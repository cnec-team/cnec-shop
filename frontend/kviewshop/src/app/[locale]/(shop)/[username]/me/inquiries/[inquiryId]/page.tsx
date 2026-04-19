'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { getInquiryDetail, addInquiryMessage, closeInquiry } from '@/lib/actions/inquiry';
import { PageHeader } from '@/components/shop/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  MessageCircle, Loader2, User, Store, Send, CheckCircle,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING_DELAY: '배송 지연',
  PRODUCT_DEFECT: '상품 불량',
  EXCHANGE: '교환',
  REFUND: '환불',
  PAYMENT: '결제',
  OTHER: '기타',
};

export default function InquiryDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const inquiryId = params.inquiryId as string;
  const { buyer } = useUser();

  const [inquiry, setInquiry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const loadInquiry = async () => {
    try {
      const data = await getInquiryDetail(inquiryId);
      setInquiry(data);
    } catch (error) {
      console.error('문의 상세 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!buyer?.id) return;
    loadInquiry();
  }, [buyer?.id, inquiryId]);

  const handleSendReply = async () => {
    if (reply.length < 5 || isSending) return;
    setIsSending(true);
    try {
      await addInquiryMessage(inquiryId, reply.trim());
      toast.success('메시지가 전송됐어요');
      setReply('');
      await loadInquiry();
    } catch (error: any) {
      toast.error(error.message || '전송에 실패했습니다');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await closeInquiry(inquiryId);
      toast.success('문의가 종료되었습니다');
      await loadInquiry();
    } catch (error: any) {
      toast.error(error.message || '종료에 실패했습니다');
    } finally {
      setIsClosing(false);
    }
  };

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">문의를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const canReply = inquiry.status === 'OPEN' || inquiry.status === 'ANSWERED';

  return (
    <div className="pb-32">
      <PageHeader
        title="문의 상세"
        backLink={`/${locale}/${username}/me/inquiries`}
      />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">
              {CATEGORY_LABELS[inquiry.category] || inquiry.category}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              inquiry.status === 'OPEN' ? 'bg-orange-50 text-orange-600' :
              inquiry.status === 'ANSWERED' ? 'bg-green-50 text-green-600' :
              'bg-gray-100 text-gray-500'
            }`}>
              {inquiry.status === 'OPEN' ? '답변대기' : inquiry.status === 'ANSWERED' ? '답변완료' : '종료'}
            </span>
          </div>
          <h1 className="text-base font-bold text-gray-900 mb-2">{inquiry.title}</h1>
          <p className="text-xs text-gray-400">
            #{inquiry.order?.orderNumber} · {formatDate(inquiry.createdAt)}
          </p>
          <div className="h-px bg-gray-100 my-4" />
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
        </div>

        {/* Answers (chat style) */}
        {inquiry.answers?.length > 0 && (
          <div className="space-y-2">
            {inquiry.answers.map((ans: any) => {
              const isBuyer = ans.answerByType === 'BUYER';
              return (
                <div key={ans.id} className={`flex ${isBuyer ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 ${
                    isBuyer
                      ? 'bg-gray-50 border border-gray-100'
                      : 'bg-blue-50 border border-blue-100'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {isBuyer ? (
                        <User className="h-3 w-3 text-gray-400" />
                      ) : (
                        <Store className="h-3 w-3 text-blue-500" />
                      )}
                      <span className={`text-[10px] font-medium ${isBuyer ? 'text-gray-500' : 'text-blue-600'}`}>
                        {isBuyer ? '나' : inquiry.brand?.brandName || '판매자'}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(ans.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{ans.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 종료 안내 */}
        {inquiry.status === 'CLOSED' && (
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
            <p className="text-sm text-gray-500">이 문의는 종료되었습니다</p>
          </div>
        )}
      </div>

      {/* Reply input (sticky bottom) */}
      {canReply && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-lg mx-auto">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="추가 문의 내용을 입력하세요 (5자 이상)"
              rows={2}
              maxLength={2000}
              className="rounded-xl resize-none mb-2"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{reply.length}/2000</span>
              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  disabled={isClosing}
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-1"
                  title="문의 종료"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  종료
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={reply.length < 5 || isSending}
                  size="sm"
                  className="rounded-lg gap-1 bg-gray-900"
                >
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  전송
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
