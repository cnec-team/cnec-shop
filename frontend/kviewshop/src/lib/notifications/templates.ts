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
        preheader: `${data.productName} 결제가 완료됐어요. 곧 발송 시작해드릴게요`,
        statusBadge: { text: '주문 완료', variant: 'success' },
        heroTitle: `${data.buyerName}님, 주문이 완료됐어요`,
        heroSubtitle: '결제가 정상적으로 처리됐어요.\n발송이 시작되면 운송장 번호와 함께 다시 알려드릴게요.',
        darkHeroCard: { label: '주문 상품', title: data.productName, subLabel: `주문번호 ${data.orderNumber}` },
        sections: [
          emailAmountBox('결제 금액', data.totalAmount, '결제 완료'),
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '결제일', value: formatKDate(now) },
          ]),
          emailNoticeBox('평균 <strong>1~3일 안에 발송</strong>돼요. 주말/공휴일은 제외하고 계산해주세요.', 'info'),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '주문이 완료되었습니다', message: `${data.productName} - ${formatPrice(data.totalAmount)}`, linkUrl },
  }
}

// ---------- 2. 배송 시작 → 구매자 ----------

export function shippingStartMessage(data: {
  buyerName: string; orderNumber: string; productName: string
  trackingNumber?: string; courierName?: string; recipientEmail?: string; orderLinkUrl?: string
}) {
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const courierInfo = data.courierName ? `\n택배사: ${data.courierName}` : ''
  const trackingInfo = data.trackingNumber ? `\n운송장번호: ${data.trackingNumber}` : ''
  const kakaoMsg = `[크넥샵] 배송 시작\n\n${data.buyerName}님, 상품이 발송되었��니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}${courierInfo}${trackingInfo}`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SHIPPING_START, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 발송 시작! 곧 만나보세요`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: `${data.courierName ?? '택배'}으로 발송됐어요. 운송장 번호로 배송 위치 확인하세요`,
        statusBadge: { text: '발송 시작', variant: 'info' },
        heroTitle: `${data.productName}이(가) 출발했어요`,
        heroSubtitle: '주문하신 상품이 방금 발송됐어요.\n보통 1~2일 안에 도착해요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            ...(data.courierName ? [{ label: '택배사', value: data.courierName }] : []),
            ...(data.trackingNumber ? [{ label: '운송장���호', value: data.trackingNumber, emphasis: true }] : []),
            { label: '발송일', value: formatKDate(now) },
          ]),
          emailNoticeBox('아래 버튼을 누르면 <strong>실시간 배송 위치</strong>를 확인할 수 있어요.', 'info'),
        ],
        primaryAction: { text: '배송 추적하기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SHIPPING', title: '상품이 발송되었습니다', message: `${data.productName}${data.trackingNumber ? ` (운송장: ${data.trackingNumber})` : ''}`, linkUrl },
  }
}

// ---------- 3. 배송 완료 → 구��자 ----------

export function deliveryCompleteMessage(data: {
  buyerName: string; orderNumber: string; productName: string; recipientEmail?: string; orderLinkUrl?: string
}) {
  const linkUrl = data.orderLinkUrl ?? '/buyer/reviews'
  const kakaoMsg = `[크넥샵] 배송 ���료\n\n${data.buyerName}님, 상품이 배달 완료되었습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n\n상품이 마음에 드셨다면 리뷰를 남겨주세요!`
  const now = new Date()

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.DELIVERY_COMPLETE, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 배송이 완료됐어요`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '잘 받으셨나요? 짧은 후기로 다른 분들도 도와주세요',
        statusBadge: { text: '배�� 완료', variant: 'success' },
        heroTitle: `${data.productName} 배송이 완료됐어요`,
        heroSubtitle: '잘 받으셨나요?\n사용해보시고 짧은 후기 남겨주시면 다른 분들께도 큰 도움이 돼요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber },
            { label: '상품', value: data.productName },
            { label: '배송 완료��', value: formatKDate(now) },
          ]),
          emailNoticeBox('리뷰 작성은 <strong>1분이면 충분</strong>해요. 솔직한 후기는 다른 구매자에게 큰 도움이 돼요.', 'success'),
        ],
        primaryAction: { text: '리뷰 작성하기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        secondaryAction: { text: '주문 내역', url: `${SITE_URL}/ko/buyer/orders` },
        tip: '리뷰 작성에 1분이면 충분해요. 솔직한 후기는 다른 구매자에게 큰 도움이 돼요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'DELIVERY', title: '배송이 완료되었���니다', message: `${data.productName} - 리뷰를 남겨주세요!`, linkUrl },
  }
}

// ---------- 4. 주문 발생 → 브랜드 ----------

