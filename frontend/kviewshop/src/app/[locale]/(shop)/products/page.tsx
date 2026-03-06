import { createClient } from '@/lib/supabase/server';
import { ProductsPageClient } from './products-client';
import type { Metadata } from 'next';
import type { Product, Brand } from '@/types/database';

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

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*, brand:brands(id, brand_name, logo_url)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(200);

  return (data || []) as Product[];
}

async function getBrands(): Promise<{ id: string; brand_name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('brands')
    .select('id, brand_name')
    .order('brand_name', { ascending: true });

  return (data || []) as { id: string; brand_name: string }[];
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  const [products, brands] = await Promise.all([getProducts(), getBrands()]);

  return <ProductsPageClient products={products} brands={brands} locale={locale} />;
}
