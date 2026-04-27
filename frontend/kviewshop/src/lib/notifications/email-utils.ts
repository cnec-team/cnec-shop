/**
 * 이메일 HTML XSS 방지 유틸
 */

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function escapeVariables(variables: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(variables).map(([k, v]) => [k, escapeHtml(v)])
  )
}

export function safeUrl(url: string): string {
  if (/^(javascript|data|vbscript):/i.test(url)) return '#'
  return escapeHtml(url)
}
