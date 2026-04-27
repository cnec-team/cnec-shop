import Link from 'next/link';
import type { Creator, SkinType } from '@/types/database';
import { SKIN_TYPE_LABELS } from '@/types/database';

interface CreatorCardProps {
  creator: Creator & { product_count?: number; resolvedProfileImage?: string | null };
  locale: string;
  productsLabel: string;
}

export function CreatorCard({ creator, locale, productsLabel }: CreatorCardProps) {
  const displayName = creator.display_name || creator.shop_id;
  const initials = displayName.slice(0, 1);
  const profileImage = creator.resolvedProfileImage || creator.profile_image_url;

  return (
    <Link
      href={`/${locale}/${creator.shop_id}`}
      className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-5 transition-colors hover:bg-gray-50"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all">
        {profileImage ? (
          <img
            src={profileImage}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
            {initials}
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{displayName}</h3>
        {creator.bio && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{creator.bio}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {creator.skin_type && (
          <span className="bg-gray-100 rounded-full px-2.5 py-0.5 text-[10px] text-gray-500">
            {SKIN_TYPE_LABELS[creator.skin_type as SkinType] || creator.skin_type}
          </span>
        )}
        <span className="text-xs text-gray-400">
          {productsLabel.replace('{count}', String(creator.product_count ?? 0))}
        </span>
      </div>
    </Link>
  );
}
