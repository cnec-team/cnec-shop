import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-72 sm:h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
