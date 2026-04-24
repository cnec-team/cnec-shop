/**
 * 이메일 디자인 시스템 V3 미리보기 생성 (56개 전체)
 * 실행: npx tsx scripts/test-email-design.ts
 * 결과: test-output/index.html
 */

import {
  orderCompleteMessage, shippingStartMessage, deliveryCompleteMessage,
  newOrderBrandMessage, invoiceReminderMessage, saleOccurredMessage,
  campaignApprovedMessage, campaignStartedMessage, trialApprovedMessage,
  trialShippedMessage, trialRequestedMessage, settlementConfirmedMessage,
  proposalGongguInviteMessage, proposalProductPickMessage, bulkSendReportMessage,
  creatorApplicationSubmittedMessage, creatorApprovedMessage, creatorRejectedMessage,
  brandApprovedTemplate, brandRejectedTemplate, brandStatusChangedTemplate,
  orderCancelledByBrandTemplate, orderCancelledByBrandToCreatorTemplate,
  orderCancelledByBuyerTemplate, orderCancelledByBuyerToCreatorTemplate,
  exchangeRequestedTemplate, refundRequestedTemplate,
  campaignParticipationRejectedTemplate, campaignRecruitingStartedTemplate,
  // Stage B - Security/Legal
  passwordChangedMessage, loginFromNewDeviceMessage, loginAbnormalDetectedMessage,
  dormantWarningMessage, dormantTransitionedMessage, termsChangedMessage,
  privacyPolicyChangedMessage, accountDeletedMessage, emailVerificationMessage,
  // Stage C - Order Lifecycle
  paymentFailedMessage, shippingDelayedMessage, returnPickedUpMessage,
  refundCompletedMessage, exchangeRespondedMessage, refundRespondedMessage,
  // Stage D - Retention
  cartReminderMessage, restockNotificationMessage, couponIssuedMessage,
  couponExpiringMessage, repurchaseReminderMessage, interestCreatorNewCampaignMessage,
  // Stage E - Reports
  creatorMonthlyReportMessage, brandMonthlyReportMessage, lowStockAlertMessage,
  settlementDepositedMessage, taxInvoiceIssuedMessage, creatorWeeklySummaryMessage,
} from '../src/lib/notifications/templates'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const outputDir = join(__dirname, '..', 'test-output')
mkdirSync(outputDir, { recursive: true })

const e = 'test@example.com'

