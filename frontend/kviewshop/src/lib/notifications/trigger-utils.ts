import { prisma } from '@/lib/db'

export function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

export async function logCronJob(jobName: string) {
  const log = await prisma.cronJobLog.create({
    data: { jobName, status: 'running' },
  })
  return {
    async complete(processed: number, failed: number) {
      await prisma.cronJobLog.update({
        where: { id: log.id },
        data: { endedAt: new Date(), processed, failed, status: 'completed' },
      })
    },
    async fail(error: string) {
      await prisma.cronJobLog.update({
        where: { id: log.id },
        data: { endedAt: new Date(), status: 'failed', error },
      })
    },
  }
}

export async function logNotification(
  userId: string | null,
  notificationType: string,
  channel: string,
  status: string,
  errorMessage?: string,
) {
  try {
    await prisma.notificationLog.create({
      data: { userId, notificationType, channel, status, errorMessage },
    })
  } catch {
    // ignore logging failures
  }
}

export function hasMarketingConsent(marketingAgreedAt: Date | null): boolean {
  return marketingAgreedAt !== null
}
