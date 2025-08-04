import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { uploadImage, uploadVideo, deleteAsset } from '@/lib/cloudinary';
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
        prerequisites: JSON.parse(formData.get('prerequisites') as string || '[]'),
        outcomes: JSON.parse(formData.get('outcomes') as string || '[]'),
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