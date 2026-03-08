import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

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
    const creatorId = creator?.id ?? null;
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Get current balance (latest record)
    const latestPoint = await prisma.creatorPoint.findFirst({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    });

    const balance = latestPoint?.balanceAfter ?? 0;

    // Get paginated history
    const [history, count] = await Promise.all([
      prisma.creatorPoint.findMany({
        where: { creatorId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.creatorPoint.count({
        where: { creatorId },
      }),
    ]);

    return NextResponse.json({
      balance,
      history,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Points API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
