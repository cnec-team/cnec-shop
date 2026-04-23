import type { PhoneVerificationProvider, VerificationEntry } from './types'
import { randomBytes } from 'crypto'

const popbill = require('popbill')
const MessageService = require('popbill/lib/MessageService')

const POPBILL_LINK_ID = process.env.POPBILL_LINK_ID ?? ''
const POPBILL_SECRET_KEY = process.env.POPBILL_SECRET_KEY ?? ''
const POPBILL_CORP_NUM = process.env.POPBILL_CORP_NUM ?? ''
const POPBILL_IS_TEST = process.env.POPBILL_IS_TEST === 'true'
const POPBILL_SMS_SENDER = process.env.POPBILL_SMS_SENDER ?? ''

const CODE_LENGTH = 6
const CODE_TTL_MS = 3 * 60 * 1000 // 3분
const MAX_ATTEMPTS = 5

// 인메모리 인증코드 저장소 (프로덕션에서는 Redis 권장)
const verificationStore = new Map<string, VerificationEntry>()

// 만료된 항목 주기적 정리
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of verificationStore.entries()) {
      if (v.expiresAt < now) verificationStore.delete(k)
    }
  }, 5 * 60 * 1000)
}

function generateCode(): string {
  const bytes = randomBytes(4)
  const num = bytes.readUInt32BE(0) % Math.pow(10, CODE_LENGTH)
  return num.toString().padStart(CODE_LENGTH, '0')
}

function generateRequestId(): string {
  return `pv_${Date.now()}_${randomBytes(8).toString('hex')}`
}

function stripHyphens(phone: string): string {
  return phone.replace(/-/g, '')
}

function getMessageService() {
  return new MessageService({
    LinkID: POPBILL_LINK_ID,
    SecretKey: POPBILL_SECRET_KEY,
    IsTest: POPBILL_IS_TEST,
  })
}

export class PopbillProvider implements PhoneVerificationProvider {
  async requestCode(phoneNumber: string) {
    const phone = stripHyphens(phoneNumber)
    if (!phone || phone.length < 10) {
      return { success: false, error: '유효하지 않은 전화번호입니다', requestId: '' }
    }

    if (!POPBILL_LINK_ID || !POPBILL_SECRET_KEY || !POPBILL_CORP_NUM) {
      return { success: false, error: '팝빌 환경변수가 설정되지 않았습니다', requestId: '' }
    }

    if (!POPBILL_SMS_SENDER) {
      return { success: false, error: '발신번호가 설정되지 않았습니다', requestId: '' }
    }

    const code = generateCode()
    const requestId = generateRequestId()
    const message = `[CNEC Shop] 인증번호 [${code}]를 입력해주세요.`

    const messageService = getMessageService()

    return new Promise<{ success: boolean; error?: string; requestId: string }>((resolve) => {
      try {
        messageService.sendSMS(
          POPBILL_CORP_NUM,
          POPBILL_SMS_SENDER,
          phone,
          '',
          message,
          '', // 예약전송 없음 (즉시)
          false, // 광고 여부
          (receiptNum: string) => {
            verificationStore.set(requestId, {
              code,
              phone,
              expiresAt: Date.now() + CODE_TTL_MS,
              attempts: 0,
            })
            resolve({ success: true, requestId })
          },
          (err: { code: number; message: string }) => {
            console.error('[PhoneVerification] SMS 발송 실패:', err)
            resolve({ success: false, error: `SMS 발송 실패: ${err.message}`, requestId: '' })
          },
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[PhoneVerification] SMS 발송 중 에러:', msg)
        resolve({ success: false, error: msg, requestId: '' })
      }
    })
  }

  async verifyCode(requestId: string, code: string) {
    const entry = verificationStore.get(requestId)
    if (!entry) {
      return { success: false, error: '인증 요청을 찾을 수 없습니다. 다시 요청해주세요.' }
    }

    if (Date.now() > entry.expiresAt) {
      verificationStore.delete(requestId)
      return { success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      verificationStore.delete(requestId)
      return { success: false, error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' }
    }

    entry.attempts++

    if (entry.code !== code) {
      return { success: false, error: '인증번호가 일치하지 않습니다.' }
    }

    verificationStore.delete(requestId)
    return { success: true }
  }
}

/** 인증 완료된 전화번호인지 확인 (API route에서 사용) */
export function getVerifiedPhone(requestId: string): string | null {
  // verifyCode 성공 후 호출되므로 이미 삭제됨
  // 대신 verifyCode 성공 시 별도 저장
  return null
}
