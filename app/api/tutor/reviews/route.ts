import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const courses = await Course.find({ tutorId: session.user.id })
      .populate('reviews.userId', 'firstName lastName')
      .select('title reviews rating totalRatings totalReviews');

    
    let allReviews: any[] = [];
    let totalReviews = 0;
    let totalRatings = 0;
    let totalRatingSum = 0;

    courses.forEach(course => {
      if (course.reviews && course.reviews.length > 0) {
        course.reviews.forEach((review: any) => {
          allReviews.push({
            ...review.toObject(),
            courseName: course.title,
          });
        });
        totalReviews += course.totalReviews || 0;
        totalRatings += course.totalRatings || 0;
        totalRatingSum += (course.rating || 0) * (course.totalRatings || 0);
      }
    });

    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const averageRating = totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(1) : 0;
    return NextResponse.json({
      reviews: allReviews.slice(0, 20),
      stats: {
        averageRating,
        totalReviews,
        totalRatings,
      }
    });

  } catch (error: unknown) {
    console.error('[TUTOR_REVIEWS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    );
  }
} 