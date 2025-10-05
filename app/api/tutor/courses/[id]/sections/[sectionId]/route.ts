import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import mongoose from 'mongoose';

// GET - Fetch a specific section
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id, sectionId } = resolvedParams;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the logged-in user is the tutor of this course
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const section = course.sections?.find((s: any) => s._id.toString() === sectionId);

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Get section error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific section
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id, sectionId } = resolvedParams;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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

    // Update the section
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, 'sections._id': sectionId },
      {
        $set: {
          'sections.$.title': title.trim(),
          'sections.$.description': description?.trim() || '',
          'sections.$.lessons': lessons.map((lesson: any) => ({
            _id: lesson._id && mongoose.Types.ObjectId.isValid(lesson._id) 
              ? new mongoose.Types.ObjectId(lesson._id) 
              : new mongoose.Types.ObjectId(),
            title: lesson.title?.trim() || '',
            description: lesson.description?.trim() || '',
            duration: lesson.duration?.trim() || '',
            type: lesson.type || 'video',
            videoLink: lesson.videoLink?.trim() || '',
            assignmentLink: lesson.assignmentLink?.trim() || '',
            assignmentDescription: lesson.assignmentDescription?.trim() || '',
          }))
        }
      },
      { new: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const updatedSection = updatedCourse.sections?.find((s: any) => s._id.toString() === sectionId);

    console.log(`[UPDATE_SECTION] Updated section "${title}" in course ${id}`);

    return NextResponse.json({
      message: 'Section updated successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Safely handle params whether it's a Promise or not
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id, sectionId } = resolvedParams;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the logged-in user is the tutor of this course
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove the section
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $pull: { sections: { _id: sectionId } } },
      { new: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }

    console.log(`[DELETE_SECTION] Deleted section ${sectionId} from course ${id}`);

    return NextResponse.json({
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
