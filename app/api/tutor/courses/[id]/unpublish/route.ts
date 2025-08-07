import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Ensure params is awaited before accessing its properties
    const { id } = await params;

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

    // Update the course to be unpublished
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { published: false },
      { new: true }
    );

    return NextResponse.json({
      message: 'Course unpublished successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Unpublish course error:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish course' },
      { status: 500 }
    );
  }
}