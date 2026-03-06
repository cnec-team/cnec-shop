import { createClient } from '@/lib/supabase/server';
import { CreatorsPageClient } from './creators-client';
import type { Metadata } from 'next';
import type { Creator } from '@/types/database';

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

async function getCreators(): Promise<(Creator & { product_count: number })[]> {
  const supabase = await createClient();
  const { data: creators } = await supabase
    .from('creators')
    .select('*')
    .order('total_sales', { ascending: false })
    .limit(100);

  if (!creators || creators.length === 0) return [];

  const creatorIds = creators.map((c) => c.id);
  const { data: counts } = await supabase
    .from('creator_shop_items')
    .select('creator_id')
    .in('creator_id', creatorIds)
    .eq('is_visible', true);

  const countMap: Record<string, number> = {};
  (counts || []).forEach((item: { creator_id: string }) => {
    countMap[item.creator_id] = (countMap[item.creator_id] || 0) + 1;
  });

  return creators.map((c) => ({
    ...c,
    product_count: countMap[c.id] || 0,
  })) as (Creator & { product_count: number })[];
}

export default async function CreatorsPage({ params }: PageProps) {
  const { locale } = await params;
  const creators = await getCreators();

  return <CreatorsPageClient creators={creators} locale={locale} />;
}
