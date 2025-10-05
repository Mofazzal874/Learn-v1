import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const data = await req.json();
    
    // Use the video action to create the video
    const { createVideo } = await import('@/app/actions/video');
    const videoId = await createVideo(data);

    return NextResponse.json({ id: videoId, message: 'Video created successfully' });
  } catch (error: unknown) {
    console.error('[VIDEO_CREATE_ERROR]', error);
    
    let errorMessage = 'Failed to create video';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle duplicate slug error specifically
      if (error.message.includes('E11000') && error.message.includes('slug_1')) {
        errorMessage = 'A video with this title already exists. Please choose a different title.';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const published = searchParams.get('published');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    await connectDB();

    // Build query
    const query: Record<string, string | boolean | object> = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (published !== null && published !== undefined) {
      query.published = published === 'true';
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get videos with pagination
    const videos = await Video.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName image',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Video.countDocuments(query);

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    console.error('[VIDEOS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}