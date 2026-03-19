import { Header } from '@/components/layout/header';
import { BrandSidebar } from '@/components/layout/brand-sidebar';
import type { Locale } from '@/lib/i18n/config';

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header locale={locale as Locale} />
      <div className="flex">
        <BrandSidebar locale={locale as Locale} />
        <main className="w-full lg:ml-60 flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
