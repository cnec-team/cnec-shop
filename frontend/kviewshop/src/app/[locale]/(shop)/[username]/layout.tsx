import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { LegalFooter } from '@/components/shop/legal-footer';
import { ShopBottomNav } from '@/components/shop/ShopBottomNav';
import { GuestSyncEffect } from '@/components/shop/GuestSyncEffect';
import { WelcomeToastEffect } from '@/components/shop/WelcomeToastEffect';

interface ShopUsernameLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; username: string }>;
}

export default async function ShopUsernameLayout({
  children,
  params,
}: ShopUsernameLayoutProps) {
  const { locale, username } = await params;

  // DB 검증: 실제 크리에이터인지 확인
  const creator = await prisma.creator.findFirst({
    where: {
      shopId: { equals: username, mode: 'insensitive' },
    },
    select: { id: true, status: true },
  });

  if (!creator || creator.status !== 'active') {
    notFound();
  }

  return (
    <>
      <GuestSyncEffect />
      <WelcomeToastEffect />
      {children}
      <ShopBottomNav locale={locale} username={username} />
      <LegalFooter locale={locale} variant="minimal" />
    </>
  );
}
