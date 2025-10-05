import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
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

    const { id } = await params;
    const { review } = await req.json();

    if (!review || !review.trim()) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    await connectDB();

    // Find the video
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get user details for the response
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add the comment
    const newComment = {
      userId: session.user.id,
      review: review.trim(),
      createdAt: new Date()
    };

    video.comments.unshift(newComment); // Add to beginning for newest first
    video.totalComments = video.comments.length;
    
    await video.save();

    // Return the new comment with user details
    const commentWithUser = {
      _id: video.comments[0]._id,
      userId: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image
      },
      review: review.trim(),
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      message: 'Comment added successfully',
      comment: commentWithUser
    });
    
  } catch (error: unknown) {
    console.error('[VIDEO_COMMENT_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    // Find the video and populate comments with user details
    const video = await Video.findById(id)
      .populate('comments.userId', 'firstName lastName image')
      .lean();
      
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Sort comments by newest first
    const sortedComments = video.comments.sort((a: { createdAt: Date }, b: { createdAt: Date }) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ 
      comments: sortedComments,
      totalComments: video.totalComments 
    });
    
  } catch (error: unknown) {
    console.error('[VIDEO_COMMENTS_FETCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}