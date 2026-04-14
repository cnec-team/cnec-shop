import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const SYSTEM_PROMPT = `당신은 K-뷰티 공구(공동구매) 전문 마케팅 어드바이저입니다. 크리에이터가 인스타그램에서 뷰티 제품을 판매할 때 사용할 공구 전략을 제안합니다. 반드시 3가지 전략을 JSON 배열로 출력하세요: CONSERVATIVE(안전한 접근, 제품 효능 중심), AGGRESSIVE(적극적, 비포애프터/가격 충격 중심), VIRAL(바이럴 가능성 최대화, 트렌드/밈 활용). 각 전략에 포함: strategy, hook(릴스 훅 15자 이내), target(타겟 1줄), estimated_cvr(범위, 예: 3~5%), caption(인스타 캡션 200자 이내), hashtags(5-8개 배열), reasoning(추천 이유 2줄). JSON 배열만 출력. 마크다운 없이.`;

interface GonguTipResult {
  strategy: string;
  hook: string;
  target: string;
  estimated_cvr: string;
  caption: string;
  hashtags: string[];
  reasoning: string;
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export async function generateGonguTips(
  productId: string,
  creatorId?: string
): Promise<{ tips: GonguTipResult[] } | null> {
  const client = getClient();
  if (!client) return null;

  // Check rate limit (24h)
  const recentTip = await prisma.aiGonguTip.findFirst({
    where: {
      productId,
      generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recentTip) {
    throw new Error('RATE_LIMITED');
  }

  // Fetch product data
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: { select: { brandName: true, companyName: true } },
      priceData: { where: { channel: 'BRAND_INPUT' }, select: { channelName: true, price: true } },
      priceBadge: { select: { badgeType: true, message: true } },
      campaignProducts: {
        include: { campaign: { select: { type: true, status: true } } },
        where: { campaign: { status: { in: ['RECRUITING', 'ACTIVE'] } } },
        take: 1,
      },
    },
  });

  if (!product) throw new Error('Product not found');

  // Fetch creator profile if available
  let creatorInfo = '';
  if (creatorId) {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { displayName: true, skinType: true, personalColor: true },
    });
    if (creator) {
      const parts: string[] = [];
      if (creator.skinType) parts.push(`피부타입: ${creator.skinType}`);
      if (creator.personalColor) parts.push(`퍼스널컬러: ${creator.personalColor}`);
      if (parts.length > 0) creatorInfo = `\n크리에이터 정보: ${parts.join(', ')}`;
    }
  }

  const originalPrice = Number(product.originalPrice ?? 0);
  const salePrice = Number(product.salePrice ?? product.price ?? 0);
  const campaignProduct = product.campaignProducts[0];
  const campaignPrice = campaignProduct ? Number((campaignProduct as Record<string, unknown>).campaignPrice ?? salePrice) : salePrice;
  const discount = originalPrice > 0 ? Math.round(((originalPrice - campaignPrice) / originalPrice) * 100) : 0;

  const channelPrices = product.priceData
    .map((p) => `${p.channelName}: ${Number(p.price).toLocaleString()}원`)
    .join(', ');

  const userPrompt = `상품명: ${product.name ?? ''}
브랜드: ${product.brand?.brandName ?? product.brand?.companyName ?? ''}
카테고리: ${product.category ?? ''}
정가: ${originalPrice.toLocaleString()}원
공구가: ${campaignPrice.toLocaleString()}원
할인율: ${discount}%
핵심 특징: ${product.description?.slice(0, 200) ?? ''}
용량: ${product.volume ?? ''}
${channelPrices ? `채널별 가격: ${channelPrices}` : ''}
${product.priceBadge ? `가격 뱃지: ${product.priceBadge.badgeType} (${product.priceBadge.message ?? ''})` : ''}${creatorInfo}`;

  let tips: GonguTipResult[] = [];
  let lastError: unknown = null;

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      tips = JSON.parse(text) as GonguTipResult[];
      if (Array.isArray(tips) && tips.length > 0) break;
    } catch (err) {
      lastError = err;
      if (attempt === 1) throw lastError;
    }
  }

  if (tips.length === 0) throw lastError ?? new Error('Failed to generate tips');

  // Delete old tips for this product, then insert new ones
  await prisma.aiGonguTip.deleteMany({ where: { productId } });
  await prisma.aiGonguTip.createMany({
    data: tips.slice(0, 3).map((tip) => ({
      productId,
      strategy: tip.strategy,
      hook: tip.hook,
      targetMessage: tip.target,
      estimatedCvr: tip.estimated_cvr,
      caption: tip.caption,
      hashtags: tip.hashtags ?? [],
      reasoning: tip.reasoning ?? null,
      modelUsed: 'claude-sonnet-4-6',
    })),
  });

  return { tips: tips.slice(0, 3) };
}
