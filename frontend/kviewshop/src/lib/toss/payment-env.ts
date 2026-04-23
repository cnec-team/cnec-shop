/**
 * 고객 상품 결제용 토스페이먼츠 환경변수 검증
 * (브랜드 구독 결제용 billing-env.ts와 분리)
 */
export function getTossPaymentConfig() {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY
  if (!secretKey) {
    throw new Error('[TossPayments] 환경변수 누락: TOSS_PAYMENTS_SECRET_KEY')
  }

  const webhookSecret = process.env.TOSS_PAYMENTS_WEBHOOK_SECRET ?? secretKey

  return {
    secretKey,
    webhookSecret,
    apiBase: 'https://api.tosspayments.com/v1',
  }
}

export function getTossPaymentClientKey(): string | null {
  return process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY ?? null
}
