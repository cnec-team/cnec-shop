import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileBottomNav } from '@/components/creator/MobileBottomNav';
import { CreatorMobileHeader } from '@/components/creator/CreatorMobileHeader';
import { OnboardingTutorial } from '@/components/creator/OnboardingTutorial';
import type { Locale } from '@/lib/i18n/config';

export default async function CreatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check onboarding status — redirect if not completed
  const session = await auth();
  if (session?.user?.id) {
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      select: { onboardingStatus: true, onboardingCompleted: true, painPointVectorUpdatedAt: true },
    });
    if (creator && creator.onboardingStatus !== 'COMPLETE' && !creator.onboardingCompleted) {
      redirect(`/${locale}/creator/onboarding`);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header locale={locale as Locale} />
      <CreatorMobileHeader />
      <div className="flex">
        <Sidebar role="creator" locale={locale as Locale} />
        <main className="w-full lg:ml-60 flex-1 p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
      <OnboardingTutorial />
    </div>
  );
}
