import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const { productId } = await request.json();

  if (!productId) {
    return NextResponse.json({ error: 'productId 필수' }, { status: 400 });
  }

  // Check if summary already exists and is recent (within 24h)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      reviewSummary: true,
      reviewSummaryUpdatedAt: true,
      reviewCount: true,
      name: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
  }

  const now = new Date();
  const summaryAge = product.reviewSummaryUpdatedAt
    ? now.getTime() - product.reviewSummaryUpdatedAt.getTime()
    : Infinity;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (product.reviewSummary && summaryAge < ONE_DAY) {
    return NextResponse.json({ summary: product.reviewSummary });
  }

  // Fetch approved reviews
  const reviews = await prisma.productReview.findMany({
    where: { productId, isApproved: true },
    select: { rating: true, content: true, title: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (reviews.length < 3) {
    return NextResponse.json({ summary: null, reason: '리뷰가 3개 이상이어야 AI 요약이 생성됩니다' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ summary: null, reason: 'AI 서비스 설정 필요' });
  }

  const client = new Anthropic({ apiKey });

  const reviewTexts = reviews
    .map((r, i) => `[${r.rating}점] ${r.title || ''} ${r.content}`)
    .join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `아래는 "${product.name}" 상품의 고객 리뷰 ${reviews.length}개입니다.

${reviewTexts}

위 리뷰를 분석하여 한국어로 요약해주세요. 형식:
1. 한 줄 요약 (핵심 평가)
2. 장점 3가지 (가장 많이 언급된 순)
3. 아쉬운 점 (있다면 1-2가지)
4. 추천 대상 (어떤 사람에게 좋은지)

각 항목은 간결하게 1-2문장으로. 총 200자 이내. 마크다운 없이 평문으로.`,
        },
      ],
    });

    const summary =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Save to product
    const totalReviews = await prisma.productReview.count({
      where: { productId, isApproved: true },
    });
    const avgResult = await prisma.productReview.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        reviewSummary: summary,
        reviewSummaryUpdatedAt: now,
        reviewCount: totalReviews,
        averageRating: avgResult._avg.rating
          ? Math.round(avgResult._avg.rating * 10) / 10
          : null,
      },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI review summary error:', error);
    return NextResponse.json({ summary: null, reason: 'AI 요약 생성 실패' });
  }
}
