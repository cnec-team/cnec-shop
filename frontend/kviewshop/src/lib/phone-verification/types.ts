export interface PhoneVerificationProvider {
  /** 인증번호 발송 */
  requestCode(phoneNumber: string): Promise<{
    success: boolean
    error?: string
    /** 서버에서 관리하는 요청 ID */
    requestId: string
  }>

  /** 인증번호 검증 */
  verifyCode(requestId: string, code: string): Promise<{
    success: boolean
    error?: string
  }>
}

export interface VerificationEntry {
  code: string
  phone: string
  expiresAt: number
  attempts: number
}
