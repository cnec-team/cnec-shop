/**
 * 브랜드 구독 결제용 토스페이먼츠 환경변수 검증
 */
export function getTossBillingConfig() {
  const required = {
    secretKey: process.env.TOSS_PAYMENTS_BILLING_SECRET_KEY,
    webhookSecret: process.env.TOSS_PAYMENTS_BILLING_WEBHOOK_SECRET,
  }

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    const names: Record<string, string> = {
      secretKey: 'TOSS_PAYMENTS_BILLING_SECRET_KEY',
      webhookSecret: 'TOSS_PAYMENTS_BILLING_WEBHOOK_SECRET',
    }
    throw new Error(
      `[TossPayments Billing] 환경변수 누락: ${missing.map((m) => names[m]).join(', ')}`
    )
  }

  return {
    secretKey: required.secretKey!,
    webhookSecret: required.webhookSecret!,
    mode: (process.env.PAYMENT_MODE ?? 'test') as 'test' | 'live',
    apiBase: 'https://api.tosspayments.com/v1',
  }
}
