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

    // Use the video action to publish the video
    const { publishVideo } = await import('@/app/actions/video');
    await publishVideo(id);

    return NextResponse.json({ message: 'Video published successfully' });
  } catch (error: any) {
    console.error('[VIDEO_PUBLISH_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish video' },
      { status: 500 }
    );
  }
}