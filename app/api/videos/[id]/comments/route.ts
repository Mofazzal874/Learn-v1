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
    const { review } = await req.json();

    if (!review || !review.trim()) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Use the video action to add comment
    const { addVideoComment } = await import('@/app/actions/video');
    await addVideoComment(id, review);

    return NextResponse.json({ message: 'Comment added successfully' });
  } catch (error: any) {
    console.error('[VIDEO_COMMENT_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}