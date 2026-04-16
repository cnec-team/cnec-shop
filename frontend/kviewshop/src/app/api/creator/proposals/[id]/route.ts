import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creator = await prisma.creator.findFirst({
    where: { userId: authUser.id },
    select: { id: true, instagramHandle: true, displayName: true },
  })
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  const { id } = await params
  const body = await request.json()
  const { action, rejectionReason } = body as {
    action: 'accept' | 'reject'
    rejectionReason?: string
  }

  const proposal = await prisma.creatorProposal.findUnique({
    where: { id },
    include: {
      brand: { select: { userId: true, brandName: true } },
      campaign: {
        include: {
          products: { include: { product: true } },
        },
      },
    },
  })

  if (!proposal) {
    return NextResponse.json({ error: '제안을 찾을 수 없습니다' }, { status: 404 })
  }

  if (proposal.creatorId !== creator.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  if (proposal.status !== 'PENDING') {
    return NextResponse.json({ error: '이미 처리된 제안입니다' }, { status: 400 })
  }

  const creatorLabel = creator.instagramHandle
    ? `@${creator.instagramHandle}`
    : (creator.displayName ?? '크리에이터')

  if (action === 'accept') {
    await prisma.$transaction(async (tx) => {
      await tx.creatorProposal.update({
        where: { id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      })

      // 공구인 경우 CampaignParticipation + ShopItem 자동 생성
      if (proposal.type === 'GONGGU' && proposal.campaignId) {
        const existingParticipation = await tx.campaignParticipation.findUnique({
          where: {
            campaignId_creatorId: {
              campaignId: proposal.campaignId,
              creatorId: creator.id,
            },
          },
        })
        if (!existingParticipation) {
          await tx.campaignParticipation.create({
            data: {
              campaignId: proposal.campaignId,
              creatorId: creator.id,
              status: 'APPROVED',
              appliedAt: new Date(),
              approvedAt: new Date(),
            },
          })
        }

        // 캠페인 전체 상품을 ShopItem으로 추가
        const campaignProducts = proposal.campaign?.products ?? []
        for (const cp of campaignProducts) {
          const existingItem = await tx.creatorShopItem.findFirst({
            where: {
              creatorId: creator.id,
              productId: cp.productId,
              campaignId: proposal.campaignId,
            },
          })
          if (!existingItem) {
            await tx.creatorShopItem.create({
              data: {
                creatorId: creator.id,
                productId: cp.productId,
                campaignId: proposal.campaignId,
                type: 'GONGGU',
                isVisible: true,
              },
            })
          }
        }
      }

      // 브랜드에게 알림
      try {
        await tx.notification.create({
          data: {
            userId: proposal.brand.userId,
            type: 'CAMPAIGN',
            title: '제안 수락',
            message: `${creatorLabel}님이 ${proposal.type === 'GONGGU' ? '공구' : '크리에이터픽'} 제안을 수락했습니다`,
            linkUrl: '/brand/creators',
            isRead: false,
          },
        })
      } catch {
        // 알림 실패가 주요 로직에 영향 주지 않도록
      }
    })

    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    await prisma.$transaction(async (tx) => {
      await tx.creatorProposal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
          rejectionReason: rejectionReason || null,
        },
      })

      try {
        await tx.notification.create({
          data: {
            userId: proposal.brand.userId,
            type: 'CAMPAIGN',
            title: '제안 거절',
            message: `${creatorLabel}님이 제안을 거절했습니다`,
            linkUrl: '/brand/creators',
            isRead: false,
          },
        })
      } catch {
        // 알림 실패가 주요 로직에 영향 주지 않도록
      }
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
}
