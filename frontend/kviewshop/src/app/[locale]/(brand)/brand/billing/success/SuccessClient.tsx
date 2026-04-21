'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function SuccessClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'confirming' | 'success' | 'failed'>(
    'confirming'
  )
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = params.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setStatus('failed')
      setErrorMsg('필수 정보가 빠졌어요')
      return
    }

    fetch('/api/billing/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success) {
          setStatus('success')
          setTimeout(() => router.push('/ko/brand/pricing'), 3000)
        } else {
          setStatus('failed')
          setErrorMsg(data.error ?? '결제 승인에 실패했어요')
        }
      })
      .catch((err) => {
        setStatus('failed')
        setErrorMsg(err instanceof Error ? err.message : '알 수 없는 오류')
      })
  }, [params, router])

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {status === 'confirming' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">결제를 확정하고 있어요</h1>
          <p className="text-muted-foreground">잠시만 기다려주세요...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-emerald-600">
            결제가 완료됐어요!
          </h1>
          <p className="text-muted-foreground">
            잠시 후 가격 페이지로 이동해요.
          </p>
        </>
      )}
      {status === 'failed' && (
        <>
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            결제 확정에 실패했어요
          </h1>
          <p className="text-muted-foreground mb-2">{errorMsg}</p>
          <p className="text-sm text-muted-foreground mb-6">
            결제가 이루어졌다면 자동 환불되거나 고객센터로 문의해주세요.
          </p>
          <a href="/ko/brand/pricing" className="underline">
            가격 페이지로 돌아가기
          </a>
        </>
      )}
    </div>
  )
}
