import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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
    const course = await Course.findById(courseId).lean();
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify that the course belongs to the authenticated tutor
    if ((course as any).tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("[GET_COURSE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}