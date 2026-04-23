import { escapeHtml, safeUrl } from './email-utils'
import { getEmailFooter } from './email-footer'

export const KAKAO_TEMPLATES = {
  ORDER_COMPLETE: 'CNECSHOP_001',
  SHIPPING_START: 'CNECSHOP_002',
  DELIVERY_COMPLETE: 'CNECSHOP_003',
  NEW_ORDER_BRAND: 'CNECSHOP_004',
  INVOICE_REMINDER: 'CNECSHOP_005',
  SALE_OCCURRED: 'CNECSHOP_006',
  CAMPAIGN_APPROVED: 'CNECSHOP_007',
  CAMPAIGN_STARTED: 'CNECSHOP_008',
  TRIAL_APPROVED: 'CNECSHOP_009',
  TRIAL_SHIPPED: 'CNECSHOP_010',
  TRIAL_REQUESTED: 'CNECSHOP_011',
  SETTLEMENT_CONFIRMED: 'CNECSHOP_012',
  PROPOSAL_GONGGU: 'CNECSHOP_013',
  PROPOSAL_PRODUCT_PICK: 'CNECSHOP_014',
  CREATOR_APPLICATION_SUBMITTED: 'CNECSHOP_015',
  CREATOR_APPROVED: 'CNECSHOP_016',
  CREATOR_REJECTED: 'CNECSHOP_017',
} as const

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cnecshop.com'

function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

function emailLayout(body: string, recipientEmail?: string): string {
  const footer = recipientEmail ? getEmailFooter(recipientEmail) : ''
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#2563EB;padding:24px 32px">
<span style="color:#ffffff;font-size:20px;font-weight:700">크넥샵</span>
</td></tr>
<tr><td style="padding:32px 24px">
${body}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px">
크넥샵 | cnecshop.com
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function infoBox(content: string): string {
  return `<div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">${content}</div>`
}

function ctaButton(text: string, url: string): string {
  const escaped = safeUrl(url)
  return `<div style="text-align:center;margin:24px 0">
<a href="${escaped}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px">${escapeHtml(text)}</a>
</div>`
}

function earningsBox(label: string, amount: number): string {
  return `<div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:16px 0;text-align:center">
<div style="color:#166534;font-size:13px;margin-bottom:4px">${escapeHtml(label)}</div>
<div style="color:#166534;font-size:24px;font-weight:700">${formatPrice(amount)}</div>
</div>`
}

// ---------- 1. 주문 완료 → 구매자 ----------

export function orderCompleteMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  totalAmount: number
  recipientEmail?: string
  orderLinkUrl?: string
}) {
  const v = {
    buyerName: escapeHtml(data.buyerName),
    orderNumber: escapeHtml(data.orderNumber),
    productName: escapeHtml(data.productName),
  }
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const kakaoMsg = `[크넥샵] 주문 완료\n\n${data.buyerName}님, 주문이 완료되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n결제금액: ${formatPrice(data.totalAmount)}\n\n배송이 시작되면 알려드리겠습니다.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.ORDER_COMPLETE, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 주문이 완료되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.buyerName}님, 주문이 완료되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName}</div>
          <div><strong>결제금액</strong>: ${formatPrice(data.totalAmount)}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">배송이 시작되면 알림을 보내드리겠습니다.</p>
        ${ctaButton('주문 상세보기', `${SITE_URL}${linkUrl}`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '주문이 완료되었습니다',
      message: `${data.productName} - ${formatPrice(data.totalAmount)}`,
      linkUrl,
    },
  }
}

// ---------- 2. 배송 시작 → 구매자 ----------

export function shippingStartMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  trackingNumber?: string
  courierName?: string
  recipientEmail?: string
  orderLinkUrl?: string
}) {
  const v = {
    buyerName: escapeHtml(data.buyerName),
    orderNumber: escapeHtml(data.orderNumber),
    productName: escapeHtml(data.productName),
    courierName: escapeHtml(data.courierName ?? ''),
    trackingNumber: escapeHtml(data.trackingNumber ?? ''),
  }
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const trackingInfo = data.trackingNumber ? `\n운송장번호: ${data.trackingNumber}` : ''
  const courierInfo = data.courierName ? `\n택배사: ${data.courierName}` : ''
  const kakaoMsg = `[크넥샵] 배송 시작\n\n${data.buyerName}님, 상품이 발송되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}${courierInfo}${trackingInfo}`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SHIPPING_START, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 상품이 발송되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.buyerName}님, 상품이 발송되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName}</div>
          ${data.courierName ? `<div style="margin-bottom:8px"><strong>택배사</strong>: ${v.courierName}</div>` : ''}
          ${data.trackingNumber ? `<div><strong>운송장번호</strong>: ${v.trackingNumber}</div>` : ''}
        `)}
        ${ctaButton('배송 추적하기', `${SITE_URL}${linkUrl}`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SHIPPING',
      title: '상품이 발송되었습니다',
      message: `${data.productName}${data.trackingNumber ? ` (운송장: ${data.trackingNumber})` : ''}`,
      linkUrl,
    },
  }
}

