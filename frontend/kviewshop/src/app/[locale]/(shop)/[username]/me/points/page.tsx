'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Gift, Loader2, Coins } from 'lucide-react';

export default function PointsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const { buyer } = useUser();

  const [history, setHistory] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'earn' | 'use'>('all');

  useEffect(() => {
    if (!buyer?.id) return;
    const loadData = async () => {
      try {
        const res = await fetch('/api/me/points');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
          setBalance(data.balance || 0);
        }
      } catch {}
      setIsLoading(false);
    };
    loadData();
  }, [buyer?.id]);

  const filteredHistory = history.filter((h: any) => {
    if (tab === 'earn') return h.amount > 0;
    if (tab === 'use') return h.amount < 0;
    return true;
  });

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
          href={`/${locale}/${username}/me`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          마이페이지
        </Link>

        {/* Balance card */}
        <div className="bg-white rounded-2xl p-6 mb-3 text-center">
          <Gift className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <p className="text-xs text-gray-400 mb-1">보유 포인트</p>
          <p className="text-3xl font-bold text-gray-900">{balance.toLocaleString()}<span className="text-lg">P</span></p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-3">
          {(['all', 'earn', 'use'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                tab === t ? 'bg-gray-900 text-white font-semibold' : 'text-gray-500'
              }`}
            >
              {t === 'all' ? '전체' : t === 'earn' ? '적립' : '사용'}
            </button>
          ))}
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Coins className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">내역이 없습니다</p>
            </div>
          ) : (
            filteredHistory.map((item: any, i: number) => (
              <div key={item.id || i} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{item.description || item.type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${item.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}P
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
