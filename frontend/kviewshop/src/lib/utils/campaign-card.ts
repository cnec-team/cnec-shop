import type { CampaignCardData } from '@/components/brand/CampaignCard';

export interface RawCampaign {
  id: string;
  title: string;
  description: string | null;
  type: string;
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

export function toCardData(c: RawCampaign): CampaignCardData {
  const avgPrice =
    c.products.length > 0
      ? c.products.reduce((s, cp) => s + Number(cp.campaignPrice), 0) / c.products.length
      : 0;
  const revenue = Math.round(avgPrice * c.soldCount);

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
    revenue,
    revenueChangePercent: null,
    products: c.products.map((cp) => ({
      id: cp.product?.id ?? cp.id,
      name: cp.product?.name ?? null,
      images: cp.product?.images ?? [],
    })),
  };
}