// ---------- 3. 배송 완료 → 구매자 ----------

export function deliveryCompleteMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  recipientEmail?: string
  orderLinkUrl?: string
}) {
  const v = {
    buyerName: escapeHtml(data.buyerName),
    orderNumber: escapeHtml(data.orderNumber),
    productName: escapeHtml(data.productName),
  }
  const linkUrl = data.orderLinkUrl ?? '/buyer/reviews'
  const kakaoMsg = `[크넥샵] 배송 완료\n\n${data.buyerName}님, 상품이 배달 완료되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n\n상품이 마음에 드셨다면 리뷰를 남겨주세요!`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.DELIVERY_COMPLETE, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 배송이 완료되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.buyerName}님, 배송이 완료되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div><strong>상품</strong>: ${v.productName}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">상품이 마음에 드셨다면 리뷰를 남겨주세요!</p>
        ${ctaButton('리뷰 작성하기', `${SITE_URL}${linkUrl}`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'DELIVERY',
      title: '배송이 완료되었습니다',
      message: `${data.productName} - 리뷰를 남겨주세요!`,
      linkUrl,
    },
  }
}

// ---------- 4. 주문 발생 → 브랜드 ----------

export function newOrderBrandMessage(data: {
  brandName: string
  orderNumber: string
  productName: string
  quantity: number
  totalAmount: number
  buyerName: string
  recipientEmail?: string
}) {
  const v = {
    brandName: escapeHtml(data.brandName),
    orderNumber: escapeHtml(data.orderNumber),
    productName: escapeHtml(data.productName),
    buyerName: escapeHtml(data.buyerName),
  }
  const kakaoMsg = `[크넥샵] 새 주문 발생\n\n${data.brandName}님, 새로운 주문이 들어왔습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName} x ${data.quantity}\n결제금액: ${formatPrice(data.totalAmount)}\n구매자: ${data.buyerName}`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.NEW_ORDER_BRAND, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 새 주문이 접수되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">새 주문이 접수되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName} x ${data.quantity}</div>
          <div style="margin-bottom:8px"><strong>결제금액</strong>: ${formatPrice(data.totalAmount)}</div>
          <div><strong>구매자</strong>: ${v.buyerName}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">빠른 배송 준비를 부탁드립니다.</p>
        ${ctaButton('주문 관리하기', `${SITE_URL}/brand/orders`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '새 주문이 접수되었습니다',
      message: `${data.productName} x ${data.quantity} - ${formatPrice(data.totalAmount)}`,
      linkUrl: '/brand/orders',
    },
  }
}

// ---------- 5. 송장 미입력 → 브랜드 ----------

export function invoiceReminderMessage(data: {
  brandName: string
  orderNumber: string
  productName: string
  orderDate: string
  recipientEmail?: string
}) {
  const v = {
    brandName: escapeHtml(data.brandName),
    orderNumber: escapeHtml(data.orderNumber),
    productName: escapeHtml(data.productName),
    orderDate: escapeHtml(data.orderDate),
  }
  const kakaoMsg = `[크넥샵] 송장 입력 요청\n\n${data.brandName}님, 아직 송장이 입력되지 않은 주문이 있습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n주문일: ${data.orderDate}\n\n빠른 배송 처리를 부탁드립니다.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.INVOICE_REMINDER, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 송장 입력을 완료해주세요 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">송장 입력이 필요합니다</h2>
        <p style="color:#6b7280;font-size:14px">아래 주문의 송장이 아직 입력되지 않았습니다.</p>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName}</div>
          <div><strong>주문일</strong>: ${v.orderDate}</div>
        `)}
        ${ctaButton('송장 입력하기', `${SITE_URL}/brand/orders`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '송장 입력을 완료해주세요',
      message: `${data.orderNumber} - ${data.productName}`,
      linkUrl: '/brand/orders',
    },
  }
}

// ---------- 6. 판매 발생 → 크리에이터 ----------

