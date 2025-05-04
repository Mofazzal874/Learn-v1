import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';
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
    const processedSections = sections.map((section, index) => ({
      title: section.title,
      description: section.description,
      order: index,
      lessons: section.lessons.map(lesson => ({
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        videoLink: lesson.videoLink || '',
        assignmentLink: lesson.assignmentLink || '',
        assignmentDescription: lesson.assignmentDescription || '',
      }))
    }));

    // Create the course using Mongoose
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
      sections: processedSections,
      published: false,
      approved: false
    });

    return NextResponse.json({ 
      message: 'Course created successfully', 
      courseId: course._id 
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