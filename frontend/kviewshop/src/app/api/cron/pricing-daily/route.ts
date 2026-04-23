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
    restrictedExpired: 0,
    restrictedReminder: 0,
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

  // 2. 체험 종료 → 30일 제한 모드 전환
  const trialExpired = await prisma.brandSubscription.findMany({
    where: { planV3: 'TRIAL', trialEndsAt: { lt: now }, status: 'ACTIVE' },
    include: { brand: { include: { user: true } } },
  })
  for (const sub of trialExpired) {
    const restrictedUntil = new Date(now)
    restrictedUntil.setDate(restrictedUntil.getDate() + 30)

    await prisma.brandSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'RESTRICTED',
        restrictedAt: now,
        restrictedUntil,
      },
    })
    results.trialExpired++

    try {
      await sendNotification({
        userId: sub.brand.userId,
        type: 'SYSTEM',
        title: '체험 기간이 종료됐어요',
        message: '30일 내 결제하시면 데이터를 그대로 유지할 수 있어요. 스탠다드(월 ₩99,000) 또는 프로(월 ₩330,000) 중 선택하세요.',
      })
    } catch (e) {
      console.error('[cron/pricing-daily] trial ended notification', e)
    }
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

  // 5. 제한 모드 D-7 알림
  const sevenDaysFromNow = addDays(now, 7)
  const restrictedSoonExpiring = await prisma.brandSubscription.findMany({
    where: {
      status: 'RESTRICTED',
      restrictedUntil: {
        gte: startOfDay(sevenDaysFromNow),
        lte: endOfDay(sevenDaysFromNow),
      },
    },
    include: { brand: { include: { user: true } } },
  })
  for (const sub of restrictedSoonExpiring) {
    try {
      await sendNotification({
        userId: sub.brand.userId,
        type: 'SYSTEM',
        title: '7일 후 계정이 비활성화됩니다',
        message: '지금 결제하면 데이터를 유지할 수 있어요. 스탠다드(월 ₩99,000) 또는 프로(월 ₩330,000) 중 선택하세요.',
      })
      results.restrictedReminder++
    } catch (e) {
      console.error('[cron/pricing-daily] restricted reminder notification', e)
    }
  }

  // 6. 제한 모드 30일 만료 → 비활성화
  const restrictedExpired = await prisma.brandSubscription.findMany({
    where: {
      status: 'RESTRICTED',
      restrictedUntil: { lt: now },
    },
    include: { brand: { include: { user: true } } },
  })
  for (const sub of restrictedExpired) {
    await prisma.brandSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'DEACTIVATED',
        deactivatedAt: now,
      },
    })
    results.restrictedExpired++

    try {
      await sendNotification({
        userId: sub.brand.userId,
        type: 'SYSTEM',
        title: '계정이 비활성화됐어요',
        message: '데이터는 90일간 보존됩니다. 그 안에 결제하시면 복구됩니다.',
      })
    } catch (e) {
      console.error('[cron/pricing-daily] deactivation notification', e)
    }
  }

  return NextResponse.json(results)
}
