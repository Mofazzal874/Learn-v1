import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { User } from '@/models/User';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { rating, review } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (!review || !review.trim()) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    await connectDB();

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get user details for the response
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize arrays if they don't exist
    if (!course.reviews) {
      course.reviews = [];
    }
    if (!course.ratings) {
      course.ratings = [];
    }

    // Check if user has already reviewed this course
    const existingReviewIndex = course.reviews.findIndex(
      (r: { userId: { toString(): string } }) => r.userId.toString() === session.user.id
    );

    if (existingReviewIndex >= 0) {
      // Update existing review
      course.reviews[existingReviewIndex].rating = rating;
      course.reviews[existingReviewIndex].review = review.trim();
      course.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      // Add new review
      course.reviews.unshift({
        userId: session.user.id,
        rating,
        review: review.trim(),
        createdAt: new Date()
      });
    }

    // Update totalReviews count
    course.totalReviews = course.reviews.length;

    // Also update or add rating to ratings array
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

    // Calculate average rating
    const totalRatings = course.ratings.length;
    const sumRatings = course.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    
    course.rating = Math.round(averageRating * 100) / 100;
    course.totalRatings = totalRatings;

    await course.save();

    // Return the new review with user details
    const reviewWithUser = {
      _id: course.reviews[existingReviewIndex >= 0 ? existingReviewIndex : 0]._id,
      userId: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image
      },
      rating,
      review: review.trim(),
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      message: 'Review submitted successfully',
      review: reviewWithUser,
      averageRating: course.rating,
      totalRatings: totalRatings,
      totalReviews: course.totalReviews
    });
    
  } catch (error: unknown) {
    console.error('[COURSE_REVIEW_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    await connectDB();

    const course = await Course.findById(id)
      .populate('reviews.userId', 'firstName lastName image')
      .select('reviews totalReviews rating totalRatings');
      
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Sort reviews by newest first and limit
    const sortedReviews = course.reviews
      .sort((a: { createdAt: string }, b: { createdAt: string }) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);

    return NextResponse.json({
      reviews: sortedReviews,
      totalReviews: course.totalReviews || 0,
      averageRating: course.rating || 0,
      totalRatings: course.totalRatings || 0
    });
    
  } catch (error: unknown) {
    console.error('[COURSE_REVIEWS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    );
  }
}