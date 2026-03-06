import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Creator, SkinType } from '@/types/database';
import { SKIN_TYPE_LABELS } from '@/types/database';

interface CreatorCardProps {
  creator: Creator & { product_count?: number };
  locale: string;
  productsLabel: string;
}

export function CreatorCard({ creator, locale, productsLabel }: CreatorCardProps) {
  const initials = (creator.display_name || creator.shop_id)
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/${locale}/${creator.shop_id}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      <Avatar className="h-20 w-20 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
        <AvatarImage src={creator.profile_image_url || undefined} alt={creator.display_name} />
        <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="text-center space-y-1.5">
        <h3 className="font-semibold text-sm line-clamp-1">{creator.display_name}</h3>
        {creator.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{creator.bio}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {creator.skin_type && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {SKIN_TYPE_LABELS[creator.skin_type as SkinType] || creator.skin_type}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {productsLabel.replace('{count}', String(creator.product_count ?? 0))}
        </span>
      </div>
    </Link>
  );
}
