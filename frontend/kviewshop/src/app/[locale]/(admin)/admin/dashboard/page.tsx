import { Suspense } from 'react'
import {
  getAdminKpiStats,
  getAdminPendingQueue,
  getAdminRecentActivity,
  getAdminTopBrands,
  getAdminTopCreators,
  getAdminWeeklyTrend,
} from '@/lib/actions/admin'
import { DashboardClient } from './dashboard-client'

export const revalidate = 60

export default async function AdminDashboardPage() {
  const [kpi, queue, activity, topBrands, topCreators, weeklyTrend] = await Promise.all([
    getAdminKpiStats(),
    getAdminPendingQueue(),
    getAdminRecentActivity(20),
    getAdminTopBrands(5),
    getAdminTopCreators(5),
    getAdminWeeklyTrend(7),
  ])

  return (
    <DashboardClient
      kpi={kpi}
      queue={queue}
      activity={activity}
      topBrands={topBrands}
      topCreators={topCreators}
      weeklyTrend={weeklyTrend}
    />
  )
}
