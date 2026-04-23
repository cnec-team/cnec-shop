/**
 * 크넥샵 이메일 디자인 시스템 V3
 * 토스 블루 기반 컬러 팔레트 + 타이포그래피 + 레이아웃 + 스페이싱
 */

// ────────────────────────────── 컬러 팔레트 ──────────────────────────────

export const COLORS = {
  BRAND_PRIMARY: '#3182F6',
  BRAND_PRIMARY_DARK: '#1B64DA',
  BRAND_PRIMARY_LIGHT: '#E8F2FE',
  TEXT_PRIMARY: '#191F28',
  TEXT_SECONDARY: '#4E5968',
  TEXT_TERTIARY: '#8B95A1',
  BORDER: '#E5E8EB',
  BG_GRAY: '#F2F4F6',
  BG_WHITE: '#FFFFFF',
  SUCCESS: '#06C167',
  WARNING: '#FF6B35',
  DANGER: '#F04438',
  // V3
  DARK_CARD_BG: '#191F28',
  DARK_CARD_TEXT_SECONDARY: '#8B95A1',
  GRADIENT_BLUE_START: '#3182F6',
  GRADIENT_BLUE_END: '#1B64DA',
  PILL_BADGE_BG_INFO: '#E8F2FE',
  PILL_BADGE_BG_SUCCESS: '#E6F9EF',
  PILL_BADGE_BG_WARNING: '#FFF1EB',
  PILL_BADGE_BG_NEUTRAL: '#F2F4F6',
  PILL_BADGE_FG_INFO: '#1B64DA',
  PILL_BADGE_FG_SUCCESS: '#06C167',
  PILL_BADGE_FG_WARNING: '#FF6B35',
  PILL_BADGE_FG_NEUTRAL: '#4E5968',
} as const

// ────────────────────────────── 타이포그래피 ──────────────────────────────

export const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

export const FONT_SIZE = {
  H1: '28px',
  H2: '20px',
  H3: '16px',
  BODY: '14px',
  SMALL: '12px',
  DARK_HERO: '32px',
  TIP_LABEL: '13px',
} as const

export const FONT_WEIGHT = {
  BOLD: '700',
  MEDIUM: '500',
  REGULAR: '400',
} as const

export const LINE_HEIGHT = '1.6'

// ────────────────────────────── 레이아웃 ──────────────────────────────

export const LAYOUT = {
  CONTAINER_WIDTH: '600',
  MOBILE_MIN: '320',
  PADDING_OUTER: '24px',
  PADDING_INNER: '20px',
} as const

// ────────────────────────────── 스페이싱 ──────────────────────────────

export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
} as const
