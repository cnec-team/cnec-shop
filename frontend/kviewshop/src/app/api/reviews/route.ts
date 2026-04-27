import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const sort = searchParams.get('sort') || 'recent';
  const ratingFilter = searchParams.get('rating');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!productId) {
    return NextResponse.json({ error: 'productId 필수' }, { status: 400 });
  }

  const where: any = {
    productId,
    isApproved: true,
  };

  if (ratingFilter) {
    where.rating = parseInt(ratingFilter, 10);
  }

  let orderBy: any;
  switch (sort) {
    case 'helpful':
      orderBy = { helpfulCount: 'desc' };
      break;
    case 'rating_high':
      orderBy = { rating: 'desc' };
      break;
    case 'rating_low':
      orderBy = { rating: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const offset = (page - 1) * limit;

  const [reviews, total, ratingStats] = await Promise.all([
    prisma.productReview.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.productReview.count({ where }),
    prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: { rating: true },
    }),
  ]);

  const stats = {
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
  };

  let sum = 0;
  for (const r of ratingStats) {
    stats.distribution[r.rating] = r._count.rating;
    stats.total += r._count.rating;
    sum += r.rating * r._count.rating;
  }
  stats.average = stats.total > 0 ? Math.round((sum / stats.total) * 10) / 10 : 0;

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      images: r.images,
      videos: r.videos,
      instagramPostUrl: r.instagramPostUrl,
      instagramVerified: r.instagramVerified,
      isVerifiedPurchase: r.isVerifiedPurchase,
      isFeatured: r.isFeatured,
      helpfulCount: r.helpfulCount,
      buyerName: r.buyer?.user?.name
        ? r.buyer.user.name.charAt(0) + '*'.repeat(r.buyer.user.name.length - 1)
        : '구매자',
      createdAt: r.createdAt,
    })),
    stats,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
