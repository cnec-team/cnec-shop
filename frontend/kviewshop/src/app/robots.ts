import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/ko',
          '/ko/terms',
          '/ko/privacy',
          '/ko/refund-policy',
          '/ko/faq',
          '/ko/support',
        ],
        disallow: ['/api/', '/admin/', '/brand/', '/creator/', '/buyer/', '/ko/signup'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
