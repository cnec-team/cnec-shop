import { renderEmail } from './email-base'
import { emailInfoTable, emailAmountBox, emailNoticeBox, formatKDate, formatKRW } from './email-components'

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
  SETTLEMENT_PAID: 'CNECSHOP_026',
  SETTLEMENT_HELD: 'CNECSHOP_027',
  SETTLEMENT_CANCELLED: 'CNECSHOP_028',
} as const

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cnecshop.com'

function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
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
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const kakaoMsg = `[크넥샵] 주문 완료\n\n${data.buyerName}님, 주문이 완료되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n결제금액: ${formatPrice(data.totalAmount)}\n\n배송이 시작되면 알려드리겠습니다.`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.ORDER_COMPLETE, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 주문이 완료됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        statusBadge: { text: '주문 완료', variant: 'success' },
        darkHeroCard: { label: '주문 상품', title: data.productName, subLabel: `주문번호 ${data.orderNumber}` },
        preheader: `${data.productName} 결제가 완료됐어요. 곧 발송 시작해드릴게요`,
        heroTitle: `${data.buyerName}님, 주문이 완료됐어요`,
        heroSubtitle: '결제가 정상적으로 처리됐어요. 발송이 시작되면 운송장 번호와 함께 다시 알려드릴게요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            { label: '결제일', value: formatKDate(now) },
          ]),
          emailAmountBox('결제 금액', data.totalAmount, '결제 완료'),
          emailNoticeBox('평균 1~3일 안에 발송돼요. 주말/공휴일은 제외하고 계산해주세요.', 'info'),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        recipientEmail: data.recipientEmail,
      }),
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
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const trackingInfo = data.trackingNumber ? `\n운송장번호: ${data.trackingNumber}` : ''
  const courierInfo = data.courierName ? `\n택배사: ${data.courierName}` : ''
  const kakaoMsg = `[크넥샵] 배송 시작\n\n${data.buyerName}님, 상품이 발송되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}${courierInfo}${trackingInfo}`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SHIPPING_START, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 발송 시작! 곧 만나보세요`,
      html: renderEmail({
        recipientType: 'buyer',
        statusBadge: { text: '발송 시작', variant: 'info' },
        preheader: `${data.courierName ?? '택배'}으로 발송됐어요. 운송장 번호로 배송 위치 확인하세요`,
        heroTitle: `${data.productName}이(가) 출발했어요`,
        heroSubtitle: '주문하신 상품이 방금 발송됐어요. 보통 1~2일 안에 도착해요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            ...(data.courierName ? [{ label: '택배사', value: data.courierName }] : []),
            ...(data.trackingNumber ? [{ label: '운송장번호', value: data.trackingNumber, emphasis: true }] : []),
            { label: '발송일', value: formatKDate(now) },
          ]),
          emailNoticeBox('아래 버튼을 누르면 실시간 배송 위치를 확인할 수 있어요. 배송 완료까지 보통 1~2일 걸려요.', 'info'),
        ],
        primaryAction: { text: '배송 추적하기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        recipientEmail: data.recipientEmail,
      }),
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
  const linkUrl = data.orderLinkUrl ?? '/buyer/reviews'
  const kakaoMsg = `[크넥샵] 배송 완료\n\n${data.buyerName}님, 상품이 배달 완료되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n\n상품이 마음에 드셨다면 리뷰를 남겨주세요!`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.DELIVERY_COMPLETE, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 배송이 완료됐어요`,
      html: renderEmail({
        recipientType: 'buyer',
        statusBadge: { text: '배송 완료', variant: 'success' },
        tip: '리뷰 작성에 1분이면 충분해요. 솔직한 후기는 다른 구매자에게 큰 도움이 돼요.',
        preheader: '잘 받으셨나요? 짧은 후기로 다른 분들도 도와주세요',
        heroTitle: `${data.productName} 배송이 완료됐어요`,
        heroSubtitle: '잘 받으셨나요? 사용해보시고 짧은 후기 남겨주시면 다른 분들께도 큰 도움이 돼요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber },
            { label: '상품', value: data.productName },
            { label: '배송 완료일', value: formatKDate(now) },
          ]),
          emailNoticeBox('리뷰 작성에 1분이면 충분해요. 솔직한 후기는 다른 구매자에게 큰 도움이 돼요.', 'success'),
        ],
        primaryAction: { text: '리뷰 작성하기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        secondaryAction: { text: '주문 내역', url: `${SITE_URL}/ko/buyer/orders` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 새 주문 발생\n\n${data.brandName}님, 새로운 주문이 들어왔습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName} x ${data.quantity}\n결제금액: ${formatPrice(data.totalAmount)}\n구매자: ${data.buyerName}`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.NEW_ORDER_BRAND, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 새 주문 접수! ${data.productName} x ${data.quantity}`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '새 주문', variant: 'success' },
        preheader: `${data.buyerName}님이 주문하셨어요. 빠르게 송장 등록 부탁드려요`,
        heroTitle: '새 주문이 접수됐어요',
        heroSubtitle: '구매자가 결제를 완료했어요. 빠른 발송을 위해 1~2일 안에 송장을 등록해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: `${data.productName} x ${data.quantity}` },
            { label: '구매자', value: data.buyerName },
            { label: '주문일시', value: formatKDate(now) },
          ]),
          emailAmountBox('결제 금액', data.totalAmount, '플랫폼 수수료 차감 전'),
          emailNoticeBox('영업일 기준 2일 내 송장 미입력 시 자동 알림이 다시 발송돼요. 빠른 발송 부탁드려요.', 'warning'),
        ],
        primaryAction: { text: '주문 처리하기', url: `${SITE_URL}/ko/brand/orders` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 송장 입력 요청\n\n${data.brandName}님, 아직 송장이 입력되지 않은 주문이 있습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n주문일: ${data.orderDate}\n\n빠른 배송 처리를 부탁드립니다.`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.INVOICE_REMINDER, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 송장 등록이 필요해요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '송장 등록 필요', variant: 'warning' },
        preheader: `${data.orderDate} 주문이 아직 발송 처리되지 않았어요`,
        heroTitle: '아직 송장이 등록되지 않았어요',
        heroSubtitle: '아래 주문이 결제 완료된 지 시간이 지났는데 송장이 등록되지 않았어요. 구매자가 기다리고 있어요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            { label: '주문일', value: data.orderDate },
            { label: '독촉 발송일', value: formatKDate(now) },
          ]),
          emailNoticeBox('구매자 만족도와 브랜드 평점에 영향을 줄 수 있어요. 가능한 빨리 송장을 등록해주세요.', 'warning'),
        ],
        primaryAction: { text: '송장 등록하기', url: `${SITE_URL}/ko/brand/orders` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 판매 발생\n\n${data.creatorName}님, 내 샵에서 판매가 발생했습니다!\n\n상품: ${data.productName}\n판매금액: ${formatPrice(data.orderAmount)}\n내 수익: ${formatPrice(data.commissionAmount)}`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SALE_OCCURRED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 판매 발생! +${formatPrice(data.commissionAmount)}`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '판매 발생', variant: 'success' },
        tip: '판매 직후 <strong>감사 스토리</strong>를 올리면 재구매율이 높아져요.',
        preheader: `${data.productName}이(가) 판매됐어요. 내 수익 ${formatPrice(data.commissionAmount)}`,
        heroTitle: `${data.creatorName}님, 판매가 발생했어요!`,
        heroSubtitle: '방금 내 셀렉트샵에서 판매가 일어났어요. 정산은 매월 정해진 날짜에 진행돼요.',
        sections: [
          emailInfoTable([
            { label: '상품', value: data.productName },
            { label: '판매 금액', value: formatKRW(data.orderAmount) },
            { label: '판매 시각', value: formatKDate(now) },
          ]),
          emailAmountBox('내 수익', data.commissionAmount, '커미션 100% 지급 (수수료 0원)'),
          emailNoticeBox('정산은 월 1회 진행돼요. 누적 수익은 대시보드에서 실시간으로 확인할 수 있어요.', 'success'),
        ],
        primaryAction: { text: '판매 현황 보기', url: `${SITE_URL}/ko/creator/sales` },
        secondaryAction: { text: '내 샵 가기', url: `${SITE_URL}/ko/creator/shop` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 캠페인 참여 승인\n\n${data.creatorName}님, 캠페인 참여가 승인되었습니다.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignTitle}\n\n이제 해당 상품을 내 샵에서 판매할 수 있습니다.`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CAMPAIGN_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.brandName} 캠페인 참여가 확정됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '참여 확정', variant: 'success' },
        preheader: `${data.campaignTitle} 캠페인 참여가 승인됐어요. 지금 바로 판매 가능해요`,
        heroTitle: '캠페인 참여가 확정됐어요',
        heroSubtitle: `${data.brandName}의 캠페인에 참여가 승인됐어요. 이미 내 셀렉트샵에 자동으로 추가됐어요.`,
        sections: [
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '승인일', value: formatKDate(now) },
          ]),
          emailNoticeBox('SNS에 셀렉트샵 링크를 공유하면 바로 판매가 시작돼요. 첫 판매까지 보통 3~7일 걸려요.', 'success'),
        ],
        primaryAction: { text: '내 샵 확인하기', url: `${SITE_URL}/ko/creator/shop` },
        recipientEmail: data.recipientEmail,
      }),
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
  const endInfo = data.endDate ? `\n종료일: ${data.endDate}` : ''
  const kakaoMsg = `[크넥샵] 캠페인 시작\n\n${data.creatorName}님, 참여 중인 캠페인이 시작되었습니다.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignTitle}${endInfo}\n\n지금부터 판매가 가능합니다!`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CAMPAIGN_STARTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.campaignTitle} 캠페인 오픈! 지금부터 판매 가능해요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '캠페인 오픈', variant: 'info' },
        tip: '캠페인 시작 후 <strong>48시간이 판매 골든타임</strong>이에요.',
        preheader: `${data.brandName}의 캠페인이 방금 시작됐어요`,
        heroTitle: '캠페인이 시작됐어요',
        heroSubtitle: '지금부터 캠페인 종료일까지 판매 가능해요. SNS에 공유해서 첫 판매를 만들어보세요.',
        sections: [
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '시작일', value: formatKDate(now) },
            ...(data.endDate ? [{ label: '종료일', value: data.endDate }] : []),
          ]),
          emailNoticeBox('캠페인 기간 종료 시 자동으로 내 샵에서 내려가요. 한정 기간 강조하면 전환율이 더 높아져요.', 'info'),
        ],
        primaryAction: { text: '내 샵 확인하기', url: `${SITE_URL}/ko/creator/shop` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 체험 신청 승인\n\n${data.creatorName}님, 체험 신청이 승인되었습니다.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}\n\n곧 체험 상품이 발송될 예정입니다.`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 체험 신청이 승인됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '승인 완료', variant: 'success' },
        darkHeroCard: { label: '체험 상품', title: data.productName, subLabel: data.brandName },
        tip: '체험 후 공구 진행 여부는 자유롭게 결정하시면 돼요. 진행 안 해도 불이익 없어요.',
        preheader: `${data.brandName}에서 곧 체험 상품을 발송해드려요`,
        heroTitle: '체험 신청이 승인됐어요',
        heroSubtitle: `${data.brandName}에서 곧 체험 상품을 발송해드려요. 발송되면 운송장 번호와 함께 다시 알려드릴게요.`,
        sections: [
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '체험 상품', value: data.productName, emphasis: true },
            { label: '승인일', value: formatKDate(now) },
          ]),
          emailNoticeBox('체험 후 공구 진행 여부는 자유롭게 결정하시면 돼요. 진행 안 해도 불이익 없어요.', 'info'),
        ],
        primaryAction: { text: '체험 현황 보기', url: `${SITE_URL}/ko/creator/trial/my` },
        recipientEmail: data.recipientEmail,
      }),
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
  const trackingInfo = data.trackingNumber ? `\n운송장번호: ${data.trackingNumber}` : ''
  const kakaoMsg = `[크넥샵] 체험 상품 발송\n\n${data.creatorName}님, 체험 상품이 발송되었습니다.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}${trackingInfo}`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_SHIPPED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 체험 상품이 출발했어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '발송 시작', variant: 'info' },
        darkHeroCard: { label: '체험 상품', title: data.productName, subLabel: data.brandName },
        preheader: '운송장 번호로 배송 위치 확인하세요',
        heroTitle: '체험 상품이 출발했어요',
        heroSubtitle: `${data.brandName}에서 체험 상품을 발송했어요. 보통 1~2일 안에 도착해요.`,
        sections: [
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '체험 상품', value: data.productName, emphasis: true },
            ...(data.trackingNumber ? [{ label: '운송장번호', value: data.trackingNumber, emphasis: true }] : []),
            { label: '발송일', value: formatKDate(now) },
          ]),
          emailNoticeBox('도착 후 사용해보시고 공구 진행 여부를 결정해주세요. 결정 기한은 보통 7~14일이에요.', 'info'),
        ],
        primaryAction: { text: '체험 현황 보기', url: `${SITE_URL}/ko/creator/trial/my` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 체험 신청 접수\n\n${data.brandName}님, 새로운 체험 신청이 접수되었습니다.\n\n크리에이터: ${data.creatorName}\n상품: ${data.productName}\n\n승인 여부를 결정해주세요.`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_REQUESTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.creatorName}님이 ${data.productName} 체험을 신청했어요`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '새 체험 신청', variant: 'info' },
        darkHeroCard: { label: '체험 상품', title: data.productName, subLabel: `신청자 ${data.creatorName}` },
        preheader: '크리에이터 프로필을 확인하고 승인 여부를 결정해주세요',
        heroTitle: '새 체험 신청이 접수됐어요',
        heroSubtitle: `${data.creatorName}님이 체험 상품을 신청했어요. 크리에이터 프로필 확인 후 승인 여부를 결정해주세요.`,
        sections: [
          emailInfoTable([
            { label: '신청 크리에이터', value: data.creatorName, emphasis: true },
            { label: '체험 상품', value: data.productName },
            { label: '신청일', value: formatKDate(now) },
          ]),
          emailNoticeBox('승인 시 자동으로 크리에이터에게 알림이 가고, 발송 정보 입력 화면으로 이동해요.', 'info'),
        ],
        primaryAction: { text: '체험 신청 검토하기', url: `${SITE_URL}/ko/brand/trial` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 정산 확정\n\n${data.creatorName}님, ${data.period} 정산이 확정되었습니다.\n\n정산금액: ${formatPrice(data.netAmount)}\n입금예정일: ${data.paymentDate}`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SETTLEMENT_CONFIRMED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.period} 정산 확정 — ${data.paymentDate}에 입금돼요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '정산 확정', variant: 'success' },
        preheader: `${formatPrice(data.netAmount)}이 ${data.paymentDate}에 등록 계좌로 입금돼요`,
        heroTitle: `${data.period} 정산이 확정됐어요`,
        heroSubtitle: '아래 금액이 등록하신 계좌로 입금될 예정이에요. 입금 완료되면 다시 알려드릴게요.',
        sections: [
          emailInfoTable([
            { label: '정산 기간', value: data.period },
            { label: '확정일', value: formatKDate(now) },
            { label: '입금 예정일', value: data.paymentDate, emphasis: true },
          ]),
          emailAmountBox('정산 금액', data.netAmount, '세금/수수료 차감 후 실수령액'),
          emailNoticeBox('계좌 정보가 변경됐다면 정산 페이지에서 미리 수정해주세요. 입금 후엔 변경이 어려워요.', 'success'),
        ],
        primaryAction: { text: '정산 내역 보기', url: `${SITE_URL}/ko/creator/settlements` },
        recipientEmail: data.recipientEmail,
      }),
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
  const commissionInfo = data.commissionRate ? `\n커미션: ${data.commissionRate}%` : ''
  const kakaoMsg = `[크넥샵] 공구 초대\n\n${data.creatorName}님, 새로운 공구 초대가 도착했어요.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignName}${commissionInfo}\n\n아래 링크에서 상세 내용을 확인해주세요.`
  const now = new Date()

  const sections: string[] = [
    emailInfoTable([
      { label: '브랜드', value: data.brandName },
      { label: '캠페인', value: data.campaignName, emphasis: true },
      ...(data.commissionRate ? [{ label: '커미션율', value: `${data.commissionRate}%` }] : []),
      { label: '초대일', value: formatKDate(now) },
    ]),
  ]
  if (data.messageBody) {
    sections.push(emailNoticeBox(data.messageBody, 'info'))
  }

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.PROPOSAL_GONGGU, message: kakaoMsg },
    email: {
      subject: `[${data.brandName}] ${data.campaignName} 공구 초대가 도착했어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '공구 초대', variant: 'warning' },
        tip: '공구 초대는 빠르게 응답할수록 좋은 조건을 받을 수 있어요.',
        preheader: `${data.brandName}에서 공구 참여 초대가 왔어요. 커미션 ${data.commissionRate ?? ''}%`,
        heroTitle: `${data.brandName}에서 공구 초대가 왔어요`,
        heroSubtitle: `${data.creatorName}님께 새로운 공구 캠페인 참여를 제안드려요. 자세한 내용은 아래에서 확인해주세요.`,
        sections,
        primaryAction: { text: '캠페인 자세히 보기', url: data.acceptUrl },
        secondaryAction: { text: '내 제안 목록', url: `${SITE_URL}/ko/creator/proposals` },
        recipientEmail: data.recipientEmail,
      }),
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
  const commissionInfo = data.commissionRate ? `\n커미션: ${data.commissionRate}%` : ''
  const kakaoMsg = `[크넥샵] 상품 추천 요청\n\n${data.creatorName}님, 새로운 상품 추천 요청이 도착했어요.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}${commissionInfo}\n\n내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.`
  const now = new Date()

  const sections: string[] = [
    emailInfoTable([
      { label: '브랜드', value: data.brandName },
      { label: '상품', value: data.productName, emphasis: true },
      ...(data.commissionRate ? [{ label: '커미션율', value: `${data.commissionRate}%` }] : []),
      { label: '요청일', value: formatKDate(now) },
    ]),
  ]
  if (data.messageBody) {
    sections.push(emailNoticeBox(data.messageBody, 'info'))
  }

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.PROPOSAL_PRODUCT_PICK, message: kakaoMsg },
    email: {
      subject: `[${data.brandName}] ${data.productName} 추천 요청이 도착했어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '상품 추천 요청', variant: 'info' },
        darkHeroCard: { label: '추천 상품', title: data.productName, subLabel: data.brandName },
        tip: '상시 추천 상품은 캠페인 종료 없이 꾸준한 수익을 만들어줘요.',
        preheader: `${data.brandName}의 ${data.productName} 상시 추천 요청이 왔어요. 커미션 ${data.commissionRate ?? ''}%`,
        heroTitle: `${data.brandName}에서 상품 추천 요청이 왔어요`,
        heroSubtitle: `${data.creatorName}님의 셀렉트샵에 상시 추천 상품으로 등록해달라는 요청이에요. 마음에 들면 추가해보세요.`,
        sections,
        primaryAction: { text: '상품 자세히 보기', url: data.acceptUrl },
        secondaryAction: { text: '내 제안 목록', url: `${SITE_URL}/ko/creator/proposals` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()
  const channelRows = Object.entries(data.channelBreakdown)
    .map(([ch, count]) => ({ label: ch, value: `${count}건` }))

  const sections: string[] = [
    emailInfoTable([
      { label: '총 발송', value: `${data.sentCount}건`, emphasis: true },
      { label: '실패', value: `${data.failedCount}건` },
      { label: '발송 일시', value: formatKDate(now) },
      ...channelRows,
    ]),
  ]
  if (data.paidCount > 0) {
    sections.push(emailAmountBox('유료 발송 비용', data.paidAmount, `유료 ${data.paidCount}건 x 500원`))
  }
  sections.push(emailNoticeBox('실패한 발송은 자동으로 재시도되지 않아요. 필요 시 다시 발송해주세요.', 'info'))

  return {
    kakao: null,
    email: {
      subject: `[크넥샵] 일괄 발송 완료 — ${data.sentCount}건 전송됨`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '발송 완료', variant: 'success' },
        preheader: `총 ${data.sentCount}건 전송, 실패 ${data.failedCount}건. 자세한 리포트를 확인하세요`,
        heroTitle: '일괄 발송이 완료됐어요',
        heroSubtitle: '제안 메시지 일괄 발송이 끝났어요. 발송 결과와 비용을 확인해주세요.',
        sections,
        primaryAction: { text: '발송 내역 보기', url: data.reportLink },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: null,
  }
}

