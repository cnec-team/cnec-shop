'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrderDetail } from '@/lib/actions/buyer';
import { requestExchange } from '@/lib/actions/exchange-refund';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronLeft, RefreshCw, Loader2, Package, Check,
} from 'lucide-react';

const REASONS = ['제품 불량', '사이즈 교환', '색상 교환', '기타'];

export default function ExchangePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const orderId = params.orderId as string;
  const { buyer } = useUser();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!buyer?.id) return;
    getBuyerOrderDetail(orderId, buyer.id)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [buyer?.id, orderId]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isValid = selectedItems.length > 0 && reason && details.length >= 10;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await requestExchange({ orderId, itemIds: selectedItems, reason, details, images: [] });
      toast.success('교환 신청이 접수되었습니다');
      router.push(`/${locale}/my/inquiries`);
    } catch (error: any) {
      toast.error(error.message || '교환 신청에 실패했습니다');
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
          <RefreshCw className="h-5 w-5" />
          교환 신청
        </h1>

        {/* Item selection */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">교환할 상품 선택</p>
          <div className="space-y-2">
            {order?.items?.map((item: any) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  selectedItems.includes(item.id) ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedItems.includes(item.id) ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                }`}>
                  {selectedItems.includes(item.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {(item.productImage || item.product?.imageUrl) ? (
                    <Image src={item.productImage || item.product?.imageUrl} alt="" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="h-3 w-3 text-gray-300" /></div>
                  )}
                </div>
                <p className="text-sm text-gray-900 text-left truncate flex-1">{item.productName || item.product?.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">교환 사유</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`h-10 rounded-xl text-sm border transition-colors ${
                  reason === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="상세 내용을 입력해주세요 (10자 이상)"
            rows={4}
            className="rounded-xl resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '교환 신청'}
        </Button>
      </div>
    </div>
  );
}
