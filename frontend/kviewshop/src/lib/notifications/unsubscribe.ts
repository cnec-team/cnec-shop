import crypto from 'crypto'

const SECRET = process.env.UNSUBSCRIBE_SECRET
  ?? process.env.NEXTAUTH_SECRET
  ?? 'fallback-dev-only'

export function generateUnsubscribeToken(email: string, category: string = 'all'): string {
  const payload = `${email}:${category}:${Date.now()}`
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${hmac}`).toString('base64url')
}

export function verifyUnsubscribeToken(token: string): { email: string; category: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 4) return null
    const [email, category, timestamp, hmac] = parts

    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(`${email}:${category}:${timestamp}`)
      .digest('hex')

    if (hmac.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))) {
      return null
    }

    // 30일 만료
    const ts = parseInt(timestamp, 10)
    if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null

    return { email, category }
  } catch {
    return null
  }
}

export function getUnsubscribeUrl(email: string, category: string = 'all'): string {
  const token = generateUnsubscribeToken(email, category)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cnecshop.com'
  return `${base}/ko/unsubscribe?token=${token}`
}
