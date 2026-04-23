import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.brandSubscription.updateMany({
    where: {
      OR: [
        { planV3: 'STANDARD', status: 'ACTIVE' },
        { planV3: 'PRO', status: 'ACTIVE' },
      ],
    },
    data: {
      currentMonthUsed: 0,
      currentMonthCampaigns: 0,
      currentMonthMessages: 0,
      monthlyDetailViewUsed: 0,
      currentMonthOverageAmount: 0,
      currentMonthResetAt: new Date(),
    },
  })

  await prisma.creator.updateMany({
    data: {
      currentMonthProposals: 0,
      proposalResetAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, resetAt: new Date() })
}
