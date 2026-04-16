import { Skeleton } from '@/components/ui/skeleton'

export default function ProposalsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  )
}
