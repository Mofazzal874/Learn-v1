import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';

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
    const { rating } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await connectDB();

    // Find the video
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if user has already rated this video
    const existingRatingIndex = video.ratings.findIndex(
      (r: { userId: { toString(): string } }) => r.userId.toString() === session.user.id
    );

    if (existingRatingIndex >= 0) {
      // Update existing rating
      video.ratings[existingRatingIndex].rating = rating;
      video.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      video.ratings.push({
        userId: session.user.id,
        rating,
        createdAt: new Date()
      });
    }

    // Calculate average rating with proper precision
    const totalRatings = video.ratings.length;
    const sumRatings = video.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    
    // Round to 2 decimal places for storage but keep precision
    video.rating = Math.round(averageRating * 100) / 100;
    video.totalRatings = totalRatings;
    
    console.log('Rating calculation:', {
      totalRatings,
      sumRatings,
      averageRating,
      finalRating: video.rating,
      allRatings: video.ratings.map(r => ({ userId: r.userId, rating: r.rating }))
    });

    await video.save();

    return NextResponse.json({ 
      message: 'Rating submitted successfully',
      averageRating: video.rating,
      totalRatings: totalRatings,
      userRating: rating
    });
    
  } catch (error: unknown) {
    console.error('[VIDEO_RATING_ERROR]', error);
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
    const { id } = params;

    await connectDB();

    const video = await Video.findById(id).select('rating totalRatings ratings');
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    let userRating = null;
    if (session?.user?.id) {
      const userRatingObj = video.ratings.find(
        (r: { userId: { toString(): string } }) => r.userId.toString() === session.user.id
      );
      userRating = userRatingObj?.rating || null;
    }

    return NextResponse.json({
      averageRating: video.rating || 0,
      totalRatings: video.totalRatings || 0,
      userRating
    });
    
  } catch (error: unknown) {
    console.error('[VIDEO_RATING_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: 500 }
    );
  }
}