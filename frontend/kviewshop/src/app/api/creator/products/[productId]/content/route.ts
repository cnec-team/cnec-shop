import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { getEmbedUrl, detectContentType } from '@/lib/utils/embed';

const MAX_CONTENTS_PER_PRODUCT = 5;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
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

    const { productId } = await params;
    const body = await request.json();
    const { url, caption } = body as { url: string; caption?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL을 입력해주세요' }, { status: 400 });
    }

    // Check max limit
    const existingCount = await prisma.creatorProductContent.count({
      where: { creatorId: creator.id, productId },
    });
    if (existingCount >= MAX_CONTENTS_PER_PRODUCT) {
      return NextResponse.json(
        { error: `상품당 최대 ${MAX_CONTENTS_PER_PRODUCT}개까지 등록할 수 있습니다` },
        { status: 400 }
      );
    }

    const type = detectContentType(url);
    const embedUrl = getEmbedUrl(url, type);

    const content = await prisma.creatorProductContent.create({
      data: {
        creatorId: creator.id,
        productId,
        type,
        url: url.trim(),
        embedUrl,
        caption: caption?.trim() || null,
        sortOrder: existingCount,
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json({ error: '이미 등록된 URL입니다' }, { status: 409 });
    }
    console.error('Failed to create content:', error);
    return NextResponse.json({ error: '등록에 실패했습니다' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
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

    const { productId } = await params;

    const contents = await prisma.creatorProductContent.findMany({
      where: { creatorId: creator.id, productId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Failed to fetch contents:', error);
    return NextResponse.json({ error: '조회에 실패했습니다' }, { status: 500 });
  }
}
