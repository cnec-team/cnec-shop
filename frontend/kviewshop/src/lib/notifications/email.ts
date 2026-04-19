import { logger } from '@/lib/notifications/logger'
import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST ?? 'smtp.worksmobile.com'
const SMTP_PORT = Number(process.env.SMTP_PORT ?? '587')
const SMTP_USER = process.env.SMTP_USER ?? ''
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? ''
const EMAIL_FROM = process.env.EMAIL_FROM ?? ''

function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  })
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  if (!SMTP_USER || !SMTP_PASSWORD || !EMAIL_FROM) {
    logger.warn('SMTP 환경변수가 설정되지 않았습니다')
    return { success: false, error: 'SMTP 환경변수 누락' }
  }

  if (!params.to) {
    return { success: false, error: '수신자 이메일 없음' }
  }

  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    logger.info('이메일 발송 성공', { to: logger.mask(params.to) })
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('이메일 발송 실패', err, { to: logger.mask(params.to) })
    return { success: false, error: message }
  }
}
