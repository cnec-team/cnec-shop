'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { cn } from '@/lib/utils';

type CampaignType = 'all' | 'GONGGU' | 'ALWAYS';

function bucketOf(status: string): CampaignFilter {
  if (status === 'DRAFT') return 'draft';
  if (status === 'ENDED') return 'ended';
  return 'active';
}

const TYPE_TABS: Array<{ value: CampaignType; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'GONGGU', label: '공구' },
  { value: 'ALWAYS', label: '상시' },
];

function toTypeParam(v: CampaignType): string | null {
  if (v === 'GONGGU') return 'groupbuy';
  if (v === 'ALWAYS') return 'always';
  return null;
}

function fromTypeParam(v: string | null): CampaignType {
  if (v === 'groupbuy') return 'GONGGU';
  if (v === 'always') return 'ALWAYS';
  return 'all';
}

function fromStatusParam(v: string | null): CampaignFilter {
  if (v === 'active' || v === 'draft' || v === 'ended' || v === 'all') return v;
  return 'active';
}

function typeLabel(t: CampaignType): string {
  if (t === 'GONGGU') return '공구';
  if (t === 'ALWAYS') return '상시';
  return '';
}

export function CampaignListView() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'ko';
  const basePath = `/${locale}/brand/campaigns`;

  const [campaigns, setCampaigns] = useState<RawCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read from URL query params
  const typeFilter = fromTypeParam(searchParams.get('type'));
  const statusFilter = fromStatusParam(searchParams.get('status'));
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  const updateUrl = useCallback((type: CampaignType, status: CampaignFilter, q: string) => {
    const p = new URLSearchParams();
    const tp = toTypeParam(type);
    if (tp) p.set('type', tp);
    if (status !== 'active') p.set('status', status);
    if (q.trim()) p.set('q', q.trim());
    const qs = p.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [basePath, router]);

  const setTypeFilter = useCallback((v: CampaignType) => {
    updateUrl(v, statusFilter, search);
  }, [statusFilter, search, updateUrl]);

  const setStatusFilter = useCallback((v: CampaignFilter) => {
    updateUrl(typeFilter, v, search);
  }, [typeFilter, search, updateUrl]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    updateUrl(typeFilter, statusFilter, v);
  }, [typeFilter, statusFilter, updateUrl]);

  const resetFilters = useCallback(() => {
    setSearch('');
    updateUrl('all', 'all', '');
  }, [updateUrl]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const brand = await getBrandSession();
        if (!brand) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        // Fetch all campaigns (no type filter at API level)
        const data = await getBrandCampaigns(brand.id);
        if (!cancelled) setCampaigns(data as unknown as RawCampaign[]);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
        if (!cancelled) toast.error('캠페인을 불러오지 못했어요');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter by type
  const typedCampaigns = useMemo(() => {
    if (typeFilter === 'all') return campaigns;
    return campaigns.filter((c) => c.type === typeFilter);
  }, [campaigns, typeFilter]);

  const counts = useMemo(() => {
    const acc: Record<CampaignFilter, number> = { active: 0, draft: 0, ended: 0, all: typedCampaigns.length };
    typedCampaigns.forEach((c) => { acc[bucketOf(c.status)] += 1; });
    return acc;
  }, [typedCampaigns]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return typedCampaigns.filter((c) => {
      if (statusFilter !== 'all' && bucketOf(c.status) !== statusFilter) return false;
      if (term && !c.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [typedCampaigns, statusFilter, search]);

  const totalCampaigns = campaigns.length;
  const hasSearch = search.trim().length > 0;
  const hasTypeFilter = typeFilter !== 'all';
  const hasStatusFilter = statusFilter !== 'all';
  const isFiltered = hasSearch || hasTypeFilter || hasStatusFilter;

  // Empty state copy logic
  function getEmptyState() {
    // Case A: brand has zero campaigns at all
    if (totalCampaigns === 0) {
      return {
        title: '아직 만든 캠페인이 없어요',
        description: '첫 캠페인을 만들어 크리에이터와 협업을 시작해보세요',
        cta: 'create' as const,
      };
    }
    // Case B: has campaigns but filter result is empty
    if (hasSearch) {
      return {
        title: '검색 결과가 없어요',
        description: '다른 조건으로 검색해보세요',
        cta: 'reset' as const,
      };
    }
    if (hasTypeFilter && !hasStatusFilter) {
      return {
        title: `${typeLabel(typeFilter)} 캠페인이 없어요`,
        description: '다른 유형을 선택해보세요',
        cta: 'reset' as const,
      };
    }
    if (hasStatusFilter) {
      const statusLabels: Record<string, string> = {
        active: '진행 중인',
        draft: '작성 중인',
        ended: '종료된',
      };
      const prefix = statusLabels[statusFilter] ?? '';
      return {
        title: `${prefix} 캠페인이 없어요`,
        description: '다른 조건으로 검색해보세요',
        cta: 'reset' as const,
      };
    }
    return {
      title: '캠페인이 없어요',
      description: '다른 조건으로 검색해보세요',
      cta: 'reset' as const,
    };
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">캠페인 관리</h1>
          <p className="mt-1.5 text-sm text-gray-500">크리에이터와 함께하는 판매 파이프라인</p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          새 캠페인
        </Link>
      </header>

      {/* Type filter (segment) */}
      <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 w-fit">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeFilter(tab.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              typeFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status filter + Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CampaignFilterTabs value={statusFilter} counts={counts} onChange={setStatusFilter} />
        <div className="lg:w-[360px]">
          <CampaignSearchBar value={search} onChange={handleSearchChange} />
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
        (() => {
          const empty = getEmptyState();
          return (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                <Package className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-xl font-bold text-gray-900">{empty.title}</p>
              <p className="mt-2 max-w-md text-sm text-gray-500 whitespace-pre-line">{empty.description}</p>
              {empty.cta === 'create' ? (
                <button
                  type="button"
                  onClick={() => router.push(`${basePath}/new`)}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  새 캠페인
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  전체 보기
                </button>
              )}
            </div>
          );
        })()
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
