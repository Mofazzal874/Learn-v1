// lib/embedding.ts

import { Pinecone } from '@pinecone-database/pinecone';
import { CohereClientV2 } from 'cohere-ai';
// Removed unused import
import { RoadmapEmbeddingDetails, IRoadmapEmbeddingDetails } from '@/models/RoadmapEmbeddingDetails';
import connectDB from './db';

// Initialize clients
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Configuration constants
const EMBEDDING_CONFIG = {
  COHERE_MODEL: 'embed-v4.0',
  PINECONE_NAMESPACE: 'roadmap-embeddings',
  VECTOR_DIMENSION: 1536, // Default dimension for embed-v4.0 with float embeddings
  INPUT_TYPE: 'search_document' as const,
  TRUNCATE: 'END' as const,
  MAX_TEXT_LENGTH: 64000, // Much higher limit for embed-v4.0 (128k tokens ≈ 96k chars)
} as const;

// Stop words to remove during preprocessing
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
]);

// Educational keywords that don't add semantic value to search
// Only the most basic, repetitive words that interfere with similarity matching
const EDUCATIONAL_NOISE_WORDS = new Set([
  'introduction', 'intro', 'introductory',
  'getting', 'started', 'start', 'starting',
  'complete', 'comprehensive', 'full', 'total',
  'tutorial', 'tutorials', 'guide', 'guides',
  'course', 'courses', 'class', 'classes',
  'lesson', 'lessons', 'lecture', 'lectures',
  'chapter', 'chapters', 'section', 'sections',
  'part', 'parts', 'module', 'modules',
  'step', 'steps',
  'learn', 'learning', 'study', 'studying',
  'understanding', 'understand',
  'example', 'examples'
]);

/**
 * Cleans node title by removing unwanted metadata suffixes
 * Removes everything after the first digit that's not part of initial numbering
 */
function cleanNodeTitle(title: string): string {
  if (!title) return title;
  
  // Handle initial numbering like "1. " or "10. "
  const initialNumberMatch = title.match(/^\d+\.\s+/);
  if (initialNumberMatch) {
    // There's initial numbering, look for the first digit after it
    const afterInitialNumber = title.substring(initialNumberMatch[0].length);
    const firstDigitMatch = afterInitialNumber.match(/\d/);
    if (firstDigitMatch && firstDigitMatch.index !== undefined) {
      // Found a digit after the initial numbering, remove everything from that point
      return (initialNumberMatch[0] + afterInitialNumber.substring(0, firstDigitMatch.index)).trim();
    }
    return title; // No problematic digits found
  } else {
    // No initial numbering, find the first digit and remove everything after it
    const firstDigitMatch = title.match(/\d/);
    if (firstDigitMatch && firstDigitMatch.index !== undefined) {
      return title.substring(0, firstDigitMatch.index).trim();
    }
    return title; // No digits found
  }
}

/**
 * Cleans HTML tags and formatting from text
 */
export function cleanHtmlText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Remove common markdown/formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts and concatenates relevant text from roadmap data
 */
export function extractRoadmapText(roadmap: any): string {
  const parts: string[] = [];

  // Add title (high importance)
  if (roadmap.title) {
    parts.push(roadmap.title);
  }

  // Process nodes with sequence weighting
  if (roadmap.nodes && roadmap.nodes.length > 0) {
    const sortedNodes = roadmap.nodes
      .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

    // Add sequence-weighted titles (early nodes get more weight)
    const nodeTitles = sortedNodes.map((node: any, index: number) => {
      const weight = Math.max(1, sortedNodes.length - index);
      const cleanedTitle = cleanNodeTitle(node.title);
      const weightedTitle = Array(Math.min(weight, 3)).fill(cleanedTitle).join(' ');
      return weightedTitle;
    }).join(' ');
    
    if (nodeTitles) {
      parts.push(nodeTitles);
    }

    // Add cleaned descriptions (concatenated)
    const descriptions = sortedNodes
      .flatMap((node: any) => node.description || [])
      .filter((desc: any) => desc && desc.trim().length > 0)
      .map((desc: any) => cleanHtmlText(desc))
      .join(' ');
    
    if (descriptions) {
      parts.push(descriptions);
    }
  }

  return parts.join(' ');
}

