import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import { sendNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const tomorrow = addDays(now, 1)
  const sevenDaysLater = addDays(now, 7)

  const results = {
    trialEndingTomorrow: 0,
    trialExpired: 0,
    proExpiringSoon: 0,
    proExpired: 0,
  }

  // 1. 체험 D-1 알림
  const trialEndingTomorrow = await prisma.brandSubscription.findMany({
    where: {
      planV3: 'TRIAL',
      trialEndsAt: {
        gte: startOfDay(tomorrow),
        lte: endOfDay(tomorrow),
      },
    },
    include: { brand: { include: { user: true } } },
  })
  for (const sub of trialEndingTomorrow) {
    try {
      await sendNotification({
        userId: sub.brand.userId,
        type: 'SYSTEM',
        title: '내일이면 체험이 끝나요',
        message: `3일 체험이 내일까지예요. 공동구매 ${sub.trialUsedCampaigns}개, 메시지 ${sub.trialUsedMessages}건, 상세정보 ${sub.trialUsedDetailViews}번 사용하셨어요. 내일부터 스탠다드로 전환돼요.`,
      })
      results.trialEndingTomorrow++
    } catch (e) {
      console.error('[cron/pricing-daily] trial ending notification', e)
    }
  }

  // 2. 체험 종료 → STANDARD 전환
  const trialExpired = await prisma.brandSubscription.findMany({
    where: { planV3: 'TRIAL', trialEndsAt: { lt: now } },
  })
  for (const sub of trialExpired) {
    await prisma.brandSubscription.update({
      where: { id: sub.id },
      data: { planV3: 'STANDARD', shopCommissionRate: 10.0 },
    })
    results.trialExpired++
  }

  // 3. 프로 만료 7일 전 알림
  const proExpiringSoon = await prisma.brandSubscription.findMany({
    where: {
      planV3: 'PRO',
      proExpiresAt: {
        gte: startOfDay(sevenDaysLater),
        lte: endOfDay(sevenDaysLater),
      },
    },
    include: { brand: { include: { user: true } } },
  })
  for (const sub of proExpiringSoon) {
    try {
      await sendNotification({
        userId: sub.brand.userId,
        type: 'SYSTEM',
        title: '프로 만료 7일 전이에요',
        message: `프로가 ${sub.proExpiresAt?.toLocaleDateString('ko-KR')}에 만료돼요. 미리 연장하시면 끊김 없이 이어서 사용하실 수 있어요.`,
      })
      results.proExpiringSoon++
    } catch (e) {
      console.error('[cron/pricing-daily] pro expiring notification', e)
    }
  }

  // 4. 프로 만료 → STANDARD
  const proExpired = await prisma.brandSubscription.findMany({
    where: { planV3: 'PRO', proExpiresAt: { lt: now } },
  })
  for (const sub of proExpired) {
    await prisma.brandSubscription.update({
      where: { id: sub.id },
      data: { planV3: 'STANDARD', shopCommissionRate: 10.0 },
    })
    results.proExpired++
  }

  return NextResponse.json(results)
}
