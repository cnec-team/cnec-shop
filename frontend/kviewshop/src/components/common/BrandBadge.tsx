'use client';

import { BadgeCheck } from 'lucide-react';

interface BrandBadgeProps {
  brandName: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md';
  verified?: boolean;
}

export function BrandBadge({ brandName, logoUrl, size = 'sm', verified = true }: BrandBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const logoSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className="inline-flex items-center gap-1">
      {logoUrl && (
        <img
          src={logoUrl}
          alt={brandName}
          className={`${logoSize} rounded-full object-cover`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <span className={`${textSize} text-gray-500 font-medium`}>{brandName}</span>
      {verified && (
        <BadgeCheck className={`${iconSize} text-blue-500`} />
      )}
    </span>
  );
}
