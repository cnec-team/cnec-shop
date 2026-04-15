'use client';

import { AlertCircle } from 'lucide-react';

export default function Error() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#8E8E93]">
      <AlertCircle className="h-12 w-12 mb-4" />
      <p className="text-[15px]">콘텐츠를 불러오는 중 오류가 발생했습니다</p>
    </div>
  );
}