export function newOrderBrandMessage(data: {
  brandName: string; orderNumber: string; productName: string; quantity: number; totalAmount: number; buyerName: string; recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 새 주문 발생\n\n${data.brandName}님, 새로운 주문이 들어왔습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName} x ${data.quantity}\n결제금액: ${formatPrice(data.totalAmount)}\n구매자: ${data.buyerName}`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.NEW_ORDER_BRAND, message: kakaoMsg },
    email: {
      subject: `[크���샵] 새 주문 접수! ${data.productName} x ${data.quantity}`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `${data.buyerName}님이 주문하셨어요. 빠르게 송장 등록 부탁드려요`,
        statusBadge: { text: '새 주문', variant: 'success' },
        heroTitle: '새 주문이 접수됐어요',
        heroSubtitle: '구매자가 결제를 완료했어요.\n빠른 발송을 위해 1~2일 안에 송장을 등록해주세요.',
        sections: [
          emailAmountBox('결제 금액', data.totalAmount, '플랫폼 수수료 차감 전'),
          emailInfoTable([
            { label: '���문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: `${data.productName} x ${data.quantity}` },
            { label: '구매자', value: data.buyerName },
            { label: '주문일시', value: formatKDate(now) },
          ]),
          emailNoticeBox('영업일 기준 <strong>2일 내 송장 미입력</strong> 시 자동 알림이 다시 발송돼요.', 'warning'),
        ],
        primaryAction: { text: '주문 처리하기', url: `${SITE_URL}/ko/brand/orders` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '새 주문이 접수되었습니다', message: `${data.productName} x ${data.quantity} - ${formatPrice(data.totalAmount)}`, linkUrl: '/brand/orders' },
  }
}

// ---------- 5. 송장 미입력 → 브랜드 ----------

export function invoiceReminderMessage(data: {
  brandName: string; orderNumber: string; productName: string; orderDate: string; recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 송장 입력 요청\n\n${data.brandName}님, 아직 송장이 입력되지 않은 주문이 있습니다.\n\n주문번호: ${data.orderNumber}\n상품: ${data.productName}\n주문일: ${data.orderDate}\n\n빠른 배송 처리를 부탁드립니다.`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.INVOICE_REMINDER, message: kakaoMsg },
    email: {
      subject: `[���넥샵] 송장 등록이 필요해요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `${data.orderDate} 주문이 아직 발송 처리되지 않았어요`,
        statusBadge: { text: '송��� 등록 필요', variant: 'warning' },
        heroTitle: '아직 송장이 등록되지 않았어���',
        heroSubtitle: '아래 주문이 결제 완료된 지 시간이 지났는데 송장이 등록되지 않았어요.\n구매자가 기다리고 있어요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '상품', value: data.productName },
            { label: '주문일', value: data.orderDate },
            { label: '독촉 발송일', value: formatKDate(now) },
          ]),
          emailNoticeBox('구매자 만족도와 <strong>브랜드 평점</strong>에 영향을 줄 수 있어요. 가능한 빨리 송장을 등록���주세요.', 'warning'),
        ],
        primaryAction: { text: '송장 등록하기', url: `${SITE_URL}/ko/brand/orders` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '송장 입력을 완료해주세요', message: `${data.orderNumber} - ${data.productName}`, linkUrl: '/brand/orders' },
  }
}

// ---------- 6. 판매 발생 → 크리에이��� ----------

export function saleOccurredMessage(data: {
  creatorName: string; productName: string; orderAmount: number; commissionAmount: number; recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 판매 ��생\n\n${data.creatorName}님, 내 샵에서 판매가 발생했습니다!\n\n상품: ${data.productName}\n��매금액: ${formatPrice(data.orderAmount)}\n내 수익: ${formatPrice(data.commissionAmount)}`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SALE_OCCURRED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 판매 발생! +${formatPrice(data.commissionAmount)}`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.productName}이(가) 판매됐어요. 내 수익 ${formatPrice(data.commissionAmount)}`,
        statusBadge: { text: '판매 발생', variant: 'success' },
        heroTitle: `${data.creatorName}님, 판매가 발생했어��!`,
        heroSubtitle: '방금 내 셀렉트샵에서 판매가 일어났어요.\n정산은 매월 정해진 날��에 진행돼요.',
        sections: [
          emailAmountBox('내 수익', data.commissionAmount, '커미션 100% · 수수료 0원'),
          emailInfoTable([
            { label: '상품', value: data.productName },
            { label: '판매 금액', value: formatKRW(data.orderAmount) },
            { label: '판매 시각', value: formatKDate(now) },
          ]),
          emailNoticeBox('정산은 <strong>월 1회</strong> 진행돼요. 누적 수익은 대시보드에서 실시간으로 확인할 수 있어요.', 'success'),
        ],
        primaryAction: { text: '판매 현황 보기', url: `${SITE_URL}/ko/creator/sales` },
        secondaryAction: { text: '내 샵 가기', url: `${SITE_URL}/ko/creator/shop` },
        tip: '판매 직후 <strong>감사 스토리</strong>를 올리면 재구매율이 높아져요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SALE', title: '판매가 발생했습니다!', message: `${data.productName} - 내 수익 ${formatPrice(data.commissionAmount)}`, linkUrl: '/creator/sales' },
  }
}

// ---------- 7. 캠페인 승인 → 크리에이터 ----------

export function campaignApprovedMessage(data: {
  creatorName: string; brandName: string; campaignTitle: string; recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 캠페인 참여 승인\n\n${data.creatorName}님, 캠페인 참여가 승인되었습니다.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignTitle}\n\n이제 해당 상품을 내 샵에서 판매할 ��� 있습니다.`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CAMPAIGN_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.brandName} 캠페인 참여가 확정됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.campaignTitle} 캠페인 참여가 승인됐어요. 지금 바로 판매 가능해요`,
        statusBadge: { text: '참여 확정', variant: 'success' },
        heroTitle: '캠페인 참여가 확정됐��요',
        heroSubtitle: `${data.brandName}의 캠페인에 참여가 승인됐어요.\n이미 내 셀렉트샵에 자동으로 추가됐어요.`,
        sections: [
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '승인일', value: formatKDate(now) },
          ]),
          emailNoticeBox('SNS에 셀렉트샵 링크를 공유하면 바로 판매가 시작돼요. <strong>첫 판매까지 보통 3~7일</strong> 걸려요.', 'success'),
        ],
        primaryAction: { text: '내 샵 확인하기', url: `${SITE_URL}/ko/creator/shop` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '캠페인 참여가 승인되었습니다', message: `${data.brandName} - ${data.campaignTitle}`, linkUrl: '/creator/campaigns' },
  }
}

// ---------- 8. 캠페인 시작 → ��리에이터 ----------

