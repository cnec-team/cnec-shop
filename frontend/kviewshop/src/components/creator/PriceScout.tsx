'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ShieldCheck,
  Star,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

// ── Badge Types ──

interface PriceBadgeInfo {
  type: string;
  message: string | null;
}

const BADGE_CONFIG: Record<string, {
  label: string;
  className: string;
  icon: typeof ShieldCheck;
}> = {
  LOWEST: {
    label: '최저가 보장',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: ShieldCheck,
  },
  EXCLUSIVE: {
    label: '독점 구성',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Star,
  },
  CAUTION: {
    label: '가격 확인 필요',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  UNKNOWN: {
    label: '가격 정보 없음',
    className: 'bg-gray-50 text-gray-500 border-gray-200',
    icon: HelpCircle,
  },
};

export function PriceBadgeTag({ badge }: { badge: PriceBadgeInfo }) {
  const config = BADGE_CONFIG[badge.type] ?? BADGE_CONFIG.UNKNOWN;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-0.5 font-medium ${config.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

// ── Price Detail Sheet ──

interface ChannelPrice {
  name: string;
  price: number;
  url: string | null;
  isLowest: boolean;
}

interface PriceDetailData {
  product: {
    id: string;
    name: string | null;
    cnecPrice: number;
    originalPrice: number;
    thumbnailUrl: string | null;
  };
  channels: ChannelPrice[];
  badge: PriceBadgeInfo;
  savings: number;
}

export function PriceScoutSheet({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<PriceDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !loaded) {
      setLoading(true);
      try {
        const res = await fetch(`/api/creator/price-scout/${productId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">가격 비교</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : data ? (
          <div className="space-y-4 py-4">
            {/* Product name */}
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {data.product.name}
            </p>

            {/* Badge */}
            <PriceBadgeTag badge={data.badge} />

            {/* CNEC Price - highlighted */}
            <div className="bg-gray-900 text-white rounded-xl p-4">
              <p className="text-xs text-gray-400">크넥샵 가격</p>
              <p className="text-2xl font-bold mt-0.5">
                {data.product.cnecPrice.toLocaleString('ko-KR')}원
              </p>
              {data.savings > 0 && (
                <p className="text-xs text-emerald-400 mt-1">
                  시중 대비 ₩{data.savings.toLocaleString('ko-KR')} 혜택
                </p>
              )}
            </div>

            {/* CAUTION warning */}
            {data.badge.type === 'CAUTION' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-800">
                  다른 채널에서 더 낮은 가격이 있어요
                </span>
              </div>
            )}

            <Separator />

            {/* Channel prices */}
            {data.channels.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500">채널별 가격</p>
                {data.channels.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{ch.name}</span>
                      {ch.isLowest && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                          최저
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {ch.price.toLocaleString('ko-KR')}원
                      </span>
                      {ch.url && (
                        <a
                          href={ch.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                채널 가격 정보가 없습니다
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            가격 정보를 불러올 수 없습니다
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
