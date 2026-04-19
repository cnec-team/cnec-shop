import { Skeleton } from '@/components/ui/skeleton';

export default function BrandInquiriesLoading() {
  return (
    <div className="max-w-4xl space-y-5">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    </div>
  );
}
