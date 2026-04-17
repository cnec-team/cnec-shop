import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';

interface RecentViewItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    nameKo?: string | null;
    thumbnailUrl?: string | null;
    images?: string[] | null;
    salePrice?: number | null;
    originalPrice?: number | null;
  };
}

interface Props {
  items: RecentViewItem[];
  shopUsername: string;
  locale: string;
}

export function RecentViewsSection({ items, shopUsername, locale }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="py-6 border-t border-gray-100 mt-8">
      <div className="flex items-center gap-2 mb-4 px-4">
        <Clock className="h-4 w-4 text-gray-500" />
        <h2 className="text-base font-semibold">최근 본 다른 상품</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x">
        {items.map((item) => {
          const image = item.product.thumbnailUrl ?? item.product.images?.[0];
          const name = item.product.nameKo ?? item.product.name;
          const price = Number(item.product.salePrice ?? item.product.originalPrice ?? 0);

          return (
            <Link
              key={item.id}
              href={`/${locale}/${shopUsername}/product/${item.productId}`}
              className="flex-shrink-0 w-28 snap-start"
            >
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {image ? (
                  <Image
                    src={image}
                    alt={name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                    이미지 없음
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs line-clamp-2">{name}</p>
              <p className="mt-1 text-sm font-semibold">
                {new Intl.NumberFormat('ko-KR').format(price)}원
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
