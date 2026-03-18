import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
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
    <div className="min-h-screen bg-background">
      <Header locale={locale as Locale} />
      <div className="flex">
        <Sidebar role="brand_admin" locale={locale as Locale} />
        <main className="w-full lg:ml-60 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