export function campaignStartedMessage(data: {
  creatorName: string; brandName: string; campaignTitle: string; endDate?: string; recipientEmail?: string
}) {
  const endInfo = data.endDate ? `\n종료일: ${data.endDate}` : ''
  const kakaoMsg = `[크���샵] 캠페인 시작\n\n${data.creatorName}님, 참여 중인 ��페인��� 시작되었습니다.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignTitle}${endInfo}\n\n지금부터 판매가 가능합니다!`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CAMPAIGN_STARTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.campaignTitle} 캠페인 오픈! 지금부터 판매 가능해요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.brandName}의 캠페인이 방금 시작됐어요`,
        statusBadge: { text: '캠��인 오픈', variant: 'info' },
        heroTitle: '캠페인이 시작됐어��',
        heroSubtitle: '지금부터 캠페인 종료일까지 판매 가능해요.\nSNS에 공유해서 첫 판매를 만들어보세요.',
        sections: [
          emailInfoTable([
            { label: '브랜드', value: data.brandName },
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '시작일', value: formatKDate(now) },
            ...(data.endDate ? [{ label: '종료일', value: data.endDate }] : []),
          ]),
          emailNoticeBox('캠페인 기간 종료 시 <strong>자동으로 내 샵에서 내려가요</strong>. 한정 기간 강조하면 전환율이 더 높아져요.', 'info'),
        ],
        primaryAction: { text: '내 샵 확인하기', url: `${SITE_URL}/ko/creator/shop` },
        tip: '캠페인 시작 후 <strong>48시간이 판매 골든타임</strong>이에요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '캠��인이 시작��었습니다', message: `${data.brandName} - ${data.campaignTitle}`, linkUrl: '/creator/campaigns' },
  }
}

// ---------- 9. 체험 승인 → 크리에이터 ----------

export function trialApprovedMessage(data: {
  creatorName: string; brandName: string; productName: string; recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 체험 신청 승인\n\n${data.creatorName}님, 체험 신청이 승인되었습니다.\n\n브랜드: ${data.brandName}\n��품: ${data.productName}\n\n곧 체험 상품이 발송될 예정입니다.`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 체험 신청이 승인됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.brandName}에서 곧 체험 상품을 발송해드려요`,
        statusBadge: { text: '승인 완료', variant: 'success' },
        heroTitle: '체험 신청이 승인됐어요',
        heroSubtitle: `${data.brandName}에서 곧 ���험 상품을 발송해드려요.\n발송되면 운��장 번호와 함께 다시 알려드릴게요.`,
        darkHeroCard: { label: '체험 상품', title: data.productName, subLabel: data.brandName },
        sections: [
          emailInfoTable([
            { label: '브��드', value: data.brandName },
            { label: '승인���', value: formatKDate(now) },
            { label: '예상 발송', value: '1~2영업일 이내' },
          ]),
          emailNoticeBox('체험 후 공구 진행 여부는 <strong>자유롭게 결정</strong>하실 수 있어요. 진행하지 않아도 불이익은 없어요.', 'info'),
        ],
        primaryAction: { text: '체험 현황 보기', url: `${SITE_URL}/ko/creator/trial/my` },
        secondaryAction: { text: '브랜드 프로필 ���기', url: `${SITE_URL}/ko/creator/trial/my` },
        tip: '체험 후기를 작성하시면 다음 캠페인에서 <strong>매칭 우선 순위</strong>�� 올라가요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '체험 신청이 승인되었습니다', message: `${data.brandName} - ${data.productName}`, linkUrl: '/creator/trial/my' },
  }
}

// ---------- 10. 체험 발송 ��� 크리에이터 ----------

export function trialShippedMessage(data: {
  creatorName: string; brandName: string; productName: string; trackingNumber?: string; recipientEmail?: string
}) {
  const trackingInfo = data.trackingNumber ? `\n운송장번호: ${data.trackingNumber}` : ''
  const kakaoMsg = `[크넥샵] 체험 상품 발송\n\n${data.creatorName}님, 체험 상��이 발송되었습니다.\n\n브랜드: ${data.brandName}\n상품: ${data.productName}${trackingInfo}`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_SHIPPED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.productName} 체험 상품이 출발했어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '운송장 번호로 배송 위치 확인하세요',
        statusBadge: { text: '발송 시작', variant: 'info' },
        heroTitle: '체험 상품이 출발했어요',
        heroSubtitle: `${data.brandName}에서 체험 ���품을 발송했어요.\n보통 1~2일 안에 도착해요.`,
        darkHeroCard: { label: '체험 상품', title: data.productName, subLabel: data.brandName },
        sections: [
          emailInfoTable([
            ...(data.trackingNumber ? [{ label: '운송장번호', value: data.trackingNumber, emphasis: true }] : []),
            { label: '발송일', value: formatKDate(now) },
          ]),
          emailNoticeBox('도착 후 사용해보시고 공구 진행 여부를 결정해주세요. 결정 기한은 보통 <strong>7~14일</strong>이에요.', 'info'),
        ],
        primaryAction: { text: '체험 현황 보기', url: `${SITE_URL}/ko/creator/trial/my` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '체험 상품이 발송되었��니다', message: `${data.brandName} - ${data.productName}`, linkUrl: '/creator/trial/my' },
  }
}

// ---------- 11. 체험 신청 접수 → 브랜드 ----------

export function trialRequestedMessage(data: {
  brandName: string; creatorName: string; productName: string; recipientEmail?: string
}) {
  const kakaoMsg = `[크넥샵] 체험 신청 접수\n\n${data.brandName}님, 새로운 체험 ��청이 접���되었습니다.\n\n크리에이터: ${data.creatorName}\n상품: ${data.productName}\n\n승인 여부를 결정해주세요.`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.TRIAL_REQUESTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.creatorName}님이 ${data.productName} 체험을 신청했어요`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: '크리에이터 프로필을 확인하고 승인 여부를 결정해주세요',
        statusBadge: { text: '새 체험 신청', variant: 'info' },
        heroTitle: '새 체험 신청이 접수됐어요',
        heroSubtitle: `${data.creatorName}님이 체험 상품을 신청했어요.\n크리에이터 프로필 확인 후 승인 여부를 결정해주세요.`,
        darkHeroCard: { label: '체험 상품', title: data.productName, subLabel: `신청자 ${data.creatorName}` },
        sections: [
          emailInfoTable([{ label: '신청일', value: formatKDate(now) }]),
          emailNoticeBox('승인 시 자동으로 크리에이터에게 알림이 가고, <strong>발송 정보 입력 화면</strong>으로 이동해요.', 'info'),
        ],
        primaryAction: { text: '체험 신청 검토하기', url: `${SITE_URL}/ko/brand/trial` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '새 체험 신청이 접수되었습니다', message: `${data.creatorName} - ${data.productName}`, linkUrl: '/brand/trial' },
  }
}

