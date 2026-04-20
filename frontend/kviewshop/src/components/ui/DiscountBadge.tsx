import { cn } from '@/lib/utils';

interface DiscountBadgeProps {
  originalPrice: number;
  salePrice: number;
  className?: string;
}

export function DiscountBadge({ originalPrice, salePrice, className }: DiscountBadgeProps) {
  if (!originalPrice || originalPrice <= 0 || !salePrice || salePrice <= 0) return null;
  if (salePrice >= originalPrice) return null;

  const rate = Math.round((1 - salePrice / originalPrice) * 100);
  if (!isFinite(rate) || rate <= 0) return null;

  let style = 'bg-gray-100 text-gray-600';
  let label = `${rate}% 할인`;

  if (rate >= 30) {
    style = 'bg-red-50 text-red-500';
    label = `${rate}% 할인 🔥`;
  } else if (rate >= 10) {
    style = 'bg-blue-50 text-blue-600';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        style,
        className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {label}
    </span>
  );
}
