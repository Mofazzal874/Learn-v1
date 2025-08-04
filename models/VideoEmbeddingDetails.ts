// models/VideoEmbeddingDetails.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IVideoEmbeddingDetails extends Document {
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  embeddingId: string; // Stable ID for Pinecone (e.g., "video_<videoId>")
  vectorDimension: number;
  lastEmbeddedAt: Date;
  sourceContent: {
    title: string;
    subtitle: string;
    description: string;
    category: string;
    subcategory: string;
    level: string;
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

const VideoEmbeddingDetailsSchema: Schema = new Schema(
  {
    videoId: { 
      type: mongoose.Types.ObjectId, 
      ref: "Video", 
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
      default: 1536 // Default dimension for embed-v4.0 with float embeddings
    },
    lastEmbeddedAt: { 
      type: Date, 
      required: true,
      default: Date.now 
    },
    sourceContent: {
      title: { type: String, required: true },
      subtitle: { type: String },
      description: { type: String, required: true },
      category: { type: String, required: true },
      subcategory: { type: String },
      level: { 
        type: String, 
        enum: ["beginner", "intermediate", "advanced"], 
        required: true 
      },
      concatenatedText: { type: String, required: true }
    },
    processingMetadata: {
      cohereModel: { 
        type: String, 
        required: true,
        default: "embed-v4.0"
      },
      pineconeNamespace: { 
        type: String, 
        required: true,
        default: "video-embeddings"
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
      { videoId: 1, userId: 1 },
      { userId: 1, status: 1 },
      { embeddingId: 1 }
    ]
  }
);

// Create a compound unique index to prevent duplicate embeddings for the same video
VideoEmbeddingDetailsSchema.index({ videoId: 1, userId: 1 }, { unique: true });

export const VideoEmbeddingDetails = 
  mongoose.models?.VideoEmbeddingDetails || 
  mongoose.model<IVideoEmbeddingDetails>("VideoEmbeddingDetails", VideoEmbeddingDetailsSchema);