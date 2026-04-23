import { getTossBillingConfig } from './billing-env'

export interface TossConfirmResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
  [key: string]: unknown
}

export class TossApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus: number,
    public raw: unknown
  ) {
    super(message)
    this.name = 'TossApiError'
  }
}

function getAuthHeader(): string {
  const { secretKey } = getTossBillingConfig()
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
}

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<TossConfirmResponse> {
  const { apiBase } = getTossBillingConfig()
  const res = await fetch(`${apiBase}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new TossApiError(
      data.message ?? '결제 승인에 실패했어요',
      data.code ?? 'UNKNOWN',
      res.status,
      data
    )
  }

  return data
}

export async function cancelPayment(params: {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
}): Promise<unknown> {
  const { apiBase } = getTossBillingConfig()
  const res = await fetch(`${apiBase}/payments/${params.paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: params.cancelReason,
      ...(params.cancelAmount && { cancelAmount: params.cancelAmount }),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new TossApiError(
      data.message ?? '결제 취소에 실패했어요',
      data.code ?? 'UNKNOWN',
      res.status,
      data
    )
  }
  return data
}

export interface TossPaymentDetail {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method?: string
  approvedAt?: string
  cancels?: Array<{ cancelAmount: number; cancelReason: string; canceledAt: string }>
  [key: string]: unknown
}

export async function getPayment(paymentKey: string): Promise<TossPaymentDetail> {
  const { apiBase } = getTossBillingConfig()
  const res = await fetch(`${apiBase}/payments/${paymentKey}`, {
    headers: { Authorization: getAuthHeader() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new TossApiError(
      data.message ?? '결제 조회에 실패했어요',
      data.code ?? 'NOT_FOUND',
      res.status,
      data
    )
  }
  return res.json()
}
