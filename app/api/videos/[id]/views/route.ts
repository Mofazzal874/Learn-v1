import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use the video action to increment views
    const { incrementVideoViews } = await import('@/app/actions/video');
    await incrementVideoViews(id);

    return NextResponse.json({ message: 'View counted' });
  } catch (error: any) {
    console.error('[VIDEO_VIEW_ERROR]', error);
    // Don't return error for view increments as it's not critical
    return NextResponse.json({ message: 'View not counted' }, { status: 200 });
  }
}