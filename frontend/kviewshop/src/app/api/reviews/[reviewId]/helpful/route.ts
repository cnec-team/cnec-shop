import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { reviewId } = await params;

  const buyer = await prisma.buyer.findUnique({
    where: { userId: session.user.id },
  });

  if (!buyer) {
    return NextResponse.json({ error: '구매자 계정이 필요합니다' }, { status: 403 });
  }

  const existing = await prisma.reviewHelpfulVote.findUnique({
    where: {
      reviewId_buyerId: { reviewId, buyerId: buyer.id },
    },
  });

  if (existing) {
    // Toggle off
    await prisma.$transaction([
      prisma.reviewHelpfulVote.delete({ where: { id: existing.id } }),
      prisma.productReview.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ voted: false });
  }

  // Toggle on
  await prisma.$transaction([
    prisma.reviewHelpfulVote.create({
      data: { reviewId, buyerId: buyer.id },
    }),
    prisma.productReview.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ voted: true });
}
