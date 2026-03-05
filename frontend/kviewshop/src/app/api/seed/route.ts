import { createClient } from '@supabase/supabase-js';
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
      brand_name: '하우파파',
      business_number: '123-45-67890',
      description: '건강한 피부를 위한 클린 뷰티 브랜드',
      contact_email: 'contact@howpapa.kr',
      platform_fee_rate: 0.03,
      bank_name: '국민은행',
      bank_account: '123-456-789012',
    },
  },
  {
    email: 'nuccio@cnec.kr',
    password: 'brand123!@#',
    name: '누씨오',
    role: 'brand_admin' as const,
    brandData: {
      brand_name: '누씨오',
      business_number: '987-65-43210',
      description: '민감 피부 전문 스킨케어 브랜드',
      contact_email: 'contact@nuccio.kr',
      platform_fee_rate: 0.03,
      bank_name: '신한은행',
      bank_account: '987-654-321098',
    },
  },
  {
    email: 'beautyjin@cnec.kr',
    password: 'creator123!@#',
    name: '뷰티진',
    role: 'creator' as const,
    creatorData: {
      shop_id: 'beautyjin',
      display_name: '뷰티진의 셀렉트샵',
      bio: '제가 직접 써보고 추천하는 제품들',
      instagram_handle: '@beautyjin',
      skin_type: 'combination',
      personal_color: 'spring_warm',
      skin_concerns: ['여드름', '미백'],
      total_sales: 0,
      total_earnings: 0,
      is_business: false,
      bank_name: '카카오뱅크',
      bank_account: '3333-01-1234567',
    },
  },
  {
    email: 'skinhana@cnec.kr',
    password: 'creator123!@#',
    name: '스킨하나',
    role: 'creator' as const,
    creatorData: {
      shop_id: 'skinhana',
      display_name: '스킨하나의 셀렉트샵',
      bio: '민감피부 전문 크리에이터',
      instagram_handle: '@skinhana',
      skin_type: 'dry',
      personal_color: 'summer_cool',
      skin_concerns: ['민감성', '건조'],
      total_sales: 0,
      total_earnings: 0,
      is_business: true,
      business_number: '111-22-33333',
      bank_name: '하나은행',
      bank_account: '456-789-012345',
    },
  },
];

// Demo products for brands
const demoProducts = {
  howpapa: [
    {
      name: '하우파파 진정 수분 로션',
      category: 'skincare',
      description: '<p>건조하고 예민한 피부를 위한 진정 수분 로션입니다. 판테놀과 세라마이드 함유로 피부 장벽을 강화합니다.</p>',
      original_price: 38000,
      sale_price: 38000,
      stock: 500,
      images: [],
      volume: '300ml',
      ingredients: '판테놀, 세라마이드, 히알루론산, 알로에베라',
      status: 'ACTIVE',
      allow_creator_pick: true,
      default_commission_rate: 0.10,
    },
    {
      name: '하우파파 비타민C 세럼',
      category: 'skincare',
      description: '<p>순수 비타민C 15% 함유. 피부 톤업과 탄력에 도움을 줍니다.</p>',
      original_price: 42000,
      sale_price: 42000,
      stock: 300,
      images: [],
      volume: '30ml',
      ingredients: '아스코르빈산 15%, 비타민E, 페룰산',
      status: 'ACTIVE',
      allow_creator_pick: true,
      default_commission_rate: 0.12,
    },
  ],
  nuccio: [
    {
      name: '누씨오 약산성 클렌징 폼',
      category: 'skincare',
      description: '<p>pH 5.5 약산성 클렌징 폼. 자극 없이 깨끗하게 세안합니다.</p>',
      original_price: 18000,
      sale_price: 18000,
      stock: 800,
      images: [],
      volume: '150ml',
      ingredients: '코코넛 유래 계면활성제, 티트리 오일',
      status: 'ACTIVE',
      allow_creator_pick: true,
      default_commission_rate: 0.10,
    },
    {
      name: '누씨오 토너패드',
      category: 'skincare',
      description: '<p>AHA/BHA 함유 각질 케어 토너패드. 모공 관리에 효과적입니다.</p>',
      original_price: 22000,
      sale_price: 22000,
      stock: 600,
      images: [],
      volume: '70매',
      ingredients: 'AHA 2%, BHA 0.5%, 위치하젤',
      status: 'ACTIVE',
      allow_creator_pick: true,
      default_commission_rate: 0.10,
    },
  ],
};

// Demo campaigns
const demoCampaigns = {
  howpapa: {
    type: 'GONGGU',
    title: '하우파파 2월 공구',
    description: '하우파파 인기 상품 2월 특별 공구! 최대 35% 할인',
    status: 'ACTIVE',
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    recruitment_type: 'OPEN',
    commission_rate: 0.15,
    total_stock: 200,
    sold_count: 0,
    campaignPrice: 24700, // 35% off of 38000
  },
  nuccio: {
    type: 'GONGGU',
    title: '누씨오 특가전',
    description: '민감피부 전문 누씨오 특가! 최대 40% 할인',
    status: 'RECRUITING',
    start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    recruitment_type: 'APPROVAL',
    commission_rate: 0.12,
    total_stock: 300,
    sold_count: 0,
    target_participants: 50,
    conditions: '팔로워 1,000명 이상 뷰티 크리에이터',
    campaignPrice: 10800, // 40% off of 18000
  },
};

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing server configuration' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: { step: string; status: string; error?: string }[] = [];
  const brandIds: Record<string, string> = {};
  const creatorIds: Record<string, string> = {};
  const productIds: Record<string, string[]> = {};

  // 1. Create users
  for (const account of testAccounts) {
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === account.email);

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: { name: account.name, role: account.role },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');
        userId = authData.user.id;
      }

      await supabase.from('users').upsert({
        id: userId,
        email: account.email,
        name: account.name,
        role: account.role,
        status: 'active',
      });

      if (account.role === 'brand_admin' && 'brandData' in account) {
        const { data: brand } = await supabase.from('brands').upsert({
          user_id: userId,
          ...account.brandData,
        }, { onConflict: 'user_id' }).select().single();
        if (brand) {
          const key = account.email.split('@')[0];
          brandIds[key] = brand.id;
        }
      }

      if (account.role === 'creator' && 'creatorData' in account) {
        const { data: creator } = await supabase.from('creators').upsert({
          user_id: userId,
          ...account.creatorData,
        }, { onConflict: 'user_id' }).select().single();
        if (creator) {
          creatorIds[account.creatorData.shop_id] = creator.id;
        }
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
        const { data } = await supabase.from('products').insert({
          brand_id: brandId,
          ...product,
        }).select().single();
        if (data) productIds[brandKey].push(data.id);
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
      const { data: camp } = await supabase.from('campaigns').insert({
        brand_id: brandId,
        ...campaignData,
      }).select().single();

      if (camp && prods[0]) {
        await supabase.from('campaign_products').insert({
          campaign_id: camp.id,
          product_id: prods[0],
          campaign_price: campaignPrice,
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