// ---------- 12. 정산 확정 → 크리에이터 ----------

export function settlementConfirmedMessage(data: {
  creatorName: string; period: string; netAmount: number; paymentDate: string; recipientEmail?: string
}) {
  const kakaoMsg = `[���넥샵] 정산 확��\n\n${data.creatorName}님, ${data.period} 정산이 확정되었습니다.\n\n정산금액: ${formatPrice(data.netAmount)}\n입금예정일: ${data.paymentDate}`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.SETTLEMENT_CONFIRMED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.period} 정산 확정 — ${data.paymentDate}에 입금돼요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${formatPrice(data.netAmount)}이 ${data.paymentDate}에 등록 계좌로 입금돼요`,
        statusBadge: { text: '정산 확정', variant: 'success' },
        heroTitle: `${data.period} 정산이 확정됐어요`,
        heroSubtitle: '아래 금액이 등록하신 계좌로 입금될 예정��에요.\n입금 완료되면 다시 알려드릴게요.',
        sections: [
          emailAmountBox('정산 금액', data.netAmount, '세금/수수료 차감 후 실수령액'),
          emailInfoTable([
            { label: '정산 기간', value: data.period },
            { label: '확정일', value: formatKDate(now) },
            { label: '입금 예정일', value: data.paymentDate, emphasis: true },
          ]),
          emailNoticeBox('<strong>계좌 정보 변경</strong>은 정산 페이지에서 미리 수정해주세요. 입금 후엔 변경이 어려워요.', 'success'),
        ],
        primaryAction: { text: '정산 내역 보기', url: `${SITE_URL}/ko/creator/settlements` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SETTLEMENT', title: '정산이 확정되었습니다', message: `${data.period} - ${formatPrice(data.netAmount)}`, linkUrl: '/creator/settlements' },
  }
}

// ---------- 13. 공구 초대 → 크리에이터 ----------

export function proposalGongguInviteMessage(data: {
  creatorName: string; brandName: string; campaignName: string; commissionRate?: number; messageBody?: string; acceptUrl: string; recipientEmail?: string
}) {
  const commissionInfo = data.commissionRate ? `\n커미션: ${data.commissionRate}%` : ''
  const kakaoMsg = `[크넥샵] 공구 초대\n\n${data.creatorName}님, 새로운 공구 ���대가 도착했어요.\n\n브랜드: ${data.brandName}\n캠페인: ${data.campaignName}${commissionInfo}\n\n아래 링크에서 상세 내용을 확인해주세요.`
  const now = new Date()
  const sections: string[] = []
  if (data.commissionRate) { sections.push(emailAmountBox('���미션', `${data.commissionRate}%`, '건당 정산 · 수수료 0원')) }
  sections.push(emailInfoTable([
    { label: '브랜드', value: data.brandName },
    { label: '캠페인', value: data.campaignName, emphasis: true },
    { label: '초대 일시', value: formatKDate(now) },
  ]))
  if (data.messageBody) { sections.push(emailNoticeBox(data.messageBody, 'info')) }

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.PROPOSAL_GONGGU, message: kakaoMsg },
    email: {
      subject: `[${data.brandName}] ${data.campaignName} 공구 초대가 도착했어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.brandName}에서 공구 참여 초대가 왔어요. 커미션 ${data.commissionRate ?? ''}%`,
        statusBadge: { text: '공구 초대', variant: 'warning' },
        heroTitle: `${data.brandName}에서\n공구 초대가 왔어요`,
        heroSubtitle: `${data.creatorName}님께 새로운 공구 캠페인을 제안드려요.\n자세한 조건은 아래에서 확인해 주세요.`,
        sections,
        primaryAction: { text: '캠페인 자세히 보기', url: data.acceptUrl },
        secondaryAction: { text: '나중에 결정하기', url: `${SITE_URL}/ko/creator/proposals` },
        tip: '초대 캠페인은 <strong>48시간 이내 응답</strong>할수록 매칭률이 높아요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: `${data.brandName}에서 공구 초대가 왔어요`, message: `${data.campaignName} 캠페인`, linkUrl: '/creator/proposals' },
  }
}

// ---------- 14. 상품 추천 요청 → 크리에이터 ----------

export function proposalProductPickMessage(data: {
  creatorName: string; brandName: string; productName: string; commissionRate?: number; messageBody?: string; acceptUrl: string; recipientEmail?: string
}) {
  const commissionInfo = data.commissionRate ? `\n커미션: ${data.commissionRate}%` : ''
  const kakaoMsg = `[크넥샵] 상품 추천 요청\n\n${data.creatorName}님, 새로운 상품 추천 요청이 도착했어요.\n\n��랜드: ${data.brandName}\n상품: ${data.productName}${commissionInfo}\n\n내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.`
  const now = new Date()
  const sections: string[] = []
  if (data.commissionRate) { sections.push(emailAmountBox('커미션', `${data.commissionRate}%`, '건당 정산 · 수수료 0원')) }
  sections.push(emailInfoTable([{ label: '요청일', value: formatKDate(now) }]))
  if (data.messageBody) { sections.push(emailNoticeBox(data.messageBody, 'info')) }

  return {
    kakao: { templateCode: KAKAO_TEMPLATES.PROPOSAL_PRODUCT_PICK, message: kakaoMsg },
    email: {
      subject: `[${data.brandName}] ${data.productName} 추천 요청이 도착했어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: `${data.brandName}의 ${data.productName} 상시 추천 요청이 왔어요. 커미션 ${data.commissionRate ?? ''}%`,
        statusBadge: { text: '상품 추천 요��', variant: 'info' },
        heroTitle: `${data.brandName}에서\n상품 추천 요청이 왔어요`,
        heroSubtitle: `${data.creatorName}님의 셀렉트샵에 상시 추��� 상품으로 등록해달라는 요청이���요.\n마음에 들면 추가해보세요.`,
        darkHeroCard: { label: '추천 상품', title: data.productName, subLabel: data.brandName },
        sections,
        primaryAction: { text: '상품 자세히 보기', url: data.acceptUrl },
        secondaryAction: { text: '나중에 결정하기', url: `${SITE_URL}/ko/creator/proposals` },
        tip: '추천 상품은 <strong>스토리·릴스에 1회 이상 노출</strong>하면 전환율이 3배 올라가요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: `${data.brandName}에서 상품 추��� 요청`, message: data.productName, linkUrl: '/creator/proposals' },
  }
}

