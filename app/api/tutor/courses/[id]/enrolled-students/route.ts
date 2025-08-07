import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { UserProgress } from '@/models/UserProgress';
import { User } from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    await connectDB();

    // Find the course and verify the tutor owns it
    const course = await Course.findById(id)
      .populate('enrolledUsers', 'firstName lastName email image')
      .select('title enrolledUsers tutorId totalStudents');
      
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the logged-in user is the tutor of this course
    if (course.tutorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Access denied. You are not the tutor of this course.' }, { status: 403 });
    }

    // Get additional enrollment details from UserProgress
    const enrolledUsers = [];
    
    for (const user of course.enrolledUsers) {
      // Get user progress for this course
      const userProgress = await UserProgress.findOne({ 
        userId: user._id,
        'enrolledCourses.courseId': course._id 
      }).select('enrolledCourses');

      const courseProgress = userProgress?.enrolledCourses?.find(
        (enrollment: { courseId: { toString(): string } }) => 
          enrollment.courseId.toString() === course._id.toString()
      );

      enrolledUsers.push({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        enrolledAt: courseProgress?.enrolledAt || null,
        status: courseProgress?.status || 'enrolled',
        lastAccessedAt: courseProgress?.lastAccessedAt || null
      });
    }

    // Sort by enrollment date (newest first)
    enrolledUsers.sort((a, b) => {
      if (!a.enrolledAt || !b.enrolledAt) return 0;
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });

    return NextResponse.json({
      courseTitle: course.title,
      totalStudents: course.totalStudents || 0,
      enrolledUsers
    });

  } catch (error: unknown) {
    console.error('[ENROLLED_STUDENTS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled students' },
      { status: 500 }
    );
  }
}