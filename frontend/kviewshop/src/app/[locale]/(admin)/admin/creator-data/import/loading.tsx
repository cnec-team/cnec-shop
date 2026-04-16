import { Skeleton } from '@/components/ui/skeleton'

export default function ImportLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}
