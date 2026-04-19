'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { createInquiry } from '@/lib/actions/inquiry';
import { getBuyerOrderDetail } from '@/lib/actions/buyer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronLeft, MessageCircle, Loader2, AlertCircle, Send, Phone,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'SHIPPING_DELAY', label: '배송 지연' },
  { value: 'PRODUCT_DEFECT', label: '상품 불량' },
  { value: 'EXCHANGE', label: '교환 문의' },
  { value: 'REFUND', label: '환불 문의' },
  { value: 'PAYMENT', label: '결제 문의' },
  { value: 'OTHER', label: '기타' },
];

const MIN_TITLE = 2;
const MAX_TITLE = 200;
const MIN_CONTENT = 5;
const MAX_CONTENT = 2000;

export default function InquiryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const orderId = params.orderId as string;
  const { buyer } = useUser();

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ category: false, title: false, content: false });
  const [brand, setBrand] = useState<{ brandName?: string | null; companyName?: string | null; csPhone?: string | null } | null>(null);

  // Load order to get brand CS info
  useEffect(() => {
    if (!buyer?.id || !orderId) return;
    getBuyerOrderDetail(orderId, buyer.id).then((order: any) => {
      if (order?.brand) setBrand(order.brand);
    }).catch(() => {});
  }, [buyer?.id, orderId]);

  const errors = {
    category: touched.category && !category ? '문의 유형을 선택해주세요' : '',
    title: touched.title && title.length > 0 && title.length < MIN_TITLE
      ? `제목은 최소 ${MIN_TITLE}자 이상이어야 해요`
      : touched.title && title.length === 0
        ? '제목을 입력해주세요'
        : '',
    content: touched.content && content.length > 0 && content.length < MIN_CONTENT
      ? `내용은 최소 ${MIN_CONTENT}자 이상 작성해주세요`
      : touched.content && content.length === 0
        ? '내용을 입력해주세요'
        : '',
  };

  const isValid = category && title.length >= MIN_TITLE && content.length >= MIN_CONTENT;

  const handleSubmit = async () => {
    // Touch all fields to show errors
    setTouched({ category: true, title: true, content: true });
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createInquiry({
        orderId,
        category,
        title,
        content,
      });
      toast.success('문의가 접수됐어요');
      router.push(`/${locale}/my/inquiries`);
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
          href={`/${locale}/my/orders/${orderId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          주문 상세
        </Link>

        {/* 브랜드 먼저 연락 안내 */}
        {brand?.csPhone && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-3">
            <p className="text-sm font-medium text-blue-800 mb-1">
              먼저 {brand.brandName || brand.companyName} 고객센터로 문의하시면 더 빠르게 해결됩니다
            </p>
            <a
              href={`tel:${brand.csPhone}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-800 mt-1"
            >
              <Phone className="h-4 w-4" />
              {brand.csPhone}
            </a>
          </div>
        )}

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
                    onClick={() => {
                      setCategory(cat.value);
                      setTouched((t) => ({ ...t, category: true }));
                    }}
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
              {errors.category && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                placeholder="문의 제목을 입력하세요"
                maxLength={MAX_TITLE}
                className={`h-12 rounded-xl ${errors.title ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.title ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">{title.length}/{MAX_TITLE}</span>
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, content: true }))}
                placeholder="문의 내용을 상세히 작성해주세요"
                rows={6}
                maxLength={MAX_CONTENT}
                className={`rounded-xl resize-none ${errors.content ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.content ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.content}
                  </p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${content.length < MIN_CONTENT && touched.content ? 'text-red-400' : 'text-gray-400'}`}>
                  {content.length}/{MAX_CONTENT}
                </span>
              </div>
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

        {/* 미충족 요건 표시 */}
        {!isValid && (touched.category || touched.title || touched.content) && (
          <div className="mb-3 px-1">
            <p className="text-xs text-gray-400">
              {!category && '문의 유형 선택 '}
              {title.length < MIN_TITLE && `제목 ${MIN_TITLE}자 이상 `}
              {content.length < MIN_CONTENT && `내용 ${MIN_CONTENT}자 이상 `}
              입력이 필요해요
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />전송 중...</>
          ) : (
            <><Send className="h-4 w-4" />문의 접수</>
          )}
        </Button>
      </div>
    </div>
  );
}
