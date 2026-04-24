import { Skeleton } from '@/components/ui/skeleton'

export default function BroadcastNewLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
