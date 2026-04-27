import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const SYSTEM_PROMPT = `당신은 크넥샵(CNEC Shop)의 AI 고객 상담 어시스턴트입니다. K-뷰티 크리에이터 커머스 플랫폼의 고객센터 챗봇으로서 친절하고 전문적으로 응대합니다.

주요 안내 사항:
- 주문/배송: 주문 후 1-3일 내 발송, 배송 추적은 마이페이지에서 확인
- 교환/반품: 수령 후 7일 이내, 미개봉/미사용 제품만 가능, 단순변심 시 반품비 고객 부담
- 결제: 신용카드, 카카오페이, 네이버페이, 계좌이체 지원
- 크리에이터 관련: 크리에이터별 개인 샵에서 구매, 크리에이터 수수료는 상품가에 포함
- 포인트: 리뷰 작성 시 300P, 인스타그램 리뷰 +500P, 사진 리뷰 +200P
- 운영시간: 평일 10:00-18:00 (점심 12:00-13:00 제외)
- 문의: support@cnecshop.com / 010-6886-3302

규칙:
1. 한국어로 응답 (고객이 다른 언어로 질문하면 해당 언어로 응답)
2. 300자 이내로 간결하게
3. 모르는 내용은 "고객센터에 직접 문의해 주세요"로 안내
4. 개인정보 요청하지 않기
5. 가격 할인 약속하지 않기`;

export async function POST(request: NextRequest) {
  const { message, history, productId } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: '메시지를 입력해주세요' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: '현재 AI 상담이 불가합니다. 고객센터(support@cnecshop.com)로 직접 문의해 주세요.',
    });
  }

  // If product context, fetch product info
  let productContext = '';
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        description: true,
        salePrice: true,
        originalPrice: true,
        ingredients: true,
        howToUse: true,
        shippingFee: true,
        returnPolicy: true,
        brand: { select: { brandName: true, csPhone: true, csEmail: true } },
      },
    });
    if (product) {
      productContext = `\n\n현재 고객이 보고 있는 상품 정보:
- 상품명: ${product.name}
- 브랜드: ${product.brand.brandName}
- 판매가: ${product.salePrice ? Number(product.salePrice).toLocaleString() : '미정'}원
- 원가: ${product.originalPrice ? Number(product.originalPrice).toLocaleString() : '미정'}원
- 배송비: ${Number(product.shippingFee).toLocaleString()}원
- 성분: ${product.ingredients || '정보 없음'}
- 사용법: ${product.howToUse || '정보 없음'}
- 교환/반품: ${product.returnPolicy || '수령 후 7일 이내'}
- 브랜드 CS: ${product.brand.csPhone || ''} / ${product.brand.csEmail || ''}`;
    }
  }

  const client = new Anthropic({ apiKey });

  // Build messages from history
  const messages: Anthropic.MessageParam[] = [];
  if (history && Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content,
      });
    }
  }
  messages.push({ role: 'user', content: message });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT + productContext,
      messages,
    });

    const reply =
      response.content[0].type === 'text'
        ? response.content[0].text
        : '응답을 생성할 수 없습니다.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({
      reply: '일시적인 오류가 발생했습니다. 고객센터(support@cnecshop.com)로 직접 문의해 주세요.',
    });
  }
}