export function saleOccurredMessage(data: {
  creatorName: string
  productName: string
  orderAmount: number
  commissionAmount: number
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    productName: escapeHtml(data.productName),
  }
  const kakaoMsg = `[크넥샵] 판매 발생\n\n${data.creatorName}님, 내 샵에서 판매가 발생했습니다!\n\n상품: ${data.productName}\n판매금액: ${formatPrice(data.orderAmount)}\n내 수익: ${formatPrice(data.commissionAmount)}`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SALE_OCCURRED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 판매가 발생했습니다! (+${formatPrice(data.commissionAmount)})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 판매가 발생했습니다!</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName}</div>
          <div><strong>판매금액</strong>: ${formatPrice(data.orderAmount)}</div>
        `)}
        ${earningsBox('내 수익', data.commissionAmount)}
        ${ctaButton('판매 현황 보기', `${SITE_URL}/creator/sales`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SALE',
      title: '판매가 발생했습니다!',
      message: `${data.productName} - 내 수익 ${formatPrice(data.commissionAmount)}`,
      linkUrl: '/creator/sales',
    },
  }
}

// ---------- 7. 캠페인 승인 → 크리에이터 ----------

export function campaignApprovedMessage(data: {
  creatorName: string
  brandName: string
  campaignTitle: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    brandName: escapeHtml(data.brandName),
    campaignTitle: escapeHtml(data.campaignTitle),
  }
  const kakaoMsg = `[크넥샵] 캠페인 참여 승인\n\n${data.creatorName}님, 캠페인 참여가 승인되었습니다.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignTitle}\n\n이제 해당 상품을 내 샵에서 판매할 수 있습니다.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CAMPAIGN_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 캠페인 참여가 승인되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 캠페인 참여가 승인되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>브랜드</strong>: ${v.brandName}</div>
          <div><strong>캠페인</strong>: ${v.campaignTitle}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">이제 해당 상품을 내 샵에서 판매할 수 있습니다.</p>
        ${ctaButton('내 샵 확인하기', `${SITE_URL}/creator/shop`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '캠페인 참여가 승인되었습니다',
      message: `${data.brandName} - ${data.campaignTitle}`,
      linkUrl: '/creator/campaigns',
    },
  }
}

// ---------- 8. 캠페인 시작 → 크리에이터 ----------

export function campaignStartedMessage(data: {
  creatorName: string
  brandName: string
  campaignTitle: string
  endDate?: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    brandName: escapeHtml(data.brandName),
    campaignTitle: escapeHtml(data.campaignTitle),
    endDate: escapeHtml(data.endDate ?? ''),
  }
  const endInfo = data.endDate ? `\n종료일: ${data.endDate}` : ''
  const kakaoMsg = `[크넥샵] 캠페인 시작\n\n${data.creatorName}님, 참여 중인 캠페인이 시작되었습니다.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignTitle}${endInfo}\n\n지금부터 판매가 가능합니다!`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CAMPAIGN_STARTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 캠페인이 시작되었습니다 - ${data.campaignTitle}`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">캠페인이 시작되었습니다!</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>브랜드</strong>: ${v.brandName}</div>
          <div style="margin-bottom:8px"><strong>캠페인</strong>: ${v.campaignTitle}</div>
          ${data.endDate ? `<div><strong>종료일</strong>: ${v.endDate}</div>` : ''}
        `)}
        <p style="color:#6b7280;font-size:14px">지금부터 판매가 가능합니다. 내 팔로워들에게 공유해보세요!</p>
        ${ctaButton('내 샵 확인하기', `${SITE_URL}/creator/shop`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '캠페인이 시작되었습니다',
      message: `${data.brandName} - ${data.campaignTitle}`,
      linkUrl: '/creator/campaigns',
    },
  }
}

// ---------- 9. 체험 승인 → 크리에이터 ----------

