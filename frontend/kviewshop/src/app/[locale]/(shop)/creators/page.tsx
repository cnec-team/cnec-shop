import { prisma } from '@/lib/db';
import { CreatorsPageClient } from './creators-client';
import type { Metadata } from 'next';

export const revalidate = 120;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === 'ko';
  return {
    title: isKo ? '크리에이터 — 크넥' : 'Creators — CNEC',
    description: isKo
      ? '나에게 맞는 뷰티 크리에이터를 찾아보세요'
      : 'Find the right beauty creator for you',
    openGraph: {
      title: isKo ? '크리에이터 — 크넥' : 'Creators — CNEC',
      description: isKo
        ? '나에게 맞는 뷰티 크리에이터를 찾아보세요'
        : 'Find the right beauty creator for you',
      type: 'website',
      siteName: 'CNEC Commerce',
    },
  };
}

async function getCreators() {
  const creators = await prisma.creator.findMany({
    orderBy: {
      totalSales: 'desc',
    },
    take: 100,
  });

  if (creators.length === 0) return [];

  const creatorIds = creators.map((c) => c.id);
  const counts = await prisma.creatorShopItem.findMany({
    where: {
      creatorId: { in: creatorIds },
      isVisible: true,
    },
    select: {
      creatorId: true,
    },
  });

  const countMap: Record<string, number> = {};
  counts.forEach((item) => {
    countMap[item.creatorId] = (countMap[item.creatorId] || 0) + 1;
  });

  // Serialize Decimal fields before passing to client component
  return creators.map((c) => ({
    ...c,
    totalSales: Number(c.totalSales),
    totalEarnings: Number(c.totalEarnings),
    totalRevenue: Number(c.totalRevenue),
    product_count: countMap[c.id] || 0,
  }));
}

export default async function CreatorsPage({ params }: PageProps) {
  const { locale } = await params;
  const creators = await getCreators();

  return <CreatorsPageClient creators={creators as any} locale={locale} />;
}