const templates: { name: string; filename: string; category: string; html: string }[] = [
  { name: '#16 크리에이터 가입 신청', filename: 'creator-application-submitted', category: '회원', html: creatorApplicationSubmittedMessage({ creatorName: '김크리에이터', recipientEmail: e }).email.html },
  { name: '#17 크리에이터 승인', filename: 'creator-approved', category: '회원', html: creatorApprovedMessage({ creatorName: '김크리에이터', recipientEmail: e }).email.html },
  { name: '#18 크리에이터 거절', filename: 'creator-rejected', category: '회원', html: creatorRejectedMessage({ creatorName: '김크리에이터', reason: '팔로워 수 기준 미달 (최소 1,000명)', recipientEmail: e }).email.html },
  { name: '#19 브랜드 승인', filename: 'brand-approved', category: '회원', html: brandApprovedTemplate({ brandName: '뷰티랩 코리아', recipientEmail: e }).email.html },
  { name: '#20 브랜드 거절', filename: 'brand-rejected', category: '회원', html: brandRejectedTemplate({ brandName: '뷰티랩 코리아', recipientEmail: e }).email.html },
  { name: '#21 브랜드 상태 변경', filename: 'brand-status-changed', category: '회원', html: brandStatusChangedTemplate({ brandName: '뷰티랩 코리아', status: '운영 중지', recipientEmail: e }).email.html },
  { name: '#1 주문 완료', filename: 'order-complete', category: '주문배송', html: orderCompleteMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', totalAmount: 35000, recipientEmail: e }).email.html },
  { name: '#2 배송 시작', filename: 'shipping-start', category: '주문배송', html: shippingStartMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', trackingNumber: '1234-5678-9012', courierName: 'CJ대한통운', recipientEmail: e }).email.html },
  { name: '#3 배송 완료', filename: 'delivery-complete', category: '주문배송', html: deliveryCompleteMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', recipientEmail: e }).email.html },
  { name: '#4 새 주문 (브랜드)', filename: 'new-order-brand', category: '주문배송', html: newOrderBrandMessage({ brandName: '뷰티랩 코리아', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', quantity: 2, totalAmount: 35000, buyerName: '박구매자', recipientEmail: e }).email.html },
  { name: '#5 송장 미입력', filename: 'invoice-reminder', category: '주문배송', html: invoiceReminderMessage({ brandName: '뷰티랩 코리아', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', orderDate: '2026년 4월 20일', recipientEmail: e }).email.html },
  { name: '#6 판매 발생', filename: 'sale-occurred', category: '캠페인판매', html: saleOccurredMessage({ creatorName: '김크리에이터', productName: '비타민C 세럼 30ml', orderAmount: 35000, commissionAmount: 10500, recipientEmail: e }).email.html },
  { name: '#7 캠페인 승인', filename: 'campaign-approved', category: '캠페인판매', html: campaignApprovedMessage({ creatorName: '김크리에이터', brandName: '뷰티랩 코리아', campaignTitle: '봄맞이 비타민 공구', recipientEmail: e }).email.html },
  { name: '#8 캠페인 시작', filename: 'campaign-started', category: '캠페인판매', html: campaignStartedMessage({ creatorName: '김크리에이터', brandName: '뷰티랩 코리아', campaignTitle: '봄맞이 비타민 공구', endDate: '2026년 5월 14일', recipientEmail: e }).email.html },
  { name: '#9 체험 승인', filename: 'trial-approved', category: '캠페인판매', html: trialApprovedMessage({ creatorName: '김크리에이터', brandName: '뷰티랩 코리아', productName: '비타민C 세럼 30ml', recipientEmail: e }).email.html },
  { name: '#10 체험 발송', filename: 'trial-shipped', category: '캠페인판매', html: trialShippedMessage({ creatorName: '김크리에이터', brandName: '뷰티랩 코리아', productName: '비타민C 세럼 30ml', trackingNumber: '1234-5678-9012', recipientEmail: e }).email.html },
  { name: '#11 체험 신청 접수', filename: 'trial-requested', category: '캠페인판매', html: trialRequestedMessage({ brandName: '뷰티랩 코리아', creatorName: '김크리에이터', productName: '비타민C 세럼 30ml', recipientEmail: e }).email.html },
  { name: '#12 정산 확정', filename: 'settlement-confirmed', category: '캠페인판매', html: settlementConfirmedMessage({ creatorName: '김크리에이터', period: '2026년 4월', netAmount: 287500, paymentDate: '2026년 5월 20일', recipientEmail: e }).email.html },
  { name: '#13 공구 초대', filename: 'proposal-gonggu', category: '캠페인판매', html: proposalGongguInviteMessage({ creatorName: '김크리에이터', brandName: '뷰티랩 코리아', campaignName: '봄맞이 비타민 공구', commissionRate: 30, messageBody: '안녕하세요, 저희 신제품 공구 함께 진행하고 싶어서 연락드려요!', acceptUrl: 'https://cnecshop.com/ko/creator/proposals/123', recipientEmail: e }).email.html },
  { name: '#14 상품 추천 요청', filename: 'proposal-product-pick', category: '캠페인판매', html: proposalProductPickMessage({ creatorName: '김크리에이터', brandName: '뷰티랩 코리아', productName: '비타민C 세럼 30ml', commissionRate: 30, messageBody: '안녕하세요, 저희 신제품 공구 함께 진행하고 싶어서 연락드려요!', acceptUrl: 'https://cnecshop.com/ko/creator/proposals/123', recipientEmail: e }).email.html },
  { name: '#28 캠페인 참여 거절', filename: 'campaign-participation-rejected', category: '캠페인판매', html: campaignParticipationRejectedTemplate({ creatorName: '김크리에이터', campaignTitle: '봄맞이 비타민 공구', recipientEmail: e }).email.html },
  { name: '#29 캠페인 모집 시작', filename: 'campaign-recruiting-started', category: '캠페인판매', html: campaignRecruitingStartedTemplate({ campaignTitle: '봄맞이 비타민 공구', recipientEmail: e }).email.html },
  { name: '#22 주문 취소 (브랜드 -> 구매자)', filename: 'order-cancelled-by-brand', category: '운영CS', html: orderCancelledByBrandTemplate({ orderNumber: 'ORD-20260423-001', cancelReason: '단순 변심', recipientEmail: e }).email.html },
  { name: '#23 주문 취소 (브랜드 -> 크리에이터)', filename: 'order-cancelled-by-brand-to-creator', category: '운영CS', html: orderCancelledByBrandToCreatorTemplate({ orderNumber: 'ORD-20260423-001', recipientEmail: e }).email.html },
  { name: '#24 주문 취소 (구매자 -> 브랜드)', filename: 'order-cancelled-by-buyer', category: '운영CS', html: orderCancelledByBuyerTemplate({ orderNumber: 'ORD-20260423-001', recipientEmail: e }).email.html },
  { name: '#25 주문 취소 (구매자 -> 크리에이터)', filename: 'order-cancelled-by-buyer-to-creator', category: '운영CS', html: orderCancelledByBuyerToCreatorTemplate({ orderNumber: 'ORD-20260423-001', recipientEmail: e }).email.html },
  { name: '#26 교환 요청', filename: 'exchange-requested', category: '운영CS', html: exchangeRequestedTemplate({ orderNumber: 'ORD-20260423-001', reason: '사이즈가 다른 제품으로 교환 요청', recipientEmail: e }).email.html },
  { name: '#27 환불 요청', filename: 'refund-requested', category: '운영CS', html: refundRequestedTemplate({ orderNumber: 'ORD-20260423-001', refundType: '전액 환불', recipientEmail: e }).email.html },
  { name: '#15 일괄 발송 리포트', filename: 'bulk-send-report', category: '운영CS', html: bulkSendReportMessage({ brandName: '뷰티랩 코리아', sentCount: 150, failedCount: 3, channelBreakdown: { '이메일': 100, '알림톡': 50 }, paidCount: 50, paidAmount: 25000, reportLink: 'https://cnecshop.com/ko/brand/proposals/bulk/456', recipientEmail: e }).email.html },

  // Security/Legal
  { name: '#41 비밀번호 변경', filename: 'password-changed', category: '보안', html: passwordChangedMessage({ userName: '김크리에이터', changedAt: new Date(), ipAddress: '123.45.67.89', recipientEmail: e }).email.html },
  { name: '#42 새 기기 로그인', filename: 'login-new-device', category: '보안', html: loginFromNewDeviceMessage({ userName: '김크리에이터', loginAt: new Date(), ipAddress: '123.45.67.89', userAgent: 'Chrome/120 macOS', recipientEmail: e }).email.html },
  { name: '#43 이상 접속 감지', filename: 'login-abnormal', category: '보안', html: loginAbnormalDetectedMessage({ userName: '김크리에이터', loginAt: new Date(), country: '미국', ipAddress: '203.0.113.42', recipientEmail: e }).email.html },
  { name: '#44 휴면 전환 예정', filename: 'dormant-warning', category: '보안', html: dormantWarningMessage({ userName: '박구매자', dormantDate: '2026년 5월 24일', recipientEmail: e }).email.html },
  { name: '#45 휴면 전환 완료', filename: 'dormant-transitioned', category: '보안', html: dormantTransitionedMessage({ userName: '박구매자', transitionedAt: new Date(), recipientEmail: e }).email.html },
  { name: '#61 약관 변경', filename: 'terms-changed', category: '법적', html: termsChangedMessage({ effectiveDate: '2026년 6월 1일', summary: '크리에이터 수수료 정책 변경', termsUrl: 'https://cnecshop.com/ko/terms', recipientEmail: e }).email.html },
  { name: '#62 개인정보방침 변경', filename: 'privacy-changed', category: '법적', html: privacyPolicyChangedMessage({ effectiveDate: '2026년 6월 1일', summary: '마케팅 활용 동의 항목 변경', privacyUrl: 'https://cnecshop.com/ko/privacy', recipientEmail: e }).email.html },
  { name: '#63 탈퇴 완료', filename: 'account-deleted', category: '법적', html: accountDeletedMessage({ userName: '박구매자', deletedAt: new Date(), retentionMonths: 3, recipientEmail: e }).email.html },
  { name: '#64 이메일 인증', filename: 'email-verification', category: '법적', html: emailVerificationMessage({ verificationCode: '482917', expiresInMinutes: 10, recipientEmail: e }).email.html },

  // Order Lifecycle
  { name: '#31 결제 실패', filename: 'payment-failed', category: '결제취소', html: paymentFailedMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', reason: '카드 한도 초과', recipientEmail: e }).email.html },
  { name: '#32 배송 지연', filename: 'shipping-delayed', category: '결제취소', html: shippingDelayedMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', expectedDate: '2026년 4월 28일', reason: '재고 확인 중', recipientEmail: e }).email.html },
  { name: '#33 반품 수거 완료', filename: 'return-picked-up', category: '결제취소', html: returnPickedUpMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', pickedUpAt: new Date(), expectedRefundDate: '2026년 4월 30일', recipientEmail: e }).email.html },
  { name: '#34 환불 완료', filename: 'refund-completed', category: '결제취소', html: refundCompletedMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', refundAmount: 35000, refundMethod: '신한카드', refundedAt: new Date(), recipientEmail: e }).email.html },
  { name: '#35 교환 승인', filename: 'exchange-approved', category: '결제취소', html: exchangeRespondedMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', status: 'approved', recipientEmail: e }).email.html },
  { name: '#36 환불 거절', filename: 'refund-rejected', category: '결제취소', html: refundRespondedMessage({ buyerName: '박구매자', orderNumber: 'ORD-20260423-001', productName: '비타민C 세럼 30ml', status: 'rejected', reason: '사용 흔적으로 반품 불가', recipientEmail: e }).email.html },

  // Retention
  { name: '#46 장바구니 리마인더', filename: 'cart-reminder', category: '마케팅', html: cartReminderMessage({ buyerName: '박구매자', itemCount: 3, topProductName: '비타민C 세럼 30ml', totalAmount: 89000, recipientEmail: e }).email.html },
  { name: '#47 재입고 알림', filename: 'restock-notification', category: '마케팅', html: restockNotificationMessage({ buyerName: '박구매자', productName: '비타민C 세럼 30ml', productUrl: 'https://cnecshop.com/ko/products/123', price: 35000, recipientEmail: e }).email.html },
  { name: '#48 쿠폰 발급', filename: 'coupon-issued', category: '마케팅', html: couponIssuedMessage({ userName: '박구매자', couponName: '첫 구매 할인', discountDisplay: '5,000원 할인', expiresAt: '2026년 5월 31일', minOrderAmount: '30,000원', useUrl: 'https://cnecshop.com/ko/coupons', recipientEmail: e }).email.html },
  { name: '#49 쿠폰 만료 임박', filename: 'coupon-expiring', category: '마케팅', html: couponExpiringMessage({ userName: '박구매자', couponName: '첫 구매 할인', discountDisplay: '5,000원 할인', expiresAt: '2026년 5월 1일', daysLeft: 7, useUrl: 'https://cnecshop.com/ko/coupons', recipientEmail: e }).email.html },
  { name: '#50 재구매 리마인더', filename: 'repurchase-reminder', category: '마케팅', html: repurchaseReminderMessage({ buyerName: '박구매자', lastProductName: '비타민C 세럼 30ml', lastOrderedAt: '2026년 3월 10일', reorderUrl: 'https://cnecshop.com/ko/products/123', discountDisplay: '10% 재구매 할인', recipientEmail: e }).email.html },
  { name: '#51 관심 크리에이터 공구', filename: 'interest-creator-campaign', category: '마케팅', html: interestCreatorNewCampaignMessage({ buyerName: '박구매자', creatorName: '김크리에이터', campaignTitle: '봄맞이 비타민 공구', campaignUrl: 'https://cnecshop.com/ko/campaigns/123', recipientEmail: e }).email.html },

  // Reports
  { name: '#52 크리에이터 월간 리포트', filename: 'creator-monthly-report', category: '리포트', html: creatorMonthlyReportMessage({ creatorName: '김크리에이터', period: '2026년 4월', totalRevenue: 287500, revenueChangePercent: 15, orderCount: 23, visitCount: 1240, conversionRate: 1.9, topProductsText: '비타민C 세럼 30ml', tipText: 'SNS에 리뷰 콘텐츠를 올리면 전환율이 높아져요.', recipientEmail: e }).email.html },
  { name: '#53 브랜드 월간 리포트', filename: 'brand-monthly-report', category: '리포트', html: brandMonthlyReportMessage({ brandName: '뷰티랩 코리아', period: '2026년 4월', totalSales: 4500000, salesChangePercent: 22, creatorCount: 15, orderCount: 128, topProductText: '비타민C 세럼 30ml', recipientEmail: e }).email.html },
  { name: '#54 재고 소진 임박', filename: 'low-stock-alert', category: '리포트', html: lowStockAlertMessage({ brandName: '뷰티랩 코리아', productName: '비타민C 세럼 30ml', currentStock: 3, threshold: 5, recipientEmail: e }).email.html },
  { name: '#55 정산 입금 완료', filename: 'settlement-deposited', category: '리포트', html: settlementDepositedMessage({ creatorName: '김크리에이터', period: '2026년 4월', depositedAmount: 287500, bankAccountMasked: '신한 ***-**-1234', depositedAt: new Date(), recipientEmail: e }).email.html },
  { name: '#56 세금계산서 발행', filename: 'tax-invoice-issued', category: '리포트', html: taxInvoiceIssuedMessage({ brandName: '뷰티랩 코리아', period: '2026년 4월', amount: 4500000, invoicePdfUrl: 'https://cnecshop.com/invoices/123.pdf', recipientEmail: e }).email.html },
  { name: '#57 크리에이터 주간 요약', filename: 'creator-weekly-summary', category: '리포트', html: creatorWeeklySummaryMessage({ creatorName: '김크리에이터', weekStart: '4/14', weekEnd: '4/20', totalRevenue: 72500, revenueChangePercent: -8, topProductName: '비타민C 세럼 30ml', recipientEmail: e }).email.html },
]

for (const t of templates) { writeFileSync(join(outputDir, `${t.filename}.html`), t.html, 'utf-8') }

const categories = ['회원', '주문배송', '캠페인판매', '운영CS', '보안', '법적', '결제취소', '마케팅', '리포트']
const grouped = categories.map(cat => ({ category: cat, items: templates.filter(t => t.category === cat) }))

const indexHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>크넥샵 이메일 V3 미리보기</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#191F28}h1{font-size:28px;margin-bottom:8px}.sub{color:#8B95A1;font-size:14px;margin-bottom:32px}h2{font-size:18px;color:#3182F6;margin-top:32px;margin-bottom:12px;border-bottom:2px solid #E8F2FE;padding-bottom:8px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}a{display:block;padding:12px 16px;background:#F2F4F6;border-radius:8px;text-decoration:none;color:#191F28;font-size:14px;transition:background 0.2s}a:hover{background:#E8F2FE}.c{color:#8B95A1;font-size:12px}</style></head><body>
<h1>크넥샵 이메일 V3 미리보기</h1><p class="sub">총 ${templates.length}개 | Design System V3</p>
${grouped.map(g => `<h2>${g.category} <span class="c">(${g.items.length}개)</span></h2><div class="grid">${g.items.map(t => `<a href="${t.filename}.html" target="_blank">${t.name}</a>`).join('')}</div>`).join('')}
</body></html>`
writeFileSync(join(outputDir, 'index.html'), indexHtml, 'utf-8')
console.log(`V3 미리보기 생성 완료: ${templates.length}개 + index.html`)
console.log(`  open ${join(outputDir, 'index.html')}`)
