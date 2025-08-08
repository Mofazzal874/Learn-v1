import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    // Build search query
    const searchQuery: Record<string, unknown> = {
      published: true
    };
    
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get videos sorted by rating and views
    const videos = await Video.find(searchQuery)
      .populate({
        path: 'userId',
        select: 'firstName lastName image',
        model: 'User'
      })
      .sort({ rating: -1, views: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title subtitle description category level thumbnail thumbnailAsset rating views totalComments userId duration createdAt')
      .lean();
    
    // Get total count for pagination
    const total = await Video.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      videos: JSON.parse(JSON.stringify(videos)),
      pagination: {
        currentPage: page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: unknown) {
    console.error('[POPULAR_VIDEOS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular videos' },
      { status: 500 }
    );
  }
}