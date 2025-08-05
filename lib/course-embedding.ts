// lib/course-embedding.ts

import { Pinecone } from '@pinecone-database/pinecone';
import { CohereClientV2 } from 'cohere-ai';
import { CourseEmbeddingDetails, ICourseEmbeddingDetails } from '@/models/CourseEmbeddingDetails';
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
  PINECONE_NAMESPACE: 'course-embeddings',
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
 * Extracts and concatenates relevant text from course data
 */
export function extractCourseText(course: any): string {
  const parts: string[] = [];

  // Add title (high importance)
  if (course.title) {
    parts.push(course.title);
  }

  // Add subtitle
  if (course.subtitle) {
    parts.push(course.subtitle);
  }

  // Add cleaned description
  if (course.description) {
    const cleanDescription = cleanHtmlText(course.description);
    parts.push(cleanDescription);
  }

  // Add category and level
  if (course.category) {
    parts.push(course.category);
  }
  
  if (course.level) {
    parts.push(course.level);
  }

  // Add learning outcomes if available
  if (course.outcomes && course.outcomes.length > 0) {
    const outcomes = course.outcomes.join(' ');
    parts.push(outcomes);
  }

  // Process sections - only include section titles
  if (course.sections && course.sections.length > 0) {
    const sortedSections = course.sections
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const sectionTitles = sortedSections
      .map((section: any) => section.title)
      .filter((title: any) => title && title.trim().length > 0)
      .join(' ');

    if (sectionTitles) {
      parts.push(sectionTitles);
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

  // Remove stop words (optional - be careful not to over-remove)
  const words = processed.split(' ');
  const filteredWords = words.filter(word => 
    word.length > 2 && !STOP_WORDS.has(word)
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
    console.log(`[COURSE_EMBEDDING] Generating embedding for text of length: ${text.length}`);
    
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
        console.log(`[COURSE_EMBEDDING] Generated embedding with ${embeddings.float[0].length} dimensions`);
        return embeddings.float[0] as number[];
      }
      
      // If no float embeddings, try other types
      for (const [key, value] of Object.entries(embeddings)) {
        if (Array.isArray(value) && value.length > 0) {
          console.log(`[COURSE_EMBEDDING] Generated embedding with ${value[0].length} dimensions (type: ${key})`);
          return value[0] as number[];
        }
      }
    }
    
    // Fallback for older API versions or unexpected structure
    if (Array.isArray(embeddings) && embeddings.length > 0) {
      console.log(`[COURSE_EMBEDDING] Generated embedding with ${embeddings[0].length} dimensions (legacy format)`);
      return embeddings[0] as number[];
    }
    
    throw new Error('Unexpected embedding response structure');
  } catch (error: any) {
    console.error('[COURSE_EMBEDDING] Cohere embedding generation failed:', error);
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
    console.log(`[COURSE_EMBEDDING] Upserting vector ${embeddingId} to Pinecone`);
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);

    await namespace.upsert([
      {
        id: embeddingId,
        values: vector,
        metadata: {
          entityType: 'course',
          ...metadata,
          upsertedAt: new Date().toISOString(),
        },
      },
    ]);

    console.log(`[COURSE_EMBEDDING] Successfully upserted vector ${embeddingId} to Pinecone`);
  } catch (error: any) {
    console.error('[COURSE_EMBEDDING] Pinecone upsert failed:', error);
    throw new Error(`Pinecone upsert failed: ${error.message}`);
  }
}

/**
 * Creates a stable embedding ID for a course
 */
export function createEmbeddingId(courseId: string): string {
  return `course_${courseId}`;
}

/**
 * Main function to process course embeddings
 */
