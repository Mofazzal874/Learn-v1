import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { UserProgress } from "@/models/UserProgress";
import { Course } from "@/models/Course";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find user progress data without population first
    const userProgress = await UserProgress.findOne({ userId: session.user.id }).lean() as any;

    if (!userProgress) {
      // Return default dashboard data for new users
      return NextResponse.json({
        totalLearningTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCoursesCompleted: 0,
        totalVideosWatched: 0,
        totalCertificatesEarned: 0,
        enrolledCoursesCount: 0,
        savedCoursesCount: 0,
        skillsCount: 0,
        achievementsCount: 0,
        goalsCount: 0,
        activeGoalsCount: 0,
        completedGoalsCount: 0,
        lastActive: null,
        enrolledCourses: [],
        achievements: [],
        goals: [],
        recentActivities: [],
        skills: [],
        learningPreferences: {
          reminderEnabled: true,
          reminderTime: '19:00',
          weeklyGoalHours: 10
        },
        dailyProgress: [],
        streakData: {
          current: 0,
          longest: 0,
          daysActive: 0
        }
      });
    }

    // Calculate learning time in hours
    const learningTimeHours = Math.round((userProgress.totalLearningTime || 0) / 60);

    // Process enrolled courses for recent progress (without population for now)
    const recentCourses = (userProgress.enrolledCourses || [])
      .sort((a: any, b: any) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 3)
      .map((enrollment: any) => ({
        id: enrollment.courseId,
        title: 'Course', // Will be populated by frontend if needed
        category: 'General',
        progress: enrollment.progress || 0,
        lastAccessed: enrollment.lastAccessedAt,
        thumbnail: null,
        timeSpent: enrollment.timeSpent || 0,
        status: enrollment.status
      }));

    // Process achievements with recent first
    const achievements = (userProgress.achievements || [])
      .sort((a: any, b: any) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .map((achievement: any) => ({
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        badge: achievement.badge,
        earnedAt: achievement.earnedAt,
        metadata: achievement.metadata
      }));

    // Process goals
    const goals = (userProgress.goals || []).map((goal: any) => ({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      target: goal.target,
      current: goal.current,
      progress: goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0,
      deadline: goal.deadline,
      status: goal.status,
      createdAt: goal.createdAt,
      completedAt: goal.completedAt
    }));

    const activeGoals = goals.filter((goal: any) => goal.status === 'active');
    const completedGoals = goals.filter((goal: any) => goal.status === 'completed');

    // Process recent activities
    const recentActivities = (userProgress.recentActivities || [])
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((activity: any) => ({
        type: activity.type,
        description: activity.description,
        courseId: activity.courseId,
        videoId: activity.videoId,
        metadata: activity.metadata,
        createdAt: activity.createdAt
      }));

    // Process skills
    const skills = (userProgress.skills || []).map((skill: any) => ({
      name: skill.name,
      level: skill.level,
      progress: skill.progress,
      earnedFrom: skill.earnedFrom,
      lastUpdated: skill.lastUpdated
    }));

    // Process daily progress for charts (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyProgress = last7Days.map(date => {
      const dayProgress = (userProgress.dailyProgressHour || []).find((dp: any) => 
        dp.date && new Date(dp.date).toISOString().split('T')[0] === date
      );
      
      return {
        date,
        hoursSpent: dayProgress?.hoursSpent || 0,
        lessonsCompleted: dayProgress?.lessonsCompleted || 0,
        videosWatched: dayProgress?.videosWatched?.length || 0
      };
    });

    // Calculate streak data
    const today = new Date();
    const daysActive = (userProgress.dailyProgressHour || []).filter((dp: any) => 
      dp.hoursSpent > 0
    ).length;

    const dashboardData = {
      // Main stats
      totalLearningTime: learningTimeHours,
      currentStreak: userProgress.currentStreak || 0,
      longestStreak: userProgress.longestStreak || 0,
      totalCoursesCompleted: userProgress.totalCoursesCompleted || 0,
      totalVideosWatched: userProgress.totalVideosWatched || 0,
      totalCertificatesEarned: userProgress.totalCertificatesEarned || 0,
      
      // Counts
      enrolledCoursesCount: (userProgress.enrolledCourses || []).length,
      savedCoursesCount: (userProgress.savedCourses || []).length,
      skillsCount: (userProgress.skills || []).length,
      achievementsCount: (userProgress.achievements || []).length,
      goalsCount: goals.length,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      
      // Detailed data
      lastActive: userProgress.lastActive,
      enrolledCourses: recentCourses,
      achievements: achievements.slice(0, 5), // Recent 5 achievements
      goals: activeGoals.slice(0, 3), // Top 3 active goals
      recentActivities: recentActivities.slice(0, 5), // Recent 5 activities
      skills: skills.slice(0, 4), // Top 4 skills
      
      // Preferences
      learningPreferences: userProgress.learningPreferences || {
        reminderEnabled: true,
        reminderTime: '19:00',
        weeklyGoalHours: 10
      },
      
      // Charts data
      dailyProgress,
      streakData: {
        current: userProgress.currentStreak || 0,
        longest: userProgress.longestStreak || 0,
        daysActive
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("[DASHBOARD_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
