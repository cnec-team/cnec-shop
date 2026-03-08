import { NextRequest, NextResponse } from 'next/server';
import { awardPoints } from '@/lib/points';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { initCreatorMissions, checkAndCompleteMission } from '@/lib/missions';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: { id: true, onboardingCompleted: true },
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Skip if already completed
    if (creator.onboardingCompleted) {
      return NextResponse.json({ success: true, totalPoints: 5000, alreadyCompleted: true });
    }

    // Award points
    await awardPoints(creator.id, 'SIGNUP_BONUS', '가입 축하 포인트');
    await awardPoints(creator.id, 'PERSONA_COMPLETE', '페르소나 완료 보너스');

    // Complete SHOP_OPEN mission
    await initCreatorMissions(creator.id);
    await checkAndCompleteMission(creator.id, 'SHOP_OPEN');

    // Mark onboarding as completed
    await prisma.creator.update({
      where: { id: creator.id },
      data: { onboardingCompleted: true },
    });

    const totalPoints = 5000; // 3000 + 2000

    return NextResponse.json({ success: true, totalPoints });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
