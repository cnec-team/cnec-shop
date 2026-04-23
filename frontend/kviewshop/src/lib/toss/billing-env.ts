/**
 * 브랜드 구독 결제용 토스페이먼츠 환경변수 검증
 */
export function getTossBillingConfig() {
  const secretKey = process.env.TOSS_PAYMENTS_BILLING_SECRET_KEY
  if (!secretKey) {
    throw new Error('[TossPayments Billing] 환경변수 누락: TOSS_PAYMENTS_BILLING_SECRET_KEY')
  }

  const webhookSecret = process.env.TOSS_PAYMENTS_BILLING_WEBHOOK_SECRET ?? secretKey

  return {
    secretKey,
    webhookSecret,
    mode: (process.env.PAYMENT_MODE ?? 'test') as 'test' | 'live',
    apiBase: 'https://api.tosspayments.com/v1',
  }
}
