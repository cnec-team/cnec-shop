import { LegalFooter } from '@/components/shop/legal-footer';

interface ShopUsernameLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; username: string }>;
}

export default async function ShopUsernameLayout({
  children,
  params,
}: ShopUsernameLayoutProps) {
  const { locale } = await params;

  return (
    <>
      {children}
      <LegalFooter locale={locale} variant="minimal" />
    </>
  );
}
