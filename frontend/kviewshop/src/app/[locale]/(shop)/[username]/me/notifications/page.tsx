'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { ChevronLeft, Bell, Loader2 } from 'lucide-react';

interface Settings {
  kakaoOrder: boolean;
  kakaoShipping: boolean;
  kakaoDeliver: boolean;
  kakaoGonggu: boolean;
  emailOrder: boolean;
  emailShipping: boolean;
  emailDeliver: boolean;
  emailGonggu: boolean;
}

const DEFAULT: Settings = {
  kakaoOrder: true, kakaoShipping: true, kakaoDeliver: true, kakaoGonggu: true,
  emailOrder: true, emailShipping: true, emailDeliver: true, emailGonggu: true,
};

const LABELS: Record<string, string> = {
  kakaoOrder: '주문 알림',
  kakaoShipping: '배송 알림',
  kakaoDeliver: '배달완료 알림',
  kakaoGonggu: '공구 알림',
  emailOrder: '주문 알림',
  emailShipping: '배송 알림',
  emailDeliver: '배달완료 알림',
  emailGonggu: '공구 알림',
};

export default function NotificationsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const { buyer } = useUser();

  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!buyer?.id) return;
    fetch('/api/me/notification-settings')
      .then(r => r.json())
      .then(data => { if (data) setSettings({ ...DEFAULT, ...data }); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [buyer?.id]);

  const debounceRef = useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (updated: Settings) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetch('/api/me/notification-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {});
      }, 300);
    };
  }, [])();

  const toggle = (key: keyof Settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    debounceRef(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const renderToggle = (key: keyof Settings) => (
    <div key={key} className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{LABELS[key]}</span>
      <button
        onClick={() => toggle(key)}
        className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-gray-900' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings[key] ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
          style={{ transform: settings[key] ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );

  const kakaoKeys: (keyof Settings)[] = ['kakaoOrder', 'kakaoShipping', 'kakaoDeliver', 'kakaoGonggu'];
  const emailKeys: (keyof Settings)[] = ['emailOrder', 'emailShipping', 'emailDeliver', 'emailGonggu'];

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
          <Bell className="h-5 w-5" />
          알림 설정
        </h1>

        <div className="bg-white rounded-2xl p-5 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">카카오톡 알림</h2>
          <div className="divide-y divide-gray-50">
            {kakaoKeys.map(renderToggle)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">이메일 알림</h2>
          <div className="divide-y divide-gray-50">
            {emailKeys.map(renderToggle)}
          </div>
        </div>

        <div className="bg-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400">푸시 알림은 준비 중입니다</p>
        </div>
      </div>
    </div>
  );
}
