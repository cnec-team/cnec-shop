/**
 * 크넥샵 이메일 마스터 템플릿 V3
 * emailWrapper + emailHeader + statusBadge + hero + darkHeroCard + sections + tip + footer
 */

import { getEmailFooter } from './email-footer'
import { SPACING } from './email-design-system'
import {
  emailWrapper,
  emailHeader,
  emailStatusBadge,
  emailHero,
  emailDarkHeroCard,
  emailButton,
  emailTipBlock,
} from './email-components'

export function renderEmail(params: {
  recipientType?: 'creator' | 'brand' | 'buyer' | null
  preheader?: string
  statusBadge?: { text: string; variant: 'info' | 'success' | 'warning' | 'neutral' }
  heroTitle: string
  heroSubtitle?: string
  darkHeroCard?: { label: string; title: string; subLabel?: string }
  sections: string[]
  primaryAction?: { text: string; url: string }
  secondaryAction?: { text: string; url: string }
  tip?: string
  recipientEmail?: string
}): string {
  const parts: string[] = []

  parts.push(emailHeader(params.recipientType))

  if (params.preheader) {
    parts.push(`<tr><td style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;mso-hide:all">${params.preheader}${'&nbsp;'.repeat(60)}</td></tr>`)
  }

  if (params.statusBadge) {
    parts.push(emailStatusBadge(params.statusBadge.text, params.statusBadge.variant))
  }

  parts.push(emailHero(params.heroTitle, params.heroSubtitle))

  if (params.darkHeroCard) {
    parts.push(emailDarkHeroCard(params.darkHeroCard))
  }

  for (const section of params.sections) {
    parts.push(section)
  }

  if (params.primaryAction) {
    parts.push(emailButton(params.primaryAction.text, params.primaryAction.url, 'primary'))
  }
  if (params.secondaryAction) {
    parts.push(emailButton(params.secondaryAction.text, params.secondaryAction.url, 'secondary'))
  }

  if (params.tip) {
    parts.push(emailTipBlock(params.tip))
  }

  if (params.recipientEmail) {
    const footer = getEmailFooter(params.recipientEmail)
    parts.push(`<tr><td style="padding:0 40px ${SPACING.LG}">${footer}</td></tr>`)
  }

  return emailWrapper(parts.join('\n'))
}
