import Link from 'next/link';
import { Users } from 'lucide-react';
import { ClearLastShopCookie } from '@/components/shop/ClearLastShopCookie';

export default function ShopNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <ClearLastShopCookie />
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Users className="w-7 h-7 text-gray-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          존재하지 않는 샵입니다
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          주소를 다시 확인해주세요
        </p>
        <Link
          href="/no-shop-context"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-5 py-2.5"
        >
          크리에이터 둘러보기
        </Link>
      </div>
    </div>
  );
}
