import { Skeleton } from '@/components/ui/skeleton';

export default function ShopLoading() {
  return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-12 w-full rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}
