import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Header } from '@/components/layout/header';
import { BrandSidebar } from '@/components/layout/brand-sidebar';
import type { Locale } from '@/lib/i18n/config';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { resolveBrandPlan } from '@/lib/pricing/v3/plan-resolver';

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let pricingVersion: 'v2' | 'v3' = 'v3';
  try {
    const authUser = await getAuthUser();
    if (authUser) {
      const brand = await prisma.brand.findUnique({ where: { userId: authUser.id } });
      if (brand) {
        // Brand approval check
        const headersList = await headers();
        const pathname = headersList.get('x-pathname') || '';
        const isExemptPath = /\/brand\/(pending|login)/.test(pathname);
        if (!brand.approved && !isExemptPath) {
          redirect(`/${locale}/brand/pending`);
        }

        const subscription = await prisma.brandSubscription.findUnique({ where: { brandId: brand.id } });
        const plan = resolveBrandPlan(subscription);
        pricingVersion = plan.version === 'v2' ? 'v2' : 'v3';
      }
    }
  } catch {
    // 기본값 v3
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header locale={locale as Locale} />
      <div className="flex">
        <BrandSidebar locale={locale as Locale} pricingVersion={pricingVersion} />
        <main className="w-full lg:ml-60 flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
