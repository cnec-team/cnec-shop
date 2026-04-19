import { prisma } from '@/lib/db'

export interface ChannelPreferences {
  inApp: boolean
  email: boolean
  kakao: boolean
}

const DEFAULT_ALLOW: ChannelPreferences = { inApp: true, email: true, kakao: true }

/**
 * 거래성 알림 (주문/배송/정산)은 수신거부 불가.
 * 마케팅성 (캠페인/제안/시스템)은 거부 가능.
 */
export function isTransactional(type?: string): boolean {
  if (!type) return false
  return ['ORDER', 'SHIPPING', 'DELIVERY', 'SETTLEMENT'].includes(type)
}

export async function getNotificationPreferences(
  userId?: string,
  notificationType?: string,
): Promise<ChannelPreferences> {
  if (!userId) return DEFAULT_ALLOW

  // 거래성 알림은 무조건 발송
  if (isTransactional(notificationType)) return DEFAULT_ALLOW

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        buyer: {
          select: {
            notificationSetting: {
              select: {
                kakaoOrder: true,
                kakaoShipping: true,
                kakaoDeliver: true,
                kakaoGonggu: true,
                emailOrder: true,
                emailShipping: true,
                emailDeliver: true,
                emailGonggu: true,
              },
            },
          },
        },
        creator: { select: { notificationSettings: true } },
      },
    })

    if (!user) return DEFAULT_ALLOW

    // Buyer: BuyerNotificationSetting 모델 사용
    if (user.buyer?.notificationSetting) {
      const s = user.buyer.notificationSetting
      // 마케팅성(공구 알림) 설정 체크
      return {
        inApp: true,
        email: s.emailGonggu !== false,
        kakao: s.kakaoGonggu !== false,
      }
    }

    // Creator: JSON 필드
    if (user.creator?.notificationSettings) {
      const s = user.creator.notificationSettings as Record<string, unknown>
      return {
        inApp: s.inApp !== false,
        email: s.email !== false,
        kakao: s.kakao !== false,
      }
    }

    return DEFAULT_ALLOW
  } catch (e) {
    console.error('[preferences] query failed', e)
    return DEFAULT_ALLOW
  }
}
