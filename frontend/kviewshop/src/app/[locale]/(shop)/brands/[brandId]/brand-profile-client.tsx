'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Star,
  Package,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  MapPin,
  Instagram,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface BrandProfileData {
  brand: {
    id: string;
    brandName: string | null;
    companyName: string | null;
    logoUrl: string | null;
    description: string | null;
    descriptionEn: string | null;
    contactEmail: string | null;
    csPhone: string | null;
    csEmail: string | null;
    csHours: string | null;
    shippingReturnAddress: string | null;
    exchangePolicy: string | null;
    brandInstagramHandle: string | null;
    certifications: any;
    createdAt: Date;
  };
  products: {
    id: string;
    name: string | null;
    thumbnailUrl: string | null;
    salePrice: number | null;
    originalPrice: number | null;
    images: string[];
    category: string | null;
    averageRating: number | null;
    reviewCount: number;
  }[];
  stats: {
    productCount: number;
    averageRating: number | null;
    totalReviews: number;
  };
}

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function BrandProfileClient({
  data,
  locale,
}: {
  data: BrandProfileData;
  locale: string;
}) {
  const { brand, products, stats } = data;
  const isKo = locale === 'ko';

  const t = {
    products: isKo ? '상품' : 'Products',
    reviews: isKo ? '리뷰' : 'Reviews',
    avgRating: isKo ? '평균 평점' : 'Avg Rating',
    brandInfo: isKo ? '브랜드 소개' : 'About',
    csInfo: isKo ? '고객센터' : 'Customer Service',
    shippingReturn: isKo ? '배송/교환/반품' : 'Shipping & Returns',
    allProducts: isKo ? '전체 상품' : 'All Products',
    noProducts: isKo ? '등록된 상품이 없습니다' : 'No products',
    back: isKo ? '뒤로' : 'Back',
    certified: isKo ? '인증' : 'Certified',
    since: isKo ? '입점' : 'Since',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>

          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="relative h-24 w-24 shrink-0 rounded-2xl border border-border bg-card overflow-hidden">
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={brand.brandName || ''}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{brand.brandName}</h1>
              {brand.companyName && (
                <p className="text-sm text-muted-foreground mt-0.5">{brand.companyName}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stats.productCount}</span>
                  <span className="text-xs text-muted-foreground">{t.products}</span>
                </div>
                {stats.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stats.totalReviews.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{t.reviews}</span>
                </div>
              </div>

              {/* Instagram */}
              {brand.brandInstagramHandle && (
                <a
                  href={`https://instagram.com/${brand.brandInstagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  @{brand.brandInstagramHandle}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Brand Description */}
        {brand.description && (
          <div className="mt-6 p-5 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-semibold mb-2">{t.brandInfo}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {isKo ? brand.description : (brand.descriptionEn || brand.description)}
            </p>
            {/* Certifications */}
            {brand.certifications && Array.isArray(brand.certifications) && brand.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(brand.certifications as string[]).map((cert, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-600 px-2.5 py-0.5 text-xs font-medium"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customer Service Info */}
        {(brand.csPhone || brand.csEmail || brand.csHours) && (
          <div className="mt-4 p-5 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-semibold mb-3">{t.csInfo}</h2>
            <div className="space-y-2">
              {brand.csPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${brand.csPhone}`} className="hover:text-primary">
                    {brand.csPhone}
                  </a>
                </div>
              )}
              {brand.csEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${brand.csEmail}`} className="hover:text-primary">
                    {brand.csEmail}
                  </a>
                </div>
              )}
              {brand.csHours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{brand.csHours}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping & Return Policy */}
        {(brand.shippingReturnAddress || brand.exchangePolicy) && (
          <div className="mt-4 p-5 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-semibold mb-3">{t.shippingReturn}</h2>
            {brand.shippingReturnAddress && (
              <div className="flex items-start gap-2 text-sm mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{brand.shippingReturnAddress}</span>
              </div>
            )}
            {brand.exchangePolicy && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {brand.exchangePolicy}
              </p>
            )}
          </div>
        )}

        {/* Products */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">{t.allProducts}</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/products`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-muted">
                    {(product.thumbnailUrl || product.images[0]) ? (
                      <Image
                        src={product.thumbnailUrl || product.images[0]}
                        alt={product.name || ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.originalPrice && product.salePrice && product.originalPrice > product.salePrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatKRW(product.originalPrice)}
                        </span>
                      )}
                      {product.salePrice && (
                        <span className="text-sm font-bold">{formatKRW(product.salePrice)}</span>
                      )}
                    </div>
                    {product.averageRating && product.reviewCount > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs">{product.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noProducts}</p>
          )}
        </div>
      </div>
    </div>
  );
}
