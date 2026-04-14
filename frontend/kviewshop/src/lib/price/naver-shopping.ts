interface NaverShopItem {
  title: string;
  link: string;
  lprice: string;
  mallName: string;
}

interface NaverShopResponse {
  items: NaverShopItem[];
}

interface NaverPriceResult {
  lowestPrice: number;
  productUrl: string;
  mallName: string;
}

export async function searchNaverPrice(
  productName: string,
  brandName?: string
): Promise<NaverPriceResult | null> {
  const clientId = process.env.NAVER_SHOPPING_CLIENT_ID;
  const clientSecret = process.env.NAVER_SHOPPING_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const query = brandName ? `${brandName} ${productName}` : productName;

  try {
    const url = new URL('https://openapi.naver.com/v1/search/shop.json');
    url.searchParams.set('query', query);
    url.searchParams.set('display', '5');
    url.searchParams.set('sort', 'asc');

    const res = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!res.ok) {
      console.error(`Naver Shopping API error: ${res.status}`);
      return null;
    }

    const data: NaverShopResponse = await res.json();

    if (!data.items || data.items.length === 0) return null;

    const cheapest = data.items[0];
    const price = parseInt(cheapest.lprice, 10);

    if (isNaN(price) || price <= 0) return null;

    return {
      lowestPrice: price,
      productUrl: cheapest.link,
      mallName: cheapest.mallName,
    };
  } catch (err) {
    console.error('Naver Shopping API failed:', err);
    return null;
  }
}
