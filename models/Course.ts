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

const lessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: String }, // "30 mins", "1 hour", etc.
  videoLink: { type: String },
  videoAsset: cloudinaryAssetSchema,
  assignmentLink: { type: String },
  assignmentDescription: { type: String },
  resources: [{
    title: { type: String },
    url: { type: String },
    type: { type: String, enum: ['pdf', 'link', 'zip', 'other'] }
  }],
  quiz: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    explanation: { type: String }
  }]
});

const sectionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  lessons: [lessonSchema],
  order: { type: Number, required: true }
});

const courseSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  tutorId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String }, // URL to the thumbnail
  thumbnailAsset: cloudinaryAssetSchema, // Cloudinary asset info for the thumbnail
  previewVideo: { type: String }, // URL to the preview video
  previewVideoAsset: cloudinaryAssetSchema, // Cloudinary asset info for the preview video
  price: { type: Number, required: true, default: 0 },
  isFree: { type: Boolean, default: false },
  discountedPrice: { type: Number },
  discountEnds: { type: Date },
  category: { type: String, required: true },
  subcategory: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  certificate: { type: Boolean, default: false },
  prerequisites: [{ type: String }],
  outcomes: [{ type: String }],
  sections: [sectionSchema],
  tags: [{ type: String }],
  language: { type: String, default: 'English' },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  ratings: [{
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
  reviews: [{
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  enrolledUsers: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  }],
  requirements: [{ type: String }],
  welcomeMessage: { type: String },
  completionMessage: { type: String }
}, {
  timestamps: true
});

// Create indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ tutorId: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ published: 1, approved: 1 });

export const Course = mongoose.models?.Course || mongoose.model('Course', courseSchema);