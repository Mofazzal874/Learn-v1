import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import mongoose from "mongoose";

// Add POST method to support form submissions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reuse the same logic as PATCH
  return PATCH(req, { params });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
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

    // Find the course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify ownership
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate course before publishing
    if (!course.title || !course.description || !course.thumbnail) {
      return NextResponse.json(
        { error: "Course is incomplete. Please add a title, description, and thumbnail." }, 
        { status: 400 }
      );
    }

    if (!course.sections || course.sections.length === 0) {
      return NextResponse.json(
        { error: "Course must have at least one section with content before publishing." },
        { status: 400 }
      );
    }

    // Update course status
    course.published = true;
    course.approved = true; // Auto-approve when publishing for now
    await course.save();

    // Return success JSON response instead of redirecting
    return NextResponse.json({ 
      success: true, 
      published: true,
      course: {
        id: course._id,
        title: course.title,
        published: course.published
      }
    });
  } catch (error) {
    console.error("[PUBLISH_COURSE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to publish course" },
      { status: 500 }
    );
  }
}