// ---------- 15. 일괄 발송 리포트 → 브랜드 (이메일만) ----------

export function bulkSendReportMessage(data: {
  brandName: string; sentCount: number; failedCount: number; channelBreakdown: Record<string, number>; paidCount: number; paidAmount: number; reportLink: string; recipientEmail?: string
}) {
  const now = new Date()
  const channelRows = Object.entries(data.channelBreakdown).map(([ch, count]) => ({ label: ch, value: `${count}건` }))
  const sections: string[] = []
  if (data.paidCount > 0) { sections.push(emailAmountBox('유료 발송 비용', data.paidAmount, `유료 ${data.paidCount}건 \u00D7 500원`)) }
  sections.push(emailInfoTable([
    { label: '총 발송', value: `${data.sentCount}건`, emphasis: true },
    { label: '실패', value: `${data.failedCount}건` },
    { label: '발송 일시', value: formatKDate(now) },
    ...channelRows,
  ]))
  sections.push(emailNoticeBox('실패한 발송은 <strong>자동으로 재시도되지 않아요</strong>. 필요 시 다시 발송해주세요.', 'info'))

  return {
    kakao: null,
    email: {
      subject: `[크넥샵] 일괄 발송 완료 — ${data.sentCount}건 전송됨`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `총 ${data.sentCount}건 전송, 실패 ${data.failedCount}건. 자세한 리포트를 확인하세요`,
        statusBadge: { text: '발송 완료', variant: 'success' },
        heroTitle: '일괄 발송이 완료됐어요',
        heroSubtitle: '제안 메시지 일괄 발송이 끝났어요.\n발송 결과와 비용을 확인해주세요.',
        sections,
        primaryAction: { text: '발송 내역 보기', url: data.reportLink },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: null,
  }
}

// ---------- 16. 크리에이터 가입 신청 → 크리에��터 ----------

export function creatorApplicationSubmittedMessage(data: { creatorName: string; recipientEmail?: string }) {
  const kakaoMsg = `[크넥샵] 가입 신청 완료\n\n${data.creatorName}님, ��넥샵 크리에이터 가입 신청이 완료됐어요.\n\n1~2영업일 내 심사 결과를 알려드릴게요.\n승인되면 바로 내 샵을 열 수 있어요!`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_APPLICATION_SUBMITTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.creatorName}님, 가입 신청이 접수됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '1~2영업일 안에 심사 결과 알려드릴게요',
        statusBadge: { text: '가입 신청 접수', variant: 'info' },
        heroTitle: `${data.creatorName}님,\n가입 신청이 접수됐어요`,
        heroSubtitle: '1~2영업일 안에 심사 결과를 이메일로 알려드릴게요.\n승인되면 바로 내 셀렉트샵을 열 수 있어요.',
        sections: [
          emailAmountBox('심사 후 받게 될 혜택', 3000, '가입 축하 포인트 자동 지급'),
          emailInfoTable([
            { label: '신청일', value: formatKDate(now) },
            { label: '심사 예정', value: '영업일 기준 1~2일' },
            { label: '결과 안내', value: '가입 이메일로 발송' },
          ]),
          emailNoticeBox('심사 결과 메일이 보이지 않으면 <strong>스팸함</strong>도 한 번 확인해 주세요.', 'info'),
        ],
        primaryAction: { text: '크넥샵 둘���보기', url: `${SITE_URL}/ko` },
        secondaryAction: { text: '도움말 ��기', url: `${SITE_URL}/ko/support` },
        tip: '심사 대기 중에 <strong>프로필과 SNS 링크</strong>를 미리 채워두면, 승인 직후 첫 캠페인 매칭 속도가 빨라져요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SYSTEM', title: '크리에이터 가입 신청이 완료됐어요', message: '1~2영업일 내 심사 결과를 알려드릴게요.', linkUrl: '/creator/pending' },
  }
}

// ---------- 17. 크리에이터 승인 → 크리에이터 ----------