export async function processCourseEmbedding(
  course: any, // Accept any type to handle plain objects from API routes
  userId: string
): Promise<ICourseEmbeddingDetails> {
  const startTime = Date.now();
  
  try {
    await connectDB();

    const embeddingId = createEmbeddingId(course._id?.toString() || course.id?.toString());
    
    console.log(`[COURSE_EMBEDDING] Starting processing for course ${course._id || course.id}:`, {
      title: course.title,
      category: course.category,
      level: course.level,
      embeddingId
    });
    
    // Extract and preprocess text
    const rawText = extractCourseText(course);
    const processedText = preprocessText(rawText);
    
    console.log(`[COURSE_EMBEDDING] Text processing completed:`, {
      courseId: course._id || course.id,
      rawTextLength: rawText.length,
      processedTextLength: processedText.length,
      embeddingId
    });

    // Create or update embedding record
    let embeddingRecord = await CourseEmbeddingDetails.findOneAndUpdate(
      { courseId: course._id || course.id, userId },
      {
        embeddingId,
        vectorDimension: EMBEDDING_CONFIG.VECTOR_DIMENSION,
        sourceContent: {
          title: course.title,
          subtitle: course.subtitle || '',
          description: course.description,
          category: course.category,
          level: course.level,
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

    console.log(`[COURSE_EMBEDDING] Database record created/updated for course ${course._id || course.id}`);

    // Generate embedding
    const vector = await generateEmbedding(processedText);
    
    console.log(`[COURSE_EMBEDDING] Embedding generated successfully for course ${course._id || course.id}:`, {
      vectorLength: vector.length,
      firstFewValues: vector.slice(0, 3)
    });
    
    // Prepare metadata for Pinecone
    const pineconeMetadata = {
      courseId: course._id?.toString() || course.id?.toString(),
      userId: userId,
      title: course.title,
      subtitle: course.subtitle || '',
      category: course.category,
      level: course.level,
      difficulty: course.level, // Alias for level
      type: 'course',
      sectionCount: course.sections?.length || 0,
      sourceId: course._id?.toString() || course.id?.toString(),
    };

    // Upsert to Pinecone
    await upsertToPinecone(embeddingId, vector, pineconeMetadata);

    const processingTime = Date.now() - startTime;

    // Update record as completed
    embeddingRecord = await CourseEmbeddingDetails.findByIdAndUpdate(
      embeddingRecord._id,
      {
        status: 'completed',
        'processingMetadata.processingTime': processingTime,
        'processingMetadata.tokenCount': Math.ceil(processedText.length / 4), // Rough estimate
      },
      { new: true }
    );

    console.log(`[COURSE_EMBEDDING] Processing completed successfully in ${processingTime}ms for course ${course._id || course.id}`);
    
    return embeddingRecord!;

  } catch (error: any) {
    console.error(`[COURSE_EMBEDDING] Processing failed for course ${course._id || course.id}:`, error);
    
    // Update record as failed
    try {
      await CourseEmbeddingDetails.findOneAndUpdate(
        { courseId: course._id || course.id, userId },
        {
          status: 'failed',
          errorMessage: error.message,
        }
      );
    } catch (updateError) {
      console.error('[COURSE_EMBEDDING] Failed to update embedding record with error status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Deletes embedding from Pinecone when course is deleted
 */
export async function deleteCourseEmbedding(courseId: string, userId: string): Promise<void> {
  try {
    await connectDB();
    
    const embeddingId = createEmbeddingId(courseId);
    
    console.log(`[COURSE_EMBEDDING] Starting deletion process for course ${courseId}`);
    
    // Delete from Pinecone
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      try {
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
        const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);
        await namespace.deleteOne(embeddingId);
        console.log(`[COURSE_EMBEDDING] Deleted vector ${embeddingId} from Pinecone`);
      } catch (pineconeError) {
        console.error('[COURSE_EMBEDDING] Failed to delete from Pinecone:', pineconeError);
        // Don't throw - continue with MongoDB cleanup
      }
    }
    
    // Delete from MongoDB
    await CourseEmbeddingDetails.findOneAndDelete({ courseId, userId });
    console.log(`[COURSE_EMBEDDING] Deleted embedding record for course ${courseId}`);
    
  } catch (error) {
    console.error(`[COURSE_EMBEDDING] Failed to delete embedding for course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Search for suggested courses based on a text query
 */
export async function searchSuggestedCourses(
  query: string,
  topK: number = 5
): Promise<Array<{
  courseId: string;
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

  try {
    console.log(`[COURSE_SEARCH] Searching for courses related to: "${query}"`);
    
    // Generate embedding for the search query using the same preprocessing
    const processedQuery = preprocessText(query);
    const queryVector = await generateEmbedding(processedQuery);
    
    console.log(`[COURSE_SEARCH] Generated query embedding with ${queryVector.length} dimensions`);
    
    // Search in Pinecone
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    const namespace = index.namespace(EMBEDDING_CONFIG.PINECONE_NAMESPACE);
    
    const searchResults = await namespace.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter: {
        entityType: 'course'  // Only search for courses
      }
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      console.log('[COURSE_SEARCH] No matching courses found');
      return [];
    }

    console.log(`[COURSE_SEARCH] Found ${searchResults.matches.length} matching courses`);
    
    // Process and return results
    return searchResults.matches.map(match => ({
      courseId: match.metadata?.courseId as string || match.metadata?.sourceId as string,
      title: match.metadata?.title as string || 'Unknown Title',
      category: match.metadata?.category as string || 'Unknown Category',
      level: match.metadata?.level as string || 'Unknown Level',
      score: match.score || 0
    })).filter(result => result.courseId); // Filter out any results without courseId

  } catch (error: unknown) {
    console.error('[COURSE_SEARCH] Search failed:', error);
    throw new Error(`Course search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Health check for embedding services
 */
export async function checkCourseEmbeddingServicesHealth(): Promise<{
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
      texts: ['test course embedding'],
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