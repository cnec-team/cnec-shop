import { prisma } from '@/lib/db'
import { sendNotification } from '@/lib/notifications'
import { followCampaignStartedMessage } from '@/lib/notifications/templates'
import { logger } from '@/lib/notifications/logger'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cnecshop.com'
const BATCH_SIZE = 50

/**
 * 공구 시작 시 참여 크리에이터의 팔로워에게 알림 발송
 * - 인앱 알림 + 카카오 알림톡 동시 발송
 * - 알림 실패가 비즈니스 로직에 영향 주지 않음 (try/catch)
 */
export async function notifyFollowersOnCampaignStart(
  creatorId: string,
  campaignId: string
) {
  try {
    // 1. 크리에이터 정보
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        shopId: true,
        username: true,
        displayName: true,
        userId: true,
      },
    })
    if (!creator) return

    // 2. 캠페인 + 상품 정보
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        products: {
          include: { product: { select: { name: true, nameKo: true } } },
          take: 3,
        },
      },
    })
    if (!campaign) return

    // 3. 팔로워 userId 목록
    const follows = await prisma.follow.findMany({
      where: { creatorId },
      select: { userId: true },
    })
    if (follows.length === 0) return

    // 4. 상품 요약
    const productNames = campaign.products
      .map((cp) => cp.product?.nameKo || cp.product?.name || '')
      .filter(Boolean)
      .join(', ')
    const productSummary =
      productNames.length > 50 ? productNames.slice(0, 47) + '...' : productNames

    const shopSlug = creator.shopId || creator.username || ''
    const shopUrl = `${SITE_URL}/${shopSlug}`

    const template = followCampaignStartedMessage({
      creatorName: creator.displayName || '크리에이터',
      campaignTitle: campaign.title ?? '',
      productSummary,
      shopUrl,
    })

    // 5. 배치로 팔로워에게 알림 발송
    const userIds = follows.map((f) => f.userId)

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE)
      const users = await prisma.user.findMany({
        where: { id: { in: batch } },
        select: { id: true, phone: true, name: true },
      })

      await Promise.allSettled(
        users.map((user) =>
          sendNotification({
            userId: user.id,
            type: template.inApp.type,
            title: template.inApp.title,
            message: template.inApp.message,
            linkUrl: template.inApp.linkUrl,
            phone: user.phone ?? undefined,
            receiverName: user.name ?? undefined,
            kakaoTemplate: user.phone ? template.kakao : undefined,
          })
        )
      )
    }

    logger.info(`[Follow알림] ${creator.displayName} 공구 시작 알림 발송 완료`, {
      creatorId,
      campaignId,
      followerCount: userIds.length,
    })
  } catch (error) {
    // 알림 실패가 비즈니스 로직에 영향 주면 안 됨
    logger.error('[Follow알림] 발송 실패', error)
  }
}
