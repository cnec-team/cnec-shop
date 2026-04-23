'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Phone, CheckCircle2 } from 'lucide-react'

interface PhoneVerificationInputProps {
  phoneNumber: string
  onVerified: (data: { phoneNumber: string; verificationToken: string }) => void
  onError?: (msg: string) => void
  disabled?: boolean
}

export function PhoneVerificationInput({
  phoneNumber,
  onVerified,
  onError,
  disabled,
}: PhoneVerificationInputProps) {
  const [step, setStep] = useState<'idle' | 'sent' | 'verified'>('idle')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [requestId, setRequestId] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = () => {
    setCountdown(180) // 3분
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleRequestCode = async () => {
    const cleaned = phoneNumber.replace(/-/g, '')
    if (!cleaned || cleaned.length < 10) {
      onError?.('유효한 휴대폰 번호를 입력해주세요')
      return
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/auth/phone/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleaned }),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data.error || '인증번호 발송에 실패했어요')
        return
      }

      setRequestId(data.requestId)
      setStep('sent')
      setCode('')
      startCountdown()
    } catch {
      onError?.('인증번호 발송 중 오류가 발생했어요')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      onError?.('인증번호 6자리를 입력해주세요')
      return
    }

    setIsVerifying(true)
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, code, phoneNumber: phoneNumber.replace(/-/g, '') }),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data.error || '인증에 실패했어요')
        return
      }

      setStep('verified')
      if (timerRef.current) clearInterval(timerRef.current)
      onVerified({
        phoneNumber: phoneNumber.replace(/-/g, ''),
        verificationToken: data.verificationToken,
      })
    } catch {
      onError?.('인증 확인 중 오류가 발생했어요')
    } finally {
      setIsVerifying(false)
    }
  }

  if (step === 'verified' || disabled) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 rounded-xl bg-gray-200 px-5 h-12 text-sm font-medium text-gray-500 shrink-0"
      >
        <CheckCircle2 className="h-4 w-4" />
        인증완료
      </button>
    )
  }

  if (step === 'sent') {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="인증번호 6자리"
              className="w-full h-12 rounded-xl bg-gray-50 border-0 text-base text-center tracking-[0.3em] placeholder:tracking-normal placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              autoFocus
            />
            {countdown > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-500 font-medium">
                {formatCountdown(countdown)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={isVerifying || code.length !== 6}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 h-12 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '확인'
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={handleRequestCode}
          disabled={isSending || countdown > 150}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:text-gray-300 self-end"
        >
          {isSending ? '발송 중...' : '인증번호 재발송'}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleRequestCode}
      disabled={isSending || !phoneNumber || phoneNumber.replace(/-/g, '').length < 10}
      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 h-12 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shrink-0"
    >
      {isSending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          발송 중...
        </>
      ) : (
        <>
          <Phone className="h-4 w-4" />
          인증요청
        </>
      )}
    </button>
  )
}
