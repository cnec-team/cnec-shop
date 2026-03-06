import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function BulkUploadLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-64" />
        </CardContent>
      </Card>
    </div>
  );
}