// ---------- 16. 크리에이터 가입 신청 완료 → 크리에이터 ----------

export function creatorApplicationSubmittedMessage(data: {
  creatorName: string
  recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 가입 신청 완료\n\n${data.creatorName}님, 크넥샵 크리에이터 가입 신청이 완료됐어요.\n\n1~2영업일 내 심사 결과를 알려드릴게요.\n승인되면 바로 내 샵을 열 수 있어요!`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_APPLICATION_SUBMITTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.creatorName}님, 가입 신청이 접수됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '가입 신청 접수', variant: 'info' },
        tip: '심사 결과는 가입하신 이메일로 보내드려요. 스팸함도 확인해주세요.',
        preheader: '1~2영업일 안에 심사 결과 알려드릴게요',
        heroTitle: `${data.creatorName}님, 가입 신청이 접수됐어요`,
        heroSubtitle: '1~2영업일 안에 심사 결과를 이메일로 알려드릴게요. 승인되면 바로 내 셀렉트샵을 열 수 있어요.',
        sections: [
          emailInfoTable([
            { label: '신청일', value: formatKDate(now) },
            { label: '심사 예정', value: '영업일 기준 1~2일' },
            { label: '승인 시 혜택', value: '가입 축하 포인트 3,000원 자동 지급' },
          ]),
          emailAmountBox('가입 축하 포인트', 3000, '승인 시 즉시 지급'),
          emailNoticeBox('심사 결과는 가입하신 이메일로 보내드려요. 스팸함도 확인해주세요.', 'info'),
        ],
        primaryAction: { text: '크넥샵 둘러보기', url: `${SITE_URL}/ko` },
        secondaryAction: { text: '크리에이터 가이드', url: `${SITE_URL}/ko/guide/creator` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 가입 승인 완료\n\n축하드려요! ${data.creatorName}님의 크넥샵 크리에이터 가입이 승인됐어요.\n\n지금 바로 내 샵을 열어보세요.\n가입 축하 3,000원이 지급됐어요!`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.creatorName}님, 크리에이터 가입이 승인됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '승인 완료', variant: 'success' },
        tip: '대시보드에서 첫 캠페인을 골라 내 샵에 추가해보세요. 보통 첫 판매까지 3~7일 걸려요.',
        preheader: '지금 바로 내 셀렉트샵을 열고 첫 판매를 시작해보세요',
        heroTitle: `축하해요, ${data.creatorName}님!`,
        heroSubtitle: '크넥샵 크리에이터 가입이 승인됐어요. 지금 바로 내 셀렉트샵을 열고 첫 판매를 시작해보세요.',
        sections: [
          emailInfoTable([
            { label: '승인일', value: formatKDate(now) },
            { label: '가입 축하 포인트', value: '3,000원 (즉시 지급 완료)' },
          ]),
          emailAmountBox('가입 축하 포인트', 3000, '즉시 지급 완료'),
          emailNoticeBox('대시보드에서 첫 캠페인을 골라 내 샵에 추가해보세요. 보통 첫 판매까지 3~7일 걸려요.', 'success'),
        ],
        primaryAction: { text: '내 샵 시작하기', url: `${SITE_URL}/ko/creator/dashboard` },
        secondaryAction: { text: '캠페인 둘러보기', url: `${SITE_URL}/ko/creator/campaigns` },
        recipientEmail: data.recipientEmail,
      }),
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
  const kakaoMsg = `[크넥샵] 가입 심사 결과\n\n${data.creatorName}님, 아쉽게도 이번 심사에서는 승인이 어려웠어요.\n\n사유: ${data.reason}\n\n보완 후 재신청이 가능합니다.`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_REJECTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 가입 심사 결과를 알려드려요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '심사 결과 안내', variant: 'warning' },
        preheader: '아쉽게도 이번엔 승인이 어려웠어요. 다시 신청 가능해요',
        heroTitle: `${data.creatorName}님, 가입 심사 결과를 알려드려요`,
        heroSubtitle: '아쉽게도 이번 심사에서는 승인이 어려웠어요. 아래 사유를 확인하시고 정보를 보완해서 다시 신청해주세요.',
        sections: [
          emailInfoTable([
            { label: '심사일', value: formatKDate(now) },
            { label: '심사 결과', value: '승인 보류' },
            { label: '사유', value: data.reason, emphasis: true },
          ]),
          emailNoticeBox('재신청은 사유 보완 후 언제든 가능해요. 도움이 필요하시면 support@cnecshop.com으로 문의주세요.', 'info'),
        ],
        primaryAction: { text: '다시 신청하기', url: `${SITE_URL}/ko/creator/pending` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] ${data.brandName} 입점이 승인됐어요`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '승인 완료', variant: 'success' },
        preheader: '지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요',
        heroTitle: `${data.brandName} 입점이 승인됐어요`,
        heroSubtitle: '지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요.',
        sections: [
          emailInfoTable([
            { label: '브랜드명', value: data.brandName, emphasis: true },
            { label: '입점일', value: formatKDate(now) },
            ...(data.recipientEmail ? [{ label: '담당자 이메일', value: data.recipientEmail }] : []),
          ]),
          emailNoticeBox('상품 등록 후 어드민 검토를 거쳐 노출돼요. 영업일 기준 1~2일 걸려요.', 'info'),
        ],
        primaryAction: { text: '상품 등록하기', url: `${SITE_URL}/ko/brand/products/new` },
        secondaryAction: { text: '브랜드 대시보드', url: `${SITE_URL}/ko/brand/dashboard` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 입점 심사 결과를 알려드려요`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '심사 결과 안내', variant: 'warning' },
        preheader: '아쉽게도 이번엔 입점이 어려웠어요. 사유와 보완 방법을 안내드려요',
        heroTitle: `${data.brandName} 입점 심사 결과를 알려드려요`,
        heroSubtitle: '아쉽게도 이번 심사에서는 입점이 어려웠어요. 사유 확인 후 보완해서 다시 신청 가능해요.',
        sections: [
          emailInfoTable([
            { label: '심사일', value: formatKDate(now) },
            { label: '심사 결과', value: '입점 보류' },
            { label: '브랜드명', value: data.brandName },
          ]),
          emailNoticeBox('구체적인 사유와 보완 방법은 담당자가 별도로 안내드려요. 빠른 답변이 필요하시면 support@cnecshop.com으로 문의주세요.', 'info'),
        ],
        primaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] ${data.brandName} 운영 상태가 변경됐어요`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '상태 변경', variant: 'neutral' },
        preheader: `운영 상태가 ${data.status}로 변경됐어요. 자세한 내용을 확인해주세요`,
        heroTitle: `${data.brandName} 운영 상태가 변경됐어요`,
        heroSubtitle: '아래 변경된 운영 상태를 확인해주세요. 궁금한 점은 언제든 문의주세요.',
        sections: [
          emailInfoTable([
            { label: '브랜드명', value: data.brandName },
            { label: '변경일시', value: formatKDate(now) },
            { label: '변경된 상태', value: data.status, emphasis: true },
          ]),
          emailNoticeBox('운영 상태에 따라 상품 노출, 주문 접수, 정산이 달라질 수 있어요. 자세한 내용은 대시보드에서 확인해주세요.', 'warning'),
        ],
        primaryAction: { text: '브랜드 대시보드', url: `${SITE_URL}/ko/brand/dashboard` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
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
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 주문이 취소됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        statusBadge: { text: '주문 취소', variant: 'warning' },
        preheader: '결제하신 금액은 영업일 기준 3~5일 안에 환불돼요',
        heroTitle: '주문이 취소됐어요',
        heroSubtitle: '브랜드 측 사유로 주문이 취소됐어요. 결제하신 금액은 곧 환불해드릴게요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '취소 사유', value: data.cancelReason },
            { label: '환불 방식', value: '결제하신 카드 또는 계좌로 자동 환불' },
          ]),
          emailNoticeBox('카드 결제는 영업일 기준 3~5일, 계좌 환불은 1~2일 안에 처리돼요. 환불 완료 시 다시 알려드릴게요.', 'warning'),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 판매 주문이 취소됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '판매 취소', variant: 'warning' },
        preheader: '브랜드가 주문을 취소했어요. 해당 주문 수익은 차감돼요',
        heroTitle: '판매 주문이 취소됐어요',
        heroSubtitle: '브랜드가 주문을 취소했어요. 이 주문에서 발생한 수익은 정산에서 자동 차감돼요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '수익 처리', value: '정산 시 자동 차감' },
          ]),
          emailNoticeBox('취소 사유는 브랜드와 구매자에게만 공개돼요. 자세한 내역은 판매 현황에서 확인하세요.', 'info'),
        ],
        primaryAction: { text: '판매 현황 보기', url: `${SITE_URL}/ko/creator/sales` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 구매자가 주문을 취소했어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '구매자 취소', variant: 'warning' },
        preheader: '발송 전이면 처리 중지, 발송 후면 회수 절차 시작해주세요',
        heroTitle: '구매자가 주문을 취소했어요',
        heroSubtitle: '아직 발송 전이라면 즉시 처리를 중단해주세요. 이미 발송하셨다면 회수 절차를 진행해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '액션 필요', value: '발송 상태 확인 후 대응' },
          ]),
          emailNoticeBox('환불은 크넥샵에서 자동 처리돼요. 발송 후 취소인 경우 회수 후 재고 처리만 부탁드려요.', 'warning'),
        ],
        primaryAction: { text: '주문 처리하기', url: `${SITE_URL}/ko/brand/orders` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 판매 주문이 취소됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '판매 취소', variant: 'warning' },
        preheader: '구매자가 주문을 취소했어요. 해당 주문 수익은 차감돼요',
        heroTitle: '판매 주문이 취소됐어요',
        heroSubtitle: '구매자가 주문을 취소했어요. 이 주문에서 발생한 수익은 정산에서 자동 차감돼요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '수익 처리', value: '정산 시 자동 차감' },
          ]),
          emailNoticeBox('구매자 변심에 의한 취소는 자연스러운 일이에요. 다른 판매로 회복할 수 있어요.', 'info'),
        ],
        primaryAction: { text: '판매 현황 보기', url: `${SITE_URL}/ko/creator/sales` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 교환 요청 접수 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '교환 요청 접수', variant: 'warning' },
        preheader: '구매자가 교환을 요청했어요. 1~2일 안에 응답 부탁드려요',
        heroTitle: '교환 요청이 접수됐어요',
        heroSubtitle: '구매자가 상품 교환을 요청했어요. 빠른 처리를 위해 영업일 기준 1~2일 내 응답 부탁드려요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '교환 사유', value: data.reason },
            { label: '접수일', value: formatKDate(now) },
            { label: '응답 마감', value: '영업일 기준 2일' },
          ]),
          emailNoticeBox('미응답 시 자동으로 환불 처리될 수 있어요. 빠른 응답이 브랜드 평점에 도움이 돼요.', 'warning'),
        ],
        primaryAction: { text: '교환 요청 처리하기', url: `${SITE_URL}/ko/brand/inquiries` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 환불 요청 접수 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '환불 요청 접수', variant: 'warning' },
        preheader: `${data.refundType} 환불 요청이 왔어요. 1~2일 안에 응답 부탁드려요`,
        heroTitle: '환불 요청이 접수됐어요',
        heroSubtitle: '구매자가 환불을 요청했어요. 영업일 기준 1~2일 내 검토 후 응답해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '환불 유형', value: data.refundType },
            { label: '접수일', value: formatKDate(now) },
            { label: '응답 마감', value: '영업일 기준 2일' },
          ]),
          emailNoticeBox('미응답 시 자동 환불 처리될 수 있어요. 빠른 응답이 브랜드 평점에 도움이 돼요.', 'warning'),
        ],
        primaryAction: { text: '환불 요청 처리하기', url: `${SITE_URL}/ko/brand/inquiries` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] ${data.campaignTitle} 참여 결과를 알려드려요`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '참여 결과 안내', variant: 'warning' },
        preheader: '아쉽지만 이번 캠페인은 어려웠어요. 다른 좋은 캠페인이 기다리고 있어요',
        heroTitle: `${data.creatorName}님, 참여 결과를 알려드려요`,
        heroSubtitle: '아쉽게도 이번 캠페인은 참여가 어려웠어요. 다른 캠페인에서 더 좋은 기회를 만나보세요.',
        sections: [
          emailInfoTable([
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '결과 통보일', value: formatKDate(now) },
          ]),
          emailNoticeBox('브랜드별 선정 기준이 다르니 다양한 캠페인에 도전해보세요. 거절 사유는 브랜드 정책상 비공개예요.', 'info'),
        ],
        primaryAction: { text: '다른 캠페인 보기', url: `${SITE_URL}/ko/creator/campaigns` },
        recipientEmail: data.recipientEmail,
      }),
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
  const now = new Date()

  return {
    email: {
      subject: `[크넥샵] 새 캠페인 오픈! ${data.campaignTitle}`,
      html: renderEmail({
        recipientType: 'creator',
        statusBadge: { text: '새 캠페인 오픈', variant: 'info' },
        preheader: '지금 신청하면 먼저 참여할 수 있어요',
        heroTitle: '새 캠페인이 오픈됐어요',
        heroSubtitle: '관심 있는 카테고리의 신규 캠페인이 시작됐어요. 인기 캠페인은 일찍 마감될 수 있어요.',
        sections: [
          emailInfoTable([
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '오픈일', value: formatKDate(now) },
          ]),
          emailNoticeBox('먼저 참여 신청하면 더 많은 판매 기회를 잡을 수 있어요. 자세한 내용은 캠페인 페이지에서 확인하세요.', 'success'),
        ],
        primaryAction: { text: '캠페인 자세히 보기', url: `${SITE_URL}/ko/creator/campaigns` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'CAMPAIGN',
      title: '새 캠페인이 오픈됐어요',
      message: `"${data.campaignTitle}" 캠페인 모집이 시작되었어요. 지금 확인해보세요!`,
      linkUrl: '/creator/campaigns',
    },
  }
}

// ---------- 41. 비밀번호 변경 → 사용자 ----------

export function passwordChangedMessage(data: {
  userName: string
  changedAt: Date
  ipAddress?: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 비밀번호가 변경됐어요',
      html: renderEmail({
        recipientType: null,
        preheader: '비밀번호가 방금 변경됐어요. 본인이 아니라면 즉시 조치해주세요',
        statusBadge: { text: '보안 알림', variant: 'warning' },
        heroTitle: '비밀번호가 변경됐어요',
        heroSubtitle: '방금 계정의 비밀번호가 변경됐어요.\n본인이 아니라면 즉시 조치해주세요.',
        sections: [
          emailInfoTable([
            { label: '사용자', value: data.userName },
            { label: '변경 일시', value: formatKDate(data.changedAt) },
            ...(data.ipAddress ? [{ label: '접속 IP', value: data.ipAddress }] : []),
          ]),
          emailNoticeBox('본인이 아니라면 <strong>즉시 비밀번호를 재설정</strong>하고 <strong>support@cnecshop.com</strong>으로 문의주세요.', 'danger'),
        ],
        primaryAction: { text: '비밀번호 재설정', url: `${SITE_URL}/ko/account/reset-password` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SECURITY',
      title: '비밀번호가 변경됐어요',
      message: '본인이 아니면 즉시 재설정해주세요.',
      linkUrl: '/account/security',
    },
  }
}

// ---------- 42. 새 기기 로그인 → 사용자 ----------

export function loginFromNewDeviceMessage(data: {
  userName: string
  loginAt: Date
  ipAddress?: string
  userAgent?: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 새로운 기기에서 로그인됐어요',
      html: renderEmail({
        recipientType: null,
        preheader: '평소와 다른 기기에서 접속이 감지됐어요',
        statusBadge: { text: '새 기기 로그인', variant: 'warning' },
        heroTitle: '새로운 기기에서 로그인됐어요',
        heroSubtitle: '평소와 다른 기기에서 접속이 감지됐어요.\n본인이 아니라면 즉시 비밀번호를 변경해주세요.',
        sections: [
          emailInfoTable([
            { label: '로그인 일시', value: formatKDate(data.loginAt) },
            ...(data.userAgent ? [{ label: '기기', value: data.userAgent }] : []),
            ...(data.ipAddress ? [{ label: 'IP', value: data.ipAddress }] : []),
          ]),
          emailNoticeBox('본인이 아니라면 계정이 <strong>도용됐을 가능성</strong>이 있어요.', 'danger'),
        ],
        primaryAction: { text: '비밀번호 변경', url: `${SITE_URL}/ko/account/reset-password` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SECURITY',
      title: '새로운 기기에서 로그인됐어요',
      message: '본인이 아니라면 비밀번호를 변경해주세요.',
      linkUrl: '/account/security',
    },
  }
}

// ---------- 43. 이상 접속 감지 → 사용자 ----------

export function loginAbnormalDetectedMessage(data: {
  userName: string
  loginAt: Date
  country?: string
  ipAddress?: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 이상 접속이 감지됐어요',
      html: renderEmail({
        recipientType: null,
        preheader: '평소와 다른 위치에서 로그인이 감지됐어요',
        statusBadge: { text: '이상 접속 감지', variant: 'warning' },
        heroTitle: '이상 접속이 감지됐어요',
        heroSubtitle: '평소와 다른 위치에서 접속이 감지됐어요.\n본인이 아니라면 즉시 비밀번호를 변경해주세요.',
        sections: [
          emailInfoTable([
            { label: '감지 일시', value: formatKDate(data.loginAt) },
            ...(data.country ? [{ label: '국가', value: data.country }] : []),
            ...(data.ipAddress ? [{ label: 'IP', value: data.ipAddress }] : []),
          ]),
          emailNoticeBox('본인이 아니라면 <strong>즉시 비밀번호를 변경</strong>해주세요.', 'danger'),
        ],
        primaryAction: { text: '비밀번호 변경', url: `${SITE_URL}/ko/account/reset-password` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SECURITY',
      title: '이상 접속이 감지됐어요',
      message: '본인이 아니라면 즉시 비밀번호를 변경해주세요.',
      linkUrl: '/account/security',
    },
  }
}

// ---------- 44. 휴면 전환 예정 → 사용자 ----------

export function dormantWarningMessage(data: {
  userName: string
  dormantDate: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 곧 휴면 계정으로 전환돼요',
      html: renderEmail({
        recipientType: null,
        preheader: '1년 이상 로그인 기록이 없어 휴면 전환 예정이에요',
        statusBadge: { text: '휴면 전환 예정', variant: 'warning' },
        heroTitle: '곧 휴면 계정으로 전환돼요',
        heroSubtitle: `1년 이상 로그인 기록이 없어 ${data.dormantDate}에 휴면 계정으로 전환될 예정이에요.\n계속 이용하려면 지금 로그인해주세요.`,
        sections: [
          emailInfoTable([
            { label: '전환 예정일', value: data.dormantDate, emphasis: true },
          ]),
          emailNoticeBox('휴면 전환 후에도 <strong>재로그인 시 즉시 복구</strong>돼요. 개인정보보호법에 따라 휴면 회원 정보는 별도 분리 보관돼요.', 'info'),
        ],
        primaryAction: { text: '지금 로그인하기', url: `${SITE_URL}/ko/login` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SYSTEM',
      title: '곧 휴면 계정으로 전환돼요',
      message: `${data.dormantDate}까지 로그인하지 않으면 휴면 처리돼요.`,
      linkUrl: '/login',
    },
  }
}

// ---------- 45. 휴면 전환 완료 → 사용자 ----------

export function dormantTransitionedMessage(data: {
  userName: string
  transitionedAt: Date
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 휴면 계정으로 전환됐어요',
      html: renderEmail({
        recipientType: null,
        preheader: '로그인하시면 바로 복구돼요',
        statusBadge: { text: '휴면 전환 완료', variant: 'neutral' },
        heroTitle: '휴면 계정으로 전환됐어요',
        heroSubtitle: '1년 이상 로그인 기록이 없어 휴면 계정으로 전환됐어요.\n로그인하시면 바로 복구돼요.',
        sections: [
          emailInfoTable([
            { label: '전환일', value: formatKDate(data.transitionedAt) },
          ]),
          emailNoticeBox('로그인 시 <strong>자동 복구</strong>돼요. 별도 절차가 필요 없어요.', 'info'),
        ],
        primaryAction: { text: '계정 복구하기', url: `${SITE_URL}/ko/login` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SYSTEM',
      title: '휴면 계정으로 전환됐어요',
      message: '로그인하시면 바로 복구돼요.',
      linkUrl: '/login',
    },
  }
}

// ---------- 61. 약관 변경 안내 → 전체 사용자 ----------

export function termsChangedMessage(data: {
  effectiveDate: string
  summary: string
  termsUrl: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 이용약관이 변경돼요',
      html: renderEmail({
        recipientType: null,
        preheader: `${data.effectiveDate}부터 변경된 약관이 적용돼요`,
        statusBadge: { text: '약관 변경 안내', variant: 'info' },
        heroTitle: '이용약관이 변경돼요',
        heroSubtitle: `${data.effectiveDate}부터 적용될 약관 변경 내용을 안내드려요.\n동의하지 않으시면 탈퇴하실 수 있어요.`,
        sections: [
          emailInfoTable([
            { label: '시행일', value: data.effectiveDate, emphasis: true },
            { label: '변경 요약', value: data.summary },
          ]),
          emailNoticeBox('계속 이용하시면 변경된 약관에 <strong>동의</strong>한 것으로 간주돼요.', 'info'),
        ],
        primaryAction: { text: '전체 약관 보기', url: data.termsUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SYSTEM',
      title: '이용약관이 변경돼요',
      message: `${data.effectiveDate}부터 적용돼요. 확인해주세요.`,
      linkUrl: '/terms',
    },
  }
}

// ---------- 62. 개인정보처리방침 변경 → 전체 사용자 ----------

export function privacyPolicyChangedMessage(data: {
  effectiveDate: string
  summary: string
  privacyUrl: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 개인정보 처리방침이 변경돼요',
      html: renderEmail({
        recipientType: null,
        preheader: `${data.effectiveDate}부터 변경된 방침이 적용돼요`,
        statusBadge: { text: '방침 변경 안내', variant: 'info' },
        heroTitle: '개인정보 처리방침이 변경돼요',
        heroSubtitle: `${data.effectiveDate}부터 적용될 변경 내용을 안내드려요.`,
        sections: [
          emailInfoTable([
            { label: '시행일', value: data.effectiveDate, emphasis: true },
            { label: '변경 요약', value: data.summary },
          ]),
          emailNoticeBox('계속 이용하시면 변경된 방침에 <strong>동의</strong>한 것으로 간주돼요.', 'info'),
        ],
        primaryAction: { text: '전체 방침 보기', url: data.privacyUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SYSTEM',
      title: '개인정보 처리방침이 변경돼요',
      message: `${data.effectiveDate}부터 적용돼요.`,
      linkUrl: '/privacy',
    },
  }
}

// ---------- 63. 탈퇴 완료 → 사용자 ----------

export function accountDeletedMessage(data: {
  userName: string
  deletedAt: Date
  retentionMonths: number
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 탈퇴가 완료됐어요',
      html: renderEmail({
        recipientType: null,
        preheader: '그동안 이용해주셔서 감사해요',
        statusBadge: { text: '탈퇴 완료', variant: 'neutral' },
        heroTitle: '탈퇴가 완료됐어요',
        heroSubtitle: `${data.userName}님의 크넥샵 계정이 탈퇴 처리됐어요.\n그동안 이용해주셔서 감사해요.`,
        sections: [
          emailInfoTable([
            { label: '탈퇴일', value: formatKDate(data.deletedAt) },
            { label: '개인정보 보유', value: `${data.retentionMonths}개월` },
            { label: '거래 기록 보유', value: '전자상거래법에 따라 5년' },
          ]),
          emailNoticeBox('재가입은 언제든 가능하지만 이전 데이터는 복구되지 않아요.', 'info'),
        ],
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: null,
  }
}

// ---------- 64. 이메일 인증 코드 → 사용자 ----------

export function emailVerificationMessage(data: {
  verificationCode: string
  expiresInMinutes: number
  recipientEmail?: string
}) {
  return {
    email: {
      subject: '[크넥샵] 이메일 인증 코드',
      html: renderEmail({
        recipientType: null,
        preheader: '이메일 인증 코드를 확인해주세요',
        heroTitle: '이메일 인증 코드',
        sections: [
          emailAmountBox('인증 코드', data.verificationCode, `${data.expiresInMinutes}분 동안 유효`),
          emailNoticeBox('본인이 요청하지 않았다면 이 메일은 무시해주세요.', 'info'),
        ],
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: null,
  }
}

// ---------- 31. 결제 실패 → 구매자 ----------

export function paymentFailedMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  reason: string
  retryUrl?: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 결제가 완료되지 않았어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '다시 시도하시거나 다른 결제수단을 이용해주세요',
        statusBadge: { text: '결제 실패', variant: 'warning' },
        heroTitle: '결제가 완료되지 않았어요',
        heroSubtitle: `${data.buyerName}님의 결제가 처리되지 않았어요.\n다시 시도하시거나 다른 결제수단을 이용해주세요.`,
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            { label: '실패 사유', value: data.reason },
            { label: '재시도 가능 기한', value: '30분' },
          ]),
          emailNoticeBox('상품은 <strong>30분간 예약</strong>돼 있어요. 그 후엔 재고가 사라질 수 있어요.', 'warning'),
        ],
        primaryAction: { text: '다시 결제하기', url: data.retryUrl ?? `${SITE_URL}/ko/buyer/orders` },
        secondaryAction: { text: '다른 결제수단 보기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'ORDER',
      title: '결제가 완료되지 않았어요',
      message: `${data.productName} - ${data.reason}`,
      linkUrl: '/buyer/orders',
    },
  }
}

// ---------- 32. 배송 지연 → 구매자 ----------

export function shippingDelayedMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  expectedDate?: string
  reason?: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 배송이 예상보다 늦어지고 있어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '배송이 지연되고 있어요. 빠른 해결을 위해 노력 중이에요',
        statusBadge: { text: '배송 지연', variant: 'warning' },
        heroTitle: '배송이 예상보다 늦어지고 있어요',
        heroSubtitle: '주문하신 상품 발송이 지연되고 있어요.\n빠른 해결을 위해 노력 중이에요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            ...(data.expectedDate ? [{ label: '예상 발송일', value: data.expectedDate }] : []),
            ...(data.reason ? [{ label: '지연 사유', value: data.reason }] : []),
          ]),
          emailNoticeBox('원하시면 <strong>주문 취소</strong>도 가능해요.', 'info'),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko/buyer/orders` },
        secondaryAction: { text: '주문 취소하기', url: `${SITE_URL}/ko/buyer/orders` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'ORDER',
      title: '배송이 지연되고 있어요',
      message: `${data.productName} 발송이 지연되고 있어요.`,
      linkUrl: '/buyer/orders',
    },
  }
}

// ---------- 33. 반품 수거 완료 → 구매자 ----------

export function returnPickedUpMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  pickedUpAt: Date
  expectedRefundDate: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 반품 상품이 수거됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '수거 완료! 확인 후 환불 진행할게요',
        statusBadge: { text: '반품 수거 완료', variant: 'info' },
        heroTitle: '반품 상품이 수거됐어요',
        heroSubtitle: '수거된 상품 확인 후 환불을 진행해드릴게요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber },
            { label: '수거 완료일', value: formatKDate(data.pickedUpAt) },
            { label: '환불 예정일', value: data.expectedRefundDate, emphasis: true },
          ]),
          emailNoticeBox('카드 환불은 <strong>카드사 영업일 기준 3~5일</strong> 추가 소요돼요.', 'info'),
        ],
        primaryAction: { text: '반품 상세 보기', url: `${SITE_URL}/ko/buyer/orders` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'ORDER',
      title: '반품 상품이 수거됐어요',
      message: `${data.expectedRefundDate}까지 환불 예정이에요.`,
      linkUrl: '/buyer/orders',
    },
  }
}

// ---------- 34. 환불 완료 → 구매자 ----------

export function refundCompletedMessage(data: {
  buyerName: string
  orderNumber: string
  refundAmount: number
  refundMethod: string
  refundedAt: Date
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 환불이 완료됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '환불이 정상 처리됐어요',
        statusBadge: { text: '환불 완료', variant: 'success' },
        heroTitle: '환불이 완료됐어요',
        sections: [
          emailAmountBox('환불 금액', data.refundAmount, data.refundMethod),
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber },
            { label: '환불 수단', value: data.refundMethod },
            { label: '환불일', value: formatKDate(data.refundedAt) },
          ]),
          emailNoticeBox('카드 환불은 카드사 영업일 기준 <strong>3~5일</strong> 안에 입금돼요.', 'success'),
        ],
        primaryAction: { text: '환불 내역 보기', url: `${SITE_URL}/ko/buyer/orders` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'ORDER',
      title: '환불이 완료됐어요',
      message: `${formatKRW(data.refundAmount)} ${data.refundMethod}로 환불됐어요.`,
      linkUrl: '/buyer/orders',
    },
  }
}

// ---------- 35. 교환 응답 → 구매자 ----------

export function exchangeRespondedMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  status: 'approved' | 'rejected'
  reason?: string
  recipientEmail?: string
}) {
  const isApproved = data.status === 'approved'
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 교환 ${isApproved ? '승인' : '거절'} (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: isApproved ? '교환이 승인됐어요. 곧 재배송해드릴게요' : '아쉽게도 교환이 어려워요',
        statusBadge: { text: isApproved ? '교환 승인' : '교환 거절', variant: isApproved ? 'success' : 'warning' },
        heroTitle: isApproved ? '교환이 승인됐어요' : '교환이 어려워요',
        heroSubtitle: isApproved
          ? '브랜드에서 곧 재배송해드려요.'
          : '아쉽게도 교환이 어렵다는 답변을 받았어요. 사유를 확인해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber },
            { label: '상품', value: data.productName },
            { label: isApproved ? '승인일' : '거절 사유', value: isApproved ? formatKDate(now) : (data.reason ?? '-'), emphasis: !isApproved },
          ]),
          emailNoticeBox(
            isApproved
              ? '평균 <strong>2~3일 내 재배송</strong>돼요.'
              : '환불을 원하시면 <strong>환불 요청</strong>을 별도로 해주세요.',
            isApproved ? 'success' : 'info',
          ),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko/buyer/orders` },
        ...(isApproved ? {} : { secondaryAction: { text: '환불 요청하기', url: `${SITE_URL}/ko/buyer/orders` } }),
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'ORDER',
      title: isApproved ? '교환이 승인됐어요' : '교환이 어려워요',
      message: isApproved ? `${data.productName} 곧 재배송돼요.` : `${data.productName} - ${data.reason ?? '교환 불가'}`,
      linkUrl: '/buyer/orders',
    },
  }
}

// ---------- 36. 환불 응답 → 구매자 ----------

export function refundRespondedMessage(data: {
  buyerName: string
  orderNumber: string
  productName: string
  status: 'approved' | 'rejected'
  reason?: string
  recipientEmail?: string
}) {
  const isApproved = data.status === 'approved'
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 환불 ${isApproved ? '승인' : '거절'} (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: isApproved ? '환불이 승인됐어요. 곧 처리해드릴게요' : '아쉽게도 환불이 어려워요',
        statusBadge: { text: isApproved ? '환불 승인' : '환불 거절', variant: isApproved ? 'success' : 'warning' },
        heroTitle: isApproved ? '환불이 승인됐어요' : '환불이 어려워요',
        heroSubtitle: isApproved
          ? '환불이 승인됐어요. 영업일 기준 3~5일 내 환불 처리해드릴게요.'
          : '아쉽게도 환불이 어렵다는 답변을 받았어요. 사유를 확인해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber },
            { label: '상품', value: data.productName },
            { label: isApproved ? '승인일' : '거절 사유', value: isApproved ? formatKDate(now) : (data.reason ?? '-'), emphasis: !isApproved },
          ]),
          emailNoticeBox(
            isApproved
              ? '카드 환불은 <strong>영업일 기준 3~5일</strong> 안에 처리돼요.'
              : '추가 문의는 <strong>support@cnecshop.com</strong>으로 연락주세요.',
            isApproved ? 'success' : 'info',
          ),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko/buyer/orders` },
        ...(isApproved ? {} : { secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` } }),
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'ORDER',
      title: isApproved ? '환불이 승인됐어요' : '환불이 어려워요',
      message: isApproved ? `${data.productName} 곧 환불 처리돼요.` : `${data.productName} - ${data.reason ?? '환불 불가'}`,
      linkUrl: '/buyer/orders',
    },
  }
}

// ---------- 46. 장바구니 리마인더 → 구매자 (마케팅) ----------

export function cartReminderMessage(data: {
  buyerName: string
  itemCount: number
  topProductName: string
  totalAmount: number
  cartUrl?: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 담아두신 상품을 잊지 않으셨나요?`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: `장바구니에 ${data.itemCount}개 상품이 기다리고 있어요`,
        statusBadge: { text: '장바구니 안내', variant: 'info' },
        heroTitle: '담아두신 상품을 잊지 않으셨나요?',
        heroSubtitle: `장바구니에 ${data.itemCount}개 상품이 기다리고 있어요.\n${data.topProductName} 외 ${data.itemCount - 1}개 상품이 있어요.`,
        sections: [
          emailAmountBox('장바구니 합계', data.totalAmount),
          emailNoticeBox('인기 상품은 <strong>품절될 수 있어요</strong>.', 'warning'),
        ],
        primaryAction: { text: '장바구니로 가기', url: data.cartUrl ?? `${SITE_URL}/ko/cart` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'MARKETING',
      title: '장바구니에 담아둔 상품이 있어요',
      message: `${data.topProductName} 외 ${data.itemCount - 1}개`,
      linkUrl: '/cart',
    },
  }
}

// ---------- 47. 재입고 알림 → 구매자 (마케팅) ----------

export function restockNotificationMessage(data: {
  buyerName: string
  productName: string
  productUrl: string
  price: number
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] ${data.productName} 재입고됐어요!`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '요청하신 상품이 재입고됐어요. 빠르게 품절될 수 있어요',
        statusBadge: { text: '재입고 완료', variant: 'success' },
        heroTitle: '요청하신 상품이 재입고됐어요!',
        darkHeroCard: { label: '재입고 상품', title: data.productName },
        sections: [
          emailAmountBox('가격', data.price),
          emailNoticeBox('인기 상품이라 <strong>빠르게 품절</strong>될 수 있어요.', 'warning'),
        ],
        primaryAction: { text: '지금 구매하기', url: data.productUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'MARKETING',
      title: '재입고됐어요!',
      message: `${data.productName}`,
      linkUrl: data.productUrl,
    },
  }
}

// ---------- 48. 쿠폰 발급 → 사용자 (마케팅) ----------

export function couponIssuedMessage(data: {
  userName: string
  couponName: string
  discountDisplay: string
  expiresAt: string
  minOrderAmount?: string
  useUrl: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 새 쿠폰이 도착했어요 - ${data.couponName}`,
      html: renderEmail({
        recipientType: null,
        preheader: `${data.discountDisplay} 쿠폰이 도착했어요`,
        statusBadge: { text: '쿠폰 도착', variant: 'success' },
        heroTitle: '새 쿠폰이 도착했어요',
        sections: [
          emailAmountBox(data.couponName, data.discountDisplay),
          emailInfoTable([
            { label: '쿠폰명', value: data.couponName },
            { label: '할인', value: data.discountDisplay, emphasis: true },
            ...(data.minOrderAmount ? [{ label: '최소 주문액', value: data.minOrderAmount }] : []),
            { label: '만료일', value: data.expiresAt },
          ]),
        ],
        primaryAction: { text: '쿠폰 사용하러 가기', url: data.useUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'MARKETING',
      title: '새 쿠폰이 도착했어요',
      message: `${data.couponName} - ${data.discountDisplay}`,
      linkUrl: '/coupons',
    },
  }
}

// ---------- 49. 쿠폰 만료 임박 → 사용자 (마케팅) ----------

export function couponExpiringMessage(data: {
  userName: string
  couponName: string
  discountDisplay: string
  expiresAt: string
  daysLeft: number
  useUrl: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 쿠폰이 ${data.daysLeft}일 후 만료돼요`,
      html: renderEmail({
        recipientType: null,
        preheader: `${data.couponName} 쿠폰이 곧 만료돼요`,
        statusBadge: { text: '쿠폰 만료 임박', variant: 'warning' },
        heroTitle: '쿠폰이 곧 만료돼요',
        sections: [
          emailAmountBox(data.couponName, data.discountDisplay, `${data.daysLeft}일 후 만료`),
          emailNoticeBox(`<strong>${data.daysLeft}일</strong> 후 만료되니 잊지 말고 사용해주세요.`, 'warning'),
        ],
        primaryAction: { text: '쿠폰 사용하기', url: data.useUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'MARKETING',
      title: '쿠폰이 곧 만료돼요',
      message: `${data.couponName} - ${data.daysLeft}일 후 만료`,
      linkUrl: '/coupons',
    },
  }
}

// ---------- 50. 재구매 리마인더 → 구매자 (마케팅) ----------

export function repurchaseReminderMessage(data: {
  buyerName: string
  lastProductName: string
  lastOrderedAt: string
  reorderUrl: string
  discountDisplay?: string
  recipientEmail?: string
}) {
  const sections: string[] = [
    emailInfoTable([
      { label: '이전 구매일', value: data.lastOrderedAt },
      { label: '예상 소진 시점', value: '지금쯤' },
    ]),
  ]
  if (data.discountDisplay) {
    sections.push(emailAmountBox('재구매 혜택', data.discountDisplay))
  }
  return {
    email: {
      subject: `[크넥샵] ${data.lastProductName} 다 쓰실 때쯤 아닌가요?`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: `${data.lastProductName} 재구매 시기가 됐어요`,
        statusBadge: { text: '재구매 안내', variant: 'info' },
        heroTitle: `${data.lastProductName} 다 쓰실 때쯤 아닌가요?`,
        darkHeroCard: { label: '지난번 구매', title: data.lastProductName },
        sections,
        primaryAction: { text: '다시 구매하기', url: data.reorderUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'MARKETING',
      title: '재구매할 시간이에요',
      message: data.lastProductName,
      linkUrl: data.reorderUrl,
    },
  }
}

// ---------- 51. 관심 크리에이터 새 공구 → 구매자 (마케팅) ----------

export function interestCreatorNewCampaignMessage(data: {
  buyerName: string
  creatorName: string
  campaignTitle: string
  campaignUrl: string
  discountDisplay?: string
  recipientEmail?: string
}) {
  const sections: string[] = [
    emailInfoTable([
      { label: '크리에이터', value: data.creatorName },
      { label: '캠페인', value: data.campaignTitle, emphasis: true },
      { label: '시작일', value: formatKDate(new Date()) },
    ]),
  ]
  if (data.discountDisplay) {
    sections.push(emailAmountBox('혜택', data.discountDisplay))
  }
  sections.push(emailNoticeBox(`팔로우하시는 크리에이터의 <strong>한정 공구</strong>예요.`, 'info'))
  return {
    email: {
      subject: `[크넥샵] ${data.creatorName}님의 새 공구가 열렸어요`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: `${data.creatorName}님이 새 공구를 시작했어요`,
        statusBadge: { text: '팔로우 크리에이터 소식', variant: 'info' },
        heroTitle: `${data.creatorName}님의 새 공구가 열렸어요`,
        heroSubtitle: `팔로우하시는 ${data.creatorName}님이 새 공구를 시작했어요.\n한정 기간이니 빠르게 확인해보세요.`,
        sections,
        primaryAction: { text: '공구 참여하기', url: data.campaignUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'MARKETING',
      title: `${data.creatorName}님의 새 공구`,
      message: data.campaignTitle,
      linkUrl: data.campaignUrl,
    },
  }
}

// ---------- 52. 크리에이터 월간 리포트 → 크리에이터 ----------

export function creatorMonthlyReportMessage(data: {
  creatorName: string
  period: string
  totalRevenue: number
  revenueChangePercent: number
  orderCount: number
  visitCount: number
  conversionRate: number
  topProductsText: string
  tipText: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] ${data.period} 내 샵 성과 리포트`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.period} 셀렉트샵 성과를 정리해드렸어요`,
        statusBadge: { text: '월간 리포트', variant: 'info' },
        heroTitle: `${data.period} 내 샵 성과`,
        heroSubtitle: `${data.creatorName}님, 지난 한 달 셀렉트샵 성과를 정리해드렸어요.`,
        sections: [
          emailAmountBox('이번 달 내 수익', data.totalRevenue, `전월 대비 ${data.revenueChangePercent}%`),
          emailInfoTable([
            { label: '주문 수', value: `${data.orderCount}건` },
            { label: '방문자', value: `${data.visitCount}명` },
            { label: '전환율', value: `${data.conversionRate}%` },
            { label: 'TOP 상품', value: data.topProductsText },
          ]),
          emailNoticeBox(data.tipText, 'info'),
        ],
        primaryAction: { text: '상세 리포트 보기', url: `${SITE_URL}/ko/creator/dashboard` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'REPORT',
      title: `${data.period} 월간 리포트`,
      message: `내 수익 ${formatKRW(data.totalRevenue)} (전월 대비 ${data.revenueChangePercent}%)`,
      linkUrl: '/creator/dashboard',
    },
  }
}

// ---------- 53. 브랜드 월간 리포트 → 브랜드 ----------

export function brandMonthlyReportMessage(data: {
  brandName: string
  period: string
  totalSales: number
  salesChangePercent: number
  creatorCount: number
  orderCount: number
  topProductText: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] ${data.period} 브랜드 성과 리포트`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `${data.period} 브랜드 판매 성과를 정리해드렸어요`,
        statusBadge: { text: '월간 리포트', variant: 'info' },
        heroTitle: `${data.period} 브랜드 성과`,
        heroSubtitle: `${data.brandName}님, 지난 한 달 판매 성과를 정리해드렸어요.`,
        sections: [
          emailAmountBox('이번 달 총 매출', data.totalSales, `전월 대비 ${data.salesChangePercent}%`),
          emailInfoTable([
            { label: '참여 크리에이터', value: `${data.creatorCount}명` },
            { label: '주문 수', value: `${data.orderCount}건` },
            { label: 'TOP 상품', value: data.topProductText },
          ]),
        ],
        primaryAction: { text: '상세 리포트 보기', url: `${SITE_URL}/ko/brand/dashboard` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'REPORT',
      title: `${data.period} 월간 리포트`,
      message: `총 매출 ${formatKRW(data.totalSales)}`,
      linkUrl: '/brand/dashboard',
    },
  }
}

// ---------- 54. 재고 소진 임박 → 브랜드 ----------

export function lowStockAlertMessage(data: {
  brandName: string
  productName: string
  currentStock: number
  threshold: number
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] ${data.productName} 재고가 얼마 남지 않았어요`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `${data.productName} 재고 ${data.currentStock}개 남음`,
        statusBadge: { text: '재고 소진 임박', variant: 'warning' },
        heroTitle: '재고가 얼마 남지 않았어요',
        sections: [
          emailAmountBox('남은 재고', `${data.currentStock}개`, `임계치 ${data.threshold}개`),
          emailInfoTable([
            { label: '상품', value: data.productName, emphasis: true },
            { label: '현재 재고', value: `${data.currentStock}개` },
            { label: '임계치', value: `${data.threshold}개` },
          ]),
          emailNoticeBox('품절 시 크리에이터 판매에 <strong>영향</strong>이 있어요.', 'warning'),
        ],
        primaryAction: { text: '재고 보충하기', url: `${SITE_URL}/ko/brand/products` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SYSTEM',
      title: '재고 소진 임박',
      message: `${data.productName} ${data.currentStock}개 남음`,
      linkUrl: '/brand/products',
    },
  }
}

// ---------- 55. 정산 입금 완료 → 크리에이터 ----------

export function settlementDepositedMessage(data: {
  creatorName: string
  period: string
  depositedAmount: number
  bankAccountMasked: string
  depositedAt: Date
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] ${data.period} 정산금이 입금됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${formatKRW(data.depositedAmount)}이 입금됐어요`,
        statusBadge: { text: '입금 완료', variant: 'success' },
        heroTitle: '정산금이 입금됐어요',
        sections: [
          emailAmountBox('입금 금액', data.depositedAmount),
          emailInfoTable([
            { label: '정산 기간', value: data.period },
            { label: '입금 계좌', value: data.bankAccountMasked },
            { label: '입금 일시', value: formatKDate(data.depositedAt) },
          ]),
          emailNoticeBox('이번 달 성과도 계속 이어가세요.', 'success'),
        ],
        primaryAction: { text: '정산 내역 보기', url: `${SITE_URL}/ko/creator/settlements` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SETTLEMENT',
      title: '정산금이 입금됐어요',
      message: `${data.period} ${formatKRW(data.depositedAmount)}`,
      linkUrl: '/creator/settlements',
    },
  }
}

// ---------- 56. 세금계산서 발행 → 브랜드 ----------

export function taxInvoiceIssuedMessage(data: {
  brandName: string
  period: string
  amount: number
  invoicePdfUrl: string
  recipientEmail?: string
}) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] ${data.period} 세금계산서가 발행됐어요`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `${data.period} 세금계산서를 확인해주세요`,
        statusBadge: { text: '세금계산서 발행', variant: 'info' },
        heroTitle: '세금계산서가 발행됐어요',
        sections: [
          emailAmountBox('발행 금액', data.amount),
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '기간', value: data.period },
            { label: '발행일', value: formatKDate(now) },
          ]),
        ],
        primaryAction: { text: 'PDF 다운로드', url: data.invoicePdfUrl },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SETTLEMENT',
      title: '세금계산서가 발행됐어요',
      message: `${data.period} ${formatKRW(data.amount)}`,
      linkUrl: '/brand/settlements',
    },
  }
}