/**
 * Performs light preprocessing on text
 */
export function preprocessText(text: string): string {
  // Basic cleaning
  let processed = text
    .toLowerCase()
    .replace(/[^\w\s\|]/g, ' ') // Keep word chars, spaces, and our delimiter
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();

  // Remove stop words and educational noise words
  const words = processed.split(' ');
  const filteredWords = words.filter(word => 
    word.length > 2 && !STOP_WORDS.has(word) && !EDUCATIONAL_NOISE_WORDS.has(word)
  );

  processed = filteredWords.join(' ');

  // Truncate if too long
  if (processed.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH) {
    processed = processed.substring(0, EMBEDDING_CONFIG.MAX_TEXT_LENGTH);
    // Try to cut at word boundary
    const lastSpace = processed.lastIndexOf(' ');
    if (lastSpace > EMBEDDING_CONFIG.MAX_TEXT_LENGTH * 0.8) {
      processed = processed.substring(0, lastSpace);
    }
  }

  return processed;
}

/**
 * Generates embedding using Cohere API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY environment variable is required');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text content is required for embedding generation');
  }

  try {
    const response = await cohere.embed({
      texts: [text],
      model: EMBEDDING_CONFIG.COHERE_MODEL,
      inputType: EMBEDDING_CONFIG.INPUT_TYPE,
      truncate: EMBEDDING_CONFIG.TRUNCATE,
    });



    if (!response.embeddings || (Array.isArray(response.embeddings) && response.embeddings.length === 0)) {
      throw new Error('No embeddings returned from Cohere API');
    }

    // Handle the response structure for embed-v4.0 (embeddings are nested by type)
    const embeddings = response.embeddings;
    
    // For embed-v4.0, the embeddings are structured as: { float: [[...]], int8: [[...]], etc. }
    if (embeddings && typeof embeddings === 'object') {
      // Try to get float embeddings first (default)
      if ('float' in embeddings && Array.isArray(embeddings.float) && embeddings.float.length > 0) {
        return embeddings.float[0] as number[];
      }
      
      // If no float embeddings, try other types
      for (const [key, value] of Object.entries(embeddings)) {
        if (Array.isArray(value) && value.length > 0) {
          return value[0] as number[];
        }
      }
    }
    
    // Fallback for older API versions or unexpected structure
    if (Array.isArray(embeddings) && embeddings.length > 0) {
      return embeddings[0] as number[];
    }
    
    throw new Error('Unexpected embedding response structure');
  } catch (error: any) {
    console.error('Cohere embedding generation failed:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Upserts vector to Pinecone
 */
export async function upsertToPinecone(
  embeddingId: string, 
  vector: number[], 
  metadata: Record<string, any>
): Promise<void> {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }

  try {
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);

    await namespace.upsert([
      {
        id: embeddingId,
        values: vector,
        metadata: {
          entityType: 'roadmap',
          ...metadata,
          upsertedAt: new Date().toISOString(),
        },
      },
    ]);

    console.log(`Successfully upserted vector ${embeddingId} to Pinecone`);
  } catch (error: any) {
    console.error('Pinecone upsert failed:', error);
    throw new Error(`Pinecone upsert failed: ${error.message}`);
  }
}

/**
 * Creates a stable embedding ID for a roadmap
 */
export function createEmbeddingId(roadmapId: string): string {
  return `roadmap_${roadmapId}`;
}

/**
 * Main function to process roadmap embeddings
 */
