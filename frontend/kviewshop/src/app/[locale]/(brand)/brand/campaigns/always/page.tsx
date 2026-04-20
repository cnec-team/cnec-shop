'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { getBrandCampaigns, getBrandSession } from '@/lib/actions/brand';
import { CampaignCard, type CampaignCardData } from '@/components/brand/CampaignCard';
import {
  CampaignFilterTabs,
  type CampaignFilter,
} from '@/components/brand/CampaignFilterTabs';
import { CampaignSearchBar } from '@/components/brand/CampaignSearchBar';
import { Skeleton } from '@/components/ui/skeleton';

interface RawCampaign {
  id: string;
  title: string;
  description: string | null;
  status: string;
  recruitmentType: string;
  commissionRate: number | string;
  soldCount: number;
  totalStock: number | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  products: Array<{
    id: string;
    campaignPrice: number | string;
    product: {
      id: string;
      name: string | null;
      images?: string[];
    } | null;
  }>;
}

function bucketOf(status: string): CampaignFilter {
  if (status === 'DRAFT') return 'draft';
  if (status === 'ENDED') return 'ended';
  return 'active';
}

function toCardData(c: RawCampaign): CampaignCardData {
  const avgPrice =
    c.products.length > 0
      ? c.products.reduce((s, cp) => s + Number(cp.campaignPrice), 0) / c.products.length
      : 0;
  return {
    id: c.id,
    title: c.title,
    status: c.status,
    recruitmentType: c.recruitmentType,
    commissionRate: c.commissionRate,
    soldCount: c.soldCount,
    totalStock: c.totalStock,
    startAt: c.startAt,
    endAt: c.endAt,
    revenue: Math.round(avgPrice * c.soldCount),
    revenueChangePercent: null,
    products: c.products.map((cp) => ({
      id: cp.product?.id ?? cp.id,
      name: cp.product?.name ?? null,
      images: cp.product?.images ?? [],
    })),
  };
}

export default function AlwaysCampaignsPage() {
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
        const data = await getBrandCampaigns(brand.id, 'ALWAYS');
        if (!cancelled) setCampaigns(data as unknown as RawCampaign[]);
      } catch (error) {
        console.error('Failed to fetch always campaigns:', error);
        if (!cancelled) toast.error('캠페인을 불러오지 못했어요');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const acc: Record<CampaignFilter, number> = {
      active: 0,
      draft: 0,
      ended: 0,
      all: campaigns.length,
    };
    campaigns.forEach((c) => {
      acc[bucketOf(c.status)] += 1;
    });
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">상시 캠페인</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            기간 제한 없이 크리에이터와 지속적으로 협업하세요
          </p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:self-auto"
        >
          <Plus className="h-4 w-4" />새 캠페인
        </Link>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CampaignFilterTabs value={filter} counts={counts} onChange={setFilter} />
        <div className="lg:w-[360px]">
          <CampaignSearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 sm:flex-row">
                <Skeleton className="h-[140px] w-[140px] rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-24 w-full rounded-2xl sm:w-[260px]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
            <Repeat className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-900">상시 캠페인을 시작해보세요</p>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            기간 제한 없이 크리에이터와 지속적으로 협업할 수 있어요
          </p>
          <button
            type="button"
            onClick={() => router.push(`${basePath}/new`)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />새 캠페인 만들기
          </button>
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