export function creatorApprovedMessage(data: { creatorName: string; recipientEmail?: string }) {
  const kakaoMsg = `[크넥샵] 가입 승인 완료\n\n축하드려요! ${data.creatorName}님의 크넥샵 크리에이터 가입이 승인됐어요.\n\n지금 바로 내 샵을 열어보세요.\n가입 축하 3,000원이 지급됐어요!`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_APPROVED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] ${data.creatorName}님, 크리에이터 ���입이 승인됐어요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '지금 바로 내 셀렉트샵을 열고 첫 판매를 시작해보세요',
        statusBadge: { text: '승인 완료', variant: 'success' },
        heroTitle: `축하해요, ${data.creatorName}님!`,
        heroSubtitle: '크넥샵 크리에이터 가입이 승���됐어요.\n지금 바로 내 셀렉트샵을 열고 첫 판매를 시작해보세요.',
        sections: [
          emailAmountBox('가입 축하 포인트', 3000, '즉시 지급 완료'),
          emailInfoTable([
            { label: '승인일', value: formatKDate(now) },
            { label: '첫 혜택', value: '가입 포인트 3,000원' },
            { label: '다음 단계', value: '첫 캠페인 선택' },
          ]),
          emailNoticeBox('대시보드에서 첫 캠페인을 골라 내 샵에 추가해보세요. 보통 <strong>첫 판매까지 3~7일</strong> 걸려요.', 'success'),
        ],
        primaryAction: { text: '내 샵 시작하기', url: `${SITE_URL}/ko/creator/dashboard` },
        secondaryAction: { text: '캠페인 둘러보��', url: `${SITE_URL}/ko/creator/campaigns` },
        tip: '첫 셀렉트샵 링크를 <strong>인스타 프로필</strong>에 먼저 걸어두면 방문율이 2~3배 높아져요.',
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SYSTEM', title: '크리에이터 가입이 승인됐어요!', message: '지�� 바로 내 샵을 열어보세요. 가입 축하 3,000원이 지급됐어요!', linkUrl: '/creator/dashboard' },
  }
}

// ---------- 18. 크리에이터 거절 → 크리에이터 ----------

export function creatorRejectedMessage(data: { creatorName: string; reason: string; recipientEmail?: string }) {
  const kakaoMsg = `[크넥샵] 가입 심사 결과\n\n${data.creatorName}님, 아쉽게도 이번 심사에서는 승인이 어려웠어요.\n\n사유: ${data.reason}\n\n보완 후 재신청이 가능합니다.`
  const now = new Date()
  return {
    kakao: { templateCode: KAKAO_TEMPLATES.CREATOR_REJECTED, message: kakaoMsg },
    email: {
      subject: `[크넥샵] 가입 심사 결과를 알려드려요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '아쉽게도 이번엔 승인이 어려웠어요. 다시 신청 가능해요',
        statusBadge: { text: '심사 결과 안내', variant: 'warning' },
        heroTitle: `${data.creatorName}님, 심사 결과를 알려드려요`,
        heroSubtitle: '아쉽게도 이번 심사에서는 ���인이 어려웠어��.\n아래 사유를 확인하시고 정보를 보완해서 다시 신청해주세요.',
        sections: [
          emailInfoTable([
            { label: '심사일', value: formatKDate(now) },
            { label: '심사 결과', value: '승인 보류' },
            { label: '사유', value: data.reason, emphasis: true },
          ]),
          emailNoticeBox('재신청은 사유 보완 후 언제든 가능해요. 도움이 필요하시면 <strong>support@cnecshop.com</strong>으로 문의주세요.', 'info'),
        ],
        primaryAction: { text: '다시 신청하기', url: `${SITE_URL}/ko/creator/pending` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SYSTEM', title: '크리에이터 가입 심사 결과', message: `아쉽게도 승인이 어려웠어요. 사유: ${data.reason}`, linkUrl: '/creator/pending' },
  }
}

// ---------- 19. 브랜드 승인 → 브랜드 ----------

export function brandApprovedTemplate(data: { brandName: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] ${data.brandName} 입점이 ���인됐어요`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: '지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세���',
        statusBadge: { text: '승�� 완료', variant: 'success' },
        heroTitle: `${data.brandName} 입점��� 승인됐어요`,
        heroSubtitle: '지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요.',
        sections: [
          emailInfoTable([
            { label: '브랜드명', value: data.brandName, emphasis: true },
            { label: '입점일', value: formatKDate(now) },
            ...(data.recipientEmail ? [{ label: '담당자 이메일', value: data.recipientEmail }] : []),
          ]),
          emailNoticeBox('상품 등록 후 어드민 검토를 거쳐 노출돼요. <strong>영업일 기준 1~2일</strong> 걸려요.', 'info'),
        ],
        primaryAction: { text: '상품 등록하기', url: `${SITE_URL}/ko/brand/products/new` },
        secondaryAction: { text: '브랜드 대시보드', url: `${SITE_URL}/ko/brand/dashboard` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SYSTEM', title: '브랜드 승인 완료', message: `${data.brandName}가 승인되었어요. 지금 바로 상품을 등록해보세요!`, linkUrl: '/brand/products/new' },
  }
}

// ---------- 20. 브랜드 거절 → 브랜드 ----------

export function brandRejectedTemplate(data: { brandName: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 입점 심사 결과를 알려드려요`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: '아쉽게도 이번엔 입��이 어려웠어요. 사유와 보완 방법을 안내드려요',
        statusBadge: { text: '심사 결�� 안내', variant: 'warning' },
        heroTitle: `${data.brandName} 입점 심사 결과를 ��려드려요`,
        heroSubtitle: '아쉽게도 이번 심사에서는 입점이 어려웠어요.\n사유 확인 후 보완해서 다시 신청 가능해요.',
        sections: [
          emailInfoTable([
            { label: '심사일', value: formatKDate(now) },
            { label: '심사 결과', value: '입점 보류' },
            { label: '브랜드명', value: data.brandName },
          ]),
          emailNoticeBox('구체적인 사유와 보완 방법은 담당자가 별도로 안내드려요. 빠른 답변이 필요하���면 <strong>support@cnecshop.com</strong>으로 문의주세요.', 'info'),
        ],
        primaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SYSTEM', title: '��랜드 등록 거절', message: `${data.brandName} 등록이 거절되었습니다. 자세한 사항은 관리자에게 ��의하��요.`, linkUrl: '/support' },
  }
}

// ---------- 21. 브랜드 상태 변경 → 브랜드 ----------

export function brandStatusChangedTemplate(data: { brandName: string; status: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] ${data.brandName} 운영 상태가 변경됐어요`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `운영 상태가 ${data.status}로 변경됐어요. 자세한 내용을 확인해주세요`,
        statusBadge: { text: '상태 ���경', variant: 'neutral' },
        heroTitle: `${data.brandName} 운영 상태가 변경됐어요`,
        heroSubtitle: '아래 변경된 운영 상��를 확인해주세요.\n궁금한 점은 언제든 문의주세요.',
        sections: [
          emailInfoTable([
            { label: '브랜드명', value: data.brandName },
            { label: '변경일시', value: formatKDate(now) },
            { label: '변경된 상태', value: data.status, emphasis: true },
          ]),
          emailNoticeBox('운영 상태에 따라 <strong>상품 노출, 주문 접수, 정산</strong>이 달라질 수 있어요. 자세한 내용은 대시보드에서 확인해주세요.', 'warning'),
        ],
        primaryAction: { text: '브랜드 대시보드', url: `${SITE_URL}/ko/brand/dashboard` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'SYSTEM', title: '브랜드 상태 변경', message: `${data.brandName} 상태가 변���되었습니다.`, linkUrl: '/brand/dashboard' },
  }
}

// ---------- 22. 주문 취소 (브랜드→구매자) ----------

export function orderCancelledByBrandTemplate(data: { orderNumber: string; cancelReason: string; recipientEmail?: string; orderLinkUrl?: string }) {
  const linkUrl = data.orderLinkUrl ?? '/buyer/orders'
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 주문이 취소됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'buyer',
        preheader: '결제하신 금액은 영업일 기준 3~5일 안에 환불돼요',
        statusBadge: { text: '주문 취소', variant: 'warning' },
        heroTitle: '주문이 취소됐어���',
        heroSubtitle: '브랜드 측 사유로 주문이 ���소됐어요.\n��제하신 금액은 곧 환불해드릴게요.',
        sections: [
          emailInfoTable([
            { label: '주문번���', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '취소 사유', value: data.cancelReason },
            { label: '환불 방식', value: '결제하신 카드 또는 계좌로 자동 환불' },
          ]),
          emailNoticeBox('카드 결제는 <strong>영업일 기준 3~5일</strong>, 계좌 환불은 1~2일 안에 처리돼요. 환불 완료 시 다시 알려드릴게요.', 'warning'),
        ],
        primaryAction: { text: '주문 상세 보기', url: `${SITE_URL}/ko${linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl}` },
        secondaryAction: { text: '문의하기', url: `${SITE_URL}/ko/support` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '주문이 취소되었어요', message: `주문번호 ${data.orderNumber} (사유: ${data.cancelReason})`, linkUrl },
  }
}

// ---------- 23. 주문 취소 (브랜드→크리에이터) ----------

export function orderCancelledByBrandToCreatorTemplate(data: { orderNumber: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 판매 ��문이 취소됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '브랜드가 주문을 취소���어요. 해당 주문 수익은 차감돼요',
        statusBadge: { text: '판매 취소', variant: 'warning' },
        heroTitle: '판매 주문이 취소됐���요',
        heroSubtitle: '브랜드가 주문을 취소했어요.\n이 주문에서 발생한 수��은 정산에서 자동 차감돼요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '수익 처리', value: '정산 시 자동 차감' },
          ]),
          emailNoticeBox('취소 사유는 브랜드와 구매자에게만 공개돼요. 자세한 내역은 <strong>판매 현황</strong>에서 확인하세요.', 'info'),
        ],
        primaryAction: { text: '판��� 현황 보���', url: `${SITE_URL}/ko/creator/sales` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '주문이 취소되���어요', message: `주문번호 ${data.orderNumber}`, linkUrl: '/creator/orders' },
  }
}

