import { LegalFooter } from '@/components/shop/legal-footer';
import { ShopBottomNav } from '@/components/shop/ShopBottomNav';
import { GuestSyncEffect } from '@/components/shop/GuestSyncEffect';

interface ShopUsernameLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; username: string }>;
}

export default async function ShopUsernameLayout({
  children,
  params,
}: ShopUsernameLayoutProps) {
  const { locale, username } = await params;

  return (
    <>
      <GuestSyncEffect />
      {children}
      <ShopBottomNav locale={locale} username={username} />
      <LegalFooter locale={locale} variant="minimal" />
    </>
  );
}
