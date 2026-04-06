// Beauty tag Korean label mappings — used project-wide
// Supports both Prisma camelCase (DB) and legacy snake_case keys

export const SKIN_TYPE_LABELS: Record<string, string> = {
  DRY: '건성',
  OILY: '지성',
  COMBINATION: '복합성',
  NORMAL: '중성',
  SENSITIVE: '수부지',
  // legacy snake_case keys
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  oily_sensitive: '수부지',
}

export const SKIN_CONCERN_LABELS: Record<string, string> = {
  acne: '여드름',
  wrinkle: '주름/탄력',
  pore: '모공',
  pigmentation: '색소침착',
  redness: '홍조',
  sensitivity: '민감성',
  dryness: '속건조',
  blackhead: '블랙헤드',
  darkCircle: '다크서클',
  dark_circles: '다크서클',
}

export const PERSONAL_COLOR_LABELS: Record<string, string> = {
  SPRING_WARM: '봄웜톤',
  SUMMER_COOL: '여름쿨톤',
  AUTUMN_WARM: '가을웜톤',
  WINTER_COOL: '겨울쿨톤',
  // legacy snake_case keys
  spring_warm: '봄웜톤',
  summer_cool: '여름쿨톤',
  autumn_warm: '가을웜톤',
  winter_cool: '겨울쿨톤',
}

export function getSkinTypeLabel(v: string): string {
  return SKIN_TYPE_LABELS[v] || v
}

export function getSkinConcernLabel(v: string): string {
  return SKIN_CONCERN_LABELS[v] || v
}

export function getPersonalColorLabel(v: string): string {
  return PERSONAL_COLOR_LABELS[v] || v
}

/**
 * Get the shop base URL from environment or current origin.
 * Usage: getShopUrl(shopId) → full shop URL
 */
export function getShopBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SHOP_URL || window.location.origin
  }
  return process.env.NEXT_PUBLIC_SHOP_URL || ''
}

export function getShopUrl(shopId: string): string {
  const base = getShopBaseUrl()
  return `${base}/${shopId}`
}

/**
 * Calculate estimated earnings for a product
 */
export function calculateEarnings(
  price: number | { toString(): string },
  commissionRate: number | { toString(): string }
): number {
  return Math.round(Number(price) * Number(commissionRate))
}

/**
 * Format earnings as display string
 */
export function formatEarnings(
  price: number | { toString(): string },
  commissionRate: number | { toString(): string }
): string {
  const amount = calculateEarnings(price, commissionRate)
  return `판매 수익 ₩${amount.toLocaleString('ko-KR')}`
}
