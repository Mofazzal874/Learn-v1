import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    // Build search query
    let searchQuery: Record<string, unknown> = {
      published: true,
      approved: true
    };
    
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get courses sorted by rating and total students
    const courses = await Course.find(searchQuery)
      .populate('tutorId', 'firstName lastName image')
      .sort({ rating: -1, totalStudents: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title subtitle description category level price isFree thumbnail thumbnailAsset rating totalStudents totalReviews tutorId createdAt')
      .lean();
    
    // Get total count for pagination
    const total = await Course.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      courses: JSON.parse(JSON.stringify(courses)),
      pagination: {
        currentPage: page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: unknown) {
    console.error('[POPULAR_COURSES_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular courses' },
      { status: 500 }
    );
  }
}