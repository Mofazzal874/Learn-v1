import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { UserProgress } from "@/models/UserProgress";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const courseId = resolvedParams.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Find the course with tutor details
    const course = await Course.findById(courseId)
      .populate({
        path: 'tutorId',
        select: 'firstName lastName image',
        model: 'User'
      })
      .lean() as any;

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course is published
    if (!course.published) {
      return NextResponse.json({ error: "Course not available" }, { status: 403 });
    }

    // Check if user is enrolled
    const userProgress = await UserProgress.findOne({ userId: session.user.id }).lean() as {
      enrolledCourses?: { courseId: { toString(): string } }[]
    } | null;
    
    let isEnrolled = false;
    if (userProgress?.enrolledCourses) {
      isEnrolled = userProgress.enrolledCourses.some(
        (enrollment: any) => enrollment.courseId.toString() === courseId
      );
    }

    if (!isEnrolled) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // Return course data for learning interface
    return NextResponse.json({
      course: {
        _id: course._id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        category: course.category,
        level: course.level,
        language: course.language,
        certificate: course.certificate,
        prerequisites: course.prerequisites,
        outcomes: course.outcomes,
        sections: course.sections,
        totalStudents: course.totalStudents,
        tutorId: course.tutorId
      },
      isEnrolled: true
    });

  } catch (error) {
    console.error("Error fetching course for learning:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
