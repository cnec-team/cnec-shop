import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import { sendNotification } from '@/lib/notifications'
import {
  trialEndingMessage,
  trialPlanExpiredMessage,
  proExpiringMessage,
  proExpiredMessage,
  restrictedExpiringMessage,
  accountDeactivatedBrandMessage,
} from '@/lib/notifications/templates'

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
      const brandEmail = sub.brand.user?.email ?? undefined
      const brandName = sub.brand.brandName ?? sub.brand.companyName ?? ''
      const tmpl = trialEndingMessage({
        brandName,
        trialEndsDate: sub.trialEndsAt?.toLocaleDateString('ko-KR') ?? '',
        usedCampaigns: sub.trialUsedCampaigns ?? 0,
        usedMessages: sub.trialUsedMessages ?? 0,
        usedDetailViews: sub.trialUsedDetailViews ?? 0,
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: sub.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
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
      const brandEmail = sub.brand.user?.email ?? undefined
      const brandName = sub.brand.brandName ?? sub.brand.companyName ?? ''
      const tmpl = trialPlanExpiredMessage({
        brandName,
        restrictedUntilDate: restrictedUntil.toLocaleDateString('ko-KR'),
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: sub.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
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
      const brandEmail = sub.brand.user?.email ?? undefined
      const brandName = sub.brand.brandName ?? sub.brand.companyName ?? ''
      const tmpl = proExpiringMessage({
        brandName,
        proExpiresDate: sub.proExpiresAt?.toLocaleDateString('ko-KR') ?? '',
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: sub.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
      })
      results.proExpiringSoon++
    } catch (e) {
      console.error('[cron/pricing-daily] pro expiring notification', e)
    }
  }

  // 4. 프로 만료 → STANDARD
  const proExpired = await prisma.brandSubscription.findMany({
    where: { planV3: 'PRO', proExpiresAt: { lt: now } },
    include: { brand: { include: { user: true } } },
  })
  for (const sub of proExpired) {
    await prisma.brandSubscription.update({
      where: { id: sub.id },
      data: { planV3: 'STANDARD', shopCommissionRate: 10.0 },
    })
    results.proExpired++

    try {
      const brandEmail = sub.brand.user?.email ?? undefined
      const brandName = sub.brand.brandName ?? sub.brand.companyName ?? ''
      const tmpl = proExpiredMessage({
        brandName,
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: sub.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
      })
    } catch (e) {
      console.error('[cron/pricing-daily] pro expired notification', e)
    }
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
      const brandEmail = sub.brand.user?.email ?? undefined
      const brandName = sub.brand.brandName ?? sub.brand.companyName ?? ''
      const tmpl = restrictedExpiringMessage({
        brandName,
        restrictedUntilDate: sub.restrictedUntil?.toLocaleDateString('ko-KR') ?? '',
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: sub.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
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
      const brandEmail = sub.brand.user?.email ?? undefined
      const brandName = sub.brand.brandName ?? sub.brand.companyName ?? ''
      const tmpl = accountDeactivatedBrandMessage({
        brandName,
        retentionDays: 90,
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: sub.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
      })
    } catch (e) {
      console.error('[cron/pricing-daily] deactivation notification', e)
    }
  }

  return NextResponse.json(results)
}
