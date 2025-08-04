import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { uploadImage, uploadVideo, deleteAsset } from '@/lib/cloudinary';
import { processCourseEmbedding, deleteCourseEmbedding } from '@/lib/course-embedding';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the logged-in user is the tutor of this course
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the logged-in user is the tutor of this course
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Replace lines 82-84 with:
const formData = await req.formData();

// Extract basic course data
const courseData = {
  title: formData.get('title') as string,
  subtitle: formData.get('subtitle') as string,
  description: formData.get('description') as string,
  category: formData.get('category') as string,
  level: formData.get('level') as string,
  certificate: formData.get('certificate') === 'true',
  thumbnail: formData.get('thumbnail') as string,
  previewVideo: formData.get('previewVideo') as string,
  prerequisites: (formData.get('prerequisites') as string || '').split(',').filter(item => item.trim()),
  outcomes: (formData.get('outcomes') as string || '').split(',').filter(item => item.trim()),
};

// Extract sections and pricing data
const sections = JSON.parse(formData.get('sections') as string || '[]');
const pricing = JSON.parse(formData.get('pricing') as string || '{}');

    // Handle media uploads if new files are provided
    let thumbnailResult = course.thumbnailAsset;
    let previewVideoResult = course.previewVideoAsset;

    if (courseData.thumbnail && courseData.thumbnail !== course.thumbnail) {
      // Delete old thumbnail if exists
      if (course.thumbnailAsset?.public_id) {
        await deleteAsset(course.thumbnailAsset.public_id);
      }
      
      // Upload new thumbnail
      thumbnailResult = await uploadImage(courseData.thumbnail, 'courses/thumbnails');
    }

    if (courseData.previewVideo && courseData.previewVideo !== course.previewVideo) {
      // Delete old preview video if exists
      if (course.previewVideoAsset?.public_id) {
        await deleteAsset(course.previewVideoAsset.public_id, 'video');
      }
      
      // Upload new preview video
      previewVideoResult = await uploadVideo(courseData.previewVideo, 'courses/previews');
    }

    // Process pricing data
    const price = pricing.isFree ? 0 : parseFloat(pricing.basePrice) || 0;
    const discountedPrice = pricing.hasDiscount ? parseFloat(pricing.discountPrice) || 0 : undefined;
    const discountEnds = pricing.hasDiscount ? new Date(pricing.discountEnds) : undefined;

    // Process sections and lessons
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedSections = sections.map((section: any, index: number) => ({
      title: section.title,
      description: section.description,
      order: index,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lessons: section.lessons.map((lesson: any) => ({
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        videoLink: lesson.videoLink || '',
        assignmentLink: lesson.assignmentLink || '',
        assignmentDescription: lesson.assignmentDescription || '',
      })),
      _id: section.id ? new mongoose.Types.ObjectId(section.id) : new mongoose.Types.ObjectId()
    }));

    // Update the course
    console.log(`[UPDATE_COURSE] Updating course "${courseData.title}" with ID ${id}`);
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        title: courseData.title,
        subtitle: courseData.subtitle,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level,
        thumbnail: thumbnailResult?.secure_url || course.thumbnail,
        thumbnailAsset: thumbnailResult,
        previewVideo: previewVideoResult?.secure_url || course.previewVideo,
        previewVideoAsset: previewVideoResult,
        price,
        isFree: pricing.isFree,
        discountedPrice,
        discountEnds,
        certificate: courseData.certificate,
        prerequisites: JSON.parse(formData.get('prerequisites') as string || '[]'),
        outcomes: JSON.parse(formData.get('outcomes') as string || '[]'),
        sections: processedSections,
      },
      { new: true }
    );

    console.log(`[UPDATE_COURSE] Course updated successfully with ID: ${id}`);

    // Process embeddings asynchronously - don't wait for completion
    processCourseEmbeddingsAsync(updatedCourse, session.user.id);

    return NextResponse.json({
      message: 'Course updated successfully',
      course: updatedCourse,
      embeddingStatus: "processing"
    });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the logged-in user is the tutor of this course
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete media assets from Cloudinary
    if (course.thumbnailAsset?.public_id) {
      await deleteAsset(course.thumbnailAsset.public_id);
    }

    if (course.previewVideoAsset?.public_id) {
      await deleteAsset(course.previewVideoAsset.public_id, 'video');
    }

    // Delete the course
    console.log(`[DELETE_COURSE] Deleting course with ID: ${id}`);
    await Course.findByIdAndDelete(id);

    // Clean up embeddings asynchronously
    deleteCourseEmbeddingsAsync(id, session.user.id);

    console.log(`[DELETE_COURSE] Course deleted successfully with ID: ${id}`);
    return NextResponse.json({ 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

// Async function to process course embeddings without blocking the response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processCourseEmbeddingsAsync(course: any, userId: string) {
  try {
    console.log(`[UPDATE_COURSE] Starting async embedding processing for course ${course._id}`);
    
    // Convert the mongoose document to a plain object for processing
    const courseData = {
      _id: course._id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      sections: course.sections || [],
      outcomes: course.outcomes || [],
      prerequisites: course.prerequisites || [],
      tags: course.tags || [],
      tutorId: course.tutorId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
    
    await processCourseEmbedding(courseData, userId);
    console.log(`[UPDATE_COURSE] Embedding processing completed for course ${course._id}`);
  } catch (error) {
    console.error(`[UPDATE_COURSE] Embedding processing failed for course ${course._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main course update operation
  }
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