export function trialApprovedMessage(data: {
  creatorName: string
  brandName: string
  productName: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    brandName: escapeHtml(data.brandName),
    productName: escapeHtml(data.productName),
  }
  const kakaoMsg = `[크넥샵] 체험 신청 승인\n\n${data.creatorName}님, 체험 신청이 승인되었습니다.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}\n\n곧 체험 상품이 발송될 예정입니다.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 체험 신청이 승인되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 체험 신청이 승인되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>브랜드</strong>: ${v.brandName}</div>
          <div><strong>상품</strong>: ${v.productName}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">곧 체험 상품이 발송될 예정입니다.</p>
        ${ctaButton('체험 현황 보기', `${SITE_URL}/creator/trial/my`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '체험 신청이 승인되었습니다',
      message: `${data.brandName} - ${data.productName}`,
      linkUrl: '/creator/trial/my',
    },
  }
}

// ---------- 10. 체험 발송 → 크리에이터 ----------

export function trialShippedMessage(data: {
  creatorName: string
  brandName: string
  productName: string
  trackingNumber?: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    brandName: escapeHtml(data.brandName),
    productName: escapeHtml(data.productName),
    trackingNumber: escapeHtml(data.trackingNumber ?? ''),
  }
  const trackingInfo = data.trackingNumber ? `\n운송장번호: ${data.trackingNumber}` : ''
  const kakaoMsg = `[크넥샵] 체험 상품 발송\n\n${data.creatorName}님, 체험 상품이 발송되었습니다.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}${trackingInfo}`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_SHIPPED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 체험 상품이 발송되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">체험 상품이 발송되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>브랜드</strong>: ${v.brandName}</div>
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName}</div>
          ${data.trackingNumber ? `<div><strong>운송장번호</strong>: ${v.trackingNumber}</div>` : ''}
        `)}
        ${ctaButton('체험 현황 보기', `${SITE_URL}/creator/trial/my`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '체험 상품이 발송되었습니다',
      message: `${data.brandName} - ${data.productName}`,
      linkUrl: '/creator/trial/my',
    },
  }
}

// ---------- 11. 체험 신청 접수 → 브랜드 ----------

export function trialRequestedMessage(data: {
  brandName: string
  creatorName: string
  productName: string
  recipientEmail?: string
}) {
  const v = {
    brandName: escapeHtml(data.brandName),
    creatorName: escapeHtml(data.creatorName),
    productName: escapeHtml(data.productName),
  }
  const kakaoMsg = `[크넥샵] 체험 신청 접수\n\n${data.brandName}님, 새로운 체험 신청이 접수되었습니다.\n\n크리에이터: ${data.creatorName}\n상품: ${data.productName}\n\n승인 여부를 결정해주세요.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_REQUESTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 새 체험 신청이 접수되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">새 체험 신청이 접수되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>크리에이터</strong>: ${v.creatorName}</div>
          <div><strong>상품</strong>: ${v.productName}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">승인 여부를 결정해주세요.</p>
        ${ctaButton('체험 신청 관리', `${SITE_URL}/brand/trial`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '새 체험 신청이 접수되었습니다',
      message: `${data.creatorName} - ${data.productName}`,
      linkUrl: '/brand/trial',
    },
  }
}

// ---------- 12. 정산 확정 → 크리에이터 ----------

export function settlementConfirmedMessage(data: {
  creatorName: string
  period: string
  netAmount: number
  paymentDate: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    period: escapeHtml(data.period),
    paymentDate: escapeHtml(data.paymentDate),
  }
  const kakaoMsg = `[크넥샵] 정산 확정\n\n${data.creatorName}님, ${data.period} 정산이 확정되었습니다.\n\n정산금액: ${formatPrice(data.netAmount)}\n입금예정일: ${data.paymentDate}`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SETTLEMENT_CONFIRMED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.period} 정산이 확정되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 정산이 확정되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>정산 기간</strong>: ${v.period}</div>
          <div><strong>입금예정일</strong>: ${v.paymentDate}</div>
        `)}
        ${earningsBox('정산 금액', data.netAmount)}
        ${ctaButton('정산 내역 보기', `${SITE_URL}/creator/settlements`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SETTLEMENT',
      title: '정산이 확정되었습니다',
      message: `${data.period} - ${formatPrice(data.netAmount)}`,
      linkUrl: '/creator/settlements',
    },
  }
}

// ---------- 13. 공구 초대 → 크리에이터 ----------

