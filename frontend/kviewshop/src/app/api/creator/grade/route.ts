import { NextRequest, NextResponse } from 'next/server';
import { GRADE_THRESHOLDS } from '@/types/database';
import type { CreatorGrade } from '@/types/database';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

const GRADE_ORDER: CreatorGrade[] = ['ROOKIE', 'SILVER', 'GOLD', 'PLATINUM'];

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: { id: true },
    });
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const gradeRecord = await prisma.creatorGrade.findUnique({
      where: { creatorId: creator.id },
    });

    const grade: CreatorGrade = (gradeRecord?.grade as CreatorGrade) || 'ROOKIE';
    const monthlySales = gradeRecord?.monthlySales ?? 0;
    const commissionBonusRate = gradeRecord?.commissionBonusRate ?? 0;

    // Calculate next grade
    const currentIndex = GRADE_ORDER.indexOf(grade);
    const nextGrade = currentIndex < GRADE_ORDER.length - 1 ? GRADE_ORDER[currentIndex + 1] : null;
    const amountToNext = nextGrade ? GRADE_THRESHOLDS[nextGrade] - monthlySales : 0;

    return NextResponse.json({
      grade,
      monthlySales,
      commissionBonusRate,
      nextGrade,
      amountToNext: Math.max(0, amountToNext),
      gradeUpdatedAt: gradeRecord?.gradeUpdatedAt ?? null,
    });
  } catch (error) {
    console.error('Grade API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