// ---------- 57. 크리에이터 주간 요약 → 크리에이터 ----------

export function creatorWeeklySummaryMessage(data: {
  creatorName: string
  weekStart: string
  weekEnd: string
  totalRevenue: number
  revenueChangePercent: number
  topProductName: string
  recipientEmail?: string
}) {
  return {
    email: {
      subject: `[크넥샵] 이번 주 판매 요약 (${data.weekStart}~${data.weekEnd})`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `이번 주 수익 ${formatKRW(data.totalRevenue)}`,
        statusBadge: { text: '주간 요약', variant: 'info' },
        heroTitle: '이번 주 판매 요약',
        sections: [
          emailAmountBox('이번 주 수익', data.totalRevenue, `지난주 대비 ${data.revenueChangePercent}%`),
          emailInfoTable([
            { label: '기간', value: `${data.weekStart} ~ ${data.weekEnd}` },
            { label: 'TOP 상품', value: data.topProductName },
          ]),
        ],
        primaryAction: { text: '상세 보기', url: `${SITE_URL}/ko/creator/dashboard` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'REPORT',
      title: '이번 주 판매 요약',
      message: `수익 ${formatKRW(data.totalRevenue)} (${data.revenueChangePercent > 0 ? '+' : ''}${data.revenueChangePercent}%)`,
      linkUrl: '/creator/dashboard',
    },
  }
}

// ---------- 26. 정산 지급 완료 → 브랜드/크리에이터 ----------

export function settlementPaidMessage(data: {
  recipientName: string
  amount: number
  paidAt: string
  memo: string
  recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 정산 완료\n\n${data.recipientName}님, 정산이 완료되었어요.\n\n정산금액: ${formatPrice(data.amount)}\n정산일시: ${data.paidAt}\n메모: ${data.memo}`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SETTLEMENT_PAID, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 정산 완료 — ${formatPrice(data.amount)}이 지급되었어요`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '정산 완료', variant: 'success' },
        preheader: `${formatPrice(data.amount)}이 지급 완료되었어요`,
        heroTitle: `${data.recipientName}님, 정산이 완료되었어요`,
        heroSubtitle: '아래 금액이 지급 처리되었습니다.',
        sections: [
          emailInfoTable([
            { label: '수령인', value: data.recipientName },
            { label: '정산일시', value: data.paidAt },
            { label: '메모', value: data.memo },
          ]),
          emailAmountBox('정산 금액', data.amount),
        ],
        primaryAction: { text: '정산 내역 보기', url: `${SITE_URL}/ko/brand/settlements` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SETTLEMENT',
      title: '정산이 완료되었습니다',
      message: `${formatPrice(data.amount)} 지급 완료`,
      linkUrl: '/brand/settlements',
    },
  }
}