export function proposalGongguInviteMessage(data: {
  creatorName: string
  brandName: string
  campaignName: string
  commissionRate?: number
  messageBody?: string
  acceptUrl: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    brandName: escapeHtml(data.brandName),
    campaignName: escapeHtml(data.campaignName),
    messageBody: escapeHtml(data.messageBody ?? ''),
  }
  const commissionInfo = data.commissionRate ? `\n커미션: ${data.commissionRate}%` : ''
  const kakaoMsg = `[크넥샵] 공구 초대\n\n${data.creatorName}님, 새로운 공구 초대가 도착했어요.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignName}${commissionInfo}\n\n아래 링크에서 상세 내용을 확인해주세요.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.PROPOSAL_GONGGU, message: kakaoMsg },
    email: {
      subject: `[${data.brandName}] 공구 초대가 도착했어요`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 새로운 공구 초대가 도착했어요</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>브랜드</strong>: ${v.brandName}</div>
          <div style="margin-bottom:8px"><strong>캠페인</strong>: ${v.campaignName}</div>
          ${data.commissionRate ? `<div><strong>커미션</strong>: ${data.commissionRate}%</div>` : ''}
        `)}
        ${data.messageBody ? `<div style="padding:12px 0;font-size:14px;color:#333;white-space:pre-wrap;line-height:1.6">${v.messageBody}</div>` : ''}
        <p style="color:#6b7280;font-size:14px">답장이나 수락은 크넥샵에 로그인 후 처리해주세요.</p>
        ${ctaButton('자세히 보기', data.acceptUrl)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: `${data.brandName}에서 공구 초대가 왔어요`,
      message: `${data.campaignName} 캠페인`,
      linkUrl: '/creator/proposals',
    },
  }
}

// ---------- 14. 상품 추천 요청 → 크리에이터 ----------

export function proposalProductPickMessage(data: {
  creatorName: string
  brandName: string
  productName: string
  commissionRate?: number
  messageBody?: string
  acceptUrl: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    brandName: escapeHtml(data.brandName),
    productName: escapeHtml(data.productName),
    messageBody: escapeHtml(data.messageBody ?? ''),
  }
  const commissionInfo = data.commissionRate ? `\n커미션: ${data.commissionRate}%` : ''
  const kakaoMsg = `[크넥샵] 상품 추천 요청\n\n${data.creatorName}님, 새로운 상품 추천 요청이 도착했어요.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}${commissionInfo}\n\n내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.PROPOSAL_PRODUCT_PICK, message: kakaoMsg },
    email: {
      subject: `[${data.brandName}] 상품 추천 요청이 도착했어요`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 새로운 상품 추천 요청이 도착했어요</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>브랜드</strong>: ${v.brandName}</div>
          <div style="margin-bottom:8px"><strong>상품</strong>: ${v.productName}</div>
          ${data.commissionRate ? `<div><strong>커미션</strong>: ${data.commissionRate}%</div>` : ''}
        `)}
        ${data.messageBody ? `<div style="padding:12px 0;font-size:14px;color:#333;white-space:pre-wrap;line-height:1.6">${v.messageBody}</div>` : ''}
        <p style="color:#6b7280;font-size:14px">내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.</p>
        ${ctaButton('상품 확인하기', data.acceptUrl)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: `${data.brandName}에서 상품 추천 요청`,
      message: data.productName,
      linkUrl: '/creator/proposals',
    },
  }
}

// ---------- 15. 일괄 발송 리포트 → 브랜드 (이메일만) ----------

export function bulkSendReportMessage(data: {
  brandName: string
  sentCount: number
  failedCount: number
  channelBreakdown: Record<string, number>
  paidCount: number
  paidAmount: number
  reportLink: string
  recipientEmail?: string
}) {
  const channels = Object.entries(data.channelBreakdown)
    .map(([ch, count]) => `<div style="margin-bottom:4px">${escapeHtml(ch)}: ${count}건</div>`)
    .join('')

  return {
    kakao: null,
    email: {
      subject: `[크넥샵] 일괄 발송 완료 — ${data.sentCount}건 전송`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">일괄 발송이 완료되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>총 발송</strong>: ${data.sentCount}건</div>
          ${data.failedCount > 0 ? `<div style="margin-bottom:8px;color:#dc2626"><strong>실패</strong>: ${data.failedCount}건</div>` : ''}
        `)}
        <h3 style="font-size:14px;color:#374151;margin:16px 0 8px">채널별 발송</h3>
        <div style="font-size:13px;color:#6b7280;padding:0 8px">${channels}</div>
        ${data.paidCount > 0 ? `<p style="font-size:13px;margin-top:12px">유료 발송: ${data.paidCount}건 x 500원 = <strong>${data.paidAmount.toLocaleString()}원</strong></p>` : ''}
        ${ctaButton('발송 내역 보기', data.reportLink)}
      `, data.recipientEmail),
    },
    inApp: null,
  }
}

// ---------- 16. 크리에이터 가입 신청 완료 → 크리에이터 ----------

