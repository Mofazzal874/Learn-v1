import mongoose, { Schema } from "mongoose";

// Schema for daily progress tracking
const dailyProgressSchema = new Schema({
  date: { type: Date, required: true },
  hoursSpent: { type: Number, default: 0 },
  coursesStudied: [{ type: mongoose.Types.ObjectId, ref: 'Course' }],
  videosWatched: [{ type: mongoose.Types.ObjectId, ref: 'Video' }],
  lessonsCompleted: { type: Number, default: 0 }
}, { _id: false });

// Schema for recent activities
const recentActivitySchema = new Schema({
  type: { 
    type: String, 
    enum: ['course_enrolled', 'lesson_completed', 'video_watched', 'achievement_earned', 'goal_completed'],
    required: true 
  },
  description: { type: String, required: true },
  courseId: { type: mongoose.Types.ObjectId, ref: 'Course' },
  videoId: { type: mongoose.Types.ObjectId, ref: 'Video' },
  metadata: { type: Object }, // Additional data for the activity
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Schema for skills
const skillSchema = new Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  progress: { type: Number, default: 0, min: 0, max: 100 }, // Progress percentage
  earnedFrom: [{ type: mongoose.Types.ObjectId, ref: 'Course' }], // Courses that contributed to this skill
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Schema for achievements
const achievementSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['course_completion', 'streak', 'skill_mastery', 'time_spent', 'special'],
    required: true 
  },
  badge: { type: String }, // Badge image URL or icon name
  earnedAt: { type: Date, default: Date.now },
  metadata: { type: Object } // Additional achievement data
}, { _id: false });

// Schema for learning goals
const goalSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['daily_time', 'course_completion', 'skill_development', 'streak_maintenance', 'custom'],
    required: true 
  },
  target: { type: Number, required: true }, // Target value (hours, courses, days, etc.)
  current: { type: Number, default: 0 }, // Current progress
  deadline: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'failed'],
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { _id: false });

// Course enrollment details
const enrolledCourseSchema = new Schema({
  courseId: { type: mongoose.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0, min: 0, max: 100 }, // Completion percentage
  completedLessons: [{ type: String }], // Array of lesson IDs
  lastAccessedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 }, // Time spent in minutes
  certificateEarned: { type: Boolean, default: false },
  certificateEarnedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled' 
  }
}, { _id: false });

const userProgressSchema = new Schema({
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  totalLearningTime: { 
    type: Number, 
    default: 0 
  }, // Total time spent learning in minutes
  currentStreak: { 
    type: Number, 
    default: 0 
  }, // Current consecutive days of learning
  longestStreak: { 
    type: Number, 
    default: 0 
  }, // Longest streak ever achieved
  lastActive: { 
    type: Date, 
    default: Date.now 
  }, // Last time user was active
  savedCourses: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'Course' 
  }], // Courses saved for later
  enrolledCourses: [enrolledCourseSchema], // Detailed enrollment information
  skills: [skillSchema], // Skills and their progress
  achievements: [achievementSchema], // Earned achievements
  goals: [goalSchema], // Learning goals
  recentActivities: [recentActivitySchema], // Recent learning activities
  dailyProgressHour: [dailyProgressSchema], // Daily progress tracking
  
  // Additional tracking fields
  totalCoursesCompleted: { type: Number, default: 0 },
  totalVideosWatched: { type: Number, default: 0 },
  totalCertificatesEarned: { type: Number, default: 0 },
  learningPreferences: {
    preferredTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'] },
    reminderEnabled: { type: Boolean, default: true },
    reminderTime: { type: String, default: '19:00' }, // Format: HH:MM
    weeklyGoalHours: { type: Number, default: 10 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
userProgressSchema.index({ userId: 1 });
userProgressSchema.index({ lastActive: -1 });
userProgressSchema.index({ currentStreak: -1 });
userProgressSchema.index({ totalLearningTime: -1 });
userProgressSchema.index({ 'enrolledCourses.courseId': 1 });
userProgressSchema.index({ savedCourses: 1 });

// Methods to update progress
userProgressSchema.methods.addEnrolledCourse = function(courseId: string) {
  const existingEnrollment = this.enrolledCourses.find(
    (enrollment: { courseId: { toString(): string } }) => enrollment.courseId.toString() === courseId
  );
  
  if (!existingEnrollment) {
    this.enrolledCourses.push({
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      completedLessons: [],
      lastAccessedAt: new Date(),
      timeSpent: 0,
      status: 'enrolled'
    });
    
    // Add recent activity
    this.recentActivities.unshift({
      type: 'course_enrolled',
      description: `Enrolled in a new course`,
      courseId,
      createdAt: new Date()
    });
    
    // Keep only last 50 activities
    if (this.recentActivities.length > 50) {
      this.recentActivities = this.recentActivities.slice(0, 50);
    }
  }
  
  return this;
};

userProgressSchema.methods.addSavedCourse = function(courseId: string) {
  if (!this.savedCourses.includes(courseId)) {
    this.savedCourses.push(courseId);
  }
  return this;
};

userProgressSchema.methods.removeSavedCourse = function(courseId: string) {
  this.savedCourses = this.savedCourses.filter(
    (id: { toString(): string }) => id.toString() !== courseId
  );
  return this;
};

userProgressSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActiveDate = new Date(this.lastActive);
  
  // Check if last active was yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastActiveDate.toDateString() === yesterday.toDateString()) {
    // Continue streak
    this.currentStreak += 1;
  } else if (lastActiveDate.toDateString() === today.toDateString()) {
    // Already active today, no change needed
    return this;
  } else {
    // Streak broken, reset to 1
    this.currentStreak = 1;
  }
  
  // Update longest streak if needed
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  this.lastActive = today;
  return this;
};

export const UserProgress = mongoose.models?.UserProgress || mongoose.model('UserProgress', userProgressSchema);