// ---------- 27. 정산 보류 → 브랜드/크리에이터 ----------

export function settlementHeldMessage(data: {
  recipientName: string
  reason: string
  recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 정산 보류\n\n${data.recipientName}님, 정산이 일시 보류되었어요.\n\n사유: ${data.reason}\n\n자세한 내용은 고객센터로 문의해주세요.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SETTLEMENT_HELD, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 정산 보류 안내`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '정산 보류', variant: 'warning' },
        preheader: '정산이 일시 보류되었어요',
        heroTitle: `${data.recipientName}님, 정산이 보류되었어요`,
        heroSubtitle: '아래 사유로 정산 지급이 일시 보류되었습니다.',
        sections: [
          emailInfoTable([
            { label: '사유', value: data.reason, emphasis: true },
          ]),
          emailNoticeBox('궁금한 점은 support@cnecshop.com으로 문의해주세요.', 'warning'),
        ],
        primaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SETTLEMENT',
      title: '정산이 보류되었습니다',
      message: `사유: ${data.reason}`,
      linkUrl: '/brand/settlements',
    },
  }
}

// ---------- 28. 정산 취소 → 브랜드/크리에이터 ----------

export function settlementCancelledMessage(data: {
  recipientName: string
  reason: string
  recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 정산 취소\n\n${data.recipientName}님, 정산이 취소되었어요.\n\n사유: ${data.reason}\n\n재정산 관련 문의는 고객센터로 연락주세요.`

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SETTLEMENT_CANCELLED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 정산 취소 안내`,
      html: renderEmail({
        recipientType: 'brand',
        statusBadge: { text: '정산 취소', variant: 'warning' },
        preheader: '정산이 취소되었어요',
        heroTitle: `${data.recipientName}님, 정산이 취소되었어요`,
        heroSubtitle: '아래 사유로 정산이 취소되었습니다.',
        sections: [
          emailInfoTable([
            { label: '취소 사유', value: data.reason, emphasis: true },
          ]),
          emailNoticeBox('재정산이 필요하시면 support@cnecshop.com으로 문의해주세요.', 'info'),
        ],
        primaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: {
      type: 'SETTLEMENT',
      title: '정산이 취소되었습니다',
      message: `사유: ${data.reason}`,
      linkUrl: '/brand/settlements',
    },
  }
}
