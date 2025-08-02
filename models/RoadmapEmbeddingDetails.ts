// models/RoadmapEmbeddingDetails.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IRoadmapEmbeddingDetails extends Document {
  roadmapId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  embeddingId: string; // Stable ID for Pinecone (e.g., "roadmap_<roadmapId>")
  vectorDimension: number;
  lastEmbeddedAt: Date;
  sourceContent: {
    title: string;
    level: string;
    roadmapType: string;
    concatenatedText: string; // The processed text that was sent to Cohere
  };
  processingMetadata: {
    cohereModel: string;
    pineconeNamespace: string;
    tokenCount?: number;
    processingTime?: number;
  };
  status: "processing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapEmbeddingDetailsSchema: Schema = new Schema(
  {
    roadmapId: { 
      type: mongoose.Types.ObjectId, 
      ref: "Roadmap", 
      required: true,
      index: true 
    },
    userId: { 
      type: mongoose.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    embeddingId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    vectorDimension: { 
      type: Number, 
      required: true,
      default: 1024 
    },
    lastEmbeddedAt: { 
      type: Date, 
      required: true,
      default: Date.now 
    },
    sourceContent: {
      title: { type: String, required: true },
      level: { 
        type: String, 
        enum: ["beginner", "intermediate", "advanced"], 
        required: true 
      },
      roadmapType: { 
        type: String, 
        enum: ["week-by-week", "topic-wise"], 
        required: true 
      },
      concatenatedText: { type: String, required: true }
    },
    processingMetadata: {
      cohereModel: { 
        type: String, 
        required: true,
        default: "embed-english-v3.0"
      },
      pineconeNamespace: { 
        type: String, 
        required: true,
        default: "roadmap-embeddings"
      },
      tokenCount: { type: Number },
      processingTime: { type: Number }
    },
    status: { 
      type: String, 
      enum: ["processing", "completed", "failed"], 
      required: true,
      default: "processing",
      index: true
    },
    errorMessage: { type: String }
  },
  { 
    timestamps: true,
    // Add compound indexes for common queries
    indexes: [
      { roadmapId: 1, userId: 1 },
      { userId: 1, status: 1 },
      { embeddingId: 1 }
    ]
  }
);

// Create a compound unique index to prevent duplicate embeddings for the same roadmap
RoadmapEmbeddingDetailsSchema.index({ roadmapId: 1, userId: 1 }, { unique: true });

export const RoadmapEmbeddingDetails = 
  mongoose.models?.RoadmapEmbeddingDetails || 
  mongoose.model<IRoadmapEmbeddingDetails>("RoadmapEmbeddingDetails", RoadmapEmbeddingDetailsSchema);