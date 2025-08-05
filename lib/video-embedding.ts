// lib/video-embedding.ts

import { Pinecone } from '@pinecone-database/pinecone';
import { CohereClientV2 } from 'cohere-ai';
import { VideoEmbeddingDetails, IVideoEmbeddingDetails } from '@/models/VideoEmbeddingDetails';
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
  PINECONE_NAMESPACE: 'video-embeddings',
  VECTOR_DIMENSION: 1536, // Default dimension for embed-v4.0 with float embeddings
  INPUT_TYPE: 'search_document' as const,
  TRUNCATE: 'END' as const,
  MAX_TEXT_LENGTH: 64000, // Much higher limit for embed-v4.0 (128k tokens ≈ 96k chars)
} as const;

// Performance optimization: Simple in-memory cache for query embeddings
const QUERY_EMBEDDING_CACHE = new Map<string, { vector: number[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_CACHE_SIZE = 100; // Maximum cache entries

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
 * Extracts and concatenates relevant text from video data
 */
export function extractVideoText(video: any): string {
  const parts: string[] = [];

  // Add title (high importance)
  if (video.title) {
    parts.push(video.title);
  }

  // Add subtitle
  if (video.subtitle) {
    parts.push(video.subtitle);
  }

  // Add cleaned description
  if (video.description) {
    const cleanDescription = cleanHtmlText(video.description);
    parts.push(cleanDescription);
  }

  // Add category
  if (video.category) {
    parts.push(video.category);
  }
  
  // Add subcategory if available
  if (video.subcategory) {
    parts.push(video.subcategory);
  }
  
  // Add level
  if (video.level) {
    parts.push(video.level);
  }

  // Add learning outcomes if available
  if (video.outcomes && video.outcomes.length > 0) {
    const outcomes = video.outcomes.join(' ');
    parts.push(outcomes);
  }

  // Add language
  if (video.language) {
    parts.push(video.language);
  }

  return parts.join(' ');
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
 * Cleans roadmap node query by removing unwanted suffixes like "roadmap5,h5,h", "AAAAWS" etc.
 */
export function cleanNodeQuery(query: string): string {
  if (!query) return query;
  
  let cleaned = query;
  
  // Remove patterns like "roadmap5,h5,h" or "roadmap3,h3,h" 
  cleaned = cleaned.replace(/roadmap\d+(?:\s*,\s*[h\d]+)*(?:\s*,\s*h)*/gi, 'roadmap');
  
  // Remove repeated letters like "AAAAWS" -> "AWS" (3+ consecutive same letters)
  cleaned = cleaned.replace(/([A-Z])\1{2,}/g, '$1');
  
  // Remove standalone patterns like "5,h5,h" or "3,h3,h3,h"
  cleaned = cleaned.replace(/\s+\d+(?:\s*,\s*[h\d]+)*(?:\s*,\s*h)*\s+/g, ' ');
  cleaned = cleaned.replace(/^\d+(?:\s*,\s*[h\d]+)*(?:\s*,\s*h)*\s+/g, '');
  cleaned = cleaned.replace(/\s+\d+(?:\s*,\s*[h\d]+)*(?:\s*,\s*h)*$/g, '');
  
  // Only remove immediate consecutive duplicates of the same word, not all duplicates
  const words = cleaned.split(/\s+/);
  const deduplicatedWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const previousWord = i > 0 ? words[i - 1] : null;
    
    // Only skip if it's exactly the same as the previous word (case-insensitive)
    if (currentWord.length > 0 && 
        (!previousWord || currentWord.toLowerCase() !== previousWord.toLowerCase())) {
      deduplicatedWords.push(currentWord);
    }
  }
  
  cleaned = deduplicatedWords.join(' ');
  
  // Clean up extra spaces and normalize
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
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
 * Cache management utilities
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of QUERY_EMBEDDING_CACHE.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      QUERY_EMBEDDING_CACHE.delete(key);
    }
  }
}

