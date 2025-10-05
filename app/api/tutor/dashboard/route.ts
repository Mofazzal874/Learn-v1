import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all courses for this tutor
    const courses = await Course.find({ tutorId: session.user.id }).lean();

    // Calculate total students across all courses
    const totalStudents = courses.reduce((sum, course) => sum + (course.totalStudents || 0), 0);

    // Calculate total courses
    const totalCourses = courses.length;

    // Calculate published/active courses
    const publishedCourses = courses.filter(course => course.published).length;

    // Calculate total revenue (sum of all course prices * enrolled students)
    const totalRevenue = courses.reduce((sum, course) => {
      const courseRevenue = (course.price || 0) * (course.totalStudents || 0);
      return sum + courseRevenue;
    }, 0);

    // Calculate average rating
    let totalRatings = 0;
    let totalRatingSum = 0;

    courses.forEach(course => {
      if (course.rating && course.rating > 0) {
        totalRatings += course.totalRatings || 0;
        totalRatingSum += (course.rating || 0) * (course.totalRatings || 0);
      }
    });

    const avgRating = totalRatings > 0 ? (totalRatingSum / totalRatings) : 0;

    // Get recent courses (last 3 courses)
    const recentCourses = courses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(course => ({
        _id: course._id,
        title: course.title,
        totalStudents: course.totalStudents || 0,
        rating: course.rating || 0,
        price: course.price || 0,
        isFree: course.isFree,
        published: course.published,
        completionRate: 75, // This would need to be calculated from UserProgress
        totalReviews: course.totalReviews || 0
      }));

    // Calculate month-over-month growth (simplified - you'd need historical data for real growth)
    const studentGrowth = totalStudents > 0 ? Math.floor(Math.random() * 20) + 5 : 0; // Mock growth
    const revenueGrowth = totalRevenue > 0 ? Math.floor(Math.random() * 15) + 3 : 0; // Mock growth

    const dashboardData = {
      totalStudents,
      studentGrowth: `+${studentGrowth}% from last month`,
      totalCourses,
      publishedCourses,
      coursesInDevelopment: totalCourses - publishedCourses,
      totalRevenue: totalRevenue.toFixed(2),
      revenueGrowth: `+${revenueGrowth}% from last month`,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: totalRatings,
      recentCourses
    };

    return NextResponse.json(dashboardData);

  } catch (error: unknown) {
    console.error('[TUTOR_DASHBOARD_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
