'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          오류가 발생했습니다
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          페이지를 불러오는 중 문제가 발생했습니다
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    </div>
  );
}
