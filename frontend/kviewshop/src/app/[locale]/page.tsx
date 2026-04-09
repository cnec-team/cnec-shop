'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Megaphone,
  Wallet,
  Headphones,
  Package,
  BarChart3,
  Shield,
  Users,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  UserPlus,
  Target,
  Heart,
  Home,
  User,
  Star,
  Link2,
  Instagram,
  Youtube,
  Gift,
  Zap,
  Building2,
  Store,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── useInView hook ─── */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, isInView };
}

/* ─── CountUp component ─── */
function CountUp({ target, suffix = '+' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      <span style={{ color: '#2563EB' }}>{suffix}</span>
    </span>
  );
}

/* ─── Shared styles ─── */
const gradientText: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563EB, #3B82F6, #60A5FA)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const blueGradientBg: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
};

const anim = (isInView: boolean, cls: string) =>
  isInView ? cls : 'opacity-0';

/* ═══════════════════════════════════════════════════
   Landing Page
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hero = useInView();
  const stats = useInView();
  const steps = useInView();
  const products = useInView();
  const creatorSteps = useInView();
  const creators = useInView();
  const recommendedCreators = useInView();
  const brands = useInView();
  const benefits = useInView();
  const cta = useInView();

  return (
    <div className="min-h-screen bg-white">
      {/* ──── Header ──── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-5 h-16 md:h-[72px] flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold" style={gradientText}>
            CNEC
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/ko/creator/login" className="hidden sm:inline-flex">
              <Button variant="ghost" className="rounded-full px-5 text-sm font-semibold text-gray-600 hover:text-gray-900">
                크리에이터 시작하기
              </Button>
            </Link>
            <Link href="/ko/brand/login">
              <Button
                className="rounded-full px-5 text-sm font-bold text-white border-0"
                style={blueGradientBg}
              >
                브랜드 입점하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ──── Hero ──── */}
      <section ref={hero.ref} className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* BG blobs */}
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-50 to-blue-50/30 opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-50/20 to-transparent blur-2xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          {/* Left — Copy */}
          <div>
            <span
              className={`inline-flex items-center gap-2 text-sm font-semibold text-blue-600 ${anim(hero.isInView, 'animate-fade-in-up')}`}
            >
              <Sparkles className="h-4 w-4" />
              크넥샵
            </span>

            <h1
              className={`mt-4 text-[2.5rem] sm:text-5xl md:text-[3.5rem] font-black leading-[1.1] tracking-tight text-gray-900 ${anim(hero.isInView, 'animate-fade-in-up delay-100')}`}
            >
              뷰티 공동구매,
              <br />
              내 샵에서 바로 오픈
            </h1>

            <p
              className={`text-base md:text-lg text-gray-500 leading-relaxed max-w-md mt-5 ${anim(hero.isInView, 'animate-fade-in-up delay-200')}`}
            >
              한정된 기간, 파격적인 혜택. 팔로워들이 기다려온 공동구매를 가장 빠르고 트렌디하게 시작하세요.
            </p>

            <div className={`mt-9 space-y-6 ${anim(hero.isInView, 'animate-fade-in-up delay-300')}`}>
              {[
                { Icon: Store, title: '클릭한번으로 나만의 브랜드샵', desc: '자동 정산 + 실시간 수익 확인' },
                { Icon: Link2, title: '인스타 스토리 최적화 링크', desc: '클릭 한 번에 연결되는 매끄러운 구매 동선' },
                { Icon: TrendingUp, title: '구매를 자극하는 타임 딜', desc: 'D-Day 카운트다운과 품절 임박 뱃지로 전환율 극대화' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <f.Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-10 flex flex-col sm:flex-row gap-4 ${anim(hero.isInView, 'animate-fade-in-up delay-400')}`}>
              <Link href="/ko/creator/login">
                <Button
                  className="group rounded-full px-8 py-6 text-base font-bold text-white border-0 hover:shadow-lg hover:shadow-blue-200/40 transition-all duration-300"
                  style={blueGradientBg}
                >
                  크리에이터 시작하기
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/ko/brand/login">
                <Button variant="outline" className="rounded-full px-8 py-6 text-base font-semibold border-gray-200 hover:border-gray-300 hover:bg-gray-50/80">
                  브랜드 입점하기
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — Phone Mockup */}
          <div className={`relative ${anim(hero.isInView, 'animate-fade-in-right delay-300')}`}>
            <div className="relative mx-auto w-[300px] md:w-[340px]">
              <div className="rounded-[3rem] border-[6px] border-gray-900 bg-white shadow-2xl shadow-gray-900/10 overflow-hidden">
                {/* Notch */}
                <div className="relative flex justify-center">
                  <div className="w-[100px] h-[26px] bg-gray-900 rounded-b-2xl" />
                </div>

                {/* Header */}
                <div className="px-5 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-blue-600 font-semibold tracking-wider">크넥샵 공동구매</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">지나빅 뷰티 마켓</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">공구마감 D-1</span>
                    </div>
                  </div>
                </div>

                {/* Product cards */}
                <div className="px-4 pb-3 space-y-3">
                  {/* Featured product */}
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">할인특가</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <Image src="/images/creators/product_serum.jpg" alt="세럼" width={128} height={128} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400">한절기 필수 진정 앰플</p>
                        <p className="text-xs font-semibold text-gray-900 mt-0.5">센서티브 카밍 앰플 대용량 세트</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-gray-900">₩32,000</span>
                          <span className="text-[10px] text-gray-300 line-through">₩48,000</span>
                          <span className="text-[10px] font-bold text-rose-500">33%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second product */}
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">BEST</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <Image src="/images/creators/product_ampoule.jpg" alt="크림" width={128} height={128} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400">속당김 없는 깊은 보습</p>
                        <p className="text-xs font-semibold text-gray-900 mt-0.5">콜라겐 수분 크림 100ml</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-gray-900">₩28,500</span>
                          <span className="text-[10px] text-gray-300 line-through">₩42,000</span>
                          <span className="text-[10px] font-bold text-rose-500">32%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="px-5 py-2.5 border-t border-gray-100 flex justify-around">
                  {[
                    { icon: Home, label: '홈', active: true },
                    { icon: ShoppingBag, label: '상품', active: false },
                    { icon: BarChart3, label: '매출', active: false },
                    { icon: User, label: '마이', active: false },
                  ].map((tab) => (
                    <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-blue-600' : 'text-gray-300'}`}>
                      <tab.icon className="h-4 w-4" />
                      <span className="text-[9px] font-medium">{tab.label}</span>
                    </div>
                  ))}
                </div>

                {/* Home indicator */}
                <div className="flex justify-center pb-2">
                  <div className="w-[120px] h-[4px] bg-gray-900 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Stats ──── */}
      <section ref={stats.ref} className="py-16 md:py-20 bg-gray-50/80 border-y border-gray-100/50">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { target: 150, label: '등록 상품' },
              { target: 80, label: '활동 크리에이터' },
              { target: 2500, label: '총 주문' },
              { target: 30, label: '입점 브랜드' },
            ].map((s) => (
              <div key={s.label} className={anim(stats.isInView, 'animate-fade-in-up')}>
                <div className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                  <CountUp target={s.target} />
                </div>
                <p className="mt-2 text-sm md:text-base text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section ref={steps.ref} className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <p className={`text-sm font-semibold uppercase tracking-[0.15em] text-blue-600 ${anim(steps.isInView, 'animate-fade-in-up')}`}>
              HOW IT WORKS
            </p>
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.08] text-gray-900 mt-4 ${anim(steps.isInView, 'animate-fade-in-up delay-100')}`}>
              클릭 한 번으로,
              <br />
              공동구매가 시작됩니다
            </h2>
            <p className={`text-base md:text-lg text-gray-400 mt-4 max-w-2xl mx-auto ${anim(steps.isInView, 'animate-fade-in-up delay-200')}`}>
              브랜드가 상품을 등록하면, 크리에이터가 내 셀렉트샵에 추가하여 팔로워에게 직접 판매합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
            {/* BRAND Card */}
            <div className={`relative ${anim(steps.isInView, 'animate-fade-in-up delay-300')}`}>
              <div className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-500 h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                  <Building2 className="h-7 w-7 text-blue-600" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">BRAND</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">상품 등록 + 캠페인</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  상품을 등록하고 공구/상시 캠페인을 생성합니다. 크리에이터가 선택하면 판매가 시작됩니다.
                </p>
              </div>
              <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* CNEC Card — highlighted */}
            <div className={`relative ${anim(steps.isInView, 'animate-fade-in-up delay-400')}`}>
              <div className="group rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full text-white" style={blueGradientBg}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">CNEC</p>
                <h3 className="text-xl font-bold mb-4">플랫폼 운영</h3>
                <div className="space-y-3 mt-4">
                  {['결제(PG) 처리', '전환 추적', '수수료 정산', '크리에이터-브랜드 매칭'].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-200 shrink-0" />
                      <span className="text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* CREATOR Card */}
            <div className={`relative ${anim(steps.isInView, 'animate-fade-in-up delay-500')}`}>
              <div className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-500 h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                  <Store className="h-7 w-7 text-blue-600" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">CREATOR</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">셀렉트샵 운영</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  내 셀렉트샵에 상품을 추가하고 SNS로 팔로워에게 홍보하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Products Section ──── */}
      <section ref={products.ref} className="py-24 md:py-32 bg-gray-50/50">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.08] text-gray-900 ${anim(products.isInView, 'animate-fade-in-up')}`}>
              지금 공구 가능한 상품
            </h2>
            <p className={`text-base md:text-lg text-gray-400 mt-4 ${anim(products.isInView, 'animate-fade-in-up delay-100')}`}>
              브랜드가 등록한 검증된 상품을 내 셀렉트샵에 추가하세요
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { brand: '하우파파', name: '리페어 에센스 세럼', original: '48,000', price: '33,600', discount: 30, img: '/images/creators/product_serum.jpg', badgeColor: 'bg-rose-500', badge: 'BEST' },
              { brand: '누씨오', name: '비타민C 브라이트닝 앰플', original: '52,000', price: '36,400', discount: 30, img: '/images/creators/product_ampoule.jpg', badgeColor: 'bg-blue-600', badge: 'NEW' },
              { brand: '하우파파', name: '콜라겐 수분 크림', original: '45,000', price: '31,500', discount: 30, img: '/images/creators/product_cream.jpg', badgeColor: 'bg-emerald-500', badge: 'HOT' },
              { brand: '누씨오', name: '히알루론산 토너 패드', original: '38,000', price: '26,600', discount: 30, img: '/images/creators/product_toner.jpg', badgeColor: '', badge: '' },
            ].map((p, i) => (
              <div
                key={p.name}
                className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${anim(products.isInView, `animate-fade-in-up delay-${(i + 2) * 100}`)}`}
              >
                <div className="relative h-[180px] md:h-[200px] overflow-hidden rounded-t-2xl">
                  <Image src={p.img} alt={p.name} width={512} height={512} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-gray-400 font-medium">{p.brand}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{p.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-300 line-through">{p.original}원</span>
                    <span className="text-sm font-bold text-blue-600">{p.price}원</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`text-center mt-12 ${anim(products.isInView, 'animate-fade-in-up delay-700')}`}>
            <Link href="/ko/shop">
              <Button variant="outline" className="group rounded-full px-8 py-5 text-base font-semibold border-gray-200 hover:border-gray-300 hover:bg-gray-50/80">
                공구 상품 둘러보기
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Creator 4 Steps ──── */}
      <section ref={creatorSteps.ref} className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.08] text-gray-900 ${anim(creatorSteps.isInView, 'animate-fade-in-up')}`}>
              크리에이터 4단계
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { num: '01', Icon: ClipboardCheck, title: '상품 선택', desc: '마음에 드는 상품을 골라 내 셀렉트샵에 추가' },
              { num: '02', Icon: Gift, title: '샘플 체험', desc: '써보고 싶은 제품은 체험 신청. 브랜드가 샘플을 보내드려요' },
              { num: '03', Icon: Megaphone, title: 'SNS 홍보', desc: '내 샵 링크를 공유하고 팔로워에게 직접 판매' },
              { num: '04', Icon: Wallet, title: '자동 정산', desc: '판매 수수료가 매월 자동으로 정산됩니다' },
            ].map((card, i) => (
              <div
                key={card.num}
                className={`group bg-white rounded-3xl border border-gray-100 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-500 relative overflow-hidden ${anim(creatorSteps.isInView, `animate-fade-in-up delay-${(i + 2) * 100}`)}`}
              >
                <span className="absolute top-4 right-4 text-[4rem] font-black text-gray-50 group-hover:text-blue-50 transition-colors duration-500 leading-none select-none">
                  {card.num}
                </span>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                    <card.Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── For Creators ──── */}
      <section ref={creators.ref} className="py-24 md:py-32 bg-gray-50/30">
        <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Phone Mockup */}
          <div className={`relative max-w-[340px] mx-auto lg:mx-0 ${anim(creators.isInView, 'animate-fade-in-left')}`}>
            <div className="rounded-[3rem] border-[6px] border-gray-900 bg-white shadow-2xl shadow-gray-900/10 overflow-hidden">
              {/* Notch */}
              <div className="relative flex justify-center">
                <div className="w-[100px] h-[26px] bg-gray-900 rounded-b-2xl" />
              </div>

              {/* Phone content */}
              <div className="px-5 pt-4 pb-3">
                {/* Header */}
                <p className="text-[10px] text-gray-400 tracking-wider">MY SELECT SHOP</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-lg font-bold text-gray-900">뷰티 크리에이터 샵</p>
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-white fill-white" />
                  </div>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { img: '/images/creators/product_serum.jpg', name: '글로우 세럼', price: '₩38,000', badge: 'BEST', badgeColor: 'bg-blue-600' },
                    { img: '/images/creators/product_ampoule.jpg', name: '톤업 크림', price: '₩29,000', badge: 'NEW', badgeColor: 'bg-gray-900' },
                    { img: '/images/creators/product_cream.jpg', name: '립 틴트', price: '₩18,000', badge: 'HOT', badgeColor: 'bg-rose-500' },
                    { img: '/images/creators/product_toner.jpg', name: '클렌징 오일', price: '₩25,000', badge: '', badgeColor: '' },
                  ].map((p) => (
                    <div key={p.name}>
                      <div className="relative rounded-xl overflow-hidden bg-gray-50 aspect-square">
                        <Image src={p.img} alt={p.name} width={256} height={256} className="w-full h-full object-cover" />
                        {p.badge && (
                          <span className={`absolute top-2 left-2 ${p.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-2">{p.name}</p>
                      <p className="text-sm font-bold text-blue-600">{p.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom nav */}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-around">
                {[
                  { icon: Home, label: '홈', active: true },
                  { icon: ShoppingBag, label: '상품', active: false },
                  { icon: BarChart3, label: '매출', active: false },
                  { icon: User, label: '마이', active: false },
                ].map((tab) => (
                  <div key={tab.label} className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-blue-600' : 'text-gray-300'}`}>
                    <tab.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </div>
                ))}
              </div>

              {/* VIP 누적 판매액 */}
              <div className="mx-4 mb-3 rounded-2xl bg-gray-900 px-4 py-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">VIP 누적 판매액</p>
                  <p className="text-lg font-black text-white">₩12,450,000</p>
                </div>
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pb-2">
                <div className="w-[120px] h-[4px] bg-gray-900 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right — Text */}
          <div className={anim(creators.isInView, 'animate-fade-in-right delay-200')}>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-600">
              <Sparkles className="h-4 w-4" />
              크리에이터
            </span>

            <h2 className="text-3xl md:text-[2.75rem] font-black tracking-tight leading-tight mt-6 text-gray-900">
              팔로워들을 위한
              <br />
              프라이빗 뷰티 라운지
            </h2>

            <p className="text-base md:text-lg text-gray-500 leading-relaxed mt-5 max-w-md">
              크리에이터의 안목으로 엄선한 프리미엄 뷰티 브랜드.
              <br />
              오직 내 팔로워에게만 허락된 시크릿 특가를 오픈하세요.
            </p>

            <div className="mt-10 space-y-7">
              {[
                { Icon: ShoppingBag, title: '상품을 골라 내 샵에 추가', desc: '브랜드 상품을 검색하고 마음에 드는 상품을 내 셀렉트샵에 추가하세요' },
                { Icon: Gift, title: '써보고 공구 결정', desc: '체험 신청하면 브랜드가 샘플을 보내드려요. 직접 써보고 마음에 드는 제품만 공구하세요' },
                { Icon: Megaphone, title: 'SNS에 내 샵 링크 공유', desc: '인스타, 유튜브, 틱톡에 내 셀렉트샵 링크를 공유하고 팔로워에게 직접 판매하세요' },
                { Icon: Wallet, title: '판매 수수료 자동 정산', desc: '직접 전환 + 간접 전환(3%), 매월 20일 자동 정산됩니다' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <f.Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/ko/creator/login" className="inline-block mt-10">
              <Button
                className="group rounded-full px-8 py-6 text-base font-bold text-white border-0 hover:shadow-lg hover:shadow-blue-200/40 transition-all duration-300"
                style={blueGradientBg}
              >
                크리에이터 시작하기
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Recommended Creators ──── */}
      <section ref={recommendedCreators.ref} className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">
            <p className={`text-sm font-semibold uppercase tracking-[0.15em] text-blue-600 ${anim(recommendedCreators.isInView, 'animate-fade-in-up')}`}>
              CREATORS
            </p>
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.08] text-gray-900 mt-4 ${anim(recommendedCreators.isInView, 'animate-fade-in-up delay-100')}`}>
              추천 크리에이터
            </h2>
            <p className={`text-base md:text-lg text-gray-400 mt-4 ${anim(recommendedCreators.isInView, 'animate-fade-in-up delay-200')}`}>
              검증된 뷰티 크리에이터들의 셀렉트샵을 만나보세요
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { img: '/images/creators/sua.jpg', name: '수아뷰티', handle: '@sua_beauty', category: '스킨케어', followers: '45.2K', color: 'from-rose-400 to-pink-500', products: 12, sales: '1,847' },
              { img: '/images/creators/mini.jpg', name: '미니뷰티랩', handle: '@mini_beautylab', category: '메이크업', followers: '32.1K', color: 'from-violet-400 to-purple-500', products: 8, sales: '1,203' },
              { img: '/images/creators/jskin.jpg', name: '제이스킨', handle: '@j_skin_official', category: '더마', followers: '28.7K', color: 'from-blue-400 to-indigo-500', products: 15, sales: '2,156' },
              { img: '/images/creators/hyerin.jpg', name: '혜린픽', handle: '@hyerin_pick', category: '클린뷰티', followers: '19.5K', color: 'from-emerald-400 to-teal-500', products: 6, sales: '892' },
            ].map((c, i) => (
              <div
                key={c.handle}
                className={`group bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${anim(recommendedCreators.isInView, `animate-fade-in-up delay-${(i + 3) * 100}`)}`}
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${c.color} overflow-hidden mx-auto mb-4 ring-2 ring-gray-100`}>
                  <Image src={c.img} alt={c.name} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{c.handle}</p>
                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                  {c.category}
                </span>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.followers}</p>
                    <p className="text-[10px] text-gray-400">팔로워</p>
                  </div>
                  <div className="border-x border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{c.products}개</p>
                    <p className="text-[10px] text-gray-400">상품</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-600">{c.sales}</p>
                    <p className="text-[10px] text-gray-400">판매량</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── For Brands ──── */}
      <section ref={brands.ref} className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div className={anim(brands.isInView, 'animate-fade-in-left')}>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              브랜드
            </span>

            <h2 className="text-3xl md:text-[2.75rem] font-black tracking-tight leading-tight mt-6 text-gray-900">
              크리에이터가
              <br />
              내 브랜드를 팝니다
            </h2>
            <p className="text-lg text-gray-500 mt-4">사용료 0원. 팔린 만큼만 수수료.</p>

            <div className="mt-10 space-y-6">
              {[
                { Icon: Target, title: '타겟 고객 확보', desc: 'K-뷰티에 관심 있는 크리에이터의 팔로워에게 자연스럽게 도달' },
                { Icon: BarChart3, title: '브랜드 노출 증대', desc: '크리에이터 셀렉트샵을 통해 상시 노출' },
                { Icon: Users, title: '검증된 크리에이터 매칭', desc: '클린스코어로 검증된 크리에이터만 활동' },
                { Icon: Shield, title: '효율적인 판매 관리', desc: '주문, 배송, 정산 모두 크넥이 처리' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <f.Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/ko/brand/login" className="inline-block mt-10">
              <Button variant="outline" className="group rounded-full px-8 py-6 text-base font-semibold border-gray-300 hover:border-gray-400 hover:bg-gray-50/80">
                브랜드 입점하기
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right — Dashboard Card */}
          <div className={`max-w-[480px] mx-auto lg:mx-0 lg:ml-auto ${anim(brands.isInView, 'animate-fade-in-right delay-200')}`}>
            <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-gray-100/40 border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">브랜드 대시보드</h3>
                <span className="text-sm text-gray-400">2026.04.09</span>
              </div>

              <div className="bg-blue-50 rounded-2xl p-5 mt-4">
                <p className="text-sm text-blue-600 font-medium">이번 달 매출</p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-3xl font-black text-gray-900">₩12,450,000</span>
                  <span className="flex items-center gap-1 text-sm text-emerald-500 font-semibold mb-1">
                    <TrendingUp className="h-4 w-4" />
                    +23.5%
                  </span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end gap-2 h-[80px] mt-4 px-1">
                {[30, 45, 35, 55, 40, 65, 70].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-md ${i === 6 ? 'bg-blue-600' : 'bg-blue-200'}`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: '활성 크리에이터', value: '24명' },
                  { label: '진행 중 캠페인', value: '3개' },
                  { label: '총 주문', value: '847건' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-base font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Benefits ──── */}
      <section ref={benefits.ref} className="py-24 md:py-32 bg-gray-50/30">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <p className={`text-sm font-semibold uppercase tracking-[0.15em] text-blue-600 ${anim(benefits.isInView, 'animate-fade-in-up')}`}>
              BENEFITS
            </p>
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.08] text-gray-900 mt-4 ${anim(benefits.isInView, 'animate-fade-in-up delay-100')}`}>
              크넥이 다 해드립니다
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { Icon: Headphones, title: '전문 CS 지원', desc: '고객 응대는 전담 CS 팀이 담당합니다.' },
              { Icon: Package, title: '통합 배송 관리', desc: '복잡한 배송 과정을 크넥이 해결합니다.' },
              { Icon: Wallet, title: '자동 정산 시스템', desc: '투명하고 빠른 정산으로 걱정 없습니다.' },
              { Icon: Shield, title: '엄선된 브랜드', desc: '검증된 프리미엄 브랜드만 입점합니다.' },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${anim(benefits.isInView, `animate-fade-in-up delay-${(i + 3) * 100}`)}`}
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <card.Icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section ref={cta.ref} className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #3B82F6 100%)' }}>
        {/* Decorative circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="relative py-24 md:py-32 text-center">
          <span className={`inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-white/80 ${anim(cta.isInView, 'animate-fade-in-up')}`}>
            <Sparkles className="h-4 w-4" />
            지금 바로 시작하세요
          </span>

          <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black text-white mt-8 leading-tight ${anim(cta.isInView, 'animate-fade-in-up delay-100')}`}>
            나만의 뷰티 셀렉트샵을
            <br />
            오늘 만들어보세요
          </h2>

          <p className={`text-white/60 text-base md:text-lg mt-6 max-w-xl mx-auto leading-relaxed ${anim(cta.isInView, 'animate-fade-in-up delay-200')}`}>
            좋아하는 브랜드 상품을 팔로워에게 직접 판매하고,
            <br className="hidden sm:block" />
            매월 자동으로 수익을 정산 받으세요.
          </p>

          <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center ${anim(cta.isInView, 'animate-fade-in-up delay-300')}`}>
            <Link href="/ko/creator/login">
              <Button className="group bg-white text-blue-600 hover:bg-blue-50 rounded-full px-8 py-5 text-base font-bold shadow-lg shadow-blue-900/20 border-0">
                크리에이터 시작하기
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/ko/brand/login">
              <Button className="border border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-5 text-base font-semibold bg-transparent">
                브랜드 입점하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="py-16 border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Logo + tagline */}
            <div>
              <span className="text-xl font-bold" style={gradientText}>CNEC</span>
              <p className="text-sm text-gray-400 mt-2">K-뷰티 크리에이터 셀렉트샵 플랫폼</p>
            </div>

            {/* 서비스 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">서비스</h4>
              <div className="space-y-3">
                <Link href="/ko/creator/login" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  크리에이터 시작하기
                </Link>
                <Link href="/ko/brand/login" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  브랜드 입점하기
                </Link>
              </div>
            </div>

            {/* 고객지원 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">고객지원</h4>
              <div className="space-y-3">
                <span className="block text-sm text-gray-400">자주 묻는 질문</span>
                <span className="block text-sm text-gray-400">문의하기</span>
              </div>
            </div>

            {/* 법적 고지 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">법적 고지</h4>
              <div className="space-y-3">
                <span className="block text-sm text-gray-400">이용약관</span>
                <span className="block text-sm text-gray-400">개인정보처리방침</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-300">
              &copy; 2026 CNEC. All rights reserved.
            </p>
            <p className="text-sm text-gray-300 mt-1">
              (주)하우파파 | 대표: 박현용 | 사업자등록번호: 575-81-02253
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
