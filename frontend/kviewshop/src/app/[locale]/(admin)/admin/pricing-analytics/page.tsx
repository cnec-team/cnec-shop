import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export default async function PricingAnalyticsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/ko/login')
  if (user.role !== 'super_admin') redirect('/ko')

  const [v3Counts, mrr, suspicious] = await Promise.all([
    prisma.brandSubscription.groupBy({
      by: ['planV3'],
      _count: true,
      where: { planV3: { not: null } },
    }),
    prisma.billingPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: { in: ['CONFIRMED', 'WEBHOOK_CONFIRMED'] },
        purpose: 'PRO_SUBSCRIPTION',
        approvedAt: {
          gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ),
        },
      },
    }),
    prisma.suspiciousActivityLog.findMany({
      where: { resolvedAt: null },
      orderBy: { detectedAt: 'desc' },
      take: 20,
      include: { brand: true },
    }),
  ])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">가격 시스템 분석</h1>

      <section className="grid grid-cols-3 gap-6 mb-12">
        {v3Counts.map((c) => (
          <div key={c.planV3} className="border rounded-lg p-6">
            <div className="text-sm text-muted-foreground">{c.planV3}</div>
            <div className="text-3xl font-bold">{c._count}</div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">이번 달 프로 매출</h2>
        <div className="text-3xl font-bold">
          ₩{Number(mrr._sum.amount ?? 0).toLocaleString()}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">의심 활동</h2>
        {suspicious.length === 0 ? (
          <p className="text-muted-foreground">
            감지된 의심 활동이 없어요.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">브랜드</th>
                <th className="text-left py-2">유형</th>
                <th className="text-left py-2">심각도</th>
                <th className="text-left py-2">감지 시각</th>
              </tr>
            </thead>
            <tbody>
              {suspicious.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">
                    {s.brand.companyName ?? s.brand.brandName}
                  </td>
                  <td className="py-2">{s.activityType}</td>
                  <td className="py-2">{s.severity}</td>
                  <td className="py-2">
                    {s.detectedAt.toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
