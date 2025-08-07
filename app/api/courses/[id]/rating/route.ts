import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const { rating } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await connectDB();

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Initialize ratings array if it doesn't exist
    if (!course.ratings) {
      course.ratings = [];
    }

    // Check if user has already rated this course
    const existingRatingIndex = course.ratings.findIndex(
      (r: { userId: { toString(): string } }) => r.userId.toString() === session.user.id
    );

    if (existingRatingIndex >= 0) {
      // Update existing rating
      course.ratings[existingRatingIndex].rating = rating;
      course.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      course.ratings.push({
        userId: session.user.id,
        rating,
        createdAt: new Date()
      });
    }

    // Calculate average rating with proper precision
    const totalRatings = course.ratings.length;
    const sumRatings = course.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    
    // Round to 2 decimal places for storage but keep precision
    course.rating = Math.round(averageRating * 100) / 100;
    course.totalRatings = totalRatings;
    
    console.log('Course rating calculation:', {
      courseId: id,
      totalRatings,
      sumRatings,
      averageRating,
      finalRating: course.rating,
      allRatings: course.ratings.map(r => ({ userId: r.userId, rating: r.rating }))
    });

    await course.save();

    return NextResponse.json({ 
      message: 'Rating submitted successfully',
      averageRating: course.rating,
      totalRatings: totalRatings,
      userRating: rating
    });
    
  } catch (error: unknown) {
    console.error('[COURSE_RATING_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    await connectDB();

    const course = await Course.findById(id).select('rating totalRatings ratings');
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let userRating = null;
    if (session?.user?.id && course.ratings) {
      const userRatingObj = course.ratings.find(
        (r: { userId: { toString(): string } }) => r.userId.toString() === session.user.id
      );
      userRating = userRatingObj?.rating || null;
    }

    return NextResponse.json({
      averageRating: course.rating || 0,
      totalRatings: course.totalRatings || 0,
      userRating
    });
    
  } catch (error: unknown) {
    console.error('[COURSE_RATING_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: 500 }
    );
  }
}