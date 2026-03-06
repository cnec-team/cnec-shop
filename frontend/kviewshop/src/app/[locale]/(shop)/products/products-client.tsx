'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import type { Product } from '@/types/database';

interface ProductsPageClientProps {
  products: Product[];
  brands: { id: string; brand_name: string }[];
  locale: string;
}

const PAGE_SIZE = 20;

type SortKey = 'popular' | 'recent' | 'discount' | 'price_low' | 'price_high';
type PriceRange = '' | 'under10k' | 'under30k' | 'under50k' | 'over50k';

export function ProductsPageClient({ products, brands, locale }: ProductsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isKo = locale === 'ko';

  const t = {
    title: isKo ? '상품' : 'Products',
    desc: isKo ? '크리에이터가 추천하는 K-뷰티 상품' : 'K-Beauty products recommended by creators',
    all: isKo ? '전체' : 'All',
    sortPopular: isKo ? '인기순' : 'Popular',
    sortRecent: isKo ? '최신순' : 'Recent',
    sortDiscount: isKo ? '할인순' : 'Discount',
    sortPriceLow: isKo ? '낮은가격순' : 'Price: Low',
    sortPriceHigh: isKo ? '높은가격순' : 'Price: High',
    filterCategory: isKo ? '카테고리' : 'Category',
    filterPrice: isKo ? '가격대' : 'Price Range',
    filterBrand: isKo ? '브랜드' : 'Brand',
    noProducts: isKo ? '등록된 상품이 없습니다' : 'No products found',
    loadMore: isKo ? '더 보기' : 'Load More',
    priceUnder10k: isKo ? '~1만원' : 'Under ₩10,000',
    priceUnder30k: isKo ? '~3만원' : 'Under ₩30,000',
    priceUnder50k: isKo ? '~5만원' : 'Under ₩50,000',
    priceOver50k: isKo ? '5만원+' : '₩50,000+',
    catSkincare: isKo ? '스킨케어' : 'Skincare',
    catMakeup: isKo ? '메이크업' : 'Makeup',
    catBody: isKo ? '바디' : 'Body',
    catHair: isKo ? '헤어' : 'Hair',
    selectBrand: isKo ? '브랜드 선택' : 'Select Brand',
  };

  const categories = [
    { value: 'skincare', label: t.catSkincare },
    { value: 'makeup', label: t.catMakeup },
    { value: 'body', label: t.catBody },
    { value: 'hair', label: t.catHair },
  ];

  const priceRanges: { value: PriceRange; label: string }[] = [
    { value: 'under10k', label: t.priceUnder10k },
    { value: 'under30k', label: t.priceUnder30k },
    { value: 'under50k', label: t.priceUnder50k },
    { value: 'over50k', label: t.priceOver50k },
  ];

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>(
    (searchParams.get('price') as PriceRange) || ''
  );
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedSort, setSelectedSort] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) || 'popular'
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedPriceRange) {
      result = result.filter((p) => {
        const price = p.sale_price;
        switch (selectedPriceRange) {
          case 'under10k': return price <= 10000;
          case 'under30k': return price <= 30000;
          case 'under50k': return price <= 50000;
          case 'over50k': return price > 50000;
          default: return true;
        }
      });
    }

    if (selectedBrand) {
      result = result.filter((p) => p.brand_id === selectedBrand);
    }

    switch (selectedSort) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'discount': {
        const disc = (p: Product) =>
          p.original_price > 0
            ? ((p.original_price - p.sale_price) / p.original_price) * 100
            : 0;
        result.sort((a, b) => disc(b) - disc(a));
        break;
      }
      case 'price_low':
        result.sort((a, b) => a.sale_price - b.sale_price);
        break;
      case 'price_high':
        result.sort((a, b) => b.sale_price - a.sale_price);
        break;
      default:
        // popular — keep existing order (newest as fallback)
        break;
    }

    return result;
  }, [products, selectedCategory, selectedPriceRange, selectedBrand, selectedSort]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'popular', label: t.sortPopular },
    { value: 'recent', label: t.sortRecent },
    { value: 'discount', label: t.sortDiscount },
    { value: 'price_low', label: t.sortPriceLow },
    { value: 'price_high', label: t.sortPriceHigh },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.desc}</p>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              updateParams('category', val);
            }}
            allLabel={t.all}
          />

          {/* Price filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedPriceRange('');
                updateParams('price', '');
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                !selectedPriceRange
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {t.all}
            </button>
            {priceRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  setSelectedPriceRange(range.value);
                  updateParams('price', range.value);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                  selectedPriceRange === range.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Brand filter */}
          {brands.length > 0 && (
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                updateParams('brand', e.target.value);
              }}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">{t.all} {t.filterBrand}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brand_name}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedSort(option.value);
                  updateParams('sort', option.value);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                  selectedSort === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-16">{t.noProducts}</p>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="rounded-full border border-border bg-card px-8 py-2.5 text-sm font-medium hover:border-primary/30 transition-colors"
            >
              {t.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
