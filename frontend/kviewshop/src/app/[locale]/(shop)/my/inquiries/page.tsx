'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getMyInquiries } from '@/lib/actions/inquiry';
import { PageHeader } from '@/components/shop/PageHeader';
import { EmptyState } from '@/components/shop/EmptyState';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight, Loader2, HelpCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: '답변대기', color: 'text-orange-600', bg: 'bg-orange-50' },
  ANSWERED: { label: '답변완료', color: 'text-green-600', bg: 'bg-green-50' },
  CLOSED: { label: '종료', color: 'text-gray-500', bg: 'bg-gray-100' },
};

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING_DELAY: '배송 지연',
  PRODUCT_DEFECT: '상품 불량',
  EXCHANGE: '교환',
  REFUND: '환불',
  PAYMENT: '결제',
  OTHER: '기타',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function InquiriesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { buyer } = useUser();

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!buyer?.id) return;
    getMyInquiries()
      .then(setInquiries)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [buyer?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        title="1:1 문의"
        subtitle="문의 내역을 확인하세요"
        backLink={`/${locale}/my`}
      />

      <div className="max-w-lg mx-auto px-4 pt-4">
        {inquiries.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="문의 내역이 없어요"
            description="궁금한 점이 있으면 주문 상세에서 1:1 문의를 해보세요"
            actionLabel="주문내역 보기"
            actionHref={`/${locale}/my/orders`}
          />
        ) : (
          <div className="space-y-2">
            {inquiries.map((inq: any) => {
              const st = STATUS_CONFIG[inq.status] || STATUS_CONFIG.OPEN;
              return (
                <Link
                  key={inq.id}
                  href={`/${locale}/my/inquiries/${inq.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {CATEGORY_LABELS[inq.category] || inq.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{inq.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {inq.order?.orderNumber && `#${inq.order.orderNumber} · `}
                        {timeAgo(inq.createdAt.toString())}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
