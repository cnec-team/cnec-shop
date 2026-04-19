'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getBrandInquiries } from '@/lib/actions/brand-inquiry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare, Search, Clock, CheckCircle, XCircle, ChevronRight,
  Inbox,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'OPEN', label: '미답변' },
  { key: 'ANSWERED', label: '답변완료' },
  { key: 'CLOSED', label: '종료' },
];

const CATEGORY_OPTIONS = [
  { key: 'all', label: '전체 유형' },
  { key: 'SHIPPING_DELAY', label: '배송 지연' },
  { key: 'PRODUCT_DEFECT', label: '상품 불량' },
  { key: 'EXCHANGE', label: '교환' },
  { key: 'REFUND', label: '환불' },
  { key: 'PAYMENT', label: '결제' },
  { key: 'OTHER', label: '기타' },
];

const PERIOD_OPTIONS = [
  { key: 'all', label: '전체 기간' },
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OPEN: { label: '미답변', className: 'bg-red-50 text-red-600 border-red-200' },
  ANSWERED: { label: '답변완료', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  CLOSED: { label: '종료', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING_DELAY: '배송 지연',
  PRODUCT_DEFECT: '상품 불량',
  EXCHANGE: '교환',
  REFUND: '환불',
  PAYMENT: '결제',
  OTHER: '기타',
};

interface Inquiry {
  id: string;
  category: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderNumber: string | null;
  buyerName: string;
  hasAnswer: boolean;
  lastAnswerAt: string | null;
}

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

export default function BrandInquiriesPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadInquiries = async (status: string, cat: string, per: string, search: string) => {
    setIsLoading(true);
    try {
      const result = await getBrandInquiries({
        status: status === 'all' ? undefined : status,
        category: cat === 'all' ? undefined : cat,
        period: per === 'all' ? undefined : per,
        search: search || undefined,
      });
      setInquiries(result);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries(activeTab, category, period, searchQuery);
  }, [activeTab, category, period]);

  const handleSearch = () => {
    loadInquiries(activeTab, category, period, searchQuery);
  };

  const tabCounts = {
    all: inquiries.length,
    OPEN: inquiries.filter((i) => i.status === 'OPEN').length,
    ANSWERED: inquiries.filter((i) => i.status === 'ANSWERED').length,
    CLOSED: inquiries.filter((i) => i.status === 'CLOSED').length,
  };

  // When tab is 'all', we show all; for filtered tabs, getBrandInquiries already filtered
  const displayInquiries = inquiries;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            고객 문의
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">고객의 1:1 문의에 답변하세요</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.key === 'OPEN' && tabCounts.OPEN > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-red-400 text-white' : 'bg-red-50 text-red-600'
                }`}>
                  {tabCounts.OPEN}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        <div className="flex gap-1 flex-1 min-w-[200px]">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="주문번호 또는 고객명 검색"
            className="h-9 rounded-lg text-sm"
          />
          <Button variant="outline" size="sm" onClick={handleSearch} className="h-9 px-3 rounded-lg">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : displayInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-600">문의가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">고객 문의가 들어오면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayInquiries.map((inquiry) => {
            const statusBadge = STATUS_BADGE[inquiry.status] || STATUS_BADGE.OPEN;
            return (
              <Link
                key={inquiry.id}
                href={`/${locale}/brand/inquiries/${inquiry.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusBadge.className}`}>
                        {statusBadge.label}
                      </Badge>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {CATEGORY_LABELS[inquiry.category] || inquiry.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{inquiry.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                      <span>{inquiry.buyerName}</span>
                      {inquiry.orderNumber && (
                        <>
                          <span>·</span>
                          <span>{inquiry.orderNumber}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{timeAgo(inquiry.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 mt-2 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
