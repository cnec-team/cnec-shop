'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrderDetail } from '@/lib/actions/buyer';
import { requestRefund } from '@/lib/actions/exchange-refund';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronLeft, RotateCcw, Loader2, Package, Check,
} from 'lucide-react';

const REASONS = ['단순 변심', '제품 불량', '오배송', '기타'];
const BANKS = ['국민', '신한', '하나', '우리', '농협', 'IBK기업', 'SC제일', '카카오뱅크', '토스뱅크'];

export default function RefundPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;
  const orderId = params.orderId as string;
  const { buyer } = useUser();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [refundBank, setRefundBank] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundHolder, setRefundHolder] = useState('');
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

  const estimatedRefund = (() => {
    if (!order) return 0;
    if (refundType === 'FULL') return Number(order.totalAmount);
    const selected = (order.items || []).filter((i: any) => selectedItems.includes(i.id));
    return selected.reduce((s: number, i: any) => s + Number(i.totalPrice), 0);
  })();

  const isValid = reason && details.length >= 10 && (refundType === 'FULL' || selectedItems.length > 0);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const itemIds = refundType === 'FULL'
        ? (order?.items || []).map((i: any) => i.id)
        : selectedItems;
      await requestRefund({
        orderId, itemIds, refundType, reason, details, images: [],
        refundBank: refundBank || undefined,
        refundAccount: refundAccount || undefined,
        refundHolder: refundHolder || undefined,
      });
      toast.success('환불 신청이 접수되었습니다');
      router.push(`/${locale}/${username}/me/inquiries`);
    } catch (error: any) {
      toast.error(error.message || '환불 신청에 실패했습니다');
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
          href={`/${locale}/${username}/me/orders/${orderId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          주문 상세
        </Link>

        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <RotateCcw className="h-5 w-5" />
          환불 신청
        </h1>

        {/* Refund type */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">환불 유형</p>
          <div className="flex gap-2">
            {(['FULL', 'PARTIAL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRefundType(t)}
                className={`flex-1 h-11 rounded-xl text-sm border transition-colors ${
                  refundType === t ? 'border-gray-900 bg-gray-900 text-white font-semibold' : 'border-gray-200 text-gray-600'
                }`}
              >
                {t === 'FULL' ? '전체 환불' : '부분 환불'}
              </button>
            ))}
          </div>
        </div>

        {/* Item selection (partial) */}
        {refundType === 'PARTIAL' && (
          <div className="bg-white rounded-2xl p-5 mb-3">
            <p className="text-sm font-semibold text-gray-700 mb-3">환불할 상품 선택</p>
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
                  <span className="text-sm text-gray-500">{Number(item.totalPrice).toLocaleString()}원</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">환불 사유</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)} className={`h-10 rounded-xl text-sm border transition-colors ${
                reason === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600'
              }`}>{r}</button>
            ))}
          </div>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="상세 내용 (10자 이상)" rows={4} className="rounded-xl resize-none" />
        </div>

        {/* Bank */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">환불 계좌 (선택)</p>
          <div className="space-y-3">
            <select value={refundBank} onChange={(e) => setRefundBank(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm">
              <option value="">은행 선택</option>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <Input value={refundAccount} onChange={(e) => setRefundAccount(e.target.value)} placeholder="계좌번호" className="h-11 rounded-xl" />
            <Input value={refundHolder} onChange={(e) => setRefundHolder(e.target.value)} placeholder="예금주" className="h-11 rounded-xl" />
          </div>
        </div>

        {/* Estimate */}
        <div className="bg-gray-100 rounded-2xl p-4 mb-3 text-sm">
          <div className="flex justify-between font-semibold">
            <span>예상 환불금액</span>
            <span>{estimatedRefund.toLocaleString()}원</span>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '환불 신청'}
        </Button>
      </div>
    </div>
  );
}
