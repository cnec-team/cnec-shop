import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { awardPointsRaw } from '@/lib/points';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const amount = parseInt(body.amount, 10);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get current balance
    const latestPoint = await prisma.creatorPoint.findFirst({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    });

    const currentBalance = latestPoint?.balanceAfter ?? 0;

    if (currentBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const newBalance = currentBalance - amount;

    await prisma.creatorPoint.create({
      data: {
        creatorId: creator.id,
        pointType: 'WITHDRAW',
        amount: -amount,
        balanceAfter: newBalance,
        description: '포인트 출금 신청',
      },
    });

    return NextResponse.json({
      success: true,
      newBalance,
    });
  } catch (error) {
    console.error('Withdraw API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
