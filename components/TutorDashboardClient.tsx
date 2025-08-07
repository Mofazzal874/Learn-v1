"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, DollarSign, Star, PlusCircle, Edit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TutorDashboardData {
  totalStudents: number;
  studentGrowth: string;
  totalCourses: number;
  publishedCourses: number;
  coursesInDevelopment: number;
  totalRevenue: string;
  revenueGrowth: string;
  avgRating: number;
  totalReviews: number;
  recentCourses: {
    _id: string;
    title: string;
    totalStudents: number;
    rating: number;
    price: number;
    isFree: boolean;
    published: boolean;
    completionRate: number;
    totalReviews: number;
  }[];
}

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

interface TutorDashboardClientProps {
  user: User;
}

const TutorDashboardClient: React.FC<TutorDashboardClientProps> = ({ user }) => {
  const [dashboardData, setDashboardData] = useState<TutorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/tutor/dashboard');
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

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0a0a0a]">
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <div className="text-red-400 text-center">
          <p className="text-lg mb-2">Error loading dashboard</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header with Welcome Message */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.firstName}! 👋</h1>
              <p className="text-gray-400">Here&apos;s what&apos;s happening with your courses today.</p>
            </div>
            <Link href="/tutor/courses/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Active Students
                </CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {dashboardData.totalStudents.toLocaleString()}
                </div>
                <p className="text-xs text-blue-400 mt-1">{dashboardData.studentGrowth}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{dashboardData.totalCourses}</div>
                <p className="text-xs text-purple-400 mt-1">
                  {dashboardData.coursesInDevelopment} in development
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${parseFloat(dashboardData.totalRevenue).toLocaleString()}
                </div>
                <p className="text-xs text-green-400 mt-1">{dashboardData.revenueGrowth}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {dashboardData.avgRating > 0 ? dashboardData.avgRating : 'N/A'}
                </div>
                <p className="text-xs text-yellow-400 mt-1">
                  From {dashboardData.totalReviews} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Courses */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Your Courses</h2>
              <Link href="/tutor/courses">
                <Button variant="outline" className="text-gray-400 border-gray-800">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.recentCourses.length > 0 ? (
                dashboardData.recentCourses.map((course) => (
                  <Card key={course._id} className="bg-[#141414] border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {course.totalStudents} students enrolled
                          </p>
                        </div>
                        <Link href={`/tutor/courses/${course._id}/edit`}>
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Completion Rate</span>
                          <span className="text-blue-400">{course.completionRate}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${course.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4 text-sm">
                        <div className="flex items-center text-yellow-400">
                          <Star className="h-4 w-4 fill-yellow-400 mr-1" />
                          <span>{course.rating > 0 ? course.rating.toFixed(1) : 'N/A'}</span>
                        </div>
                        <span className="text-gray-400">
                          {course.isFree ? 'Free' : `$${course.price}`}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          course.published 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {course.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
                  <p className="text-gray-400 mb-6">Get started by creating your first course</p>
                  <Link href="/tutor/courses/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/tutor/courses/new">
                <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Course
                </Button>
              </Link>
              <Link href="/tutor/analytics">
                <Button className="w-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                  <Users className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/tutor/earnings">
                <Button className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Check Earnings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboardClient;
