import { verifyUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = body.token as string | undefined

  if (!token) {
    return Response.json({ error: 'Token required' }, { status: 400 })
  }

  const decoded = verifyUnsubscribeToken(token)
  if (!decoded) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
    include: { buyer: true, creator: true, brand: true },
  })

  // 보안상 모호하게 응답 (사용자 존재 여부 숨김)
  if (!user) return Response.json({ ok: true })

  const updateData = (existing: unknown) => ({
    ...((existing as Record<string, unknown>) ?? {}),
    email: false,
  })

  try {
    // Buyer: BuyerNotificationSetting 업데이트
    if (user.buyer) {
      const existing = await prisma.buyerNotificationSetting.findUnique({
        where: { buyerId: user.buyer.id },
      })
      if (existing) {
        await prisma.buyerNotificationSetting.update({
          where: { buyerId: user.buyer.id },
          data: {
            emailOrder: false,
            emailShipping: false,
            emailDeliver: false,
            emailGonggu: false,
          },
        })
      } else {
        await prisma.buyerNotificationSetting.create({
          data: {
            buyerId: user.buyer.id,
            emailOrder: false,
            emailShipping: false,
            emailDeliver: false,
            emailGonggu: false,
          },
        })
      }
    }

    // Creator: JSON 필드 업데이트
    if (user.creator) {
      await prisma.creator.update({
        where: { userId: user.id },
        data: { notificationSettings: updateData(user.creator.notificationSettings) },
      })
    }

    // Brand: contactEmail 등에는 notification 설정이 별도 없으므로 skip
  } catch (e) {
    console.error('[unsubscribe] failed:', e)
  }

  return Response.json({ ok: true })
}
