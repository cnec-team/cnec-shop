import { Skeleton } from '@/components/ui/skeleton'

export default function ActivityLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}
