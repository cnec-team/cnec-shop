import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

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

    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: { id: true, shopId: true },
    });
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Find or create referral code for this creator
    let myReferral = await prisma.creatorReferral.findFirst({
      where: { referrerId: creator.id, referredId: null },
      select: { referralCode: true },
    });

    let referralCode = myReferral?.referralCode;

    if (!referralCode) {
      // Create new referral entry (code-only, no referred yet)
      referralCode = generateReferralCode(creator.shopId ?? '');
      await prisma.creatorReferral.create({
        data: {
          referrerId: creator.id,
          referredId: null,
          referralCode,
          status: 'PENDING',
        },
      });
    }

    // Get all referrals where I am the referrer
    const referrals = await prisma.creatorReferral.findMany({
      where: { referrerId: creator.id, referredId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referredId: true,
        referralCode: true,
        status: true,
        referrerRewardTotal: true,
        referredRewardTotal: true,
        createdAt: true,
      },
    });

    const stats = {
      totalInvited: referrals.length,
      signupComplete: referrals.filter(r => r.status === 'SIGNUP_COMPLETE' || r.status === 'FIRST_SALE_COMPLETE').length,
      firstSaleComplete: referrals.filter(r => r.status === 'FIRST_SALE_COMPLETE').length,
      totalReward: referrals.reduce((sum, r) => sum + (r.referrerRewardTotal || 0), 0),
    };

    const shareLink = `https://shop.cnec.kr/signup?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      shareLink,
      stats,
      referrals,
    });
  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
