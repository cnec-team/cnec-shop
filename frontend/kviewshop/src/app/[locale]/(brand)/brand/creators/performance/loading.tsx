import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CreatorPerformanceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
