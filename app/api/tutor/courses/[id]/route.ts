import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { uploadImage, uploadVideo, deleteAsset } from '@/lib/cloudinary';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;

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

    // Get update data
    const data = await req.json();
    const { courseData, sections, pricing } = data;

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
      })),
      _id: section.id ? new mongoose.Types.ObjectId(section.id) : new mongoose.Types.ObjectId()
    }));

    // Update the course
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
        sections: processedSections,
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Course updated successfully',
      course: updatedCourse
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;

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
    await Course.findByIdAndDelete(id);

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