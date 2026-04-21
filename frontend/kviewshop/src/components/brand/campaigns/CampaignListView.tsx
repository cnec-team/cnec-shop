'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getBrandCampaigns, getBrandSession } from '@/lib/actions/brand';
import { CampaignCard } from '@/components/brand/CampaignCard';
import {
  CampaignFilterTabs,
  type CampaignFilter,
} from '@/components/brand/CampaignFilterTabs';
import { CampaignSearchBar } from '@/components/brand/CampaignSearchBar';
import { Skeleton } from '@/components/ui/skeleton';
import { type RawCampaign, toCardData } from '@/lib/utils/campaign-card';

function bucketOf(status: string): CampaignFilter {
  if (status === 'DRAFT') return 'draft';
  if (status === 'ENDED') return 'ended';
  return 'active';
}

interface CampaignListViewProps {
  type: 'GONGGU' | 'ALWAYS';
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function CampaignListView({
  type,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
}: CampaignListViewProps) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) ?? 'ko';
  const basePath = `/${locale}/brand/campaigns`;

  const [campaigns, setCampaigns] = useState<RawCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CampaignFilter>('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const brand = await getBrandSession();
        if (!brand) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        const data = await getBrandCampaigns(brand.id, type);
        if (!cancelled) setCampaigns(data as unknown as RawCampaign[]);
      } catch (error) {
        console.error(`Failed to fetch ${type} campaigns:`, error);
        if (!cancelled) toast.error('캠페인을 불러오지 못했어요');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [type]);

  const counts = useMemo(() => {
    const acc: Record<CampaignFilter, number> = { active: 0, draft: 0, ended: 0, all: campaigns.length };
    campaigns.forEach((c) => { acc[bucketOf(c.status)] += 1; });
    return acc;
  }, [campaigns]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (filter !== 'all' && bucketOf(c.status) !== filter) return false;
      if (term && !c.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [campaigns, filter, search]);

  const isFiltered = search.trim().length > 0 || filter !== 'all';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          새 캠페인
        </Link>
      </header>

      {/* Filter + Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CampaignFilterTabs value={filter} counts={counts} onChange={setFilter} />
        <div className="lg:w-[360px]">
          <CampaignSearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row">
                <Skeleton className="h-[140px] w-[140px] rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-28 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                </div>
                <div className="w-full space-y-3 sm:w-[260px]">
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
            <Package className="h-7 w-7 text-gray-300" />
          </div>
          {isFiltered ? (
            <>
              <p className="text-lg font-semibold text-gray-900">조건에 맞는 캠페인이 없어요</p>
              <p className="mt-1 text-sm text-gray-500">다른 필터를 시도해보세요</p>
              <button
                type="button"
                onClick={() => { setFilter('all'); setSearch(''); }}
                className="mt-5 inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                전체 보기
              </button>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-900">{emptyTitle}</p>
              <p className="mt-2 max-w-md text-sm text-gray-500 whitespace-pre-line">{emptyDescription}</p>
              <button
                type="button"
                onClick={() => router.push(`${basePath}/new`)}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />새 캠페인 만들기
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={toCardData(c)} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}
