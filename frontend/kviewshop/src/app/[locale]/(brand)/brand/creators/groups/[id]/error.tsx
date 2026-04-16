'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center py-16">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
      <p className="text-lg font-semibold mb-2">오류가 발생했습니다</p>
      <Button onClick={reset} variant="outline">다시 시도</Button>
    </div>
  );
}