function manageCacheSize(): void {
  if (QUERY_EMBEDDING_CACHE.size > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const entries = Array.from(QUERY_EMBEDDING_CACHE.entries());
    entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE + 10); // Remove a few extra
    toRemove.forEach(([key]) => QUERY_EMBEDDING_CACHE.delete(key));
  }
}

/**
 * Generates embedding using Cohere API with caching optimization
 */
export async function generateEmbedding(text: string, useCache: boolean = false): Promise<number[]> {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY environment variable is required');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text content is required for embedding generation');
  }

  // Check cache for queries only (not for document embeddings)
  if (useCache) {
    cleanExpiredCache();
    const cached = QUERY_EMBEDDING_CACHE.get(text);
    if (cached) {
      console.log(`[VIDEO_EMBEDDING] Cache hit for text: "${text.substring(0, 50)}..."`);
      return cached.vector;
    }
  }

  try {
    console.log(`[VIDEO_EMBEDDING] Generating embedding for text of length: ${text.length}`);
    
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
    let vector: number[] | null = null;
    
    // For embed-v4.0, the embeddings are structured as: { float: [[...]], int8: [[...]], etc. }
    if (embeddings && typeof embeddings === 'object') {
      // Try to get float embeddings first (default)
      if ('float' in embeddings && Array.isArray(embeddings.float) && embeddings.float.length > 0) {
        console.log(`[VIDEO_EMBEDDING] Generated embedding with ${embeddings.float[0].length} dimensions`);
        vector = embeddings.float[0] as number[];
      } else {
        // If no float embeddings, try other types
        for (const [key, value] of Object.entries(embeddings)) {
          if (Array.isArray(value) && value.length > 0) {
            console.log(`[VIDEO_EMBEDDING] Generated embedding with ${value[0].length} dimensions (type: ${key})`);
            vector = value[0] as number[];
            break;
          }
        }
      }
    }
    
    // Fallback for older API versions or unexpected structure
    if (!vector && Array.isArray(embeddings) && embeddings.length > 0) {
      console.log(`[VIDEO_EMBEDDING] Generated embedding with ${embeddings[0].length} dimensions (legacy format)`);
      vector = embeddings[0] as number[];
    }
    
    if (!vector) {
      throw new Error('Unexpected embedding response structure');
    }

    // Cache the result for queries only
    if (useCache) {
      manageCacheSize();
      QUERY_EMBEDDING_CACHE.set(text, {
        vector: vector,
        timestamp: Date.now()
      });
    }
    
    return vector;
  } catch (error: any) {
    console.error('[VIDEO_EMBEDDING] Cohere embedding generation failed:', error);
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
    console.log(`[VIDEO_EMBEDDING] Upserting vector ${embeddingId} to Pinecone`);
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);

    await namespace.upsert([
      {
        id: embeddingId,
        values: vector,
        metadata: {
          entityType: 'video',
          ...metadata,
          upsertedAt: new Date().toISOString(),
        },
      },
    ]);

    console.log(`[VIDEO_EMBEDDING] Successfully upserted vector ${embeddingId} to Pinecone`);
  } catch (error: any) {
    console.error('[VIDEO_EMBEDDING] Pinecone upsert failed:', error);
    throw new Error(`Pinecone upsert failed: ${error.message}`);
  }
}

/**
 * Creates a stable embedding ID for a video
 */
export function createEmbeddingId(videoId: string): string {
  return `video_${videoId}`;
}

/**
 * Main function to process video embeddings
 */
