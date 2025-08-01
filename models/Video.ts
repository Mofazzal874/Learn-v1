import mongoose, { Schema } from "mongoose";

// Cloudinary asset schema for storing media files
const cloudinaryAssetSchema = new Schema({
  public_id: { type: String, required: true },
  secure_url: { type: String, required: true },
  resource_type: { type: String, enum: ['image', 'video', 'raw'], required: true },
  format: { type: String },
  width: { type: Number },
  height: { type: Number },
  duration: { type: Number }, // for videos, in seconds
  bytes: { type: Number },
  created_at: { type: Date },
});

const videoSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }, // Any user can upload videos
  thumbnail: { type: String }, // URL to the thumbnail
  thumbnailAsset: cloudinaryAssetSchema, // Cloudinary asset info for the thumbnail
  videoLink: { type: String, required: true }, // URL to the video
  videoAsset: cloudinaryAssetSchema, // Cloudinary asset info for the video
  category: { type: String, required: true },
  subcategory: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  prerequisites: [{ type: String }],
  outcomes: [{ type: String }],
  tags: [{ type: String }],
  language: { type: String, default: 'English' },
  published: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  duration: { type: String }, // Video duration as string (e.g., "10:30")
  totalComments: { type: Number, default: 0 },
  comments: [{
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    review: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  ratings: [{
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true
});

// Create indexes
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ slug: 1 });
videoSchema.index({ userId: 1 });
videoSchema.index({ category: 1 });
videoSchema.index({ published: 1 });
videoSchema.index({ views: -1 }); // For sorting by popularity
videoSchema.index({ createdAt: -1 }); // For sorting by newest

export const Video = mongoose.models?.Video || mongoose.model('Video', videoSchema);