/**
 * 크넥샵 이메일 마스터 템플릿
 * emailWrapper + emailHeader + sections + footer 조합
 */

import { getEmailFooter } from './email-footer'
import { COLORS, FONT_FAMILY, FONT_SIZE, LINE_HEIGHT, SPACING } from './email-design-system'
import { emailWrapper, emailHeader, emailHero, emailButton } from './email-components'

export function renderEmail(params: {
  preheader?: string
  headerTitle?: string
  heroTitle: string
  heroSubtitle?: string
  sections: string[]
  primaryAction?: { text: string; url: string }
  secondaryAction?: { text: string; url: string }
  footerNotice?: string
  recipientEmail?: string
}): string {
  const parts: string[] = []

  // 헤더
  parts.push(emailHeader(params.headerTitle))

  // 프리헤더 (메일 목록 프리뷰 텍스트, 화면에는 미노출)
  if (params.preheader) {
    parts.push(`<tr><td style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;mso-hide:all">${params.preheader}${'&nbsp;'.repeat(60)}</td></tr>`)
  }

  // 히어로
  parts.push(emailHero(params.heroTitle, params.heroSubtitle))

  // 본문 섹션들
  for (const section of params.sections) {
    parts.push(section)
  }

  // 액션 버튼
  if (params.primaryAction) {
    parts.push(emailButton(params.primaryAction.text, params.primaryAction.url, 'primary'))
  }
  if (params.secondaryAction) {
    parts.push(emailButton(params.secondaryAction.text, params.secondaryAction.url, 'secondary'))
  }

  // 푸터 안내 문구
  if (params.footerNotice) {
    parts.push(`<tr><td style="padding:${SPACING.LG} ${SPACING.XL} ${SPACING.SM}">
<p style="margin:0;font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY};text-align:center">${params.footerNotice}</p>
</td></tr>`)
  }

  // 기존 푸터 (수신거부 등)
  if (params.recipientEmail) {
    const footer = getEmailFooter(params.recipientEmail)
    parts.push(`<tr><td style="padding:0 ${SPACING.XL} ${SPACING.LG}">${footer}</td></tr>`)
  }

  return emailWrapper(parts.join('\n'))
}
