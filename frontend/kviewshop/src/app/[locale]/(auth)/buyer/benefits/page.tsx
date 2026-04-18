'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/shop/legal-footer';
import {
  Gift, Bell, Heart, Sparkles, Zap, Award, MessageCircle, ShoppingBag,
} from 'lucide-react';

const benefits = [
  {
    icon: Gift,
    title: '가입 즉시 3,000 포인트',
    desc: '첫 주문에 바로 사용 가능',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Bell,
    title: '주문 추적 자동',
    desc: '결제부터 배송까지 실시간 알림',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Heart,
    title: '찜 영구 저장',
    desc: '마음에 드는 상품을 놓치지 마세요',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: Sparkles,
    title: '새 공구 푸시 알림',
    desc: '크리에이터 신규 공구 소식을 가장 먼저',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Zap,
    title: '다음 결제 30초',
    desc: '배송지/결제 정보 저장으로 빠른 결제',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: Award,
    title: '등급별 혜택',
    desc: '구매 횟수에 따라 등급 UP + 추가 포인트',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: MessageCircle,
    title: '1:1 문의 통합 관리',
    desc: '주문/배송 문의를 한 곳에서',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
];

export default function BenefitsPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 py-8 px-4">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href={`/${locale}`} className="inline-block mb-3">
              <span className="font-headline text-3xl font-bold text-gold-gradient">
                CNEC Shop
              </span>
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">크넥샵 회원 7가지 혜택</h1>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="space-y-3 mb-8">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4 shadow-sm"
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg ${b.bg} flex items-center justify-center`}>
                  <b.icon className={`h-5 w-5 ${b.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link href={`/${locale}/buyer/signup`}>
            <Button className="w-full h-12 rounded-xl text-base font-semibold btn-gold">
              지금 가입하기
            </Button>
          </Link>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">이미 회원이신가요? </span>
            <Link
              href={`/${locale}/buyer/login`}
              className="text-sm font-medium text-primary hover:underline"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