// ---------- 24. 주문 취소 (구매자→브랜드) ----------

export function orderCancelledByBuyerTemplate(data: { orderNumber: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 구매자가 주문을 취소했어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: '발송 전이면 처리 중지, 발송 후면 회수 절차 시작해주세요',
        statusBadge: { text: '구매자 취소', variant: 'warning' },
        heroTitle: '구매자가 주문을 취소했��요',
        heroSubtitle: '아직 발송 전이라면 즉시 처리를 중단해주세요.\n이미 발송하셨다면 회수 절차를 진행해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '액션 필요', value: '발송 상태 확인 후 대응' },
          ]),
          emailNoticeBox('환불은 <strong>크넥샵에서 자동 처리</strong>돼요. 발송 �� 취소인 경우 회수 후 재고 처리만 부탁드려요.', 'warning'),
        ],
        primaryAction: { text: '주문 처리하기', url: `${SITE_URL}/ko/brand/orders` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '주문이 취소됐��요', message: `주문 ${data.orderNumber}이 취소되었습니���.`, linkUrl: '/brand/orders' },
  }
}

// ---------- 25. 주문 취소 (구매자→크리에이터) ----------

export function orderCancelledByBuyerToCreatorTemplate(data: { orderNumber: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 판매 주문이 취소됐어요 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '구매자가 ��문을 취소했어요. 해당 주문 수익은 차감돼요',
        statusBadge: { text: '판매 취소', variant: 'warning' },
        heroTitle: '판매 주문이 취소됐어요',
        heroSubtitle: '구매자가 주문을 취소했어요.\n이 주문에서 발생한 수익은 정산에서 자동 차감돼요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '취소 일시', value: formatKDate(now) },
            { label: '수익 처리', value: '정산 시 자동 차감' },
          ]),
          emailNoticeBox('구매자 변심에 의한 취소는 자연스러운 일이에요. <strong>다른 판매로 회복</strong>할 수 있어요.', 'info'),
        ],
        primaryAction: { text: '판매 현황 보기', url: `${SITE_URL}/ko/creator/sales` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '주문이 취소됐어요', message: `주문 ${data.orderNumber}이 취소되었습니다.`, linkUrl: '/creator/sales' },
  }
}

