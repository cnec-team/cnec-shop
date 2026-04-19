'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function UnsubscribeForm() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.ok ? setStatus('success') : setStatus('error'))
      .catch(() => setStatus('error'))
  }, [token])

  if (status === 'loading') return <p className="text-center py-20">처리 중...</p>

  if (status === 'success') return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold mb-4">수신거부가 완료되었어요</h1>
      <p className="text-gray-600 mb-2">앞으로 마케팅 이메일을 발송하지 않아요.</p>
      <p className="text-sm text-gray-500">
        단, 주문/배송/정산 등 거래 관련 필수 알림은 계속 발송됩니다.
      </p>
    </div>
  )

  if (status === 'invalid') return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold mb-4 text-red-600">잘못된 링크</h1>
      <p className="text-gray-600">유효하지 않은 수신거부 링크입니다.</p>
    </div>
  )

  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold mb-4 text-red-600">오류가 발생했어요</h1>
      <p className="text-gray-600">링크가 만료되었거나 유효하지 않아요.</p>
    </div>
  )
}
