import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

// CNEC Commerce Test Accounts
const testAccounts = [
  {
    email: 'admin@cnec.kr',
    password: 'admin123!@#',
    name: '크넥 관리자',
    role: 'super_admin' as const,
  },
  {
    email: 'howpapa@cnec.kr',
    password: 'brand123!@#',
    name: '하우파파',
    role: 'brand_admin' as const,
    brandData: {
      brandName: '하우파파',
      businessNumber: '123-45-67890',
      description: '건강한 피부를 위한 클린 뷰티 브랜드',
      contactEmail: 'contact@howpapa.kr',
      platformFeeRate: 0.03,
      bankName: '국민은행',
      bankAccount: '123-456-789012',
    },
  },
  {
    email: 'nuccio@cnec.kr',
    password: 'brand123!@#',
    name: '누씨오',
    role: 'brand_admin' as const,
    brandData: {
      brandName: '누씨오',
      businessNumber: '987-65-43210',
      description: '민감 피부 전문 스킨케어 브랜드',
      contactEmail: 'contact@nuccio.kr',
      platformFeeRate: 0.03,
      bankName: '신한은행',
      bankAccount: '987-654-321098',
    },
  },
  {
    email: 'beautyjin@cnec.kr',
    password: 'creator123!@#',
    name: '뷰티진',
    role: 'creator' as const,
    creatorData: {
      shopId: 'beautyjin',
      displayName: '뷰티진의 셀렉트샵',
      bio: '제가 직접 써보고 추천하는 제품들',
      instagramHandle: '@beautyjin',
      skinType: 'combination',
      personalColor: 'spring_warm',
      skinConcerns: ['여드름', '미백'],
      totalSales: 0,
      totalEarnings: 0,
      isBusiness: false,
      bankName: '카카오뱅크',
      bankAccount: '3333-01-1234567',
    },
  },
  {
    email: 'skinhana@cnec.kr',
    password: 'creator123!@#',
    name: '스킨하나',
    role: 'creator' as const,
    creatorData: {
      shopId: 'skinhana',
      displayName: '스킨하나의 셀렉트샵',
      bio: '민감피부 전문 크리에이터',
      instagramHandle: '@skinhana',
      skinType: 'dry',
      personalColor: 'summer_cool',
      skinConcerns: ['민감성', '건조'],
      totalSales: 0,
      totalEarnings: 0,
      isBusiness: true,
      businessNumber: '111-22-33333',
      bankName: '하나은행',
      bankAccount: '456-789-012345',
    },
  },
];

const demoProducts = {
  howpapa: [
    {
      name: '하우파파 진정 수분 로션',
      category: 'skincare',
      description: '<p>건조하고 예민한 피부를 위한 진정 수분 로션입니다.</p>',
      originalPrice: 38000,
      salePrice: 38000,
      stock: 500,
      volume: '300ml',
      ingredients: '판테놀, 세라마이드, 히알루론산, 알로에베라',
      status: 'ACTIVE',
      allowCreatorPick: true,
      defaultCommissionRate: 0.10,
    },
    {
      name: '하우파파 비타민C 세럼',
      category: 'skincare',
      description: '<p>순수 비타민C 15% 함유.</p>',
      originalPrice: 42000,
      salePrice: 42000,
      stock: 300,
      volume: '30ml',
      ingredients: '아스코르빈산 15%, 비타민E, 페룰산',
      status: 'ACTIVE',
      allowCreatorPick: true,
      defaultCommissionRate: 0.12,
    },
  ],
  nuccio: [
    {
      name: '누씨오 약산성 클렌징 폼',
      category: 'skincare',
      description: '<p>pH 5.5 약산성 클렌징 폼.</p>',
      originalPrice: 18000,
      salePrice: 18000,
      stock: 800,
      volume: '150ml',
      ingredients: '코코넛 유래 계면활성제, 티트리 오일',
      status: 'ACTIVE',
      allowCreatorPick: true,
      defaultCommissionRate: 0.10,
    },
    {
      name: '누씨오 토너패드',
      category: 'skincare',
      description: '<p>AHA/BHA 함유 각질 케어 토너패드.</p>',
      originalPrice: 22000,
      salePrice: 22000,
      stock: 600,
      volume: '70매',
      ingredients: 'AHA 2%, BHA 0.5%, 위치하젤',
      status: 'ACTIVE',
      allowCreatorPick: true,
      defaultCommissionRate: 0.10,
    },
  ],
};

