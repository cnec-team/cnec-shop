import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.brandSubscription.updateMany({
    data: {
      currentMonthUsed: 0,
      monthlyDetailViewUsed: 0,
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
