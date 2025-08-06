import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { UserProgress } from "@/models/UserProgress";
import { Course } from "@/models/Course";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    console.log("Fetching user progress for userId:", session.user.id);

    // Find user progress data
    const userProgress = await UserProgress.findOne({ userId: session.user.id }).lean();
    
    console.log("User progress found:", !!userProgress);
    
    if (!userProgress) {
      return NextResponse.json({
        enrolledCourses: [],
        inProgressCourses: [],
        completedCourses: [],
        totalCoursesCompleted: 0,
        lastActive: null
      });
    }

    // Get all enrolled course IDs
    const enrolledCourseIds = ((userProgress as any).enrolledCourses || []).map((enrollment: any) => enrollment.courseId);

    // Fetch all relevant courses
    const allCourseIds = enrolledCourseIds.filter(Boolean);
    console.log("Course IDs to fetch:", allCourseIds.length);
    
    const courses = allCourseIds.length > 0 
      ? await Course.find({ _id: { $in: allCourseIds } }).lean()
      : [];

    // Create a map for quick course lookup
    const courseMap = new Map();
    courses.forEach((course: any) => {
      courseMap.set(course._id.toString(), course);
    });

    // Format enrolled courses with progress data
    const enrolledCourses = ((userProgress as any).enrolledCourses || []).map((enrollment: any) => {
      const course = courseMap.get(enrollment.courseId.toString());
      if (!course) {
        console.log("Course not found for ID:", enrollment.courseId.toString());
        return null;
      }

      return {
        id: course._id.toString(),
        title: course.title,
        category: course.category,
        progress: enrollment.progress || 0,
        lastAccessed: formatLastAccessed(enrollment.lastAccessedAt),
        duration: calculateCourseDuration(course),
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        timeSpent: enrollment.timeSpent || 0,
        completedLessons: enrollment.completedLessons || [],
        certificateEarned: enrollment.certificateEarned || false,
        certificateEarnedAt: enrollment.certificateEarnedAt,
        thumbnail: course.thumbnail,
        tutorId: course.tutorId,
        price: course.price,
        isFree: course.isFree,
        level: course.level,
        rating: course.rating,
        totalStudents: course.totalStudents
      };
    }).filter(Boolean);

    // Separate into different categories
    const inProgressCourses = enrolledCourses.filter((course: any) => 
      course.status === 'enrolled' || course.status === 'in_progress'
    );
    
    const completedCourses = enrolledCourses.filter((course: any) => 
      course.status === 'completed'
    );

    return NextResponse.json({
      enrolledCourses,
      inProgressCourses,
      completedCourses,
      totalCoursesCompleted: (userProgress as any).totalCoursesCompleted || 0,
      lastActive: (userProgress as any).lastActive || null
    });

  } catch (error) {
    console.error("[GET_MY_COURSES_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format last accessed time
function formatLastAccessed(date: Date): string {
  if (!date) return "Never";
  
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  } else if (diffInDays === 1) {
    return "1 day ago";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
}

// Helper function to calculate course duration
function calculateCourseDuration(course: any): string {
  if (!course.sections || course.sections.length === 0) {
    return "Duration not available";
  }

  let totalMinutes = 0;
  
  course.sections.forEach((section: any) => {
    if (section.lessons) {
      section.lessons.forEach((lesson: any) => {
        // Parse duration string like "30 mins", "1 hour", etc.
        if (lesson.duration) {
          const duration = lesson.duration.toLowerCase();
          if (duration.includes('min')) {
            const minutes = parseInt(duration.match(/\d+/)?.[0] || '0');
            totalMinutes += minutes;
          } else if (duration.includes('hour')) {
            const hours = parseFloat(duration.match(/[\d.]+/)?.[0] || '0');
            totalMinutes += hours * 60;
          }
        }
      });
    }
  });

  if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }
}