export function creatorApplicationSubmittedMessage(data: {
  creatorName: string
  recipientEmail?: string
}) {
  const v = { creatorName: escapeHtml(data.creatorName) }
  const kakaoMsg = `[크넥샵] 가입 신청 완료\n\n${data.creatorName}님, 크넥샵 크리에이터 가입 신청이 완료됐어요.\n\n1~2영업일 내 심사 결과를 알려드릴게요.\n승인되면 바로 내 샵을 열 수 있어요!`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_APPLICATION_SUBMITTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 크리에이터 가입 신청이 완료됐어요`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 가입 신청이 완료됐어요</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">1~2영업일 내 심사 결과를 알려드릴게요.<br/>승인되면 바로 내 샵을 열 수 있어요!</p>
        ${infoBox(`
          <div style="font-size:13px;color:#6b7280">
            <div style="margin-bottom:6px">&#x2709;&#xFE0F; 이메일로 심사 결과를 보내드려요</div>
            <div style="margin-bottom:6px">&#x1F381; 승인 시 가입 축하 3,000원 자동 지급</div>
          </div>
        `)}
        ${ctaButton('크넥샵 둘러보기', SITE_URL)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SYSTEM',
      title: '크리에이터 가입 신청이 완료됐어요',
      message: '1~2영업일 내 심사 결과를 알려드릴게요.',
      linkUrl: '/creator/pending',
    },
  }
}

// ---------- 17. 크리에이터 승인 완료 → 크리에이터 ----------

export function creatorApprovedMessage(data: {
  creatorName: string
  recipientEmail?: string
}) {
  const v = { creatorName: escapeHtml(data.creatorName) }
  const kakaoMsg = `[크넥샵] 가입 승인 완료\n\n축하드려요! ${data.creatorName}님의 크넥샵 크리에이터 가입이 승인됐어요.\n\n지금 바로 내 샵을 열어보세요.\n가입 축하 3,000원이 지급됐어요!`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 축하해요! 크리에이터 가입이 승인됐어요`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">축하드려요! ${v.creatorName}님</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">크넥샵 크리에이터 가입이 승인됐어요.<br/>지금 바로 내 샵을 열어보세요!</p>
        ${earningsBox('가입 축하 포인트', 3000)}
        ${ctaButton('내 샵 시작하기', `${SITE_URL}/creator/dashboard`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SYSTEM',
      title: '크리에이터 가입이 승인됐어요!',
      message: '지금 바로 내 샵을 열어보세요. 가입 축하 3,000원이 지급됐어요!',
      linkUrl: '/creator/dashboard',
    },
  }
}

// ---------- 18. 크리에이터 승인 거절 → 크리에이터 ----------

export function creatorRejectedMessage(data: {
  creatorName: string
  reason: string
  recipientEmail?: string
}) {
  const v = { creatorName: escapeHtml(data.creatorName), reason: escapeHtml(data.reason) }
  const kakaoMsg = `[크넥샵] 가입 심사 결과\n\n${data.creatorName}님, 아쉽게도 이번 심사에서는 승인이 어려웠어요.\n\n사유: ${data.reason}\n\n보완 후 재신청이 가능합니다.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_REJECTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 크리에이터 가입 심사 결과 안내`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 심사 결과를 안내드려요</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">아쉽게도 이번 심사에서는 승인이 어려웠어요.</p>
        ${infoBox(`<div style="font-size:14px"><strong>사유</strong>: ${v.reason}</div>`)}
        <p style="color:#6b7280;font-size:14px">정보를 보완해서 다시 신청하실 수 있어요.</p>
        ${ctaButton('재신청하기', `${SITE_URL}/creator/pending`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SYSTEM',
      title: '크리에이터 가입 심사 결과',
      message: `아쉽게도 승인이 어려웠어요. 사유: ${data.reason}`,
      linkUrl: '/creator/pending',
    },
  }
}

// ---------- 19. 브랜드 승인 → 브랜드 ----------