export async function processVideoEmbedding(
  video: any, // Accept any type to handle plain objects from API routes
  userId: string
): Promise<IVideoEmbeddingDetails> {
  const startTime = Date.now();
  
  try {
    await connectDB();

    const embeddingId = createEmbeddingId(video._id?.toString() || video.id?.toString());
    
    console.log(`[VIDEO_EMBEDDING] Starting processing for video ${video._id || video.id}:`, {
      title: video.title,
      category: video.category,
      level: video.level,
      embeddingId
    });
    
    // Extract and preprocess text
    const rawText = extractVideoText(video);
    const processedText = preprocessText(rawText);
    
    console.log(`[VIDEO_EMBEDDING] Text processing completed:`, {
      videoId: video._id || video.id,
      rawTextLength: rawText.length,
      processedTextLength: processedText.length,
      embeddingId
    });

    // Create or update embedding record
    let embeddingRecord = await VideoEmbeddingDetails.findOneAndUpdate(
      { videoId: video._id || video.id, userId },
      {
        embeddingId,
        vectorDimension: EMBEDDING_CONFIG.VECTOR_DIMENSION,
        sourceContent: {
          title: video.title,
          subtitle: video.subtitle || '',
          description: video.description,
          category: video.category,
          subcategory: video.subcategory || '',
          level: video.level,
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

    console.log(`[VIDEO_EMBEDDING] Database record created/updated for video ${video._id || video.id}`);

    // Generate embedding
    const vector = await generateEmbedding(processedText);
    
    console.log(`[VIDEO_EMBEDDING] Embedding generated successfully for video ${video._id || video.id}:`, {
      vectorLength: vector.length,
      firstFewValues: vector.slice(0, 3)
    });
    
    // Prepare metadata for Pinecone
    const pineconeMetadata = {
      videoId: video._id?.toString() || video.id?.toString(),
      userId: userId,
      title: video.title,
      subtitle: video.subtitle || '',
      category: video.category,
      subcategory: video.subcategory || '',
      level: video.level,
      difficulty: video.level, // Alias for level
      type: 'video',
      duration: video.duration || '',
      sourceId: video._id?.toString() || video.id?.toString(),
    };

    // Upsert to Pinecone
    await upsertToPinecone(embeddingId, vector, pineconeMetadata);

    const processingTime = Date.now() - startTime;

    // Update record as completed
    embeddingRecord = await VideoEmbeddingDetails.findByIdAndUpdate(
      embeddingRecord._id,
      {
        status: 'completed',
        'processingMetadata.processingTime': processingTime,
        'processingMetadata.tokenCount': Math.ceil(processedText.length / 4), // Rough estimate
      },
      { new: true }
    );

    console.log(`[VIDEO_EMBEDDING] Processing completed successfully in ${processingTime}ms for video ${video._id || video.id}`);
    
    return embeddingRecord!;

  } catch (error: any) {
    console.error(`[VIDEO_EMBEDDING] Processing failed for video ${video._id || video.id}:`, error);
    
    // Update record as failed
    try {
      await VideoEmbeddingDetails.findOneAndUpdate(
        { videoId: video._id || video.id, userId },
        {
          status: 'failed',
          errorMessage: error.message,
        }
      );
    } catch (updateError) {
      console.error('[VIDEO_EMBEDDING] Failed to update embedding record with error status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Deletes embedding from Pinecone when video is deleted
 */
export async function deleteVideoEmbedding(videoId: string, userId: string): Promise<void> {
  try {
    await connectDB();
    
    const embeddingId = createEmbeddingId(videoId);
    
    console.log(`[VIDEO_EMBEDDING] Starting deletion process for video ${videoId}`);
    
    // Delete from Pinecone
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      try {
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
        const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);
        await namespace.deleteOne(embeddingId);
        console.log(`[VIDEO_EMBEDDING] Deleted vector ${embeddingId} from Pinecone`);
      } catch (pineconeError) {
        console.error('[VIDEO_EMBEDDING] Failed to delete from Pinecone:', pineconeError);
        // Don't throw - continue with MongoDB cleanup
      }
    }
    
    // Delete from MongoDB
    await VideoEmbeddingDetails.findOneAndDelete({ videoId, userId });
    console.log(`[VIDEO_EMBEDDING] Deleted embedding record for video ${videoId}`);
    
  } catch (error) {
    console.error(`[VIDEO_EMBEDDING] Failed to delete embedding for video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Search for suggested videos based on a text query
 */
export async function searchSuggestedVideos(
  query: string,
  topK: number = 5,
  similarityThreshold?: number, // Optional - will use env variable if not provided
  filters?: {
    category?: string;
    level?: string;
  }
): Promise<Array<{
  videoId: string;
  title: string;
  category: string;
  level: string;
  score: number;
}>> {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY environment variable is required');
  }

  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    throw new Error('Pinecone configuration is required');
  }

  if (!query || query.trim().length === 0) {
    throw new Error('Query text is required');
  }

  // Use environment variable for threshold if not provided
  const threshold = similarityThreshold ?? parseFloat(process.env.COSINE_SIM_THRESHOLD || '0.45');

  try {
    console.log(`[VIDEO_SEARCH] Searching for videos related to: "${query}" (threshold: ${threshold})`);
    
    // Clean query from roadmap node suffixes (like "roadmap5,h5,h", "AAAAWS")
    const cleanedQuery = cleanNodeQuery(query);
    
    // Generate embedding for the search query using the same preprocessing
    const processedQuery = preprocessText(cleanedQuery);
    const queryVector = await generateEmbedding(processedQuery, false); // Disable caching to avoid issues
    
    console.log(`[VIDEO_SEARCH] Query cleaned: "${cleanedQuery}" -> processed: "${processedQuery.substring(0, 50)}..."`);
    console.log(`[VIDEO_SEARCH] Generated query embedding with ${queryVector.length} dimensions`);
    
    // Search in Pinecone with higher topK to filter by threshold later
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);
    
    // Build filter object with optional category and level filtering
    const pineconeFilter: any = {
      entityType: 'video'  // Only search for videos
    };
    
    if (filters?.category) {
      pineconeFilter.category = filters.category;
    }
    
    if (filters?.level) {
      pineconeFilter.level = filters.level;
    }

    const searchResults = await namespace.query({
      vector: queryVector,
      topK: Math.max(topK * 3, 15), // Get more results to apply threshold filtering
      includeMetadata: true,
      filter: pineconeFilter,
      // Performance optimization: Return only essential metadata to reduce bandwidth
      includeValues: false, // We don't need the vector values in response
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      console.log('[VIDEO_SEARCH] No matching videos found');
      return [];
    }

    // Apply similarity threshold filtering and limit results
    const filteredResults = searchResults.matches
      .filter(match => (match.score || 0) >= threshold)
      .slice(0, topK)
      .map(match => ({
        videoId: match.metadata?.videoId as string || match.metadata?.sourceId as string,
        title: match.metadata?.title as string || 'Unknown Title',
        category: match.metadata?.category as string || 'Unknown Category',
        level: match.metadata?.level as string || 'Unknown Level',
        score: match.score || 0
      }))
      .filter(result => result.videoId); // Filter out any results without videoId

    console.log(`[VIDEO_SEARCH] Found ${searchResults.matches.length} videos, ${filteredResults.length} above threshold (${threshold})`);
    
    return filteredResults;

  } catch (error: unknown) {
    console.error('[VIDEO_SEARCH] Search failed:', error);
    throw new Error(`Video search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Health check for embedding services
 */
export async function checkVideoEmbeddingServicesHealth(): Promise<{
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
      texts: ['test video embedding'],
      model: EMBEDDING_CONFIG.COHERE_MODEL,
      inputType: EMBEDDING_CONFIG.INPUT_TYPE,
    });
    
    cohereHealthy = true;
  } catch (error: unknown) {
    errors.push(`Cohere: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Pinecone
  try {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      throw new Error('Pinecone configuration missing');
    }
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    await index.describeIndexStats();
    
    pineconeHealthy = true;
  } catch (error: unknown) {
    errors.push(`Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    cohere: cohereHealthy,
    pinecone: pineconeHealthy,
    errors,
  };
}