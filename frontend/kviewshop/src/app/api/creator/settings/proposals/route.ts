import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'creator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: authUser.id },
      select: { id: true },
    })
    if (!creator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const updates: Record<string, unknown> = {}
    if (typeof body.acceptingProposals === 'boolean') {
      updates.acceptingProposals = body.acceptingProposals
    }
    if (typeof body.monthlyProposalLimit === 'number' && body.monthlyProposalLimit >= 10 && body.monthlyProposalLimit <= 100) {
      updates.monthlyProposalLimit = body.monthlyProposalLimit
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '변경할 항목이 없어요' }, { status: 400 })
    }

    await prisma.creator.update({
      where: { id: creator.id },
      data: updates,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '설정을 저장하지 못했어요' }, { status: 500 })
  }
}