export function brandApprovedTemplate(data: {
  brandName: string
  recipientEmail?: string
}) {
  const v = { brandName: escapeHtml(data.brandName) }

  return {
    email: {
      subject: `[크넥샵] 브랜드 승인이 완료되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.brandName} 브랜드가 승인되었습니다</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요!</p>
        ${ctaButton('상품 등록하기', `${SITE_URL}/brand/products/new`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SYSTEM',
      title: '브랜드 승인 완료',
      message: `${data.brandName}가 승인되었어요. 지금 바로 상품을 등록해보세요!`,
      linkUrl: '/brand/products/new',
    },
  }
}

// ---------- 20. 브랜드 거절 → 브랜드 ----------

export function brandRejectedTemplate(data: {
  brandName: string
  recipientEmail?: string
}) {
  const v = { brandName: escapeHtml(data.brandName) }

  return {
    email: {
      subject: `[크넥샵] 브랜드 등록 심사 결과 안내`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.brandName} 등록이 거절되었습니다</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6">자세한 사항은 관리자에게 문의해주세요.</p>
        ${ctaButton('문의하기', `${SITE_URL}/support`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SYSTEM',
      title: '브랜드 등록 거절',
      message: `${data.brandName} 등록이 거절되었습니다. 자세한 사항은 관리자에게 문의하세요.`,
      linkUrl: '/support',
    },
  }
}

// ---------- 21. 브랜드 상태 변경 → 브랜드 ----------

export function brandStatusChangedTemplate(data: {
  brandName: string
  status: string
  recipientEmail?: string
}) {
  const v = { brandName: escapeHtml(data.brandName), status: escapeHtml(data.status) }

  return {
    email: {
      subject: `[크넥샵] 브랜드 상태가 변경되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.brandName} 상태가 변경되었습니다</h2>
        ${infoBox(`<div style="font-size:14px"><strong>변경 상태</strong>: ${v.status}</div>`)}
        <p style="color:#6b7280;font-size:14px">자세한 사항은 관리자에게 문의해주세요.</p>
        ${ctaButton('브랜드 관리', `${SITE_URL}/brand/dashboard`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'SYSTEM',
      title: '브랜드 상태 변경',
      message: `${data.brandName} 상태가 변경되었습니다.`,
      linkUrl: '/brand/dashboard',
    },
  }
}

// ---------- 22. 주문 취소 (브랜드→구매자) ----------

export function orderCancelledByBrandTemplate(data: {
  orderNumber: string
  cancelReason: string
  recipientEmail?: string
  orderLinkUrl?: string
}) {
  const v = {
    orderNumber: escapeHtml(data.orderNumber),
    cancelReason: escapeHtml(data.cancelReason),
  }
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'

  return {
    email: {
      subject: `[크넥샵] 주문이 취소되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">주문이 취소되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div><strong>취소 사유</strong>: ${v.cancelReason}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">결제하신 금액은 영업일 기준 3~5일 내 환불됩니다.</p>
        ${ctaButton('주문 상세보기', `${SITE_URL}${linkUrl}`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '주문이 취소되었어요',
      message: `주문번호 ${data.orderNumber} (사유: ${data.cancelReason})`,
      linkUrl,
    },
  }
}

// ---------- 23. 주문 취소 (브랜드→크리에이터) ----------

export function orderCancelledByBrandToCreatorTemplate(data: {
  orderNumber: string
  recipientEmail?: string
}) {
  const v = { orderNumber: escapeHtml(data.orderNumber) }

  return {
    email: {
      subject: `[크넥샵] 주문이 취소되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">주문이 취소되었습니다</h2>
        ${infoBox(`<div><strong>주문번호</strong>: ${v.orderNumber}</div>`)}
        <p style="color:#6b7280;font-size:14px">브랜드에 의해 주문이 취소되었습니다.</p>
        ${ctaButton('주문 현황 보기', `${SITE_URL}/creator/orders`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '주문이 취소되었어요',
      message: `주문번호 ${data.orderNumber}`,
      linkUrl: '/creator/orders',
    },
  }
}

// ---------- 24. 주문 취소 (구매자→브랜드) ----------

export function orderCancelledByBuyerTemplate(data: {
  orderNumber: string
  recipientEmail?: string
}) {
  const v = { orderNumber: escapeHtml(data.orderNumber) }

  return {
    email: {
      subject: `[크넥샵] 주문이 취소되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">주문이 취소되었습니다</h2>
        ${infoBox(`<div><strong>주문번호</strong>: ${v.orderNumber}</div>`)}
        <p style="color:#6b7280;font-size:14px">구매자에 의해 주문이 취소되었습니다.</p>
        ${ctaButton('주문 관리하기', `${SITE_URL}/brand/orders`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '주문이 취소됐어요',
      message: `주문 ${data.orderNumber}이 취소되었습니다.`,
      linkUrl: '/brand/orders',
    },
  }
}

// ---------- 25. 주문 취소 (구매자→크리에이터) ----------

export function orderCancelledByBuyerToCreatorTemplate(data: {
  orderNumber: string
  recipientEmail?: string
}) {
  const v = { orderNumber: escapeHtml(data.orderNumber) }

  return {
    email: {
      subject: `[크넥샵] 주문이 취소되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">주문이 취소되었습니다</h2>
        ${infoBox(`<div><strong>주문번호</strong>: ${v.orderNumber}</div>`)}
        <p style="color:#6b7280;font-size:14px">구매자에 의해 주문이 취소되었습니다.</p>
        ${ctaButton('판매 현황 보기', `${SITE_URL}/creator/sales`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '주문이 취소됐어요',
      message: `주문 ${data.orderNumber}이 취소되었습니다.`,
      linkUrl: '/creator/sales',
    },
  }
}

// ---------- 26. 교환 요청 → 브랜드 ----------

export function exchangeRequestedTemplate(data: {
  orderNumber: string
  reason: string
  recipientEmail?: string
}) {
  const v = {
    orderNumber: escapeHtml(data.orderNumber),
    reason: escapeHtml(data.reason),
  }

  return {
    email: {
      subject: `[크넥샵] 교환 신청이 접수되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">교환 신청이 접수되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div><strong>사유</strong>: ${v.reason}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">빠른 확인 부탁드립니다.</p>
        ${ctaButton('문의 관리하기', `${SITE_URL}/brand/inquiries`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '교환 신청이 접수됐어요',
      message: `주문 ${data.orderNumber} - ${data.reason}`,
      linkUrl: '/brand/inquiries',
    },
  }
}

// ---------- 27. 환불 요청 → 브랜드 ----------

export function refundRequestedTemplate(data: {
  orderNumber: string
  refundType: string
  recipientEmail?: string
}) {
  const v = {
    orderNumber: escapeHtml(data.orderNumber),
    refundType: escapeHtml(data.refundType),
  }

  return {
    email: {
      subject: `[크넥샵] 환불 신청이 접수되었습니다 (${data.orderNumber})`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">환불 신청이 접수되었습니다</h2>
        ${infoBox(`
          <div style="margin-bottom:8px"><strong>주문번호</strong>: ${v.orderNumber}</div>
          <div><strong>환불 유형</strong>: ${v.refundType}</div>
        `)}
        <p style="color:#6b7280;font-size:14px">빠른 확인 부탁드립니다.</p>
        ${ctaButton('문의 관리하기', `${SITE_URL}/brand/inquiries`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'ORDER',
      title: '환불 신청이 접수됐어요',
      message: `주문 ${data.orderNumber} - ${data.refundType} 환불`,
      linkUrl: '/brand/inquiries',
    },
  }
}

// ---------- 28. 캠페인 참여 거절 → 크리에이터 ----------

export function campaignParticipationRejectedTemplate(data: {
  creatorName: string
  campaignTitle: string
  recipientEmail?: string
}) {
  const v = {
    creatorName: escapeHtml(data.creatorName),
    campaignTitle: escapeHtml(data.campaignTitle),
  }

  return {
    email: {
      subject: `[크넥샵] 캠페인 참여가 거절되었습니다`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${v.creatorName}님, 캠페인 참여가 거절되었습니다</h2>
        ${infoBox(`<div><strong>캠페인</strong>: ${v.campaignTitle}</div>`)}
        <p style="color:#6b7280;font-size:14px">다른 캠페인에 참여해보세요.</p>
        ${ctaButton('캠페인 둘러보기', `${SITE_URL}/creator/campaigns`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '공구 참여 거절',
      message: `"${data.campaignTitle}" 참여가 거절되었습니다.`,
      linkUrl: '/creator/campaigns',
    },
  }
}

// ---------- 29. 캠페인 모집 시작 → 크리에이터 ----------

export function campaignRecruitingStartedTemplate(data: {
  campaignTitle: string
  recipientEmail?: string
}) {
  const v = { campaignTitle: escapeHtml(data.campaignTitle) }

  return {
    email: {
      subject: `[크넥샵] 새 캠페인이 오픈됐어요 - ${data.campaignTitle}`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#111827">새 캠페인이 오픈됐어요</h2>
        ${infoBox(`<div><strong>캠페인</strong>: ${v.campaignTitle}</div>`)}
        <p style="color:#6b7280;font-size:14px">지금 확인하고 참여해보세요!</p>
        ${ctaButton('캠페인 확인하기', `${SITE_URL}/creator/campaigns`)}
      `, data.recipientEmail),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '새 캠페인이 오픈됐어요',
      message: `"${data.campaignTitle}" 캠페인 모집이 시작되었어요. 지금 확인해보세요!`,
      linkUrl: '/creator/campaigns',
    },
  }
}
