import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.cnec.kr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/brand/', '/creator/', '/buyer/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
