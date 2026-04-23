export interface PhoneVerificationProvider {
  /** SMS 인증번호 발송 */
  sendSms(phoneNumber: string, code: string): Promise<{
    success: boolean
    error?: string
  }>
}
