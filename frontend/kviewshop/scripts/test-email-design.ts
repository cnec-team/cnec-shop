/**
 * 이메일 디자인 시스템 V3 미리보기 생성 (29개 전체)
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
]

for (const t of templates) { writeFileSync(join(outputDir, `${t.filename}.html`), t.html, 'utf-8') }

const categories = ['회원', '주문배송', '캠페인판매', '운영CS']
const grouped = categories.map(cat => ({ category: cat, items: templates.filter(t => t.category === cat) }))

const indexHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>크넥샵 이메일 V3 미리보기</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Pretendard',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#191F28}h1{font-size:28px;margin-bottom:8px}.sub{color:#8B95A1;font-size:14px;margin-bottom:32px}h2{font-size:18px;color:#3182F6;margin-top:32px;margin-bottom:12px;border-bottom:2px solid #E8F2FE;padding-bottom:8px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}a{display:block;padding:12px 16px;background:#F2F4F6;border-radius:8px;text-decoration:none;color:#191F28;font-size:14px;transition:background 0.2s}a:hover{background:#E8F2FE}.c{color:#8B95A1;font-size:12px}</style></head><body>
<h1>크넥샵 이메일 V3 미리보기</h1><p class="sub">총 ${templates.length}개 | Design System V3</p>
${grouped.map(g => `<h2>${g.category} <span class="c">(${g.items.length}개)</span></h2><div class="grid">${g.items.map(t => `<a href="${t.filename}.html" target="_blank">${t.name}</a>`).join('')}</div>`).join('')}
</body></html>`
writeFileSync(join(outputDir, 'index.html'), indexHtml, 'utf-8')
console.log(`V3 미리보기 생성 완료: ${templates.length}개 + index.html`)
console.log(`  open ${join(outputDir, 'index.html')}`)
