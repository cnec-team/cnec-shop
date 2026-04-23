/**
 * 크넥샵 이메일 재사용 컴포넌트
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
  return '₩' + amount.toLocaleString('ko-KR')
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

// ────────────────────────────── 1. emailWrapper ──────────────────────────────

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

// ────────────────────────────── 2. emailHeader ──────────────────────────────

export function emailHeader(title?: string): string {
  return `<tr><td style="background:${COLORS.BRAND_PRIMARY};padding:18px ${SPACING.XL};height:60px;vertical-align:middle">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="color:${COLORS.BG_WHITE};font-size:18px;font-weight:${FONT_WEIGHT.BOLD};font-family:${FONT_FAMILY}">크넥샵</td>
${title ? `<td align="right" style="color:rgba(255,255,255,0.8);font-size:${FONT_SIZE.SMALL};font-family:${FONT_FAMILY}">${escapeHtml(title)}</td>` : ''}
</tr>
</table>
</td></tr>`
}

// ────────────────────────────── 3. emailHero ──────────────────────────────

export function emailHero(title: string, subtitle?: string): string {
  return `<tr><td class="email-padding" style="padding:${SPACING.XL} ${SPACING.XL} ${SPACING.LG}">
<h1 style="margin:0;font-size:${FONT_SIZE.H1};font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.TEXT_PRIMARY};line-height:1.4;font-family:${FONT_FAMILY}">${escapeHtml(title)}</h1>
${subtitle ? `<p style="margin:${SPACING.SM} 0 0;font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_SECONDARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${escapeHtml(subtitle)}</p>` : ''}
</td></tr>`
}

// ────────────────────────────── 4. emailInfoTable ──────────────────────────────

export function emailInfoTable(rows: { label: string; value: string; emphasis?: boolean }[]): string {
  const tableRows = rows.map((row) => {
    const valueStyle = row.emphasis
      ? `font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.TEXT_PRIMARY}`
      : `color:${COLORS.TEXT_PRIMARY}`
    return `<tr>
<td style="padding:12px 16px;background:${COLORS.BG_GRAY};width:30%;font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_SECONDARY};font-family:${FONT_FAMILY};border-bottom:1px solid ${COLORS.BORDER};vertical-align:top">${escapeHtml(row.label)}</td>
<td style="padding:12px 16px;width:70%;font-size:${FONT_SIZE.BODY};${valueStyle};font-family:${FONT_FAMILY};border-bottom:1px solid ${COLORS.BORDER};vertical-align:top">${escapeHtml(row.value)}</td>
</tr>`
  }).join('')

  return `<tr><td class="email-padding" style="padding:0 ${SPACING.XL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORS.BORDER};border-radius:8px;overflow:hidden;border-collapse:separate">
${tableRows}
</table>
</td></tr>`
}

// ────────────────────────────── 5. emailAmountBox ──────────────────────────────

export function emailAmountBox(label: string, amount: number, sublabel?: string): string {
  return `<tr><td class="email-padding" style="padding:${SPACING.MD} ${SPACING.XL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.BRAND_PRIMARY_LIGHT};border-radius:8px">
<tr><td style="padding:${SPACING.LG};text-align:center">
<div style="font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};font-family:${FONT_FAMILY};margin-bottom:${SPACING.XS}">${escapeHtml(label)}</div>
<div style="font-size:28px;font-weight:${FONT_WEIGHT.BOLD};color:${COLORS.BRAND_PRIMARY};font-family:${FONT_FAMILY}">${formatKRW(amount)}</div>
${sublabel ? `<div style="font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_SECONDARY};font-family:${FONT_FAMILY};margin-top:${SPACING.XS}">${escapeHtml(sublabel)}</div>` : ''}
</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── 6. emailButton ──────────────────────────────

export function emailButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const escaped = safeUrl(url)
  const isPrimary = variant === 'primary'
  const bgColor = isPrimary ? COLORS.BRAND_PRIMARY : COLORS.BG_WHITE
  const textColor = isPrimary ? COLORS.BG_WHITE : COLORS.BRAND_PRIMARY
  const border = isPrimary ? 'none' : `1px solid ${COLORS.BORDER}`

  return `<tr><td class="email-padding" style="padding:${SPACING.MD} ${SPACING.XL}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="email-button-full">
<tr><td align="center" style="border-radius:8px;background:${bgColor};border:${border}">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escaped}" style="height:48px;v-text-anchor:middle;width:200px" arcsize="17%" strokecolor="${isPrimary ? bgColor : COLORS.BORDER}" fillcolor="${bgColor}"><center style="color:${textColor};font-family:${FONT_FAMILY};font-size:${FONT_SIZE.BODY};font-weight:${FONT_WEIGHT.MEDIUM}"><![endif]-->
<a href="${escaped}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:${FONT_SIZE.BODY};font-weight:${FONT_WEIGHT.MEDIUM};color:${textColor};text-decoration:none;font-family:${FONT_FAMILY};line-height:1">${escapeHtml(text)}</a>
<!--[if mso]></center></v:roundrect><![endif]-->
</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── 7. emailDivider ──────────────────────────────

export function emailDivider(): string {
  return `<tr><td style="padding:${SPACING.LG} ${SPACING.XL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid ${COLORS.BORDER};font-size:0;line-height:0">&nbsp;</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── 8. emailSection ──────────────────────────────

export function emailSection(content: string, padding?: string): string {
  const pad = padding ?? `${SPACING.LG} ${SPACING.XL}`
  return `<tr><td class="email-padding" style="padding:${pad};font-family:${FONT_FAMILY};font-size:${FONT_SIZE.BODY};color:${COLORS.TEXT_PRIMARY};line-height:${LINE_HEIGHT}">
${content}
</td></tr>`
}

// ────────────────────────────── 9. emailNoticeBox ──────────────────────────────

export function emailNoticeBox(text: string, type: 'info' | 'warning' | 'danger' = 'info'): string {
  const colorMap = {
    info: { border: COLORS.BRAND_PRIMARY, bg: COLORS.BRAND_PRIMARY_LIGHT, text: COLORS.BRAND_PRIMARY_DARK },
    warning: { border: COLORS.WARNING, bg: '#FFF4EE', text: '#C44D1A' },
    danger: { border: COLORS.DANGER, bg: '#FEF3F2', text: '#B42318' },
  }
  const c = colorMap[type]

  return `<tr><td class="email-padding" style="padding:${SPACING.MD} ${SPACING.XL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:4px solid ${c.border};background:${c.bg};border-radius:0 8px 8px 0">
<tr><td style="padding:14px 16px;font-size:${FONT_SIZE.BODY};color:${c.text};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${escapeHtml(text)}</td></tr>
</table>
</td></tr>`
}

// ────────────────────────────── 10. emailMeta ──────────────────────────────

export function emailMeta(text: string): string {
  return `<tr><td class="email-padding" style="padding:${SPACING.SM} ${SPACING.XL}">
<p style="margin:0;font-size:${FONT_SIZE.SMALL};color:${COLORS.TEXT_TERTIARY};line-height:${LINE_HEIGHT};font-family:${FONT_FAMILY}">${escapeHtml(text)}</p>
</td></tr>`
}

// ────────────────────────────── 11. emailHighlightText ──────────────────────────────

export function emailHighlightText(text: string): string {
  return `<span style="color:${COLORS.BRAND_PRIMARY};font-weight:${FONT_WEIGHT.BOLD}">${escapeHtml(text)}</span>`
}
