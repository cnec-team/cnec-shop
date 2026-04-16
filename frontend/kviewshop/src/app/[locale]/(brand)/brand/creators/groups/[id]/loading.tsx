import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton className="h-6 w-24 mb-2" />
      <Skeleton className="h-8 w-48 mb-1" />
      <Skeleton className="h-5 w-20 mb-6" />
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
