import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import mongoose from 'mongoose';

// GET - Fetch all sections for a course
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

    return NextResponse.json({ 
      sections: course.sections || [],
      courseTitle: course.title 
    });
  } catch (error) {
    console.error('Get sections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST - Add a new section to a course
export async function POST(
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

    const { title, description, lessons = [] } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Section title is required' }, { status: 400 });
    }

    // Create new section
    const newSection = {
      _id: new mongoose.Types.ObjectId(),
      title: title.trim(),
      description: description?.trim() || '',
      lessons: lessons.map((lesson: any) => ({
        _id: new mongoose.Types.ObjectId(),
        title: lesson.title?.trim() || '',
        description: lesson.description?.trim() || '',
        duration: lesson.duration?.trim() || '',
        type: lesson.type || 'video',
        videoLink: lesson.videoLink?.trim() || '',
        assignmentLink: lesson.assignmentLink?.trim() || '',
        assignmentDescription: lesson.assignmentDescription?.trim() || '',
      })),
      order: course.sections?.length || 0,
    };

    // Add section to course
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $push: { sections: newSection } },
      { new: true }
    );

    console.log(`[ADD_SECTION] Added section "${title}" to course ${id}`);

    return NextResponse.json({
      message: 'Section added successfully',
      section: newSection,
      course: updatedCourse
    });
  } catch (error) {
    console.error('Add section error:', error);
    return NextResponse.json(
      { error: 'Failed to add section' },
      { status: 500 }
    );
  }
}
