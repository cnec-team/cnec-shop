import { prisma } from '@/lib/db'

/**
 * 알림 생성 유틸리티.
 * try-catch로 감싸서 알림 실패가 주요 로직에 영향 주지 않도록 보장.
 */
export async function sendNotification(data: {
  userId: string
  type: 'ORDER' | 'SHIPPING' | 'SETTLEMENT' | 'CAMPAIGN' | 'SYSTEM'
  title: string
  message: string
  linkUrl?: string
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl ?? null,
      },
    })
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }
}
