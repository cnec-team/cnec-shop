export const UTM_PRESETS = {
  copy: { utm_source: 'link', utm_medium: 'copy' },
  kakao: { utm_source: 'kakao', utm_medium: 'share' },
  instagram: { utm_source: 'instagram', utm_medium: 'story' },
  tiktok: { utm_source: 'tiktok', utm_medium: 'bio' },
} as const;

export type ShareChannel = keyof typeof UTM_PRESETS;

export function buildShareUrl(baseUrl: string, channel: ShareChannel): string {
  const url = new URL(baseUrl);
  const params = UTM_PRESETS[channel];
  url.searchParams.set('utm_source', params.utm_source);
  url.searchParams.set('utm_medium', params.utm_medium);
  return url.toString();
}

export function buildPromotionCaption(productName: string, brandName: string, category: string, shareUrl: string): string {
  const caption = `직접 써보고 추천하는 ${productName}! 프로필 링크에서 구매할 수 있어요`;
  const hashtags = `#크넥 #${brandName} #${category}`.replace(/\s+/g, '');
  return `${caption}\n\n${hashtags}\n\n${shareUrl}`;
}
