/**
 * 알림 시스템 실전 발송 테스트
 * 실행: TEST_EMAIL=xxx TEST_PHONE=xxx npx tsx scripts/test-notifications-live.ts
 */
import { sendNotification } from '../src/lib/notifications'
import {
  orderCompleteMessage,
  newOrderBrandMessage,
  saleOccurredMessage,
} from '../src/lib/notifications/templates'

const TEST_EMAIL = process.env.TEST_EMAIL || 'kai@cnecshop.com'
const TEST_PHONE = process.env.TEST_PHONE || '01012345678'

async function main() {
  console.log('=== 알림 시스템 실전 테스트 시작 ===')
  console.log(`이메일: ${TEST_EMAIL}`)
  console.log(`전화: ${TEST_PHONE}`)
  console.log('')

  // 테스트 1: CNECSHOP_001 주문 완료 (구매자)
  console.log('[1/3] CNECSHOP_001 주문 완료 (구매자) 발송 시도...')
  try {
    const t1 = orderCompleteMessage({
      buyerName: '테스트 구매자',
      orderNumber: 'TEST-001',
      productName: '테스트 상품 (실제 주문 아님)',
      totalAmount: 1000,
      recipientEmail: TEST_EMAIL,
    })
    await sendNotification({
      type: t1.inApp.type,
      title: t1.inApp.title,
      message: t1.inApp.message,
      linkUrl: t1.inApp.linkUrl,
      phone: TEST_PHONE,
      kakaoTemplate: t1.kakao,
      email: TEST_EMAIL,
      emailTemplate: t1.email,
    })
    console.log('  성공')
  } catch (e) {
    console.error('  실패:', e)
  }

  // 테스트 2: CNECSHOP_004 신규 주문 (브랜드)
  console.log('\n[2/3] CNECSHOP_004 신규 주문 (브랜드) 발송 시도...')
  try {
    const t2 = newOrderBrandMessage({
      brandName: '테스트 브랜드',
      orderNumber: 'TEST-002',
      productName: '테스트 상품',
      quantity: 1,
      totalAmount: 1000,
      buyerName: '테스트 구매자',
      recipientEmail: TEST_EMAIL,
    })
    await sendNotification({
      type: t2.inApp.type,
      title: t2.inApp.title,
      message: t2.inApp.message,
      linkUrl: t2.inApp.linkUrl,
      phone: TEST_PHONE,
      kakaoTemplate: t2.kakao,
      email: TEST_EMAIL,
      emailTemplate: t2.email,
    })
    console.log('  성공')
  } catch (e) {
    console.error('  실패:', e)
  }

  // 테스트 3: CNECSHOP_006 판매 발생 (크리에이터)
  console.log('\n[3/3] CNECSHOP_006 판매 발생 (크리에이터) 발송 시도...')
  try {
    const t3 = saleOccurredMessage({
      creatorName: '테스트 크리에이터',
      productName: '테스트 상품',
      orderAmount: 1000,
      commissionAmount: 150,
      recipientEmail: TEST_EMAIL,
    })
    await sendNotification({
      type: t3.inApp.type,
      title: t3.inApp.title,
      message: t3.inApp.message,
      linkUrl: t3.inApp.linkUrl,
      phone: TEST_PHONE,
      kakaoTemplate: t3.kakao,
      email: TEST_EMAIL,
      emailTemplate: t3.email,
    })
    console.log('  성공')
  } catch (e) {
    console.error('  실패:', e)
  }

  console.log('\n=== 테스트 완료 ===')
  console.log('예상 수신:')
  console.log(`  - 이메일 3통 → ${TEST_EMAIL}`)
  console.log(`  - 알림톡 3개 → ${TEST_PHONE}`)
  console.log('')
  console.log('수신 안 됐다면:')
  console.log('  1. POPBILL_KAKAO_SENDER_KEY 확인')
  console.log('  2. 팝빌 콘솔에서 발송 이력 확인')
  console.log('  3. SMTP 설정 확인')
  console.log('  4. 스팸함 확인')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => process.exit(0))
