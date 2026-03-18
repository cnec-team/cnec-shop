'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Megaphone,
  Wallet,
  Headphones,
  Truck,
  BadgeCheck,
  ArrowRight,
  ChevronRight,
  Globe,
  Package,
  Store,
  BarChart3,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/shop/legal-footer';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { getPlatformStats } from '@/lib/actions/admin';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function HomePage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('home');
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [platformStats, setPlatformStats] = useState<{ products: number; creators: number; brands: number; orders: number } | null>(null);
  const langRef = useRef<HTMLDivElement>(null);

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
    { icon: ShoppingBag, title: t('step1Title'), desc: t('step1Desc') },
    { icon: Megaphone, title: t('step2Title'), desc: t('step2Desc') },
    { icon: Wallet, title: t('step3Title'), desc: t('step3Desc') },
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="font-headline text-xl font-bold text-gold-gradient">
            CNEC
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{localeNames[locale as Locale] || locale}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg py-1 z-50">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                        l === locale ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {localeNames[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href={`/${locale}/creator/login`}>
              <Button variant="ghost" size="sm">
                {t('creatorCta')}
              </Button>
            </Link>
            <Link href={`/${locale}/brand/login`}>
              <Button variant="outline" size="sm">
                {t('brandCta')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-3.5 w-3.5" />
              {t('badge')}
            </motion.div>

            <motion.h1
              className="font-headline text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('title')}
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-muted-foreground md:text-xl whitespace-pre-line leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Link href={`/${locale}/creator/login`}>
                <Button size="lg" className="btn-gold w-full sm:w-auto text-base px-8 py-6">
                  {t('creatorCta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/brand/login`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                  {t('brandCta')}
                </Button>
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 text-sm text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Link
                href={`/${locale}/buyer/login`}
                className="hover:text-foreground transition-colors underline underline-offset-4"
              >
                {t('loginLink')}
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      {stats && stats.some((s) => Number(s.value) > 0) && (
        <section className="border-y border-border/50 bg-card/50">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
            >
              {stats.map((stat) => (
                <motion.div key={stat.label} className="text-center" variants={fadeInUp} transition={{ duration: 0.4 }}>
                  <p className="stat-value text-3xl md:text-4xl text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* How It Works - Flow Visualization */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('howItWorks')}</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorksDesc')}
            </p>
          </motion.div>

          {/* Flow: Brand → CNEC Shop → Creator */}
          <motion.div
            className="mt-16 grid md:grid-cols-3 gap-4 md:gap-0 max-w-5xl mx-auto items-start"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {/* Brand Side */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-8 text-center card-hover"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Package className="h-8 w-8 text-accent" />
              </div>
              <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-3">
                {t('brandLabel')}
              </span>
              <h3 className="text-lg font-semibold mb-2">
                {t('brandFlowTitle')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('brandFlowDesc')}
              </p>
            </motion.div>

            {/* Center - CNEC Shop */}
            <motion.div
              className="relative flex flex-col items-center"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              {/* Arrow Left */}
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
                <ChevronRight className="h-6 w-6 text-primary/40" />
              </div>
              {/* Arrow Right */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
                <ChevronRight className="h-6 w-6 text-primary/40" />
              </div>

              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center w-full">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
                  CNEC
                </span>
                <h3 className="text-lg font-semibold mb-2">
                  {t('kviewshopFlowTitle')}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t('kviewshopFlowCS')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t('kviewshopFlowShipping')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t('kviewshopFlowSettlement')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t('kviewshopFlowReturns')}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Creator Side */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-8 text-center card-hover"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Megaphone className="h-8 w-8 text-primary" />
              </div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
                {t('creatorLabel')}
              </span>
              <h3 className="text-lg font-semibold mb-2">
                {t('creatorFlowTitle')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('creatorFlowDesc')}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 md:py-28 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              {t('creatorStepsTitle')}
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative rounded-2xl border border-border bg-card p-8 card-hover"
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute top-6 right-8 text-5xl font-bold text-muted/50">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('featuredProducts')}</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t('featuredProductsDesc')}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border bg-card overflow-hidden card-hover"
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="aspect-square bg-muted animate-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted animate-shimmer" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-shimmer" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <Link href={`/${locale}/creator/login`}>
              <Button variant="outline" size="lg">
                {t('browseProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Creators / For Brands */}
      <section className="py-20 md:py-28 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Creators */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                  {t('forCreatorsLabel')}
                </span>
                <h3 className="font-headline text-2xl font-bold md:text-3xl mb-8">
                  {t('forCreatorsTitle')}
                </h3>
              </motion.div>
              <div className="space-y-6">
                {forCreators.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-4"
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="mt-8">
                <Link href={`/${locale}/creator/login`}>
                  <Button size="lg" className="btn-gold">
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
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-4">
                  {t('forBrandsLabel')}
                </span>
                <h3 className="font-headline text-2xl font-bold md:text-3xl mb-8">
                  {t('forBrandsTitle')}
                </h3>
              </motion.div>
              <div className="space-y-6">
                {forBrands.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-4"
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="mt-8">
                <Link href={`/${locale}/brand/login`}>
                  <Button variant="outline" size="lg">
                    {t('brandCta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('whyKviewshop')}</h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                className="rounded-2xl border border-border bg-card p-6 card-hover text-center"
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Global Reach */}
      <section className="py-16 border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <Globe className="h-10 w-10 text-primary shrink-0" />
            <div>
              <h3 className="text-xl font-semibold">
                {t('globalReachTitle')}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t('globalReachDesc')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.h2
              className="font-headline text-3xl font-bold md:text-5xl"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('ctaTitle')}
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('ctaDesc')}
            </motion.p>
            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Link href={`/${locale}/creator/login`}>
                <Button size="lg" className="btn-gold w-full sm:w-auto text-base px-8 py-6">
                  {t('creatorCta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/brand/login`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">
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
