'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { X, Loader2, Clock } from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';
import { formatCurrency } from '@/lib/i18n/config';

interface ProductBrand {
  brandName: string;
  logoUrl?: string | null;
}

interface ProductData {
  id: string;
  name: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  images?: string[];
  price?: number | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  brand?: ProductBrand | null;
}

interface CreatorProductCardProps {
  product: ProductData;
  variant?: 'grid' | 'list';
  badge?: 'gonggu' | 'pick' | null;
  dDay?: number | null;
  commissionRate?: number | null;
  estimatedCommission?: number | null;
  onAction?: () => void;
  actionLabel?: string;
  onRemove?: () => void;
  showRemove?: boolean;
  isRemoving?: boolean;
  href?: string;
}

const BADGE_STYLES = {
  gonggu: 'bg-blue-100 text-blue-700',
  pick: 'bg-purple-100 text-purple-700',
} as const;

const BADGE_LABELS = {
  gonggu: '공구',
  pick: '픽',
} as const;

export function CreatorProductCard({
  product,
  variant = 'grid',
  badge,
  dDay,
  commissionRate,
  estimatedCommission,
  onAction,
  actionLabel,
  onRemove,
  showRemove = false,
  isRemoving = false,
  href,
}: CreatorProductCardProps) {
  const params = useParams();
  const locale = params.locale as string;

  const imgSrc = product.thumbnailUrl || product.imageUrl || product.images?.[0] || null;
  const price = Number(product.salePrice ?? product.price ?? 0);
  const originalPrice = Number(product.originalPrice ?? 0);
  const discount = originalPrice > price && originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const productHref = href || `/${locale}/creator/products/${product.id}`;

  if (variant === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 relative">
        {/* Remove button */}
        {showRemove && (
          <button
            onClick={(e) => { e.preventDefault(); onRemove?.(); }}
            disabled={isRemoving}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-gray-100/90 hover:bg-red-100 flex items-center justify-center transition-colors"
          >
            {isRemoving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
            ) : (
              <X className="h-3.5 w-3.5 text-gray-500" />
            )}
          </button>
        )}

        <Link href={productHref} className="flex items-center gap-3 flex-1 min-w-0">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-lg bg-gray-50 relative overflow-hidden shrink-0">
            <SafeImage
              src={imgSrc}
              alt={product.name || ''}
              fill
              className="object-cover"
              fallbackClassName="w-full h-full"
              sizes="64px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {product.brand && (
              <span className="text-[10px] text-gray-400 font-medium">{product.brand.brandName}</span>
            )}
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {discount > 0 && (
                <span className="text-xs font-bold text-red-500">{discount}%</span>
              )}
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(price, 'KRW')}
              </span>
            </div>
          </div>
        </Link>

        {/* Badges + commission on right */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {badge && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BADGE_STYLES[badge]}`}>
              {BADGE_LABELS[badge]}
            </span>
          )}
          {commissionRate != null && commissionRate > 0 && (
            <span className="text-[10px] text-green-600 font-medium">
              커미션 {Math.round(commissionRate)}%
            </span>
          )}
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Remove button */}
      {showRemove && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove?.(); }}
          disabled={isRemoving}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-gray-100/90 hover:bg-red-100 flex items-center justify-center transition-colors"
        >
          {isRemoving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
          ) : (
            <X className="h-3.5 w-3.5 text-gray-500" />
          )}
        </button>
      )}

      <Link href={productHref} className="block">
        {/* Thumbnail */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          <SafeImage
            src={imgSrc}
            alt={product.name || ''}
            fill
            className="object-cover"
            fallbackClassName="w-full h-full"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badge overlay */}
          {badge && (
            <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${BADGE_STYLES[badge]}`}>
              {BADGE_LABELS[badge]}
            </span>
          )}

          {/* D-Day overlay */}
          {dDay != null && dDay >= 0 && (
            <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {dDay === 0 ? 'D-Day' : `D-${dDay}`}
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="p-3">
          {/* Brand */}
          {product.brand && (
            <div className="flex items-center gap-1 mb-0.5">
              {product.brand.logoUrl && (
                <img
                  src={product.brand.logoUrl}
                  alt={product.brand.brandName}
                  className="h-4 w-4 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <span className="text-[10px] text-gray-400 font-medium">{product.brand.brandName}</span>
            </div>
          )}

          {/* Name */}
          <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">{product.name}</p>

          {/* Price */}
          <div className="flex items-center gap-1.5 mt-1">
            {discount > 0 && (
              <span className="text-xs font-bold text-red-500">{discount}%</span>
            )}
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(price, 'KRW')}
            </span>
            {discount > 0 && originalPrice > 0 && (
              <span className="text-[10px] text-gray-300 line-through">
                {formatCurrency(originalPrice, 'KRW')}
              </span>
            )}
          </div>

          {/* Commission info */}
          {(commissionRate != null && commissionRate > 0) && (
            <p className="text-[10px] text-green-600 font-medium mt-1.5">
              커미션 {Math.round(commissionRate)}%
              {estimatedCommission != null && estimatedCommission > 0 && (
                <span className="text-gray-400 font-normal">
                  {' '}· 1개 판매 시 ₩{estimatedCommission.toLocaleString()}
                </span>
              )}
            </p>
          )}
        </div>
      </Link>

      {/* Action button */}
      {onAction && actionLabel && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => { e.preventDefault(); onAction(); }}
            className="w-full h-9 rounded-xl text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
