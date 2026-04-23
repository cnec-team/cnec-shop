export interface TemplateMeta {
  key: string
  label: string
  category: string
  recipient: string
  statusBadgeVariant: string
  hasDarkHero: boolean
  hasTip: boolean
}

export const TEMPLATE_META: TemplateMeta[] = [
  { key: 'orderCompleteMessage', label: '주문 완료 (구매자)', category: '주문배송', recipient: '구매자', statusBadgeVariant: 'success', hasDarkHero: true, hasTip: false },
  { key: 'shippingStartMessage', label: '배송 시작 (구매자)', category: '주문배송', recipient: '구매자', statusBadgeVariant: 'info', hasDarkHero: false, hasTip: false },
  { key: 'deliveryCompleteMessage', label: '배송 완료 (구매자)', category: '주문배송', recipient: '구매자', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: true },
  { key: 'newOrderBrandMessage', label: '새 주문 발생 (브랜드)', category: '주문배송', recipient: '브랜드', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: false },
  { key: 'invoiceReminderMessage', label: '송장 미입력 (브랜드)', category: '주문배송', recipient: '브랜드', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'saleOccurredMessage', label: '판매 발생 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: true },
  { key: 'campaignApprovedMessage', label: '캠페인 승인 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: false },
  { key: 'campaignStartedMessage', label: '캠페인 시작 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'info', hasDarkHero: false, hasTip: true },
  { key: 'trialApprovedMessage', label: '체험 승인 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'success', hasDarkHero: true, hasTip: true },
  { key: 'trialShippedMessage', label: '체험 발송 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'info', hasDarkHero: true, hasTip: false },
  { key: 'trialRequestedMessage', label: '체험 신청 접수 (브랜드)', category: '캠페인판매', recipient: '브랜드', statusBadgeVariant: 'info', hasDarkHero: true, hasTip: false },
  { key: 'settlementConfirmedMessage', label: '정산 확정 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: false },
  { key: 'proposalGongguInviteMessage', label: '공구 초대 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: true },
  { key: 'proposalProductPickMessage', label: '상품 추천 요청 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'info', hasDarkHero: true, hasTip: true },
  { key: 'bulkSendReportMessage', label: '일괄 발송 리포트 (브랜드)', category: '운영CS', recipient: '브랜드', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: false },
  { key: 'creatorApplicationSubmittedMessage', label: '크리에이터 가입 신청 완료', category: '회원', recipient: '크리에이터', statusBadgeVariant: 'info', hasDarkHero: false, hasTip: true },
  { key: 'creatorApprovedMessage', label: '크리에이터 승인 완료', category: '회원', recipient: '크리에이터', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: true },
  { key: 'creatorRejectedMessage', label: '크리에이터 승인 거절', category: '회원', recipient: '크리에이터', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'brandApprovedTemplate', label: '브랜드 승인', category: '회원', recipient: '브랜드', statusBadgeVariant: 'success', hasDarkHero: false, hasTip: false },
  { key: 'brandRejectedTemplate', label: '브랜드 거절', category: '회원', recipient: '브랜드', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'brandStatusChangedTemplate', label: '브랜드 상태 변경', category: '회원', recipient: '브랜드', statusBadgeVariant: 'neutral', hasDarkHero: false, hasTip: false },
  { key: 'orderCancelledByBrandTemplate', label: '주문 취소 (브랜드 > 구매자)', category: '운영CS', recipient: '구매자', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'orderCancelledByBrandToCreatorTemplate', label: '주문 취소 (브랜드 > 크리에이터)', category: '운영CS', recipient: '크리에이터', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'orderCancelledByBuyerTemplate', label: '주문 취소 (구매자 > 브랜드)', category: '운영CS', recipient: '브랜드', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'orderCancelledByBuyerToCreatorTemplate', label: '주문 취소 (구매자 > 크리에이터)', category: '운영CS', recipient: '크리에이터', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'exchangeRequestedTemplate', label: '교환 요청 (브랜드)', category: '운영CS', recipient: '브랜드', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'refundRequestedTemplate', label: '환불 요청 (브랜드)', category: '운영CS', recipient: '브랜드', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'campaignParticipationRejectedTemplate', label: '캠페인 참여 거절 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'warning', hasDarkHero: false, hasTip: false },
  { key: 'campaignRecruitingStartedTemplate', label: '캠페인 모집 시작 (크리에이터)', category: '캠페인판매', recipient: '크리에이터', statusBadgeVariant: 'info', hasDarkHero: false, hasTip: false },
]

export const PREVIEW_DATA: Record<string, Record<string, unknown>> = {
  orderCompleteMessage: {
    buyerName: '박구매자',
    orderNumber: 'ORD-20260423-001',
    productName: '비타민C 세럼 30ml',
    totalAmount: 35000,
    recipientEmail: 'test@example.com',
  },
  shippingStartMessage: {
    buyerName: '박구매자',
    orderNumber: 'ORD-20260423-001',
    productName: '비타민C 세럼 30ml',
    trackingNumber: '1234-5678-9012',
    courierName: 'CJ대한통운',
    recipientEmail: 'test@example.com',
  },
  deliveryCompleteMessage: {
    buyerName: '박구매자',
    orderNumber: 'ORD-20260423-001',
    productName: '비타민C 세럼 30ml',
    recipientEmail: 'test@example.com',
  },
  newOrderBrandMessage: {
    brandName: '뷰티랩 코리아',
    orderNumber: 'ORD-20260423-001',
    productName: '비타민C 세럼 30ml',
    quantity: 2,
    totalAmount: 35000,
    buyerName: '박구매자',
    recipientEmail: 'test@example.com',
  },
  invoiceReminderMessage: {
    brandName: '뷰티랩 코리아',
    orderNumber: 'ORD-20260423-001',
    productName: '비타민C 세럼 30ml',
    orderDate: '2026년 4월 20일',
    recipientEmail: 'test@example.com',
  },
  saleOccurredMessage: {
    creatorName: '김크리에이터',
    productName: '비타민C 세럼 30ml',
    orderAmount: 35000,
    commissionAmount: 10500,
    recipientEmail: 'test@example.com',
  },
  campaignApprovedMessage: {
    creatorName: '김크리에이터',
    brandName: '뷰티랩 코리아',
    campaignTitle: '봄맞이 비타민 공구',
    recipientEmail: 'test@example.com',
  },
  campaignStartedMessage: {
    creatorName: '김크리에이터',
    brandName: '뷰티랩 코리아',
    campaignTitle: '봄맞이 비타민 공구',
    endDate: '2026년 5월 14일',
    recipientEmail: 'test@example.com',
  },
  trialApprovedMessage: {
    creatorName: '김크리에이터',
    brandName: '뷰티랩 코리아',
    productName: '비타민C 세럼 30ml',
    recipientEmail: 'test@example.com',
  },
  trialShippedMessage: {
    creatorName: '김크리에이터',
    brandName: '뷰티랩 코리아',
    productName: '비타민C 세럼 30ml',
    trackingNumber: '1234-5678-9012',
    recipientEmail: 'test@example.com',
  },
  trialRequestedMessage: {
    brandName: '뷰티랩 코리아',
    creatorName: '김크리에이터',
    productName: '비타민C 세럼 30ml',
    recipientEmail: 'test@example.com',
  },
  settlementConfirmedMessage: {
    creatorName: '김크리에이터',
    period: '2026년 4월',
    netAmount: 287500,
    paymentDate: '2026년 5월 20일',
    recipientEmail: 'test@example.com',
  },
  proposalGongguInviteMessage: {
    creatorName: '김크리에이터',
    brandName: '뷰티랩 코리아',
    campaignName: '봄맞이 비타민 공구',
    commissionRate: 30,
    messageBody: '안녕하세요, 저희 신제품 공구 함께 진행하고 싶어서 연락드려요!',
    acceptUrl: 'https://cnecshop.com/ko/creator/proposals/123',
    recipientEmail: 'test@example.com',
  },
  proposalProductPickMessage: {
    creatorName: '김크리에이터',
    brandName: '뷰티랩 코리아',
    productName: '비타민C 세럼 30ml',
    commissionRate: 30,
    messageBody: '안녕하세요, 저희 신제품 공구 함께 진행하고 싶어서 연락드려요!',
    acceptUrl: 'https://cnecshop.com/ko/creator/proposals/123',
    recipientEmail: 'test@example.com',
  },
  bulkSendReportMessage: {
    brandName: '뷰티랩 코리아',
    sentCount: 150,
    failedCount: 3,
    channelBreakdown: { '이메일': 100, '알림톡': 50 },
    paidCount: 50,
    paidAmount: 25000,
    reportLink: 'https://cnecshop.com/ko/brand/proposals/bulk/456',
    recipientEmail: 'test@example.com',
  },
  creatorApplicationSubmittedMessage: {
    creatorName: '김크리에이터',
    recipientEmail: 'test@example.com',
  },
  creatorApprovedMessage: {
    creatorName: '김크리에이터',
    recipientEmail: 'test@example.com',
  },
  creatorRejectedMessage: {
    creatorName: '김크리에이터',
    reason: '채널 구독자 수가 기준 미달입니다. 1,000명 이상이면 다시 신청해주세요.',
    recipientEmail: 'test@example.com',
  },
  brandApprovedTemplate: {
    brandName: '뷰티랩 코리아',
    recipientEmail: 'test@example.com',
  },
  brandRejectedTemplate: {
    brandName: '뷰티랩 코리아',
    recipientEmail: 'test@example.com',
  },
  brandStatusChangedTemplate: {
    brandName: '뷰티랩 코리아',
    status: '운영 중지',
    recipientEmail: 'test@example.com',
  },
  orderCancelledByBrandTemplate: {
    orderNumber: 'ORD-20260423-001',
    cancelReason: '단순 변심',
    recipientEmail: 'test@example.com',
  },
  orderCancelledByBrandToCreatorTemplate: {
    orderNumber: 'ORD-20260423-001',
    recipientEmail: 'test@example.com',
  },
  orderCancelledByBuyerTemplate: {
    orderNumber: 'ORD-20260423-001',
    recipientEmail: 'test@example.com',
  },
  orderCancelledByBuyerToCreatorTemplate: {
    orderNumber: 'ORD-20260423-001',
    recipientEmail: 'test@example.com',
  },
  exchangeRequestedTemplate: {
    orderNumber: 'ORD-20260423-001',
    reason: '사이즈가 다른 제품으로 교환 요청',
    recipientEmail: 'test@example.com',
  },
  refundRequestedTemplate: {
    orderNumber: 'ORD-20260423-001',
    refundType: '전액 환불',
    recipientEmail: 'test@example.com',
  },
  campaignParticipationRejectedTemplate: {
    creatorName: '김크리에이터',
    campaignTitle: '봄맞이 비타민 공구',
    recipientEmail: 'test@example.com',
  },
  campaignRecruitingStartedTemplate: {
    campaignTitle: '봄맞이 비타민 공구',
    recipientEmail: 'test@example.com',
  },
}
