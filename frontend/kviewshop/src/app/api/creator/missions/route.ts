import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { initCreatorMissions, checkAndCompleteMission } from '@/lib/missions';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: { id: true, createdAt: true },
    });
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Ensure missions exist
    await initCreatorMissions(creator.id);

    // Auto-check missions based on current state
    // Check FIRST_PRODUCT
    const shopItemCount = await prisma.creatorShopItem.count({
      where: { creatorId: creator.id },
    });

    if (shopItemCount >= 1) {
      await checkAndCompleteMission(creator.id, 'FIRST_PRODUCT');
    }

    if (shopItemCount >= 5) {
      await checkAndCompleteMission(creator.id, 'FIVE_PRODUCTS');
    }

    // Check FIRST_SALE
    const saleCount = await prisma.order.count({
      where: { creatorId: creator.id, status: 'CONFIRMED' },
    });

    if (saleCount >= 1) {
      await checkAndCompleteMission(creator.id, 'FIRST_SALE');
    }

    // Get missions
    const missions = await prisma.creatorMission.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate days since signup
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(creator.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const completed = missions.filter(m => m.isCompleted).length;
    const total = missions.length;

    return NextResponse.json({
      missions,
      completedCount: completed,
      totalCount: total,
      daysSinceSignup,
      allCompleted: completed === total,
      expired: daysSinceSignup > 30,
    });
  } catch (error) {
    console.error('Missions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: manually complete a mission (e.g., SNS_SHARE)
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
    const { missionKey } = body;

    if (!missionKey) {
      return NextResponse.json({ error: 'missionKey is required' }, { status: 400 });
    }

    const data = await checkAndCompleteMission(creator.id, missionKey);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Missions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
