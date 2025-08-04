import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';
import { processCourseEmbedding } from '@/lib/course-embedding';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const data = await req.json();
    const { courseData, sections, pricing } = data;

    // Upload media files to Cloudinary if provided
    let thumbnailResult = null;
    let previewVideoResult = null;

    if (courseData.thumbnail) {
      thumbnailResult = await uploadImage(courseData.thumbnail, 'courses/thumbnails');
    }

    if (courseData.previewVideo) {
      previewVideoResult = await uploadVideo(courseData.previewVideo, 'courses/previews');
    }

    // Generate a slug from the title
    const slug = courseData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Prepare pricing data
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
      }))
    }));

    // Create the course using Mongoose
    console.log(`[CREATE_COURSE] Creating course "${courseData.title}" for user ${session.user.id}`);
    const course = await Course.create({
      title: courseData.title,
      subtitle: courseData.subtitle,
      slug,
      description: courseData.description,
      tutorId: new mongoose.Types.ObjectId(session.user.id),
      thumbnail: thumbnailResult?.secure_url || '',
      thumbnailAsset: thumbnailResult,
      previewVideo: previewVideoResult?.secure_url || '',
      previewVideoAsset: previewVideoResult,
      price,
      isFree: pricing.isFree,
      discountedPrice,
      discountEnds,
      category: courseData.category,
      level: courseData.level,
      certificate: courseData.certificate,
      prerequisites: courseData.prerequisites || [], 
      outcomes: courseData.outcomes || [], 
      sections: processedSections,
      published: false,
      approved: false
    });

    console.log(`[CREATE_COURSE] Course created successfully with ID: ${course._id}`);

    // Process embeddings asynchronously - don't wait for completion
    processCourseEmbeddingsAsync(course, session.user.id);

    return NextResponse.json({ 
      message: 'Course created successfully', 
      courseId: course._id,
      embeddingStatus: "processing"
    });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const tutorId = session.user.id;
    const courses = await Course.find({ tutorId }).sort({ createdAt: -1 });
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// Async function to process course embeddings without blocking the response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processCourseEmbeddingsAsync(course: any, userId: string) {
  try {
    console.log(`[CREATE_COURSE] Starting async embedding processing for course ${course._id}`);
    
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
    console.log(`[CREATE_COURSE] Embedding processing completed for course ${course._id}`);
  } catch (error) {
    console.error(`[CREATE_COURSE] Embedding processing failed for course ${course._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main course creation operation
  }
}