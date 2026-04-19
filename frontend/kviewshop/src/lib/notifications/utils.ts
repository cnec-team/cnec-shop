/**
 * 알림 발송 전 전화번호/이메일 정규화 유틸
 */

export function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  // 국제번호 +82 처리
  let cleaned = phone.replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('+82')) {
    cleaned = '0' + cleaned.slice(3)
  }
  cleaned = cleaned.replace(/[^0-9]/g, '')
  if (cleaned.length < 10 || cleaned.length > 11) return undefined
  return cleaned
}

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
