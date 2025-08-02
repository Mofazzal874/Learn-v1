import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { UserProgress } from '@/models/UserProgress';
import { Course } from '@/models/Course';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { courseId, paymentMethod, amount, paymentDetails } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.published) {
      return NextResponse.json(
        { error: 'Course is not available for enrollment' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    let userProgress = await UserProgress.findOne({ userId: session.user.id });
    
    if (userProgress) {
      const existingEnrollment = userProgress.enrolledCourses.find(
        (enrollment: { courseId: { toString(): string } }) => enrollment.courseId.toString() === courseId
      );
      
      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'You are already enrolled in this course' },
          { status: 400 }
        );
      }
    } else {
      // Create new user progress document
      userProgress = new UserProgress({
        userId: session.user.id,
        totalLearningTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActive: new Date(),
        savedCourses: [],
        enrolledCourses: [],
        skills: [],
        achievements: [],
        goals: [],
        recentActivities: [],
        dailyProgressHour: [],
        totalCoursesCompleted: 0,
        totalVideosWatched: 0,
        totalCertificatesEarned: 0,
        learningPreferences: {
          reminderEnabled: true,
          reminderTime: '19:00',
          weeklyGoalHours: 10
        }
      });
    }

    // Validate payment for paid courses
    if (!course.isFree && amount > 0) {
      // Here you would integrate with a real payment processor
      // For now, we'll simulate payment validation
      if (!paymentMethod || !paymentDetails) {
        return NextResponse.json(
          { error: 'Payment details are required for paid courses' },
          { status: 400 }
        );
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would:
      // 1. Validate payment details with the payment processor
      // 2. Charge the customer
      // 3. Handle payment failures
      console.log('Processing payment:', { paymentMethod, amount, paymentDetails });
    }

    // Add enrollment to user progress
    userProgress.addEnrolledCourse(courseId);
    
    // Update streak if this is a new learning activity
    userProgress.updateStreak();
    
    // Add achievement for first enrollment if this is their first course
    if (userProgress.enrolledCourses.length === 1) {
      userProgress.achievements.push({
        title: 'First Step',
        description: 'Enrolled in your first course',
        type: 'course_completion',
        badge: 'first-enrollment',
        earnedAt: new Date(),
        metadata: { courseId }
      });
    }

    // Save user progress
    await userProgress.save();

    // Update course enrollment count (if you have this field)
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalStudents: 1 }
    });

    return NextResponse.json({
      message: 'Successfully enrolled in course',
      enrollment: {
        courseId,
        enrolledAt: new Date(),
        paymentMethod: course.isFree ? 'free' : paymentMethod,
        amount: course.isFree ? 0 : amount
      }
    });

  } catch (error: unknown) {
    console.error('[COURSE_ENROLLMENT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course. Please try again.' },
      { status: 500 }
    );
  }
}