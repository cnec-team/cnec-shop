'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getInquiryDetail, addInquiryMessage, closeInquiry } from '@/lib/actions/inquiry';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronLeft, MessageCircle, Loader2, User, Store, Send, CheckCircle,
} from 'lucide-react';

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

  useEffect(() => {
    if (!buyer?.id) return;
    getInquiryDetail(inquiryId)
      .then(setInquiry)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [buyer?.id, inquiryId]);

  const handleSendReply = async () => {
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    try {
      await addInquiryMessage(inquiryId, reply.trim());
      toast.success('추가 질문이 등록되었습니다');
      setReply('');
      // reload
      const updated = await getInquiryDetail(inquiryId);
      setInquiry(updated);
    } catch (error: any) {
      toast.error(error.message || '실패했습니다');
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
      setInquiry({ ...inquiry, status: 'CLOSED' });
    } catch (error: any) {
      toast.error(error.message || '실패했습니다');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">문의를 찾을 수 없습니다</p>
      </div>
    );
  }

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link
          href={`/${locale}/${username}/me/inquiries`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          문의 목록
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <h1 className="text-base font-bold text-gray-900 mb-2">{inquiry.title}</h1>
          <p className="text-xs text-gray-400">
            #{inquiry.order?.orderNumber} · {formatDate(inquiry.createdAt)}
          </p>
          <div className="h-px bg-gray-100 my-4" />
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
        </div>

        {/* Answers */}
        {inquiry.answers?.map((ans: any) => (
          <div
            key={ans.id}
            className={`rounded-2xl p-4 mb-2 ${
              ans.answerByType === 'BUYER'
                ? 'bg-blue-50 ml-4'
                : 'bg-white mr-4'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {ans.answerByType === 'BUYER' ? (
                <User className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <Store className="h-3.5 w-3.5 text-gray-500" />
              )}
              <span className="text-xs font-medium text-gray-500">
                {ans.answerByType === 'BUYER' ? '나' : inquiry.brand?.brandName || '담당자'}
              </span>
              <span className="text-xs text-gray-400">{formatDate(ans.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ans.content}</p>
          </div>
        ))}

        {/* Reply input */}
        {['OPEN', 'ANSWERED'].includes(inquiry.status) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="max-w-lg mx-auto flex gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="추가 질문을 입력하세요"
                rows={1}
                className="flex-1 rounded-xl resize-none min-h-[44px]"
              />
              <Button
                onClick={handleSendReply}
                disabled={!reply.trim() || isSending}
                size="icon"
                className="h-11 w-11 rounded-xl bg-gray-900"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleClose}
                disabled={isClosing}
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl"
                title="문의 종료"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
