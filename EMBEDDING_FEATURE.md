# Roadmap Embedding Feature Documentation

## Overview

This feature implements text embedding using **Cohere's embed-v4.0 model** and **Pinecone vector database** to enable intelligent search, similarity matching, and personalized recommendations for roadmaps.

## Architecture

### Components

1. **RoadmapEmbeddingDetails Model** (`models/RoadmapEmbeddingDetails.ts`)
   - Tracks embedding status and metadata
   - Links roadmaps to their vector representations
   - Stores processing information and error states

2. **Embedding Service** (`lib/embedding.ts`)
   - Handles text extraction and preprocessing
   - Interfaces with Cohere API for embedding generation
   - Manages Pinecone vector storage and retrieval
   - Provides cleanup and health check utilities

3. **API Endpoints**
   - Save/Update endpoints trigger embedding generation
   - Status endpoint for tracking processing progress
   - Health endpoint for service monitoring

4. **Frontend Components**
   - Enhanced save dialog with embedding status
   - Loading states and user feedback

## Data Flow

### When a Roadmap is Saved/Updated:

1. **Save to MongoDB** - Roadmap data is first saved to the database
2. **Fetch Complete Data** - Full roadmap with all nodes and metadata is retrieved
3. **Text Processing** - Content is extracted and preprocessed:
   ```
   Title + Level + Type + Sequence-weighted Topics + Descriptions + Time estimates
   ```
4. **Cohere API** - Processed text is sent to Cohere for embedding generation
5. **Pinecone Storage** - Vector is stored with metadata in the `roadmap-embeddings` namespace
6. **Status Tracking** - Processing status is updated in MongoDB

### Text Processing Pipeline

```typescript
// Example of extracted text:
"Title: Learn React | Level: beginner | Type: topic-wise | Topics: React Fundamentals Components State Management | Content: Learn JSX syntax Create functional components Understand props..."
```

**Preprocessing Steps:**
- Concatenate relevant fields with separators
- Convert to lowercase
- Remove excessive punctuation
- Filter stop words (optional)
- Truncate to safe token limits (8000 chars)

## Configuration

### Environment Variables Required

```env
# Cohere Configuration
COHERE_API_KEY=your_cohere_api_key

# Pinecone Configuration  
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
```

### Embedding Configuration

```typescript
const EMBEDDING_CONFIG = {
  COHERE_MODEL: 'embed-english-v3.0',
  PINECONE_NAMESPACE: 'roadmap-embeddings',
  VECTOR_DIMENSION: 1024,
  INPUT_TYPE: 'search_document',
  MAX_TEXT_LENGTH: 8000,
}
```

## API Endpoints

### Save Roadmap with Embeddings
```
POST /api/roadmap/save
POST /api/roadmap/saved
PUT /api/roadmap/saved/[id]
```
**Response:**
```json
{
  "success": true,
  "id": "roadmap_id",
  "name": "roadmap_name",
  "embeddingStatus": "processing"
}
```

### Check Embedding Status
```
GET /api/roadmap/embedding-status/[id]
```
**Response:**
```json
{
  "status": "completed|processing|failed",
  "lastEmbeddedAt": "2024-01-15T10:30:00Z",
  "processingTime": 1500,
  "cohereModel": "embed-english-v3.0"
}
```

### Health Check
```
GET /api/roadmap/health
```
**Response:**
```json
{
  "overall": true,
  "services": {
    "cohere": { "healthy": true, "configured": true },
    "pinecone": { "healthy": true, "configured": true }
  },
  "errors": []
}
```

## Database Schema

### RoadmapEmbeddingDetails Collection

