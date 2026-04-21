import { createHmac, timingSafeEqual } from 'crypto'
import { getTossBillingConfig } from './billing-env'

/**
 * 토스 웹훅 서명 검증 (timing-safe)
 */
export function verifyTossBillingWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false

  const { webhookSecret } = getTossBillingConfig()

  const expected = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('base64')

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)

  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
