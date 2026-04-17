import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'brand_admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }

    const brand = await prisma.brand.findFirst({
      where: { userId: authUser.id },
      select: { id: true },
    })
    if (!brand) {
      return NextResponse.json({ error: '브랜드를 찾을 수 없습니다' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body as { status: 'IN_PROGRESS' | 'SENT' | 'FAILED' | 'PENDING' }

    const queue = await prisma.dmSendQueue.findUnique({ where: { id } })
    if (!queue || queue.brandId !== brand.id) {
      return NextResponse.json({ error: 'DM 큐를 찾을 수 없습니다' }, { status: 404 })
    }

    const now = new Date()
    const updateData: Record<string, unknown> = { status }

    if (status === 'SENT') {
      updateData.sentAt = now
    }
    if (status === 'FAILED') {
      updateData.failedAt = now
      updateData.failReason = (body as { failReason?: string }).failReason || null
    }

    const updated = await prisma.dmSendQueue.update({
      where: { id },
      data: updateData,
    })

    // DM 발송 로그
    const eventMap: Record<string, 'CREATED' | 'PICKED' | 'SENT' | 'FAILED' | 'RETRIED'> = {
      PENDING: 'RETRIED',
      IN_PROGRESS: 'PICKED',
      SENT: 'SENT',
      FAILED: 'FAILED',
    }
    await prisma.dmSendLog.create({
      data: {
        queueId: id,
        event: eventMap[status] ?? 'CREATED',
        detail: { status, timestamp: now.toISOString() },
      },
    })

    // SENT: Proposal 상태 업데이트 + Brand 카운트
    if (status === 'SENT' && queue.proposalId) {
      await prisma.creatorProposal.update({
        where: { id: queue.proposalId },
        data: { dmStatus: 'SENT', dmQueuedAt: now },
      })
      await prisma.brand.update({
        where: { id: brand.id },
        data: {
          brandInstagramDailySentCount: { increment: 1 },
          brandInstagramLastUsedAt: now,
        },
      })
    }

    return NextResponse.json({ item: updated })
  } catch (error) {
    console.error('DM 큐 업데이트 오류:', error)
    return NextResponse.json({ error: 'DM 큐 업데이트 중 오류가 발생했습니다' }, { status: 500 })
  }
}
