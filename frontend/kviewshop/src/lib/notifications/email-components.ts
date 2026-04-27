/**
 * 크넥샵 이메일 재사용 컴포넌트 V3
 * 테이블 기반 (Outlook 호환), inline style only
 */

import { escapeHtml, safeUrl } from './email-utils'
import {
  COLORS,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  LAYOUT,
  SPACING,
} from './email-design-system'

// ────────────────────────────── 유틸 ──────────────────────────────

export function formatKRW(amount: number): string {
  return '\u20A9' + amount.toLocaleString('ko-KR')
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export function formatKDate(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const day = DAY_NAMES[date.getDay()]
  const h = date.getHours()
  const min = date.getMinutes().toString().padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${y}년 ${m}월 ${d}일 (${day}) ${ampm} ${h12}:${min}`
}

// ────────────────────────────── emailWrapper ──────────────────────────────

export function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="ko" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>크넥샵</title>
<style type="text/css">
@media only screen and (max-width: 480px) {
  .email-container { width: 100% !important; min-width: 100% !important; }
  .email-padding { padding-left: 16px !important; padding-right: 16px !important; }
  .email-font-scale { font-size: 90% !important; }
  .email-button-full { width: 100% !important; text-align: center !important; }
  .email-button-full a { display: block !important; width: 100% !important; }
}
</style>
<!--[if mso]>
<style type="text/css">
table { border-collapse: collapse; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:${COLORS.BG_GRAY};font-family:${FONT_FAMILY};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.BG_GRAY};padding:${SPACING.XL} 0">
<tr><td align="center" style="padding:0 ${SPACING.MD}">
<!--[if mso]><table role="presentation" width="${LAYOUT.CONTAINER_WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="email-container" width="${LAYOUT.CONTAINER_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="max-width:${LAYOUT.CONTAINER_WIDTH}px;width:100%;background:${COLORS.BG_WHITE};border-radius:12px;overflow:hidden">
${content}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`
}

// ────────────────────────────── emailHeader V3 ──────────────────────────────

export function emailHeader(recipientType?: 'creator' | 'brand' | 'buyer' | null): string {
  const labelMap: Record<string, string> = { creator: 'for creators', brand: 'for brands' }
  const label = recipientType && labelMap[recipientType] ? labelMap[recipientType] : ''
  return `<tr><td style="padding:40px 40px 32px 40px;vertical-align:middle">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="vertical-align:middle">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="width:10px;height:10px;background:${COLORS.BRAND_PRIMARY};border-radius:3px"></td>
<td style="padding-left:8px;font-size:18px;font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.TEXT_PRIMARY};font-family:${FONT_FAMILY}">크넥샵</td>
</tr></table>
</td>
${label ? `<td align="right" style="font-size:13px;color:${COLORS.TEXT_TERTIARY};font-family:${FONT_FAMILY}">${label}</td>` : ''}
</tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailStatusBadge (V3) ──────────────────────────────

export function emailStatusBadge(text: string, variant: 'info' | 'success' | 'warning' | 'neutral'): string {
  const bgMap = { info: COLORS.PILL_BADGE_BG_INFO, success: COLORS.PILL_BADGE_BG_SUCCESS, warning: COLORS.PILL_BADGE_BG_WARNING, neutral: COLORS.PILL_BADGE_BG_NEUTRAL }
  const fgMap = { info: COLORS.PILL_BADGE_FG_INFO, success: COLORS.PILL_BADGE_FG_SUCCESS, warning: COLORS.PILL_BADGE_FG_WARNING, neutral: COLORS.PILL_BADGE_FG_NEUTRAL }
  return `<tr><td class="email-padding" style="padding:0 40px ${SPACING.SM}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td style="background:${bgMap[variant]};color:${fgMap[variant]};font-size:13px;font-weight:${FONT_WEIGHT.MEDIUM};font-family:${FONT_FAMILY};padding:6px 12px;border-radius:20px;line-height:1">${escapeHtml(text)}</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailHero ──────────────────────────────

export function emailHero(title: string, subtitle?: string): string {
  const escapedTitle = escapeHtml(title).replace(/\n/g, '<br>')
  return `<tr><td class="email-padding" style="padding:${SPACING.SM} 40px ${SPACING.LG}">
<h1 style="margin:0;font-size:${FONT_SIZE.H1};font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.TEXT_PRIMARY};line-height:1.35;font-family:${FONT_FAMILY}">${escapedTitle}</h1>
${subtitle ? `<p style="margin:${SPACING.SM} 0 0;font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_SECONDARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${escapeHtml(subtitle).replace(/\n/g, '<br>')}</p>` : ''}
</td></tr>`
}

// ────────────────────────────── emailDarkHeroCard (V3) ──────────────────────────────

export function emailDarkHeroCard(params: { label: string; title: string; subLabel?: string }): string {
  return `<tr><td class="email-padding" style="padding:${SPACING.MD} 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.DARK_CARD_BG};border-radius:12px">
<tr><td style="padding:40px 32px;text-align:center">
<div style="font-size:14px;color:${COLORS.DARK_CARD_TEXT_SECONDARY};font-family:${FONT_FAMILY};margin-bottom:${SPACING.SM}">${escapeHtml(params.label)}</div>
<div style="font-size:${FONT_SIZE.DARK_HERO};font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.BG_WHITE};font-family:${FONT_FAMILY};line-height:1.3">${escapeHtml(params.title)}</div>
${params.subLabel ? `<div style="margin-top:12px"><span style="background:rgba(255,255,255,0.12);color:${COLORS.BG_WHITE};font-size:14px;font-family:${FONT_FAMILY};padding:6px 14px;border-radius:20px;display:inline-block">${escapeHtml(params.subLabel)}</span></div>` : ''}
</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailInfoTable V3 ──────────────────────────────

export function emailInfoTable(rows: { label: string; value: string; emphasis?: boolean }[]): string {
  const tableRows = rows.map((row, i) => {
    const valueStyle = row.emphasis
      ? `font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.TEXT_PRIMARY}`
      : `color:${COLORS.TEXT_PRIMARY}`
    const borderBottom = i < rows.length - 1 ? `border-bottom:0.5px solid ${COLORS.BORDER};` : ''
    return `<tr>
<td style="padding:14px 20px;width:30%;font-size:14px;color:${COLORS.TEXT_TERTIARY};font-family:${FONT_FAMILY};${borderBottom}vertical-align:top">${escapeHtml(row.label)}</td>
<td style="padding:14px 20px;width:70%;font-size:15px;${valueStyle};font-family:${FONT_FAMILY};${borderBottom}vertical-align:top">${escapeHtml(row.value)}</td>
</tr>`
  }).join('')

  return `<tr><td class="email-padding" style="padding:${SPACING.MD} 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.BG_GRAY};border-radius:12px;overflow:hidden;border-collapse:separate">
${tableRows}
</table>
</td></tr>`
}

// ────────────────────────────── emailAmountBox V3 ──────────────────────────────

export function emailAmountBox(label: string, amount: number | string, sublabel?: string): string {
  const displayAmount = typeof amount === 'number' ? formatKRW(amount) : escapeHtml(amount)
  return `<tr><td class="email-padding" style="padding:${SPACING.MD} 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.GRADIENT_BLUE_START};background:linear-gradient(135deg,${COLORS.GRADIENT_BLUE_START},${COLORS.GRADIENT_BLUE_END});border-radius:12px">
<tr><td style="padding:32px;text-align:center">
<div style="font-size:14px;color:rgba(255,255,255,0.8);font-family:${FONT_FAMILY};margin-bottom:${SPACING.XS}">${escapeHtml(label)}</div>
<div style="font-size:40px;font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.BG_WHITE};font-family:${FONT_FAMILY};line-height:1.2">${displayAmount}</div>
${sublabel ? `<div style="margin-top:${SPACING.SM}"><span style="background:rgba(255,255,255,0.2);color:${COLORS.BG_WHITE};font-size:13px;font-family:${FONT_FAMILY};padding:4px 12px;border-radius:20px;display:inline-block">${escapeHtml(sublabel)}</span></div>` : ''}
</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailButton V3 ──────────────────────────────

export function emailButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const escaped = safeUrl(url)
  const isPrimary = variant === 'primary'
  const bgColor = isPrimary ? COLORS.BRAND_PRIMARY : COLORS.BG_GRAY
  const textColor = isPrimary ? COLORS.BG_WHITE : COLORS.TEXT_PRIMARY

  return `<tr><td class="email-padding" style="padding:${SPACING.MD} 40px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="email-button-full">
<tr><td align="center" style="border-radius:12px;background:${bgColor}">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escaped}" style="height:56px;v-text-anchor:middle;width:220px" arcsize="21%" fillcolor="${bgColor}"><center style="color:${textColor};font-family:${FONT_FAMILY};font-size:16px;font-weight:${FONT_WEIGHT.BOLD}"><![endif]-->
<a href="${escaped}" target="_blank" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:${FONT_WEIGHT.BOLD};color:${textColor};text-decoration:none;font-family:${FONT_FAMILY};line-height:1">${escapeHtml(text)}</a>
<!--[if mso]></center></v:roundrect><![endif]-->
</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailDivider ──────────────────────────────

export function emailDivider(): string {
  return `<tr><td style="padding:${SPACING.LG} 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid ${COLORS.BORDER};font-size:0;line-height:0">&nbsp;</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailSection ──────────────────────────────

export function emailSection(content: string, padding?: string): string {
  const pad = padding ?? `${SPACING.LG} 40px`
  return `<tr><td class="email-padding" style="padding:${pad};font-family:${FONT_FAMILY};font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_PRIMARY};line-height:${LINE_HEIGHT}">
${content}
</td></tr>`
}

// ────────────────────────────── emailNoticeBox V3 ──────────────────────────────

export function emailNoticeBox(text: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info'): string {
  const dotColorMap = {
    info: COLORS.BRAND_PRIMARY,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    danger: COLORS.DANGER,
  }
  return `<tr><td class="email-padding" style="padding:${SPACING.MD} 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.BG_GRAY};border-radius:12px">
<tr>
<td style="padding:16px 20px;vertical-align:top;width:18px"><div style="width:6px;height:6px;background:${dotColorMap[type]};border-radius:50%;margin-top:7px"></div></td>
<td style="padding:16px 20px 16px 0;font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_SECONDARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${text}</td>
</tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailTipBlock (V3) ──────────────────────────────

export function emailTipBlock(text: string): string {
  return `<tr><td class="email-padding" style="padding:0 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid ${COLORS.BORDER};border-bottom:1px solid ${COLORS.BORDER};padding:${SPACING.LG} 0">
<div style="font-size:12px;font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.TEXT_TERTIARY};font-family:${FONT_FAMILY};letter-spacing:1px;margin-bottom:${SPACING.SM}">TIP</div>
<div style="font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_PRIMARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${text}</div>
</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── emailMeta ──────────────────────────────

export function emailMeta(text: string): string {
  return `<tr><td class="email-padding" style="padding:${SPACING.SM} 40px">
<p style="margin:0;font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${escapeHtml(text)}</p>
</td></tr>`
}

// ────────────────────────────── emailHighlightText ──────────────────────────────

export function emailHighlightText(text: string): string {
  return `<span style="color:${COLORS.BRAND_PRIMARY};font-weight:${FONT_WEIGHT.BOLD}">${escapeHtml(text)}</span>`
}
