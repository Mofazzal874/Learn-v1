import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Access id as a property of params object without destructuring
    const id = params.id;

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
    
    // Check if course has necessary content to be published
    if (!course.sections || course.sections.length === 0) {
      return NextResponse.json(
        { error: 'Cannot publish a course without any content sections' }, 
        { status: 400 }
      );
    }

    // Update the course to be published
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { published: true },
      { new: true }
    );

    return NextResponse.json({
      message: 'Course published successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Publish course error:', error);
    return NextResponse.json(
      { error: 'Failed to publish course' },
      { status: 500 }
    );
  }
}