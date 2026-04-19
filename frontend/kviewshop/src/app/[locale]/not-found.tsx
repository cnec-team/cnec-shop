'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';

export default function LocaleNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Search className="w-7 h-7 text-gray-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          주소를 다시 확인하거나 아래 버튼을 눌러주세요
        </p>
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-5 py-2.5"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 페이지로
          </button>
          <Link
            href="/no-shop-context"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors"
          >
            크리에이터 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}
