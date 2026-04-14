'use client';
import { AlertCircle } from 'lucide-react';
export default function Error() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <AlertCircle className="h-12 w-12 mb-4" />
      <p>데이터를 불러오는 중 오류가 발생했습니다</p>
    </div>
  );
}
