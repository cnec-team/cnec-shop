import { escapeHtml } from './email-utils'
import { getUnsubscribeUrl } from './unsubscribe'
import { COLORS, FONT_FAMILY, FONT_SIZE, SPACING } from './email-design-system'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cnecshop.com'

export function getEmailFooter(recipientEmail: string): string {
  const unsubUrl = getUnsubscribeUrl(recipientEmail)
  return `
<div style="margin-top:${SPACING.XL};padding:${SPACING.LG} 0;border-top:1px solid ${COLORS.BORDER};font-family:${FONT_FAMILY};">
  <p style="margin:0 0 12px;font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};line-height:1.6">
    본 메일은 크넥샵 서비스 이용자에게 발송되는 안내 메일이에요.
  </p>
  <p style="margin:0 0 12px;font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};line-height:1.6">
    주식회사 하우파파 (HOWPAPA Inc.) &middot; 대표 박현용<br>
    서울특별시 &middot; 문의 support@cnecshop.com
  </p>
  <p style="margin:0 0 16px;font-size:${FONT_SIZE.SMALL};line-height:1.6">
    <a href="${escapeHtml(unsubUrl)}" style="color:${COLORS.TEXT_TERTIARY};text-decoration:underline">수신거부</a>
    <span style="color:${COLORS.BORDER};margin:0 6px">&middot;</span>
    <a href="${SITE_URL}/ko/terms" style="color:${COLORS.TEXT_TERTIARY};text-decoration:underline">이용약관</a>
    <span style="color:${COLORS.BORDER};margin:0 6px">&middot;</span>
    <a href="${SITE_URL}/ko/privacy" style="color:${COLORS.TEXT_TERTIARY};text-decoration:underline">개인정보처리방침</a>
  </p>
  <p style="margin:0;font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};text-align:center">
    &copy; 2026 cnecshop &middot; Crafted for creators
  </p>
</div>`
}
