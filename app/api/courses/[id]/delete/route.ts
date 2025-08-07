import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { deleteCourseEmbedding } from "@/lib/course-embedding";
import { deleteAsset } from "@/lib/cloudinary";
import mongoose from "mongoose";

async function deleteCourseHandler(
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
      console.log(`[DELETE_COURSE] Deleting thumbnail from Cloudinary: ${course.thumbnailAsset.public_id}`);
      deletePromises.push(
        deleteAsset(course.thumbnailAsset.public_id, 'image')
      );
    }

    if (course.previewVideoAsset?.public_id) {
      console.log(`[DELETE_COURSE] Deleting preview video from Cloudinary: ${course.previewVideoAsset.public_id}`);
      deletePromises.push(
        deleteAsset(course.previewVideoAsset.public_id, 'video')
      );
    }

    // Execute all deletion promises
    if (deletePromises.length > 0) {
      console.log(`[DELETE_COURSE] Executing ${deletePromises.length} Cloudinary deletion(s)`);
      const results = await Promise.allSettled(deletePromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const assetType = index === 0 ? 'thumbnail' : 'preview video';
          console.log(`[DELETE_COURSE] Successfully deleted ${assetType} from Cloudinary`);
        } else {
          const assetType = index === 0 ? 'thumbnail' : 'preview video';
          console.log(`[DELETE_COURSE] Failed to delete ${assetType} from Cloudinary:`, result.reason);
        }
      });
    }

    // Delete the course
    console.log(`[DELETE_COURSE] Deleting course with ID: ${courseId}`);
    await Course.findByIdAndDelete(courseId);

    // Clean up embeddings asynchronously
    deleteCourseEmbeddingsAsync(courseId, session.user.id);

    console.log(`[DELETE_COURSE] Course deleted successfully with ID: ${courseId}`);
    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

// Export both DELETE and POST methods to support both form submissions and fetch requests
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return deleteCourseHandler(req, { params });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return deleteCourseHandler(req, { params });
}

// Async function to clean up embeddings when course is deleted
async function deleteCourseEmbeddingsAsync(courseId: string, userId: string) {
  try {
    console.log(`[DELETE_COURSE] Starting async embedding cleanup for course ${courseId}`);
    await deleteCourseEmbedding(courseId, userId);
    console.log(`[DELETE_COURSE] Embedding cleanup completed for course ${courseId}`);
  } catch (error) {
    console.error(`[DELETE_COURSE] Embedding cleanup failed for course ${courseId}:`, error);
    // Don't throw - this is async and shouldn't affect the main course deletion operation
  }
}