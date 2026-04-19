'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBrandInquiryDetail, answerBrandInquiry, closeBrandInquiry } from '@/lib/actions/brand-inquiry';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ChevronLeft, Package, MessageSquare, Send, Loader2,
  User, Store, Clock, XCircle, CheckCircle, AlertCircle,
  Phone, Mail,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING_DELAY: '배송 지연',
  PRODUCT_DEFECT: '상품 불량',
  EXCHANGE: '교환',
  REFUND: '환불',
  PAYMENT: '결제',
  OTHER: '기타',
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OPEN: { label: '미답변', className: 'bg-red-50 text-red-600 border-red-200' },
  ANSWERED: { label: '답변완료', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  CLOSED: { label: '종료', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PAID: '결제완료',
  PREPARING: '배송준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

interface Answer {
  id: string;
  answerBy: string;
  answerByType: string;
  content: string;
  images: string[];
  createdAt: string;
}

interface InquiryDetail {
  id: string;
  category: string;
  title: string;
  content: string;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  buyerName: string;
  buyerId: string | null;
  order: {
    id: string;
    orderNumber: string | null;
    status: string;
    totalAmount: number;
    buyerName: string | null;
    buyerEmail: string | null;
    buyerPhone: string | null;
    items: Array<{
      productName: string;
      productImage: string | null;
      quantity: number;
      unitPrice: number;
    }>;
  } | null;
  answers: Answer[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BrandInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBrandInquiryDetail(inquiryId);
        setInquiry(data);
      } catch (error) {
        console.error('문의 상세 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [inquiryId]);

  const handleSubmitAnswer = async () => {
    if (answerContent.length < 5 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await answerBrandInquiry(inquiryId, answerContent);
      toast.success('답변이 등록되었습니다');
      // Reload
      const data = await getBrandInquiryDetail(inquiryId);
      setInquiry(data);
      setAnswerContent('');
    } catch (error: any) {
      toast.error(error.message || '답변 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await closeBrandInquiry(inquiryId);
      toast.success('문의가 종료되었습니다');
      const data = await getBrandInquiryDetail(inquiryId);
      setInquiry(data);
    } catch (error: any) {
      toast.error(error.message || '문의 종료에 실패했습니다');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="max-w-3xl text-center py-16">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">문의를 찾을 수 없습니다</p>
        <Link href={`/${locale}/brand/inquiries`}>
          <Button variant="outline" className="mt-4 rounded-xl">목록으로</Button>
        </Link>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[inquiry.status] || STATUS_BADGE.OPEN;
  const canReply = inquiry.status === 'OPEN' || inquiry.status === 'ANSWERED';

  return (
    <div className="max-w-3xl space-y-4">
      {/* Back */}
      <Link
        href={`/${locale}/brand/inquiries`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4 mr-0.5" />
        고객 문의 목록
      </Link>

      {/* Section 1: 주문 정보 */}
      {inquiry.order && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Package className="h-4 w-4" />
            주문 정보
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">주문번호</span>
              <span className="font-mono text-gray-900">{inquiry.order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">주문상태</span>
              <span className="text-gray-900">{ORDER_STATUS_LABELS[inquiry.order.status] || inquiry.order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">결제금액</span>
              <span className="font-semibold text-gray-900">{inquiry.order.totalAmount.toLocaleString()}원</span>
            </div>
            {/* Items */}
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
              {inquiry.order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {item.productImage ? (
                    <Image src={item.productImage} alt={item.productName} width={36} height={36} className="rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 truncate flex-1">{item.productName}</span>
                  <span className="text-xs text-gray-400">{item.quantity}개</span>
                </div>
              ))}
            </div>
          </div>
          {/* 고객 정보 */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-xs text-gray-400 mb-1.5">고객 정보</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <User className="h-3 w-3 inline mr-1" />
                {inquiry.order.buyerName || inquiry.guestName || '고객'}
              </p>
              {(inquiry.order.buyerPhone || inquiry.guestPhone) && (
                <p className="text-gray-500">
                  <Phone className="h-3 w-3 inline mr-1" />
                  {inquiry.order.buyerPhone || inquiry.guestPhone}
                </p>
              )}
              {(inquiry.order.buyerEmail || inquiry.guestEmail) && (
                <p className="text-gray-500">
                  <Mail className="h-3 w-3 inline mr-1" />
                  {inquiry.order.buyerEmail || inquiry.guestEmail}
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/${locale}/brand/orders`}
            className="block mt-3 text-xs text-center text-gray-400 hover:text-gray-600"
          >
            주문 상세 보기 →
          </Link>
        </div>
      )}

      {/* Section 2: 문의 원문 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              {CATEGORY_LABELS[inquiry.category] || inquiry.category}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            <Clock className="h-3 w-3 inline mr-0.5" />
            {formatDate(inquiry.createdAt)}
          </span>
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">{inquiry.title}</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
        {/* 첨부 이미지 */}
        {inquiry.images.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {inquiry.images.map((img, idx) => (
              <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                <Image src={img} alt={`첨부 ${idx + 1}`} width={80} height={80} className="rounded-lg object-cover border border-gray-100" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: 답변 히스토리 */}
      {inquiry.answers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">답변 내역</h3>
          <div className="space-y-4">
            {inquiry.answers.map((answer) => {
              const isBrand = answer.answerByType === 'BRAND';
              return (
                <div key={answer.id} className={`flex ${isBrand ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3.5 ${
                    isBrand
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-gray-50 border border-gray-100'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {isBrand ? (
                        <Store className="h-3 w-3 text-blue-500" />
                      ) : (
                        <User className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={`text-[10px] font-medium ${isBrand ? 'text-blue-600' : 'text-gray-500'}`}>
                        {isBrand ? '브랜드' : '고객'}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(answer.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer.content}</p>
                    {answer.images.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {answer.images.map((img, idx) => (
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                            <Image src={img} alt="" width={60} height={60} className="rounded-lg object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 4: 답변 작성 폼 */}
      {canReply && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">답변 작성</h3>
          <Textarea
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="답변 내용을 작성하세요 (5자 이상)"
            rows={4}
            maxLength={2000}
            className="rounded-xl resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{answerContent.length}/2000</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isClosing}
                className="rounded-lg gap-1.5 text-gray-500"
              >
                {isClosing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                문의 종료
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitAnswer}
                disabled={answerContent.length < 5 || isSubmitting}
                className="rounded-lg gap-1.5 bg-gray-900"
              >
                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                답변 등록
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 종료된 문의 */}
      {inquiry.status === 'CLOSED' && (
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
          <p className="text-sm text-gray-500">이 문의는 종료되었습니다</p>
        </div>
      )}
    </div>
  );
}
