'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAGE_TITLES: Record<string, string> = {
  dashboard: '대시보드',
  products: '상품 둘러보기',
  shop: '내 샵 설정',
  campaigns: '캠페인',
  sales: '판매 현황',
  orders: '주문 관리',
  settlements: '정산 관리',
  points: '포인트',
  grade: '등급',
  referral: '추천',
  guides: '가이드',
  notifications: '알림',
  settings: '설정',
  collections: '컬렉션 관리',
  routines: '뷰티 루틴',
  banners: '배너 관리',
  live: '라이브',
};

export function CreatorMobileHeader() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  // Extract the page segment from pathname
  const segments = pathname.split('/');
  const pageSegment = segments[3] || 'dashboard'; // e.g., /ko/creator/dashboard → dashboard
  const title = PAGE_TITLES[pageSegment] || '크리에이터 센터';

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-14 z-30">
      <h1 className="text-lg font-bold truncate">{title}</h1>
      <Link href={`/${locale}/creator/notifications`}>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
          <Bell className="h-5 w-5" />
          {/* Unread notification dot */}
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </Link>
    </div>
  );
}
