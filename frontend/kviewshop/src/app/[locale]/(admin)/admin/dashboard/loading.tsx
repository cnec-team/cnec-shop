import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* 처리 대기 큐 6개 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>

      {/* KPI 4개 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-10 w-36" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      {/* 차트 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-[280px] w-full rounded-lg" />
      </div>

      {/* TOP 5 좌우 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-6">
            <Skeleton className="h-5 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 활동 피드 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <Skeleton className="h-5 w-24" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-1 h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
