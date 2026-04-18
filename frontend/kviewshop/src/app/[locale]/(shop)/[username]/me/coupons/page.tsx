'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getMyCoupons, getCouponCounts } from '@/lib/actions/coupon';
import {
  ChevronLeft, Ticket, Loader2, Tag, Calendar,
} from 'lucide-react';

export default function CouponsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const { buyer } = useUser();

  const [tab, setTab] = useState<'available' | 'used' | 'expired'>('available');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [counts, setCounts] = useState({ available: 0, used: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!buyer?.id) return;
    Promise.all([getMyCoupons(tab), getCouponCounts()])
      .then(([c, co]) => { setCoupons(c); setCounts(co); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [buyer?.id, tab]);

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    setIsLoading(true);
    getMyCoupons(t)
      .then(setCoupons)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const getDday = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `D-${diff}` : '만료';
  };

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
          <Ticket className="h-5 w-5" />
          쿠폰함
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-3">
          {([
            { key: 'available' as const, label: '사용가능', count: counts.available },
            { key: 'used' as const, label: '사용완료', count: counts.used },
            { key: 'expired' as const, label: '만료', count: counts.expired },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                tab === t.key ? 'bg-gray-900 text-white font-semibold' : 'text-gray-500'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Tag className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">쿠폰이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border-l-4 border-amber-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {c.discountType === 'PERCENT' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{c.name || '할인 쿠폰'}</p>
                    {c.minOrderAmount && (
                      <p className="text-xs text-gray-400 mt-1">{c.minOrderAmount.toLocaleString()}원 이상 구매 시</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getDday(c.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