const demoCampaigns = {
  howpapa: {
    type: 'GONGGU' as const,
    title: '하우파파 2월 공구',
    description: '하우파파 인기 상품 2월 특별 공구!',
    status: 'ACTIVE' as const,
    startAt: new Date(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    recruitmentType: 'OPEN',
    commissionRate: 0.15,
    totalStock: 200,
    soldCount: 0,
    campaignPrice: 24700,
  },
  nuccio: {
    type: 'GONGGU' as const,
    title: '누씨오 특가전',
    description: '민감피부 전문 누씨오 특가!',
    status: 'RECRUITING' as const,
    startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    recruitmentType: 'APPROVAL',
    commissionRate: 0.12,
    totalStock: 300,
    soldCount: 0,
    targetParticipants: 50,
    conditions: '팔로워 1,000명 이상 뷰티 크리에이터',
    campaignPrice: 10800,
  },
};

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const results: { step: string; status: string; error?: string }[] = [];
  const brandIds: Record<string, string> = {};
  const creatorIds: Record<string, string> = {};
  const productIds: Record<string, string[]> = {};

  // 1. Create users with Prisma + bcrypt
  for (const account of testAccounts) {
    try {
      const passwordHash = await bcrypt.hash(account.password, 12);

      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: { name: account.name, role: account.role, passwordHash },
        create: { email: account.email, name: account.name, role: account.role, passwordHash },
      });

      if (account.role === 'brand_admin' && 'brandData' in account) {
        const brand = await prisma.brand.upsert({
          where: { userId: user.id },
          update: { ...account.brandData, approved: true },
          create: { userId: user.id, ...account.brandData, approved: true },
        });
        const key = account.email.split('@')[0];
        brandIds[key] = brand.id;
      }

      if (account.role === 'creator' && 'creatorData' in account) {
        const creator = await prisma.creator.upsert({
          where: { userId: user.id },
          update: account.creatorData,
          create: { userId: user.id, ...account.creatorData },
        });
        creatorIds[account.creatorData.shopId] = creator.id;
      }

      results.push({ step: `User: ${account.email}`, status: 'ok' });
    } catch (error) {
      results.push({
        step: `User: ${account.email}`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 2. Create products
  for (const [brandKey, products] of Object.entries(demoProducts)) {
    const brandId = brandIds[brandKey];
    if (!brandId) continue;
    productIds[brandKey] = [];

    for (const product of products) {
      try {
        const created = await prisma.product.create({
          data: { brandId, ...product },
        });
        productIds[brandKey].push(created.id);
        results.push({ step: `Product: ${product.name}`, status: 'ok' });
      } catch (error) {
        results.push({
          step: `Product: ${product.name}`,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // 3. Create campaigns
  for (const [brandKey, campaign] of Object.entries(demoCampaigns)) {
    const brandId = brandIds[brandKey];
    const prods = productIds[brandKey];
    if (!brandId || !prods?.length) continue;

    try {
      const { campaignPrice, ...campaignData } = campaign;
      const camp = await prisma.campaign.create({
        data: { brandId, ...campaignData },
      });

      if (prods[0]) {
        await prisma.campaignProduct.create({
          data: {
            campaignId: camp.id,
            productId: prods[0],
            campaignPrice,
          },
        });
      }

      results.push({ step: `Campaign: ${campaign.title}`, status: 'ok' });
    } catch (error) {
      results.push({
        step: `Campaign: ${campaign.title}`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: 'CNEC Commerce seed completed',
    results,
    accounts: testAccounts.map(a => ({
      role: a.role,
      email: a.email,
    })),
  });
}
