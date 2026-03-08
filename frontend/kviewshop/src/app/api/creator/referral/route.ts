import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function generateReferralCode(shopId: string): string {
  // Use shop_id as base, add random suffix for uniqueness
  const base = shopId.slice(0, 8).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}-${suffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabase();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, shop_id')
      .eq('user_id', authUser.id)
      .single();
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Find or create referral code for this creator
    let { data: myReferral } = await supabase
      .from('creator_referrals')
      .select('referral_code')
      .eq('referrer_id', creator.id)
      .is('referred_id', null)
      .limit(1)
      .single();

    let referralCode = myReferral?.referral_code;

    if (!referralCode) {
      // Create new referral entry (code-only, no referred yet)
      referralCode = generateReferralCode(creator.shop_id);
      await supabase.from('creator_referrals').insert({
        referrer_id: creator.id,
        referred_id: null,
        referral_code: referralCode,
        status: 'PENDING',
      });
    }

    // Get all referrals where I am the referrer
    const { data: referrals } = await supabase
      .from('creator_referrals')
      .select('id, referred_id, referral_code, status, referrer_reward_total, referred_reward_total, created_at')
      .eq('referrer_id', creator.id)
      .not('referred_id', 'is', null)
      .order('created_at', { ascending: false });

    const referralList = referrals ?? [];
    const stats = {
      totalInvited: referralList.length,
      signupComplete: referralList.filter(r => r.status === 'SIGNUP_COMPLETE' || r.status === 'FIRST_SALE_COMPLETE').length,
      firstSaleComplete: referralList.filter(r => r.status === 'FIRST_SALE_COMPLETE').length,
      totalReward: referralList.reduce((sum, r) => sum + (r.referrer_reward_total || 0), 0),
    };

    const shareLink = `https://shop.cnec.kr/signup?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      shareLink,
      stats,
      referrals: referralList,
    });
  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
