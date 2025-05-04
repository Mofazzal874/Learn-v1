import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import { getCldConfig } from '@/lib/cloudinary';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    getCldConfig();

    const courseId = params.id;
    
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

    // Delete associated Cloudinary assets
    const deletePromises = [];

    if (course.thumbnailAsset?.public_id) {
      deletePromises.push(
        cloudinary.uploader.destroy(course.thumbnailAsset.public_id)
      );
    }

    if (course.previewVideoAsset?.public_id) {
      deletePromises.push(
        cloudinary.uploader.destroy(course.previewVideoAsset.public_id, { resource_type: 'video' })
      );
    }

    // Execute all deletion promises
    if (deletePromises.length > 0) {
      await Promise.allSettled(deletePromises);
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}