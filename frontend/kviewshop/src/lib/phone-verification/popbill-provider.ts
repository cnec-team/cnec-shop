import type { PhoneVerificationProvider } from './types'

const MessageService = require('popbill/lib/MessageService')

const POPBILL_LINK_ID = process.env.POPBILL_LINK_ID ?? ''
const POPBILL_SECRET_KEY = process.env.POPBILL_SECRET_KEY ?? ''
const POPBILL_CORP_NUM = process.env.POPBILL_CORP_NUM ?? ''
const POPBILL_IS_TEST = process.env.POPBILL_IS_TEST === 'true'
const POPBILL_SMS_SENDER = process.env.POPBILL_SMS_SENDER ?? ''

function getMessageService() {
  return new MessageService({
    LinkID: POPBILL_LINK_ID,
    SecretKey: POPBILL_SECRET_KEY,
    IsTest: POPBILL_IS_TEST,
  })
}

export class PopbillProvider implements PhoneVerificationProvider {
  async sendSms(phoneNumber: string, code: string) {
    if (!POPBILL_LINK_ID || !POPBILL_SECRET_KEY || !POPBILL_CORP_NUM) {
      return { success: false, error: '팝빌 환경변수가 설정되지 않았습니다' }
    }
    if (!POPBILL_SMS_SENDER) {
      return { success: false, error: '발신번호가 설정되지 않았습니다' }
    }

    const message = `[CNEC Shop] 인증번호 [${code}]를 입력해주세요.`
    const messageService = getMessageService()

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      try {
        messageService.sendSMS(
          POPBILL_CORP_NUM,
          POPBILL_SMS_SENDER,
          phoneNumber,
          '',
          message,
          '',
          false,
          () => {
            resolve({ success: true })
          },
          (err: { code: number; message: string }) => {
            console.error('[PhoneVerification] SMS 발송 실패:', err)
            resolve({ success: false, error: `SMS 발송 실패: ${err.message}` })
          },
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[PhoneVerification] SMS 발송 중 에러:', msg)
        resolve({ success: false, error: msg })
      }
    })
  }
}
