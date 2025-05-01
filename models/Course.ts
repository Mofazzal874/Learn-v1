import mongoose, { Schema } from "mongoose";

const lessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String },
  duration: { type: Number }, // in minutes
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
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  tutorId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String },
  previewVideo: { type: String },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  category: { type: String, required: true },
  subcategory: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  prerequisites: [{ type: String }],
  outcomes: [{ type: String }],
  sections: [sectionSchema],
  tags: [{ type: String }],
  language: { type: String, default: 'English' },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  reviews: [{
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    review: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  requirements: [{ type: String }],
  welcomeMessage: { type: String },
  completionMessage: { type: String }
}, {
  timestamps: true
});

// Create indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ slug: 1 });
courseSchema.index({ tutorId: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ published: 1, approved: 1 });

export const Course = mongoose.models?.Course || mongoose.model('Course', courseSchema);