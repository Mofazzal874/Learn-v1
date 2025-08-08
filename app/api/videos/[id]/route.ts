import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle both Promise and direct params
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    await connectDB();

    const video = await Video.findById(id)
      .populate({
        path: 'userId',
        select: 'firstName lastName image',
        model: 'User'
      })
      .populate({
        path: 'comments.userId',
        select: 'firstName lastName image',
        model: 'User'
      })
      .lean();

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('[VIDEO_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const data = await req.json();

    // Use the video action to update the video
    const { updateVideo } = await import('@/app/actions/video');
    await updateVideo(id, data);

    return NextResponse.json({ message: 'Video updated successfully' });
  } catch (error: any) {
    console.error('[VIDEO_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Use the video action to delete the video
    const { deleteVideo } = await import('@/app/actions/video');
    await deleteVideo(id);

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error: any) {
    console.error('[VIDEO_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}