// ---------- 26. 교환 요청 → 브랜드 ----------

export function exchangeRequestedTemplate(data: { orderNumber: string; reason: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥��] 교환 요청 접수 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: '구매자가 교환을 요청했어요. 1~2일 안에 응답 부탁드려요',
        statusBadge: { text: '교환 요청 접수', variant: 'warning' },
        heroTitle: '교환 ��청이 접수��어요',
        heroSubtitle: '구매자가 상품 교환을 요청했어요.\n빠른 처리를 위해 영업일 기준 1~2일 내 응답 부��드려요.',
        sections: [
          emailInfoTable([
            { label: '주문번��', value: data.orderNumber, emphasis: true },
            { label: '교�� 사유', value: data.reason },
            { label: '접수일', value: formatKDate(now) },
            { label: '응답 마감', value: '영업일 기준 2일' },
          ]),
          emailNoticeBox('미응답 시 <strong>자동으로 환불 처리</strong>될 수 있어요. 빠른 응답이 브랜드 평점에 도움이 돼요.', 'warning'),
        ],
        primaryAction: { text: '교환 요청 처리하기', url: `${SITE_URL}/ko/brand/inquiries` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '교환 신청이 접수됐어요', message: `주문 ${data.orderNumber} - ${data.reason}`, linkUrl: '/brand/inquiries' },
  }
}

// ---------- 27. 환불 요청 → 브랜드 ----------

export function refundRequestedTemplate(data: { orderNumber: string; refundType: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크���샵] 환불 ���청 접수 (${data.orderNumber})`,
      html: renderEmail({
        recipientType: 'brand',
        preheader: `${data.refundType} 환불 요청이 왔어요. 1~2일 안에 응답 부탁드려요`,
        statusBadge: { text: '환불 ���청 접수', variant: 'warning' },
        heroTitle: '��불 요청이 접수됐어요',
        heroSubtitle: '구매자가 환불을 요청했어요.\n영��일 기준 1~2일 내 검토 후 응답해주세요.',
        sections: [
          emailInfoTable([
            { label: '주문번호', value: data.orderNumber, emphasis: true },
            { label: '환불 유형', value: data.refundType },
            { label: '접수일', value: formatKDate(now) },
            { label: '응답 마감', value: '영업��� 기준 2일' },
          ]),
          emailNoticeBox('미응답 시 <strong>자동 환불 처리</strong>될 수 있어요. 빠른 응답이 브랜드 평점에 도움이 돼요.', 'warning'),
        ],
        primaryAction: { text: '환��� 요청 처리하기', url: `${SITE_URL}/ko/brand/inquiries` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'ORDER', title: '환불 신청이 접수됐어��', message: `주문 ${data.orderNumber} - ${data.refundType} 환불`, linkUrl: '/brand/inquiries' },
  }
}

// ---------- 28. 캠페인 참여 거절 → 크리에이터 ----------

export function campaignParticipationRejectedTemplate(data: { creatorName: string; campaignTitle: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] ${data.campaignTitle} 참여 결과를 알려드려요`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '아쉽지만 이번 캠페인은 어려웠어요. 다른 좋은 캠페인이 기다리고 있어요',
        statusBadge: { text: '참여 결과 안내', variant: 'warning' },
        heroTitle: `${data.creatorName}님, 참여 결과를 알려드려요`,
        heroSubtitle: '아쉽게도 이번 캠페인은 참여가 어려웠���요.\n다른 캠페인에서 더 좋은 기회를 만나보세요.',
        sections: [
          emailInfoTable([
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '결과 통보일', value: formatKDate(now) },
          ]),
          emailNoticeBox('브랜드별 선정 기준이 달라요. <strong>다양한 캠페인</strong>에 도전해보세요. 거절 사유는 브랜드 정책상 비공개예요.', 'info'),
        ],
        primaryAction: { text: '다른 캠페인 보기', url: `${SITE_URL}/ko/creator/campaigns` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '공구 참여 거절', message: `"${data.campaignTitle}" 참여가 거절되었습니다.`, linkUrl: '/creator/campaigns' },
  }
}

// ---------- 29. 캠페인 모집 시작 �� 크리에이터 ----------

export function campaignRecruitingStartedTemplate(data: { campaignTitle: string; recipientEmail?: string }) {
  const now = new Date()
  return {
    email: {
      subject: `[크넥샵] 새 캠페인 오픈! ${data.campaignTitle}`,
      html: renderEmail({
        recipientType: 'creator',
        preheader: '지금 신청하면 먼저 참여할 수 있어요',
        statusBadge: { text: '새 캠페인 ���픈', variant: 'info' },
        heroTitle: '새 캠페인이 오픈됐어���',
        heroSubtitle: '관심 있는 카테고리의 신규 캠페인이 시작됐어요.\n인기 캠페인은 일찍 마감될 수 있어요.',
        sections: [
          emailInfoTable([
            { label: '캠페인', value: data.campaignTitle, emphasis: true },
            { label: '오픈일', value: formatKDate(now) },
          ]),
          emailNoticeBox('먼저 참여 신청하면 <strong>더 많은 판매 기회</strong>를 잡을 수 있어요.', 'success'),
        ],
        primaryAction: { text: '캠페인 자세히 보기', url: `${SITE_URL}/ko/creator/campaigns` },
        recipientEmail: data.recipientEmail,
      }),
    },
    inApp: { type: 'CAMPAIGN', title: '새 캠페인이 오픈됐어요', message: `"${data.campaignTitle}" 캠페인 모집이 시작되었어요. 지금 확인해보세요!`, linkUrl: '/creator/campaigns' },
  }
}
