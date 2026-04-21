import { randomBytes } from 'crypto'

/**
 * 토스 orderId 생성 (6-64자, 영문/숫자/-/_)
 * 형식: {purpose}_{brandId_short}_{timestamp}_{random_16}
 */
export function generateOrderId(params: {
  purpose: 'PRO_SUB' | 'STD_CHG'
  brandId: string
}): string {
  const brandShort = params.brandId.slice(0, 8)
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString('hex')
  return `${params.purpose}_${brandShort}_${timestamp}_${random}`
}
