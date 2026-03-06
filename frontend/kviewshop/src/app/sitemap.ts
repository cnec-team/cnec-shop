import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.cnec.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Fetch active creators for dynamic shop pages
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: creators } = await supabase
        .from('creators')
        .select('shop_id, updated_at')
        .eq('status', 'ACTIVE')
        .not('shop_id', 'is', null);

      if (creators) {
        for (const creator of creators) {
          entries.push({
            url: `${BASE_URL}/ko/${creator.shop_id}`,
            lastModified: creator.updated_at ? new Date(creator.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }

      // Fetch active products with their creator shop IDs
      const { data: shopItems } = await supabase
        .from('creator_shop_items')
        .select('product_id, creator_id, campaign_id, products(updated_at), creators(shop_id)')
        .eq('is_visible', true)
        .limit(1000);

      if (shopItems) {
        const seen = new Set<string>();
        for (const item of shopItems) {
          const shopId = (item as any).creators?.shop_id;
          const productUpdated = (item as any).products?.updated_at;
          if (!shopId || !item.product_id) continue;

          const key = `${shopId}/${item.product_id}`;
          if (seen.has(key)) continue;
          seen.add(key);

          entries.push({
            url: `${BASE_URL}/ko/${shopId}/product/${item.product_id}`,
            lastModified: productUpdated ? new Date(productUpdated) : new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return entries;
}
