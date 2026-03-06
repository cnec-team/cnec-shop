import type { Product } from '@/types/database';

interface ProductJsonLdProps {
  product: Product;
  shopUrl: string;
}

export function ProductJsonLd({ product, shopUrl }: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.thumbnail_url || product.images?.[0] || '',
    brand: product.brand ? { '@type': 'Brand', name: product.brand.brand_name } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.sale_price,
      priceCurrency: 'KRW',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: shopUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebSiteJsonLdProps {
  url?: string;
}

export function WebSiteJsonLd({ url = 'https://shop.cnec.kr' }: WebSiteJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CNEC Shop',
    alternateName: '크넥샵',
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/ko/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  imageUrl?: string;
  description?: string;
}

export function OrganizationJsonLd({ name, url, imageUrl, description }: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: imageUrl || '',
    description: description || '',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
