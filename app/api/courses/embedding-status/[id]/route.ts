// app/api/courses/embedding-status/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { CourseEmbeddingDetails } from '@/models/CourseEmbeddingDetails';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[COURSE_EMBEDDING_STATUS] Starting embedding status check');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id: courseId } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    console.log(`[COURSE_EMBEDDING_STATUS] Checking embedding status for course ${courseId}`);

    // Find the embedding details for this course
    const embeddingDetails = await CourseEmbeddingDetails.findOne({
      courseId: courseId,
      userId: session.user.id
    });

    if (!embeddingDetails) {
      console.log(`[COURSE_EMBEDDING_STATUS] No embedding found for course ${courseId}`);
      return NextResponse.json({
        status: 'not_found',
        message: 'No embedding found for this course'
      });
    }

    console.log(`[COURSE_EMBEDDING_STATUS] Found embedding for course ${courseId}:`, {
      status: embeddingDetails.status,
      lastEmbeddedAt: embeddingDetails.lastEmbeddedAt,
      vectorDimension: embeddingDetails.vectorDimension
    });

    return NextResponse.json({
      status: embeddingDetails.status,
      embeddingId: embeddingDetails.embeddingId,
      lastEmbeddedAt: embeddingDetails.lastEmbeddedAt,
      vectorDimension: embeddingDetails.vectorDimension,
      processingMetadata: embeddingDetails.processingMetadata,
      sourceContent: {
        title: embeddingDetails.sourceContent.title,
        category: embeddingDetails.sourceContent.category,
        level: embeddingDetails.sourceContent.level
      },
      errorMessage: embeddingDetails.errorMessage,
      createdAt: embeddingDetails.createdAt,
      updatedAt: embeddingDetails.updatedAt
    });

  } catch (error) {
    console.error('[COURSE_EMBEDDING_STATUS] Error checking embedding status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check embedding status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}