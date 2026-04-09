import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string; contentId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: { id: true },
    });
    if (!creator) {
      return NextResponse.json({ error: '크리에이터 권한이 필요합니다' }, { status: 401 });
    }

    const { contentId } = await params;

    // Only allow deleting own content
    const content = await prisma.creatorProductContent.findUnique({
      where: { id: contentId },
      select: { creatorId: true },
    });

    if (!content) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다' }, { status: 404 });
    }

    if (content.creatorId !== creator.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 });
    }

    await prisma.creatorProductContent.delete({
      where: { id: contentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete content:', error);
    return NextResponse.json({ error: '삭제에 실패했습니다' }, { status: 500 });
  }
}
