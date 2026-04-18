'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { createInquiry } from '@/lib/actions/inquiry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronLeft, MessageCircle, Loader2, AlertCircle, Send,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'SHIPPING_DELAY', label: '배송 지연' },
  { value: 'PRODUCT_DEFECT', label: '상품 불량' },
  { value: 'EXCHANGE', label: '교환 문의' },
  { value: 'REFUND', label: '환불 문의' },
  { value: 'PAYMENT', label: '결제 문의' },
  { value: 'OTHER', label: '기타' },
];

export default function InquiryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;
  const orderId = params.orderId as string;
  const { buyer } = useUser();

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = category && title.length >= 2 && content.length >= 10;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createInquiry({
        orderId,
        category,
        title,
        content,
      });
      toast.success('문의가 접수되었습니다');
      router.push(`/${locale}/${username}/me/inquiries`);
    } catch (error: any) {
      toast.error(error.message || '문의 접수에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link
          href={`/${locale}/${username}/me/orders/${orderId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          주문 상세
        </Link>

        <div className="bg-white rounded-2xl p-5 mb-3">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5" />
            1:1 문의
          </h1>

          <div className="space-y-5">
            {/* 카테고리 */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">문의 유형</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`h-10 rounded-xl text-sm border transition-colors ${
                      category === cat.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문의 제목을 입력하세요 (2-200자)"
                maxLength={200}
                className="h-12 rounded-xl"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="문의 내용을 상세히 작성해주세요 (10자 이상)"
                rows={6}
                maxLength={2000}
                className="rounded-xl resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</p>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-3">
          <p className="text-sm text-amber-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            24시간 내 답변드립니다. 배송/교환 관련 문의는 브랜드에서 직접 답변합니다.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />제출 중...</>
          ) : (
            <><Send className="h-4 w-4" />문의 접수</>
          )}
        </Button>
      </div>
    </div>
  );
}
