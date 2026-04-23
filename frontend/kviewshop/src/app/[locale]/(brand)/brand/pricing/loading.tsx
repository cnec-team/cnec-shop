import { Skeleton } from '@/components/ui/skeleton'

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-16 md:pt-24">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
          <Skeleton className="h-10 w-48 mx-auto mt-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-8 space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-12 w-32" />
              <div className="space-y-3 pt-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
