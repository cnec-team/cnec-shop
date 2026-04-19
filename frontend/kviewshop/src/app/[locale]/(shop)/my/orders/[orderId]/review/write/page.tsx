'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { writeReview, getReviewableItems } from '@/lib/actions/review-write';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronLeft, Star, Loader2, Package, Gift,
} from 'lucide-react';

export default function ReviewWritePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const orderId = params.orderId as string;
  const { buyer } = useUser();

  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!buyer?.id) return;
    getReviewableItems(orderId)
      .then((data) => {
        setItems(data);
        if (data.length === 1) setSelectedItemId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [buyer?.id, orderId]);

  const expectedPoints = (() => {
    let p = 300;
    if (instagramUrl) p += 500;
    return p;
  })();

  const isValid = selectedItemId && rating >= 1 && content.length >= 20;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await writeReview({
        orderItemId: selectedItemId,
        rating,
        title: title || undefined,
        content,
        instagramUrl: instagramUrl || undefined,
      });
      toast.success(`후기가 등록됐어요! +${result.pointsEarned}P 지급`);
      router.push(`/${locale}/my/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.message || '후기 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Star className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-4">작성할 수 있는 후기가 없습니다</p>
          <Link
            href={`/${locale}/my/orders/${orderId}`}
            className="text-sm font-medium text-gray-900 underline"
          >
            주문 상세로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

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

        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Star className="h-5 w-5" />
          후기 작성
        </h1>

        {/* Item selection */}
        {items.length > 1 && (
          <div className="bg-white rounded-2xl p-5 mb-3">
            <p className="text-sm font-semibold text-gray-700 mb-3">상품 선택</p>
            <div className="space-y-2">
              {items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    selectedItemId === item.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {item.productImage ? (
                      <Image src={item.productImage} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 text-left truncate flex-1">{item.productName}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">별점</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star
                  className={`h-8 w-8 transition-colors ${
                    s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-5 mb-3 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">제목 (선택)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="한 줄 요약" className="h-11 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">후기 내용 *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="20자 이상 작성해주세요"
              rows={5}
              maxLength={2000}
              className="rounded-xl resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">인스타그램 URL (선택, +500P)</label>
            <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://www.instagram.com/p/..." className="h-11 rounded-xl" />
          </div>
        </div>

        {/* Points preview */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">+{expectedPoints}P 지급 예정</span>
          <span className="text-xs text-amber-500">(텍스트 300P{instagramUrl ? ' + 인스타 500P' : ''})</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '후기 등록'}
        </Button>
      </div>
    </div>
  );
}
