'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function BrandInquiriesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-3xl py-16 text-center">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
      <h2 className="text-lg font-bold text-gray-900 mb-2">문제가 발생했습니다</h2>
      <p className="text-sm text-gray-400 mb-4">{error.message || '잠시 후 다시 시도해주세요'}</p>
      <Button onClick={reset} variant="outline" className="rounded-xl">
        다시 시도
      </Button>
    </div>
  );
}
