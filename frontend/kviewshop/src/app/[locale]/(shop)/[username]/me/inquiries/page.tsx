'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getMyInquiries } from '@/lib/actions/inquiry';
import {
  ChevronLeft, ChevronRight, MessageCircle, Loader2, Inbox,
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

export default function InquiriesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const username = params.username as string;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link
          href={`/${locale}/${username}/me`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          마이페이지
        </Link>

        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5" />
          내 문의
        </h1>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">문의 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inquiries.map((inq: any) => {
              const st = STATUS_CONFIG[inq.status] || STATUS_CONFIG.OPEN;
              return (
                <Link
                  key={inq.id}
                  href={`/${locale}/${username}/me/inquiries/${inq.id}`}
                  className="block bg-white rounded-2xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-400">
                          {CATEGORY_LABELS[inq.category] || inq.category}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{inq.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {inq.order?.orderNumber && `#${inq.order.orderNumber} · `}
                        {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
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
