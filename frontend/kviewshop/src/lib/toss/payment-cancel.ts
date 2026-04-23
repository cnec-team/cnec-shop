import { getTossPaymentConfig } from './payment-env'

/**
 * 토스페이먼츠 결제 취소 API 호출
 * 재시도: 네트워크/타임아웃만 3회, 1초 간격
 */
export async function cancelTossPayment(params: {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
}): Promise<{ success: true; transactionKey: string; cancelAmount: number } | { success: false; error: string }> {
  const { secretKey, apiBase } = getTossPaymentConfig()
  const auth = Buffer.from(secretKey + ':').toString('base64')

  const body: Record<string, unknown> = { cancelReason: params.cancelReason }
  if (params.cancelAmount) body.cancelAmount = params.cancelAmount

  let lastError = ''

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${apiBase}/payments/${params.paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        const cancel = data.cancels?.[data.cancels.length - 1]
        return {
          success: true,
          transactionKey: cancel?.transactionKey || 'unknown',
          cancelAmount: cancel?.cancelAmount || params.cancelAmount || data.totalAmount || 0,
        }
      }

      const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
      lastError = errorData.message || `HTTP ${res.status}`

      // 영구 실패 (이미 취소, 금액 초과 등) → 즉시 반환
      if (res.status === 400 || res.status === 403 || res.status === 409) {
        return { success: false, error: lastError }
      }

      if (attempt < 3) await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error'
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000))
    }
  }

  return { success: false, error: `3회 재시도 실패: ${lastError}` }
}
