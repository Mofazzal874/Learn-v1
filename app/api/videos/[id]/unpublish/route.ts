import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Use the video action to unpublish the video
    const { unpublishVideo } = await import('@/app/actions/video');
    await unpublishVideo(id);

    return NextResponse.json({ message: 'Video unpublished successfully' });
  } catch (error: any) {
    console.error('[VIDEO_UNPUBLISH_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unpublish video' },
      { status: 500 }
    );
  }
}