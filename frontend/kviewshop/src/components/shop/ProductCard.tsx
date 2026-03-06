import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Product, Campaign } from '@/types/database';

interface ProductCardProps {
  product: Product;
  campaign?: Campaign | null;
  campaignPrice?: number;
  locale: string;
  shopId?: string;
}

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateDDay(endAt: string | undefined | null): { label: string; active: boolean } {
  if (!endAt) return { label: '', active: false };
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return { label: '', active: false };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return { label: 'D-Day', active: true };
  return { label: `D-${days}`, active: true };
}

function discountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function ProductCard({ product, campaign, campaignPrice, locale, shopId }: ProductCardProps) {
  const effectivePrice = campaignPrice ?? product.sale_price;
  const discount = discountPercent(product.original_price, effectivePrice);
  const dDay = campaign ? calculateDDay(campaign.end_at) : { label: '', active: false };
  const imageUrl = product.thumbnail_url || product.images?.[0];

  const href = shopId
    ? `/${locale}/${shopId}/product/${product.id}`
    : `/${locale}/products/${product.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {discount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 font-bold">
              {discount}%
            </Badge>
          )}
          {dDay.active && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
              {dDay.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        {product.brand && (
          <span className="text-[11px] text-muted-foreground">{product.brand.brand_name}</span>
        )}
        <h3 className="text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-baseline gap-1.5 mt-auto">
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatKRW(product.original_price)}
            </span>
          )}
          <span className="text-sm font-bold">{formatKRW(effectivePrice)}</span>
        </div>
      </div>
    </Link>
  );
}
