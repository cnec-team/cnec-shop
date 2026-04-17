import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  // Fetch subscription with recent payments
  const subscription = await prisma.brandSubscription.findUnique({
    where: { brandId: brand.id },
    include: {
      payments: {
        orderBy: { paidAt: 'desc' },
        take: 10,
      },
    },
  });

  // This month's date range
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Message credit summary for this month
  const credits = await prisma.messageCredit.findMany({
    where: {
      brandId: brand.id,
      sentAt: { gte: monthStart, lte: monthEnd },
    },
    select: {
      type: true,
      cost: true,
    },
  });

  let freeCount = 0;
  let paidCount = 0;
  let paidAmount = 0;

  for (const credit of credits) {
    if (credit.type === 'SUBSCRIPTION_FREE') {
      freeCount++;
    } else {
      paidCount++;
      paidAmount += Number(credit.cost);
    }
  }

  // Daily sends for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailySendsRaw = await prisma.messageCredit.groupBy({
    by: ['sentAt'],
    where: {
      brandId: brand.id,
      sentAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  });

  // Aggregate by date string
  const dailyMap = new Map<string, number>();
  for (const row of dailySendsRaw) {
    const dateKey = new Date(row.sentAt).toISOString().split('T')[0];
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + row._count.id);
  }

  const dailySends = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build response
  if (!subscription) {
    return NextResponse.json({
      subscription: {
        id: null,
        plan: 'FREE',
        status: 'ACTIVE',
        monthlyFee: 0,
        includedMessageQuota: 0,
        currentMonthUsed: 0,
        nextBillingAt: null,
        startedAt: now.toISOString(),
      },
      summary: { freeCount, paidCount, paidAmount, dailySends },
      payments: [],
    });
  }

  const payments = subscription.payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    plan: p.plan,
    paidAt: p.paidAt.toISOString(),
    status: p.status,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
  }));

  return NextResponse.json({
    subscription: {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      monthlyFee: Number(subscription.monthlyFee),
      includedMessageQuota: subscription.includedMessageQuota,
      currentMonthUsed: subscription.currentMonthUsed,
      nextBillingAt: subscription.nextBillingAt?.toISOString() ?? null,
      startedAt: subscription.startedAt.toISOString(),
    },
    summary: { freeCount, paidCount, paidAmount, dailySends },
    payments,
  });
}

export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ message: '준비중입니다' });
}
