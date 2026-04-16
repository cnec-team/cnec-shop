import { Skeleton } from '@/components/ui/skeleton'

export default function CreatorDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}
