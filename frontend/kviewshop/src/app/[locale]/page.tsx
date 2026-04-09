'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ShoppingBag,
  Megaphone,
  Wallet,
  Headphones,
  Truck,
  BadgeCheck,
  ArrowRight,
  ChevronDown,
  Globe,
  Package,
  Store,
  BarChart3,
  Shield,
  Users,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/shop/legal-footer';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { getPlatformStats } from '@/lib/actions/admin';

/* ─── Animation Variants ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ─── Animated Counter Component ─── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HomePage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('home');
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [platformStats, setPlatformStats] = useState<{ products: number; creators: number; brands: number; orders: number } | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getPlatformStats()
      .then(setPlatformStats)
      .catch(() => {});
  }, []);

  function switchLocale(newLocale: Locale) {
    setLangOpen(false);
    router.push(`/${newLocale}`);
  }

  const steps = [
    { icon: ShoppingBag, title: t('step1Title'), desc: t('step1Desc'), num: '01' },
    { icon: Megaphone, title: t('step2Title'), desc: t('step2Desc'), num: '02' },
    { icon: Wallet, title: t('step3Title'), desc: t('step3Desc'), num: '03' },
  ];

  const benefits = [
    { icon: Headphones, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: Truck, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: Wallet, title: t('benefit3Title'), desc: t('benefit3Desc') },
    { icon: BadgeCheck, title: t('benefit4Title'), desc: t('benefit4Desc') },
  ];

  const stats = platformStats
    ? [
        { value: String(platformStats.products), label: t('stats.products') },
        { value: String(platformStats.creators), label: t('stats.creators') },
        { value: String(platformStats.orders), label: t('stats.orders') },
        { value: String(platformStats.brands), label: t('stats.brands') },
      ]
    : null;

  const forCreators = [
    { icon: ShoppingBag, title: t('forCreator1Title'), desc: t('forCreator1Desc') },
    { icon: Megaphone, title: t('forCreator2Title'), desc: t('forCreator2Desc') },
    { icon: Wallet, title: t('forCreator3Title'), desc: t('forCreator3Desc') },
  ];

  const forBrands = [
    { icon: Store, title: t('forBrand1Title'), desc: t('forBrand1Desc') },
    { icon: Users, title: t('forBrand2Title'), desc: t('forBrand2Desc') },
    { icon: BarChart3, title: t('forBrand3Title'), desc: t('forBrand3Desc') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══════════════════════════════════════════
          Header — Glassmorphism Sticky Nav
          ═══════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/40">
        <div className="mx-auto flex h-16 items-center justify-between px-6 max-w-[1200px]">
          <Link href={`/${locale}`} className="text-xl font-extrabold tracking-tight text-gold-gradient">
            CNEC
          </Link>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{localeNames[locale as Locale] || locale}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-border bg-card shadow-xl py-2 z-50"
                >
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-secondary ${
                        l === locale ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {localeNames[l]}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            <Link href={`/${locale}/creator/login`}>
              <Button variant="ghost" size="sm" className="rounded-full text-sm font-medium">
                {t('creatorCta')}
              </Button>
            </Link>
            <Link href={`/${locale}/brand/login`}>
              <Button size="sm" className="rounded-full text-sm font-semibold btn-gold px-5">
                {t('brandCta')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          Hero Section — Large Typography + Parallax
          ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px] glow-pulse" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#6366F1]/[0.04] blur-[100px] glow-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[80px] glow-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 mx-auto max-w-[1200px] px-6 pt-24 pb-20"
        >
          <motion.div
            className="mx-auto max-w-[800px] text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-primary/[0.06] px-5 py-2 text-[13px] font-medium text-primary mb-10"
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('badge')}
            </motion.div>

            {/* Main Title */}
            <motion.h1
              className="font-headline text-[44px] leading-[1.15] font-extrabold tracking-tight md:text-[64px] lg:text-[72px]"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('title').split('\n').map((line: string, i: number) => (
                <span key={i}>
                  {i === 1 ? (
                    <>
                      <span className="gradient-text">{line.split(',')[0]?.replace(/크넥/, '크넥')}</span>
                      {line.includes('크넥') ? (
                        <>
                          <span className="gradient-text">크넥</span>
                          <span>{line.split('크넥')[1]}</span>
                        </>
                      ) : (
                        line
                      )}
                    </>
                  ) : (
                    line
                  )}
                  {i === 0 && <br />}
                </span>
              ))}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-7 text-[17px] text-muted-foreground md:text-[19px] leading-[1.7] whitespace-pre-line max-w-[540px] mx-auto"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/${locale}/creator/login`}>
                <Button size="lg" className="btn-gold w-full sm:w-auto text-[15px] px-8 py-6 rounded-2xl">
                  {t('creatorCta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/${locale}/brand/login`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-[15px] px-8 py-6 rounded-2xl border-border/60 hover:bg-secondary transition-all duration-300">
                  {t('brandCta')}
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="mt-10 flex items-center justify-center gap-6 text-[13px] text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                무료 시작
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                자동 정산
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                배송 걱정 없음
              </span>
            </motion.div>

            {/* Login Link */}
            <motion.p
              className="mt-6 text-[13px] text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/${locale}/buyer/login`}
                className="hover:text-foreground transition-colors underline underline-offset-4 decoration-border"
              >
                {t('loginLink')}
              </Link>
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-border/40 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1 h-2 rounded-full bg-muted-foreground/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          Stats — Animated Counters
          ═══════════════════════════════════════════ */}
      {stats && stats.some((s) => Number(s.value) > 0) && (
        <section className="relative">
          <div className="section-divider" />
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerFast}
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  variants={fadeInUp}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[40px] md:text-[48px] font-extrabold tracking-tight text-foreground">
                    <AnimatedNumber value={Number(stat.value)} />
                  </p>
                  <p className="mt-2 text-[14px] text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="section-divider" />
        </section>
      )}

      {/* ═══════════════════════════════════════════
          How It Works — Flow Visualization
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-headline text-[32px] font-extrabold md:text-[44px] tracking-tight">{t('howItWorks')}</h2>
            <p className="mt-5 text-muted-foreground text-[16px] md:text-[17px] max-w-[560px] mx-auto leading-relaxed">
              {t('howItWorksDesc')}
            </p>
          </motion.div>

          {/* Flow: Brand → CNEC → Creator */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-[960px] mx-auto items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {/* Brand Side */}
            <motion.div
              className="relative rounded-3xl bg-secondary/50 p-8 text-center group hover:bg-secondary/80 transition-all duration-300"
              variants={fadeInScale}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366F1]/10 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-7 w-7 text-[#6366F1]" />
              </div>
              <span className="inline-block rounded-full bg-[#6366F1]/10 px-3 py-1 text-[11px] font-semibold text-[#6366F1] uppercase tracking-wider mb-4">
                {t('brandLabel')}
              </span>
              <h3 className="text-[18px] font-bold mb-2 tracking-tight">
                {t('brandFlowTitle')}
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {t('brandFlowDesc')}
              </p>
              {/* Arrow */}
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </motion.div>

            {/* Center - CNEC */}
            <motion.div
              className="relative rounded-3xl border-2 border-primary/20 bg-primary/[0.03] p-8 text-center"
              variants={fadeInScale}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary uppercase tracking-wider mb-4">
                CNEC
              </span>
              <h3 className="text-[18px] font-bold mb-4 tracking-tight">
                {t('kviewshopFlowTitle')}
              </h3>
              <div className="space-y-2.5 text-[13px] text-muted-foreground">
                {[t('kviewshopFlowCS'), t('kviewshopFlowShipping'), t('kviewshopFlowSettlement'), t('kviewshopFlowReturns')].map((item) => (
                  <div key={item} className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {/* Arrow */}
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </motion.div>

            {/* Creator Side */}
            <motion.div
              className="rounded-3xl bg-secondary/50 p-8 text-center group hover:bg-secondary/80 transition-all duration-300"
              variants={fadeInScale}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                <Megaphone className="h-7 w-7 text-primary" />
              </div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary uppercase tracking-wider mb-4">
                {t('creatorLabel')}
              </span>
              <h3 className="text-[18px] font-bold mb-2 tracking-tight">
                {t('creatorFlowTitle')}
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {t('creatorFlowDesc')}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3-Step Process — Premium Cards
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36 bg-secondary/30">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-headline text-[32px] font-extrabold md:text-[44px] tracking-tight">
              {t('creatorStepsTitle')}
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-[960px] mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative rounded-3xl bg-card border border-border/50 p-8 group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.04] transition-all duration-300"
                variants={fadeInUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Step Number */}
                <span className="absolute top-7 right-8 text-[56px] font-extrabold text-secondary/80 leading-none select-none">
                  {step.num}
                </span>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] group-hover:bg-primary/10 transition-colors duration-300">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-[20px] font-bold mb-3 tracking-tight">{step.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-[1.7]">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          Featured Products — Skeleton Preview
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-headline text-[32px] font-extrabold md:text-[44px] tracking-tight">{t('featuredProducts')}</h2>
            <p className="mt-5 text-muted-foreground text-[16px] md:text-[17px] max-w-[560px] mx-auto leading-relaxed">{t('featuredProductsDesc')}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[960px] mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerFast}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden group hover:shadow-lg hover:border-border transition-all duration-300"
                variants={fadeInUp}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="aspect-square bg-secondary animate-shimmer" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-3/4 rounded-lg bg-secondary animate-shimmer" />
                  <div className="h-3 w-1/2 rounded-lg bg-secondary animate-shimmer" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href={`/${locale}/creator/login`}>
              <Button variant="outline" size="lg" className="rounded-2xl text-[15px] px-8 py-6 border-border/60 hover:bg-secondary transition-all duration-300">
                {t('browseProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          For Creators / For Brands — Split Layout
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36 bg-secondary/30">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid lg:grid-cols-2 gap-16 max-w-[1080px] mx-auto">
            {/* For Creators */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-4 py-1.5 text-[12px] font-semibold text-primary mb-6">
                  <Zap className="h-3 w-3" />
                  {t('forCreatorsLabel')}
                </span>
                <h3 className="font-headline text-[28px] font-extrabold md:text-[36px] mb-10 tracking-tight leading-tight">
                  {t('forCreatorsTitle')}
                </h3>
              </motion.div>
              <div className="space-y-7">
                {forCreators.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-5 group"
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.06] group-hover:bg-primary/10 transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold mb-1.5 tracking-tight">{item.title}</h4>
                      <p className="text-[14px] text-muted-foreground leading-[1.7]">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="mt-10">
                <Link href={`/${locale}/creator/login`}>
                  <Button size="lg" className="btn-gold rounded-2xl text-[15px] px-8 py-6">
                    {t('creatorCta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* For Brands */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/[0.06] px-4 py-1.5 text-[12px] font-semibold text-[#6366F1] mb-6">
                  <TrendingUp className="h-3 w-3" />
                  {t('forBrandsLabel')}
                </span>
                <h3 className="font-headline text-[28px] font-extrabold md:text-[36px] mb-10 tracking-tight leading-tight">
                  {t('forBrandsTitle')}
                </h3>
              </motion.div>
              <div className="space-y-7">
                {forBrands.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-5 group"
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366F1]/[0.06] group-hover:bg-[#6366F1]/10 transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-[#6366F1]" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold mb-1.5 tracking-tight">{item.title}</h4>
                      <p className="text-[14px] text-muted-foreground leading-[1.7]">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="mt-10">
                <Link href={`/${locale}/brand/login`}>
                  <Button variant="outline" size="lg" className="rounded-2xl text-[15px] px-8 py-6 border-border/60 hover:bg-secondary transition-all duration-300">
                    {t('brandCta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          Benefits — Icon Grid
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-headline text-[32px] font-extrabold md:text-[44px] tracking-tight">{t('whyKviewshop')}</h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1080px] mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerFast}
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                className="rounded-3xl bg-card border border-border/50 p-7 text-center group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.03] transition-all duration-300"
                variants={fadeInUp}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-[17px] font-bold mb-2 tracking-tight">{benefit.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-[1.7]">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          Global Reach — Minimal Banner
          ═══════════════════════════════════════════ */}
      <section className="bg-secondary/30">
        <div className="section-divider" />
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.06]">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold tracking-tight">
                {t('globalReachTitle')}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-[15px] leading-relaxed max-w-[600px]">
                {t('globalReachDesc')}
              </p>
            </div>
          </motion.div>
        </div>
        <div className="section-divider" />
      </section>

      {/* ═══════════════════════════════════════════
          Final CTA — Full-width Impact
          ═══════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
        </div>

        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            className="mx-auto max-w-[640px] text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.h2
              className="font-headline text-[36px] font-extrabold md:text-[52px] tracking-tight leading-[1.15]"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('ctaTitle')}
            </motion.h2>
            <motion.p
              className="mt-6 text-[17px] text-muted-foreground leading-relaxed max-w-[480px] mx-auto"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('ctaDesc')}
            </motion.p>
            <motion.div
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/${locale}/creator/login`}>
                <Button size="lg" className="btn-gold w-full sm:w-auto text-[15px] px-10 py-7 rounded-2xl">
                  {t('creatorCta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/brand/login`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-[15px] px-10 py-7 rounded-2xl border-border/60 hover:bg-secondary transition-all duration-300">
                  {t('brandCta')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
