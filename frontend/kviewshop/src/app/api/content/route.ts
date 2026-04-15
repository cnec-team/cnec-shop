import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = 10;

    const contents = await prisma.creatorProductContent.findMany({
      where: {
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            shopId: true,
            username: true,
            profileImageUrl: true,
            instagramHandle: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            nameKo: true,
            thumbnailUrl: true,
            imageUrl: true,
            images: true,
            salePrice: true,
            originalPrice: true,
            category: true,
            brand: {
              select: { brandName: true, logoUrl: true },
            },
          },
        },
      },
    });

    const hasMore = contents.length > limit;
    const items = hasMore ? contents.slice(0, limit) : contents;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Serialize decimals
    const serialized = items.map(c => ({
      id: c.id,
      type: c.type,
      url: c.url,
      caption: c.caption,
      createdAt: c.createdAt.toISOString(),
      creator: c.creator,
      product: c.product ? {
        ...c.product,
        salePrice: c.product.salePrice ? Number(c.product.salePrice) : null,
        originalPrice: c.product.originalPrice ? Number(c.product.originalPrice) : null,
      } : null,
    }));

    return NextResponse.json({ items: serialized, nextCursor });
  } catch (error) {
    console.error('Content feed error:', error);
    return NextResponse.json({ items: [], nextCursor: null });
  }
}