```typescript
{
  roadmapId: ObjectId,           // Reference to Roadmap
  userId: ObjectId,              // Reference to User  
  embeddingId: string,           // Stable ID: "roadmap_{roadmapId}"
  vectorDimension: number,       // Vector dimensions (1024)
  lastEmbeddedAt: Date,          // Last processing time
  
  sourceContent: {
    title: string,
    level: "beginner|intermediate|advanced",
    roadmapType: "week-by-week|topic-wise", 
    concatenatedText: string     // Processed text sent to Cohere
  },
  
  processingMetadata: {
    cohereModel: string,         // Model used for embedding
    pineconeNamespace: string,   // Storage namespace
    tokenCount?: number,         // Estimated tokens
    processingTime?: number      // Processing time in ms
  },
  
  status: "processing|completed|failed",
  errorMessage?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Pinecone Vector Metadata

```typescript
{
  entityType: "roadmap",
  roadmapId: string,
  userId: string, 
  title: string,
  level: string,
  roadmapType: string,
  nodeCount: number,
  sourceId: string,
  upsertedAt: string
}
```

## Usage Examples

### Generate Embedding for Roadmap

```typescript
import { processRoadmapEmbedding } from '@/lib/embedding';

const embeddingRecord = await processRoadmapEmbedding(roadmap, userId);
console.log(`Embedding ${embeddingRecord.embeddingId} completed`);
```

### Check Service Health

```typescript
import { checkEmbeddingServicesHealth } from '@/lib/embedding';

const health = await checkEmbeddingServicesHealth();
if (!health.cohere || !health.pinecone) {
  console.error('Embedding services not available:', health.errors);
}
```

### Clean Up Embeddings

```typescript
import { deleteRoadmapEmbedding } from '@/lib/embedding';

await deleteRoadmapEmbedding(roadmapId, userId);
```

## Error Handling

### Common Error Scenarios

1. **Missing API Keys** - Service initialization fails
2. **Cohere API Limits** - Rate limiting or quota exceeded
3. **Pinecone Connection** - Network or authentication issues
4. **Invalid Text** - Empty or malformed roadmap content
5. **Processing Timeout** - Long-running embedding generation

### Error Recovery

- **Async Processing** - Embedding failures don't block roadmap saving
- **Status Tracking** - Failed embeddings are marked and can be retried
- **Graceful Degradation** - App functions normally without embeddings
- **Cleanup on Delete** - Orphaned vectors are automatically removed

## Performance Considerations

### Processing Time
- Text extraction: ~10ms
- Cohere API call: ~500-2000ms  
- Pinecone upsert: ~100-500ms
- Total: ~1-3 seconds per roadmap

### Optimization Strategies
- **Async Processing** - Don't block user interactions
- **Batch Processing** - Group multiple roadmaps (future)
- **Caching** - Avoid re-processing unchanged content
- **Token Limits** - Truncate overly long content appropriately

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic embedding generation and storage
- ✅ Status tracking and error handling
- ✅ Async processing pipeline

### Phase 2 (Planned)
- [ ] Semantic search API endpoint
- [ ] Similarity-based recommendations  
- [ ] Content-based roadmap matching
- [ ] Embedding-powered filtering

### Phase 3 (Future)
- [ ] Multi-language support with appropriate models
- [ ] Batch processing for bulk operations
- [ ] Advanced text preprocessing (NER, topic extraction)
- [ ] Machine learning-based content enhancement

## Troubleshooting

### Common Issues

**Embedding Status Stuck on "processing"**
- Check Cohere API key and quota
- Verify Pinecone connection
- Review application logs for errors

**High Processing Times**
- Check text length before processing
- Monitor Cohere API response times
- Verify Pinecone index performance

**Failed Embeddings**
- Check roadmap content completeness
- Verify all required fields are present
- Review error messages in database

### Debug Endpoints

```bash
# Check service health
curl /api/roadmap/health

# Check specific embedding status  
curl /api/roadmap/embedding-status/{roadmapId}
```

## Security Considerations

1. **API Key Protection** - Store in environment variables
2. **User Authorization** - Verify user owns roadmap before processing
3. **Data Privacy** - Only process user's own content
4. **Rate Limiting** - Implement appropriate API call limits
5. **Input Validation** - Sanitize all user-provided content

## Monitoring and Metrics

### Key Metrics to Track
- Embedding success/failure rates
- Average processing times
- API usage and costs
- Vector storage utilization
- User feature adoption

### Logging
- All embedding operations are logged with unique identifiers
- Processing times and status changes are tracked
- Errors include full context for debugging

This implementation provides a robust foundation for AI-powered roadmap features while maintaining system reliability and user experience.