import { Skeleton } from '@/components/ui/skeleton';

export default function CampaignDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-28">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
