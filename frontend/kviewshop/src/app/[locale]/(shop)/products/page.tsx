import { prisma } from '@/lib/db';
import { ProductsPageClient } from './products-client';
import type { Metadata } from 'next';

export const revalidate = 120;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === 'ko';
  return {
    title: isKo ? '상품 — 크넥' : 'Products — CNEC',
    description: isKo
      ? '크리에이터가 추천하는 K-뷰티 상품'
      : 'K-Beauty products recommended by creators',
    openGraph: {
      title: isKo ? '상품 — 크넥' : 'Products — CNEC',
      description: isKo
        ? '크리에이터가 추천하는 K-뷰티 상품'
        : 'K-Beauty products recommended by creators',
      type: 'website',
      siteName: 'CNEC Commerce',
    },
  };
}

async function getProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      brand: {
        select: {
          id: true,
          brandName: true,
          logoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  });

  // Serialize Decimal fields before passing to client component
  return products.map((p) => ({
    ...p,
    price: p.price ? Number(p.price) : null,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    defaultCommissionRate: Number(p.defaultCommissionRate),
    shippingFee: Number(p.shippingFee),
    freeShippingThreshold: p.freeShippingThreshold
      ? Number(p.freeShippingThreshold)
      : null,
  }));
}

async function getBrands() {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      brandName: true,
    },
    orderBy: {
      brandName: 'asc',
    },
  });

  return brands;
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  const [products, brands] = await Promise.all([getProducts(), getBrands()]);

  return <ProductsPageClient products={products as any} brands={brands as any} locale={locale} />;
}
