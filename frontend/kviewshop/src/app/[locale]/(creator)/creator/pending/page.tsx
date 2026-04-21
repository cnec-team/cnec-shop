import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CreatorPendingClient } from './client';

export default async function CreatorPendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
      displayName: true,
      shopId: true,
      instagramHandle: true,
      youtubeHandle: true,
      tiktokHandle: true,
      primaryCategory: true,
      categories: true,
      bio: true,
      submittedAt: true,
      rejectionReason: true,
      createdAt: true,
    },
  });

  if (!creator) {
    redirect(`/${locale}/signup`);
  }

  // APPROVED/ACTIVE creators shouldn't be on this page
  if (creator.status === 'APPROVED' || creator.status === 'ACTIVE') {
    redirect(`/${locale}/creator/dashboard`);
  }

  if (creator.status === 'SUSPENDED') {
    redirect(`/${locale}/creator/suspended`);
  }

  return <CreatorPendingClient creator={creator} locale={locale} />;
}
