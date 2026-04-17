import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}

const FROM_NAME = process.env.RESEND_FROM_NAME || '크넥샵'
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'noreply@cnecshop.com'
const FROM_FIELD = `${FROM_NAME} <${FROM_ADDRESS}>`
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com'

function renderProposalEmailHtml(params: {
  creatorName: string
  brandName: string
  proposalType: 'GONGGU' | 'PRODUCT_PICK'
  campaignOrProductName: string
  messageBody: string
  acceptUrl: string
}): string {
  const typeLabel = params.proposalType === 'GONGGU' ? '공구 초대' : '상품 추천 요청'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:20px;color:#111;">크넥샵</h1>
  </div>
  <h2 style="font-size:18px;color:#333;">새로운 ${typeLabel}이 도착했어요</h2>
  <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0 0 4px;font-weight:600;">${params.brandName}</p>
    <p style="margin:0;font-size:14px;color:#666;">${params.campaignOrProductName}</p>
  </div>
  ${params.messageBody ? `<div style="padding:12px 0;font-size:14px;color:#333;white-space:pre-wrap;line-height:1.6;">${params.messageBody}</div>` : ''}
  <div style="text-align:center;margin:24px 0;">
    <a href="${params.acceptUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;">자세히 보기</a>
  </div>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="font-size:11px;color:#999;text-align:center;">
    답장하시려면 <a href="${SITE_URL}" style="color:#2563eb;">크넥샵에 가입</a>해주세요.<br>
    본 메일은 크넥샵에서 발송되었습니다. | <a href="mailto:${FROM_ADDRESS}" style="color:#999;">문의</a>
  </p>
</div>
</body>
</html>`
}

export async function sendProposalEmail(params: {
  to: string
  creatorName: string
  brandName: string
  proposalType: 'GONGGU' | 'PRODUCT_PICK'
  campaignOrProductName: string
  messageBody: string
  acceptUrl: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[sendProposalEmail] RESEND_API_KEY not set')
    return { success: false, error: 'RESEND_API_KEY not set' }
  }

  try {
    const result = await getResend().emails.send({
      from: FROM_FIELD,
      to: params.to,
      subject: params.proposalType === 'GONGGU'
        ? `[${params.brandName}] 공구 초대가 도착했어요`
        : `[${params.brandName}] 상품 추천 요청이 도착했어요`,
      html: renderProposalEmailHtml(params),
      replyTo: FROM_ADDRESS,
    })
    return { success: true, id: result.data?.id }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[sendProposalEmail]', message)
    return { success: false, error: message }
  }
}

function renderBulkReportHtml(params: {
  brandName: string
  sentCount: number
  failedCount: number
  channelBreakdown: Record<string, number>
  paidCount: number
  paidAmount: number
  reportLink: string
}): string {
  const channels = Object.entries(params.channelBreakdown)
    .map(([ch, count]) => `<li>${ch}: ${count}건</li>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;">
  <h1 style="font-size:20px;color:#111;">크넥샵</h1>
  <h2 style="font-size:16px;">일괄 발송 완료</h2>
  <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0;font-size:14px;">총 발송: <strong>${params.sentCount}건</strong></p>
    ${params.failedCount > 0 ? `<p style="margin:4px 0 0;font-size:14px;color:#dc2626;">실패: ${params.failedCount}건</p>` : ''}
  </div>
  <h3 style="font-size:14px;">채널별 발송</h3>
  <ul style="font-size:13px;color:#666;">${channels}</ul>
  ${params.paidCount > 0 ? `<p style="font-size:13px;">유료 발송: ${params.paidCount}건 x 500원 = <strong>${params.paidAmount.toLocaleString()}원</strong></p>` : ''}
  <div style="text-align:center;margin:24px 0;">
    <a href="${params.reportLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;">발송 내역 보기</a>
  </div>
  <p style="font-size:11px;color:#999;text-align:center;">본 메일은 크넥샵에서 자동 발송되었습니다.</p>
</div>
</body>
</html>`
}

export async function sendBulkReportEmail(params: {
  to: string
  brandName: string
  sentCount: number
  failedCount: number
  channelBreakdown: Record<string, number>
  paidCount: number
  paidAmount: number
  reportLink: string
}): Promise<{ success: boolean; id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[sendBulkReportEmail] RESEND_API_KEY not set')
    return { success: false }
  }

  try {
    const result = await getResend().emails.send({
      from: FROM_FIELD,
      to: params.to,
      subject: `[크넥샵] 일괄 발송 완료 — ${params.sentCount}건 전송`,
      html: renderBulkReportHtml(params),
    })
    return { success: true, id: result.data?.id }
  } catch (error: unknown) {
    console.error('[sendBulkReportEmail]', error)
    return { success: false }
  }
}
