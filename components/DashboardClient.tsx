"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Brain, 
  Target, 
  Trophy, 
  Clock, 
  Flame, 
  Calendar,
  TrendingUp,
  Award,
  PlayCircle,
  Star,
  CheckCircle,
  Activity
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DashboardData {
  totalLearningTime: number;
  currentStreak: number;
  longestStreak: number;
  totalCoursesCompleted: number;
  totalVideosWatched: number;
  totalCertificatesEarned: number;
  enrolledCoursesCount: number;
  savedCoursesCount: number;
  skillsCount: number;
  achievementsCount: number;
  goalsCount: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  lastActive: string | null;
  enrolledCourses: any[];
  achievements: any[];
  goals: any[];
  recentActivities: any[];
  skills: any[];
  learningPreferences: any;
  dailyProgress: any[];
  streakData: {
    current: number;
    longest: number;
    daysActive: number;
  };
}

interface DashboardClientProps {
  user: User;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ user }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/private/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_enrolled': return <BookOpen className="h-4 w-4" />;
      case 'lesson_completed': return <CheckCircle className="h-4 w-4" />;
      case 'video_watched': return <PlayCircle className="h-4 w-4" />;
      case 'achievement_earned': return <Trophy className="h-4 w-4" />;
      case 'goal_completed': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] items-center justify-center">
        <div className="text-red-400 text-center">
          <p className="text-lg mb-2">Error loading dashboard</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <div className="flex-1 p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-400 mt-2">
            Here's an overview of your learning progress
          </p>
          {dashboardData.lastActive && (
            <p className="text-sm text-blue-400 mt-1">
              Last active: {formatTimeAgo(dashboardData.lastActive)}
            </p>
          )}
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Learning Time */}
          <Card className="relative bg-[#141414] border border-blue-500/20 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-white">
                Learning Time
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-white">
                {dashboardData.totalLearningTime}h
              </div>
              <p className="text-sm text-blue-200 mt-1">
                {dashboardData.totalVideosWatched} videos watched
              </p>
            </CardContent>
          </Card>

          {/* Current Streak */}
          <Card className="relative bg-[#141414] border border-orange-500/20 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-white">
                Current Streak
              </CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-white">
                {dashboardData.currentStreak} days
              </div>
              <p className="text-sm text-orange-200 mt-1">
                Best: {dashboardData.longestStreak} days
              </p>
            </CardContent>
          </Card>

          {/* Courses Completed */}
          <Card className="relative bg-[#141414] border border-green-500/20 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-white">
                Courses Completed
              </CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <BookOpen className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-white">
                {dashboardData.totalCoursesCompleted}
              </div>
              <p className="text-sm text-green-200 mt-1">
                {dashboardData.enrolledCoursesCount} in progress
              </p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="relative bg-[#141414] border border-purple-500/20 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-white">
                Achievements
              </CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-full">
                <Trophy className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-white">
                {dashboardData.achievementsCount}
              </div>
              <p className="text-sm text-purple-200 mt-1">
                {dashboardData.totalCertificatesEarned} certificates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Courses & Skills Progress */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Courses */}
          <Card className="bg-[#141414] border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Recent Courses</CardTitle>
              <Link href="/private/my-courses" className="text-sm text-blue-400 hover:text-blue-300">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData.enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.enrolledCourses.slice(0, 3).map((course: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {course.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {course.category}
                        </p>
                        <div className="mt-2">
                          <Progress value={course.progress} className="h-1" />
                          <p className="text-xs text-gray-400 mt-1">
                            {course.progress}% complete
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No courses enrolled yet</p>
                  <Link href="/explore" className="text-blue-400 text-sm hover:text-blue-300">
                    Browse courses
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Progress */}
          <Card className="bg-[#141414] border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Skills Progress</CardTitle>
              <Link href="/private/skills" className="text-sm text-blue-400 hover:text-blue-300">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData.skills.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.skills.slice(0, 4).map((skill: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-white">{skill.name}</span>
                          <Badge variant="outline" className={`text-xs ${getSkillLevelColor(skill.level)} text-white border-0`}>
                            {skill.level}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-400">{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No skills tracked yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements & Activities */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Achievements */}
          <Card className="bg-[#141414] border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Recent Achievements</CardTitle>
              <Link href="/private/achievements" className="text-sm text-blue-400 hover:text-blue-300">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData.achievements.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.achievements.slice(0, 3).map((achievement: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className="p-2 bg-yellow-500/20 rounded-full">
                        <Award className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">
                          {achievement.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(achievement.earnedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No achievements yet</p>
                  <p className="text-xs text-gray-500">Complete courses to earn achievements</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="bg-[#141414] border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="p-1.5 bg-blue-500/20 rounded-full text-blue-400">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Learning Goals */}
        {dashboardData.goals.length > 0 && (
          <Card className="bg-[#141414] border-0 shadow-xl mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Learning Goals</CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {dashboardData.activeGoalsCount} active
                </span>
                <Link href="/private/goals" className="text-sm text-blue-400 hover:text-blue-300">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.goals.slice(0, 3).map((goal: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">
                        {goal.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs border-0 ${
                          goal.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          goal.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      {goal.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{goal.current}/{goal.target}</span>
                      </div>
                      <Progress value={goal.progress} className="h-1" />
                      <p className="text-xs text-gray-500">
                        {goal.progress}% complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Progress Chart Placeholder */}
        <Card className="bg-[#141414] border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dashboardData.dailyProgress.map((day: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div 
                    className={`h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                      day.hoursSpent > 0 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {day.hoursSpent}h
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {day.lessonsCompleted} lessons
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-white">
                    {dashboardData.dailyProgress.reduce((acc: number, day: any) => acc + day.hoursSpent, 0)}h
                  </div>
                  <div className="text-xs text-gray-400">This Week</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {dashboardData.dailyProgress.reduce((acc: number, day: any) => acc + day.lessonsCompleted, 0)}
                  </div>
                  <div className="text-xs text-gray-400">Lessons</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {dashboardData.streakData.daysActive}
                  </div>
                  <div className="text-xs text-gray-400">Days Active</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardClient;
