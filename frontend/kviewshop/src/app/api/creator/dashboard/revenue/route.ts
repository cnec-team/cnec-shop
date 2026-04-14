import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const creator = await prisma.creator.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth20 = new Date(now.getFullYear(), now.getMonth() + 1, 20);
  const nextSettlementDate = `${nextMonth20.getMonth() + 1}/${nextMonth20.getDate()}`;

  const validStatuses = ['PENDING', 'CONFIRMED'];

  const [todayConversions, monthConversions, confirmedConversions, existingSettlements] = await Promise.all([
    prisma.conversion.findMany({
      where: {
        creatorId: creator.id,
        status: { in: validStatuses },
        createdAt: { gte: todayStart },
      },
      select: { commissionAmount: true },
    }),
    prisma.conversion.findMany({
      where: {
        creatorId: creator.id,
        status: { in: validStatuses },
        createdAt: { gte: monthStart },
      },
      select: { commissionAmount: true },
    }),
    prisma.conversion.findMany({
      where: {
        creatorId: creator.id,
        status: 'CONFIRMED',
      },
      select: { commissionAmount: true },
    }),
    prisma.settlement.findMany({
      where: {
        creatorId: creator.id,
        status: { in: ['PAID', 'PENDING'] },
      },
      select: { grossCommission: true },
    }),
  ]);

  const today = todayConversions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  );

  const month = monthConversions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  );

  // Pending settlement: confirmed conversions minus already settled amounts
  const settledAmount = existingSettlements.reduce(
    (sum, s) => sum + Number(s.grossCommission),
    0
  );
  const totalConfirmed = confirmedConversions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  );
  const pendingSettlement = Math.max(totalConfirmed - settledAmount, 0);

  return NextResponse.json({
    today,
    month,
    pendingSettlement,
    nextSettlementDate,
  });
}