export async function processRoadmapEmbedding(
  roadmap: any, // Accept any type to handle plain objects from API routes
  userId: string
): Promise<IRoadmapEmbeddingDetails> {
  const startTime = Date.now();
  
  try {
    await connectDB();

    const embeddingId = createEmbeddingId(roadmap._id?.toString() || roadmap.id?.toString());
    
    // Extract and preprocess text
    const rawText = extractRoadmapText(roadmap);
    const processedText = preprocessText(rawText);
    
    console.log(`Processing embedding for roadmap ${roadmap._id || roadmap.id}:`, {
      rawTextLength: rawText.length,
      processedTextLength: processedText.length,
      embeddingId
    });

    // Create or update embedding record
    let embeddingRecord = await RoadmapEmbeddingDetails.findOneAndUpdate(
              { roadmapId: roadmap._id || roadmap.id, userId },
      {
        embeddingId,
        vectorDimension: EMBEDDING_CONFIG.VECTOR_DIMENSION,
        sourceContent: {
          title: roadmap.title,
          level: roadmap.level,
          roadmapType: roadmap.roadmapType,
          concatenatedText: processedText,
        },
        processingMetadata: {
          cohereModel: EMBEDDING_CONFIG.COHERE_MODEL,
          pineconeNamespace: EMBEDDING_CONFIG.PINECONE_NAMESPACE,
        },
        status: 'processing',
        lastEmbeddedAt: new Date(),
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    // Generate embedding
    const vector = await generateEmbedding(processedText);
    

    
    // Prepare metadata for Pinecone
    const pineconeMetadata = {
      roadmapId: roadmap._id?.toString() || roadmap.id?.toString(),
      userId: userId,
      title: roadmap.title,
      level: roadmap.level,
      roadmapType: roadmap.roadmapType,
      nodeCount: roadmap.nodes?.length || 0,
      sourceId: roadmap._id?.toString() || roadmap.id?.toString(),
    };

    // Upsert to Pinecone
    await upsertToPinecone(embeddingId, vector, pineconeMetadata);

    const processingTime = Date.now() - startTime;

    // Update record as completed
    embeddingRecord = await RoadmapEmbeddingDetails.findByIdAndUpdate(
      embeddingRecord._id,
      {
        status: 'completed',
        'processingMetadata.processingTime': processingTime,
        'processingMetadata.tokenCount': Math.ceil(processedText.length / 4), // Rough estimate
      },
      { new: true }
    );

    console.log(`Embedding processing completed in ${processingTime}ms for roadmap ${roadmap._id || roadmap.id}`);
    
    return embeddingRecord!;

  } catch (error: any) {
    console.error(`Embedding processing failed for roadmap ${roadmap._id || roadmap.id}:`, error);
    
    // Update record as failed
    try {
      await RoadmapEmbeddingDetails.findOneAndUpdate(
        { roadmapId: roadmap._id || roadmap.id, userId },
        {
          status: 'failed',
          errorMessage: error.message,
        }
      );
    } catch (updateError) {
      console.error('Failed to update embedding record with error status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Deletes embedding from Pinecone when roadmap is deleted
 */
export async function deleteRoadmapEmbedding(roadmapId: string, userId: string): Promise<void> {
  try {
    await connectDB();
    
    const embeddingId = createEmbeddingId(roadmapId);
    
    // Delete from Pinecone
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      try {
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
        const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);
        await namespace.deleteOne(embeddingId);
        console.log(`Deleted vector ${embeddingId} from Pinecone`);
      } catch (pineconeError) {
        console.error('Failed to delete from Pinecone:', pineconeError);
        // Don't throw - continue with MongoDB cleanup
      }
    }
    
    // Delete from MongoDB
    await RoadmapEmbeddingDetails.findOneAndDelete({ roadmapId, userId });
    console.log(`Deleted embedding record for roadmap ${roadmapId}`);
    
  } catch (error) {
    console.error(`Failed to delete embedding for roadmap ${roadmapId}:`, error);
    throw error;
  }
}

/**
 * Health check for embedding services
 */
export async function checkEmbeddingServicesHealth(): Promise<{
  cohere: boolean;
  pinecone: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let cohereHealthy = false;
  let pineconeHealthy = false;

  // Check Cohere
  try {
    if (!process.env.COHERE_API_KEY) {
      throw new Error('COHERE_API_KEY not configured');
    }
    
    // Test with a small embedding
    await cohere.embed({
      texts: ['test'],
      model: EMBEDDING_CONFIG.COHERE_MODEL,
      inputType: EMBEDDING_CONFIG.INPUT_TYPE,
    });
    
    cohereHealthy = true;
  } catch (error: any) {
    errors.push(`Cohere: ${error.message}`);
  }

  // Check Pinecone
  try {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      throw new Error('Pinecone configuration missing');
    }
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    await index.describeIndexStats();
    
    pineconeHealthy = true;
  } catch (error: any) {
    errors.push(`Pinecone: ${error.message}`);
  }

  return {
    cohere: cohereHealthy,
    pinecone: pineconeHealthy,
    errors,
  };
}