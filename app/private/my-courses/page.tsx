"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Clock, GraduationCap, BookmarkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Helper function to format last active time
function formatLastActive(date: string): string {
  if (!date) return "Never";
  
  const now = new Date();
  const lastActive = new Date(date);
  const diffInMs = now.getTime() - lastActive.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? "1h ago" : `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "1w ago" : `${weeks}w ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "1mo ago" : `${months}mo ago`;
  }
}

interface Course {
  id: string;
  title: string;
  category: string;
  progress: number;
  lastAccessed: string;
  duration: string;
  status?: string;
  completed?: boolean;
  certificateEarned?: boolean;
  certificateEarnedAt?: string;
  thumbnail?: string;
  timeSpent?: number;
  enrolledAt?: string;
  price?: number;
  isFree?: boolean;
  level?: string;
  rating?: number;
  totalStudents?: number;
}

interface MyCoursesData {
  enrolledCourses: Course[];
  savedCourses: Course[];
  inProgressCourses: Course[];
  completedCourses: Course[];
  totalCoursesCompleted: number;
  lastActive: string;
}



function CourseCard({ course }: { course: Course }) {
  const isCompleted = course.status === 'completed' || course.certificateEarned;
  
  return (
    <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden group hover:border-blue-500/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
            {course.category}
          </span>
          {isCompleted && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}
          {course.isFree && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
              Free
            </span>
          )}
        </div>
        <Link href={`/courses/${course.id}`}>
          <h3 className="text-lg font-semibold mb-4 text-white group-hover:text-blue-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.lastAccessed}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
          </div>
          {course.level && (
            <div className="text-xs text-gray-500">
              Level: {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </div>
          )}
          {isCompleted && course.certificateEarned && (
            <div className="pt-2 border-t border-gray-800">
              <Link 
                href={`/certificate/${course.id}`}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                View Certificate
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyCoursesPage() {
  const [data, setData] = useState<MyCoursesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/private/my-courses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const result = await response.json();
      console.log("Fetched data:", result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Loading your courses...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">Error Loading Courses</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchMyCourses}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold mb-4">My Courses</h1>
          <p className="text-gray-400 text-lg">Track your learning progress and achievements</p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#141414] border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{data.totalCoursesCompleted}</div>
              <div className="text-sm text-gray-400">Courses Completed</div>
            </div>
            <div className="bg-[#141414] border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {data.lastActive ? formatLastActive(data.lastActive) : 'Never'}
              </div>
              <div className="text-sm text-gray-400">Last Active</div>
            </div>
          </div>
        </div>

        {/* In Progress Section */}
        {data.inProgressCourses && data.inProgressCourses.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-8">
              <Clock className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">In Progress</h2>
              <span className="text-sm text-gray-400">({data.inProgressCourses.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.inProgressCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {data.completedCourses && data.completedCourses.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-8">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">Completed</h2>
              <span className="text-sm text-gray-400">({data.completedCourses.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.completedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}



        {/* Empty State */}
        {(!data.inProgressCourses || data.inProgressCourses.length === 0) && 
         (!data.completedCourses || data.completedCourses.length === 0) && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4 text-gray-400">No Courses Yet</h2>
            <p className="text-gray-500 mb-8">Start your learning journey by enrolling in a course</p>
            <Link 
              href="/explore"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Explore Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 