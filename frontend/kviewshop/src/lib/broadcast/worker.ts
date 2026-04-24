import { prisma } from '@/lib/db'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import { broadcastPromotionalMessage, broadcastInformationalMessage } from '@/lib/notifications/templates'

const CHUNK_SIZE = 50
const CHUNK_DELAY_MS = 1000
const FAILURE_THRESHOLD = 0.5

export async function processBroadcastChunks(broadcastId: string) {
  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast || broadcast.status !== 'SENDING') return

  let totalProcessed = 0
  let totalFailed = 0
  const total = broadcast.totalCount

  while (true) {
    const recipients = await prisma.broadcastRecipient.findMany({
      where: { broadcastId, status: 'PENDING' },
      take: CHUNK_SIZE,
    })

    if (recipients.length === 0) break

    for (const r of recipients) {
      try {
        // Fetch user info for this recipient
        const user = await prisma.user.findUnique({
          where: { id: r.userId },
          select: {
            id: true, name: true, email: true, phone: true,
            brand: { select: { brandName: true } },
            creator: { select: { displayName: true, username: true } },
            buyer: { select: { nickname: true } },
          },
        })

        if (!user) {
          await prisma.broadcastRecipient.update({
            where: { id: r.id },
            data: { status: 'SKIPPED', error: '사용자를 찾을 수 없음' },
          })
          continue
        }

        const recipientName = user.brand?.brandName
          ?? user.creator?.displayName
          ?? user.creator?.username
          ?? user.buyer?.nickname
          ?? user.name
          ?? '고객'

        const recipientEmail = isValidEmail(user.email) ? user.email! : undefined
        const recipientPhone = normalizePhone(user.phone)

        const tmplFn = broadcast.type === 'PROMOTIONAL'
          ? broadcastPromotionalMessage
          : broadcastInformationalMessage

        const tmpl = tmplFn({
          recipientName,
          title: broadcast.title,
          content: broadcast.content,
          recipientEmail,
        })

        // Determine which channels to send
        const shouldInApp = r.channels.includes('IN_APP')
        const shouldEmail = r.channels.includes('EMAIL') && recipientEmail
        const shouldKakao = r.channels.includes('KAKAO') && recipientPhone

        await sendNotification({
          userId: shouldInApp ? user.id : undefined,
          ...tmpl.inApp,
          phone: shouldKakao ? recipientPhone : undefined,
          email: shouldEmail ? recipientEmail : undefined,
          kakaoTemplate: shouldKakao ? tmpl.kakao : undefined,
          emailTemplate: shouldEmail ? tmpl.email : undefined,
        })

        await prisma.broadcastRecipient.update({
          where: { id: r.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
        totalProcessed++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류'
        await prisma.broadcastRecipient.update({
          where: { id: r.id },
          data: { status: 'FAILED', failedAt: new Date(), error: errorMsg },
        })
        totalFailed++
      }
    }

    // Update broadcast counts
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        sentCount: { increment: recipients.length - totalFailed },
        failedCount: { increment: totalFailed },
      },
    })

    // Check failure threshold
    const processed = totalProcessed + totalFailed
    if (processed > 0 && totalFailed / processed > FAILURE_THRESHOLD) {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'FAILED',
          lastError: `실패율 ${Math.round((totalFailed / processed) * 100)}% 초과로 자동 중단`,
          completedAt: new Date(),
        },
      })
      return
    }

    // Check if broadcast was cancelled
    const current = await prisma.broadcast.findUnique({ where: { id: broadcastId }, select: { status: true } })
    if (current?.status === 'CANCELLED') return

    // Delay between chunks
    if (recipients.length === CHUNK_SIZE) {
      await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS))
    }

    // Reset per-chunk counters
    totalFailed = 0
    totalProcessed = 0
  }

  // Mark as completed
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })
}
