import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { UserProgress } from '@/models/UserProgress';
import { Video } from '@/models/Video';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { videoId, title, duration, outcomes } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Find or create user progress
    let userProgress = await UserProgress.findOne({ userId: session.user.id });
    
    if (!userProgress) {
      // Create new user progress document
      userProgress = new UserProgress({
        userId: session.user.id,
        totalLearningTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActive: new Date(),
        savedCourses: [],
        enrolledCourses: [],
        skills: [],
        achievements: [],
        goals: [],
        recentActivities: [],
        dailyProgressHour: [],
        totalCoursesCompleted: 0,
        totalVideosWatched: 0,
        totalCertificatesEarned: 0,
        learningPreferences: {
          reminderEnabled: true,
          reminderTime: '19:00',
          weeklyGoalHours: 10
        }
      });
    }

    // Update learning time (add video duration)
    const videoMinutes = Math.round(duration || 0);
    userProgress.totalLearningTime += videoMinutes;
    
    // Update total videos watched
    userProgress.totalVideosWatched += 1;
    
    // Update streak
    userProgress.updateStreak();

    // Add skills from video outcomes
    if (outcomes && Array.isArray(outcomes)) {
      for (const outcome of outcomes) {
        const existingSkill = userProgress.skills.find(
          (skill: { name: string }) => skill.name.toLowerCase() === outcome.toLowerCase()
        );
        
        if (existingSkill) {
          // Increase skill progress more significantly for outcomes
          existingSkill.progress = Math.min(100, existingSkill.progress + 5);
          existingSkill.lastUpdated = new Date();
        } else {
          // Add new skill from outcome
          userProgress.skills.push({
            name: outcome,
            level: 'beginner',
            progress: 10, // Start with 10% progress for outcomes
            earnedFrom: [],
            lastUpdated: new Date()
          });
        }
      }
    }

    // Add recent activity
    userProgress.recentActivities.unshift({
      type: 'video_watched',
      description: `Watched "${title}"`,
      videoId,
      metadata: { duration: videoMinutes, outcomes },
      createdAt: new Date()
    });
    
    // Keep only last 50 activities
    if (userProgress.recentActivities.length > 50) {
      userProgress.recentActivities = userProgress.recentActivities.slice(0, 50);
    }

    // Update daily progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayProgress = userProgress.dailyProgressHour.find(
      (progress: { date: Date }) => 
        new Date(progress.date).toDateString() === today.toDateString()
    );
    
    if (todayProgress) {
      // Update existing daily progress
      todayProgress.hoursSpent += (videoMinutes / 60);
      todayProgress.videosWatched.push(videoId);
    } else {
      // Add new daily progress entry
      userProgress.dailyProgressHour.push({
        date: today,
        hoursSpent: videoMinutes / 60,
        coursesStudied: [],
        videosWatched: [videoId],
        lessonsCompleted: 0
      });
    }

    // Add achievements for milestones
    const achievementsToAdd = [];
    
    // First video watched
    if (userProgress.totalVideosWatched === 1) {
      achievementsToAdd.push({
        title: 'Video Explorer',
        description: 'Watched your first video',
        type: 'special',
        badge: 'first-video',
        earnedAt: new Date(),
        metadata: { videoId, title }
      });
    }
    
    // Video milestone achievements
    if ([10, 25, 50, 100].includes(userProgress.totalVideosWatched)) {
      achievementsToAdd.push({
        title: `${userProgress.totalVideosWatched} Videos Milestone`,
        description: `Watched ${userProgress.totalVideosWatched} videos`,
        type: 'special',
        badge: `${userProgress.totalVideosWatched}-videos`,
        earnedAt: new Date(),
        metadata: { totalVideos: userProgress.totalVideosWatched }
      });
    }
    
    // Learning time achievements (in hours)
    const totalHours = Math.floor(userProgress.totalLearningTime / 60);
    if ([1, 5, 10, 25, 50, 100].includes(totalHours) && 
        !userProgress.achievements.some((ach: { type: string; metadata?: { totalHours?: number } }) => 
          ach.type === 'time_spent' && ach.metadata?.totalHours === totalHours)) {
      achievementsToAdd.push({
        title: `${totalHours} Hours of Learning`,
        description: `Spent ${totalHours} hours learning`,
        type: 'time_spent',
        badge: `${totalHours}-hours`,
        earnedAt: new Date(),
        metadata: { totalHours }
      });
    }

    // Add new achievements
    if (achievementsToAdd.length > 0) {
      userProgress.achievements.push(...achievementsToAdd);
    }

    // Save user progress
    await userProgress.save();

    return NextResponse.json({
      message: 'Video progress tracked successfully',
      progress: {
        totalLearningTime: userProgress.totalLearningTime,
        totalVideosWatched: userProgress.totalVideosWatched,
        newAchievements: achievementsToAdd.length,
        skillsUpdated: outcomes?.length || 0
      }
    });

  } catch (error: unknown) {
    console.error('[VIDEO_PROGRESS_TRACKING_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to track video progress' },
      { status: 500 }
    );
  }
}