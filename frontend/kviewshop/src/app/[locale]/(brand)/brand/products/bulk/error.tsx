'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BulkUploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">상품 일괄 등록</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">오류가 발생했습니다.</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
