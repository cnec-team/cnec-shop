# 크넥샵 이메일 템플릿 인벤토리 (29개)

> 추출일: 2026-04-23
> 소스: `src/lib/notifications/templates.ts`
> 범위: email.subject + email.html 텍스트만 (inApp/kakao 제외)

---

## 카테고리별 분류 표

| # | 함수명 | 카테고리 | 수신자 | 변수 개수 |
|---|--------|---------|--------|---------|
| 1 | orderCompleteMessage | 주문배송 | 구매자 | 4 |
| 2 | shippingStartMessage | 주문배송 | 구매자 | 5 |
| 3 | deliveryCompleteMessage | 주문배송 | 구매자 | 3 |
| 4 | newOrderBrandMessage | 주문배송 | 브랜드 | 5 |
| 5 | invoiceReminderMessage | 주문배송 | 브랜드 | 4 |
| 6 | saleOccurredMessage | 캠페인판매 | 크리에이터 | 4 |
| 7 | campaignApprovedMessage | 캠페인판매 | 크리에이터 | 3 |
| 8 | campaignStartedMessage | 캠페인판매 | 크리에이터 | 4 |
| 9 | trialApprovedMessage | 캠페인판매 | 크리에이터 | 3 |
| 10 | trialShippedMessage | 캠페인판매 | 크리에이터 | 4 |
| 11 | trialRequestedMessage | 캠페인판매 | 브랜드 | 3 |
| 12 | settlementConfirmedMessage | 캠페인판매 | 크리에이터 | 4 |
| 13 | proposalGongguInviteMessage | 캠페인판매 | 크리에이터 | 5 |
| 14 | proposalProductPickMessage | 캠페인판매 | 크리에이터 | 5 |
| 15 | bulkSendReportMessage | 운영CS | 브랜드 | 5 |
| 16 | creatorApplicationSubmittedMessage | 회원 | 크리에이터 | 1 |
| 17 | creatorApprovedMessage | 회원 | 크리에이터 | 1 |
| 18 | creatorRejectedMessage | 회원 | 크리에이터 | 2 |
| 19 | brandApprovedTemplate | 회원 | 브랜드 | 2 |
| 20 | brandRejectedTemplate | 회원 | 브랜드 | 1 |
| 21 | brandStatusChangedTemplate | 회원 | 브랜드 | 2 |
| 22 | orderCancelledByBrandTemplate | 운영CS | 구매자 | 2 |
| 23 | orderCancelledByBrandToCreatorTemplate | 운영CS | 크리에이터 | 1 |
| 24 | orderCancelledByBuyerTemplate | 운영CS | 브랜드 | 1 |
| 25 | orderCancelledByBuyerToCreatorTemplate | 운영CS | 크리에이터 | 1 |
| 26 | exchangeRequestedTemplate | 운영CS | 브랜드 | 2 |
| 27 | refundRequestedTemplate | 운영CS | 브랜드 | 2 |
| 28 | campaignParticipationRejectedTemplate | 캠페인판매 | 크리에이터 | 2 |
| 29 | campaignRecruitingStartedTemplate | 캠페인판매 | 크리에이터 | 1 |

---

## 각 템플릿 상세

---

### 1. orderCompleteMessage
- **카테고리**: 주문배송
- **수신자**: 구매자
- **파라미터**:
  ```
  {
    buyerName: string
    orderNumber: string
    productName: string
    totalAmount: number
    recipientEmail?: string
    orderLinkUrl?: string
  }
  ```
- **사용 변수**: buyerName, orderNumber, productName, totalAmount
- **subject**: `[크넥샵] 주문이 완료되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > {buyerName}님, 주문이 완료되었습니다
  >
  > 주문번호: {orderNumber}
  > 상품: {productName}
  > 결제금액: {totalAmount}원
  >
  > 배송이 시작되면 알림을 보내드리겠습니다.
  >
  > [주문 상세보기] → {SITE_URL}{orderLinkUrl | /buyer/orders}

---

### 2. shippingStartMessage
- **카테고리**: 주문배송
- **수신자**: 구매자
- **파라미터**:
  ```
  {
    buyerName: string
    orderNumber: string
    productName: string
    trackingNumber?: string
    courierName?: string
    recipientEmail?: string
    orderLinkUrl?: string
  }
  ```
- **사용 변수**: buyerName, orderNumber, productName, trackingNumber, courierName
- **subject**: `[크넥샵] 상품이 발송되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > {buyerName}님, 상품이 발송되었습니다
  >
  > 주문번호: {orderNumber}
  > 상품: {productName}
  > (조건부) 택배사: {courierName}
  > (조건부) 운송장번호: {trackingNumber}
  >
  > [배송 추적하기] → {SITE_URL}{orderLinkUrl | /buyer/orders}

---

### 3. deliveryCompleteMessage
- **카테고리**: 주문배송
- **수신자**: 구매자
- **파라미터**:
  ```
  {
    buyerName: string
    orderNumber: string
    productName: string
    recipientEmail?: string
    orderLinkUrl?: string
  }
  ```
- **사용 변수**: buyerName, orderNumber, productName
- **subject**: `[크넥샵] 배송이 완료되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > {buyerName}님, 배송이 완료되었습니다
  >
  > 주문번호: {orderNumber}
  > 상품: {productName}
  >
  > 상품이 마음에 드셨다면 리뷰를 남겨주세요!
  >
  > [리뷰 작성하기] → {SITE_URL}{orderLinkUrl | /buyer/reviews}

---

### 4. newOrderBrandMessage
- **카테고리**: 주문배송
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    orderNumber: string
    productName: string
    quantity: number
    totalAmount: number
    buyerName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName, orderNumber, productName, quantity, totalAmount, buyerName
- **subject**: `[크넥샵] 새 주문이 접수되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 새 주문이 접수되었습니다
  >
  > 주문번호: {orderNumber}
  > 상품: {productName} x {quantity}
  > 결제금액: {totalAmount}원
  > 구매자: {buyerName}
  >
  > 빠른 배송 준비를 부탁드립니다.
  >
  > [주문 관리하기] → {SITE_URL}/brand/orders

---

### 5. invoiceReminderMessage
- **카테고리**: 주문배송
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    orderNumber: string
    productName: string
    orderDate: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName, orderNumber, productName, orderDate
- **subject**: `[크넥샵] 송장 입력을 완료해주세요 ({orderNumber})`
- **email 핵심 텍스트**:
  > 송장 입력이 필요합니다
  >
  > 아래 주문의 송장이 아직 입력되지 않았습니다.
  >
  > 주문번호: {orderNumber}
  > 상품: {productName}
  > 주문일: {orderDate}
  >
  > [송장 입력하기] → {SITE_URL}/brand/orders

---

### 6. saleOccurredMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    productName: string
    orderAmount: number
    commissionAmount: number
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, productName, orderAmount, commissionAmount
- **subject**: `[크넥샵] 판매가 발생했습니다! (+{commissionAmount}원)`
- **email 핵심 텍스트**:
  > {creatorName}님, 판매가 발생했습니다!
  >
  > 상품: {productName}
  > 판매금액: {orderAmount}원
  >
  > [수익 강조 박스] 내 수익: {commissionAmount}원
  >
  > [판매 현황 보기] → {SITE_URL}/creator/sales

---

### 7. campaignApprovedMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    brandName: string
    campaignTitle: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, brandName, campaignTitle
- **subject**: `[크넥샵] 캠페인 참여가 승인되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 캠페인 참여가 승인되었습니다
  >
  > 브랜드: {brandName}
  > 캠페인: {campaignTitle}
  >
  > 이제 해당 상품을 내 샵에서 판매할 수 있습니다.
  >
  > [내 샵 확인하기] → {SITE_URL}/creator/shop

---

### 8. campaignStartedMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    brandName: string
    campaignTitle: string
    endDate?: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, brandName, campaignTitle, endDate
- **subject**: `[크넥샵] 캠페인이 시작되었습니다 - {campaignTitle}`
- **email 핵심 텍스트**:
  > 캠페인이 시작되었습니다!
  >
  > 브랜드: {brandName}
  > 캠페인: {campaignTitle}
  > (조건부) 종료일: {endDate}
  >
  > 지금부터 판매가 가능합니다. 내 팔로워들에게 공유해보세요!
  >
  > [내 샵 확인하기] → {SITE_URL}/creator/shop

---

### 9. trialApprovedMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    brandName: string
    productName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, brandName, productName
- **subject**: `[크넥샵] 체험 신청이 승인되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 체험 신청이 승인되었습니다
  >
  > 브랜드: {brandName}
  > 상품: {productName}
  >
  > 곧 체험 상품이 발송될 예정입니다.
  >
  > [체험 현황 보기] → {SITE_URL}/creator/trial/my

---

### 10. trialShippedMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    brandName: string
    productName: string
    trackingNumber?: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, brandName, productName, trackingNumber
- **subject**: `[크넥샵] 체험 상품이 발송되었습니다`
- **email 핵심 텍스트**:
  > 체험 상품이 발송되었습니다
  >
  > 브랜드: {brandName}
  > 상품: {productName}
  > (조건부) 운송장번호: {trackingNumber}
  >
  > [체험 현황 보기] → {SITE_URL}/creator/trial/my

---

### 11. trialRequestedMessage
- **카테고리**: 캠페인판매
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    creatorName: string
    productName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName, creatorName, productName
- **subject**: `[크넥샵] 새 체험 신청이 접수되었습니다`
- **email 핵심 텍스트**:
  > 새 체험 신청이 접수되었습니다
  >
  > 크리에이터: {creatorName}
  > 상품: {productName}
  >
  > 승인 여부를 결정해주세요.
  >
  > [체험 신청 관리] → {SITE_URL}/brand/trial

---

### 12. settlementConfirmedMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    period: string
    netAmount: number
    paymentDate: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, period, netAmount, paymentDate
- **subject**: `[크넥샵] {period} 정산이 확정되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 정산이 확정되었습니다
  >
  > 정산 기간: {period}
  > 입금예정일: {paymentDate}
  >
  > [정산 금액 강조 박스] {netAmount}원
  >
  > [정산 내역 보기] → {SITE_URL}/creator/settlements

---

### 13. proposalGongguInviteMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    brandName: string
    campaignName: string
    commissionRate?: number
    messageBody?: string
    acceptUrl: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, brandName, campaignName, commissionRate, messageBody
- **subject**: `[{brandName}] 공구 초대가 도착했어요`
- **email 핵심 텍스트**:
  > {creatorName}님, 새로운 공구 초대가 도착했어요
  >
  > 브랜드: {brandName}
  > 캠페인: {campaignName}
  > (조건부) 커미션: {commissionRate}%
  >
  > (조건부) {messageBody}
  >
  > 답장이나 수락은 크넥샵에 로그인 후 처리해주세요.
  >
  > [자세히 보기] → {acceptUrl}
- **참고**: subject prefix가 `[크넥샵]`이 아닌 `[{brandName}]`

---

### 14. proposalProductPickMessage
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    brandName: string
    productName: string
    commissionRate?: number
    messageBody?: string
    acceptUrl: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, brandName, productName, commissionRate, messageBody
- **subject**: `[{brandName}] 상품 추천 요청이 도착했어요`
- **email 핵심 텍스트**:
  > {creatorName}님, 새로운 상품 추천 요청이 도착했어요
  >
  > 브랜드: {brandName}
  > 상품: {productName}
  > (조건부) 커미션: {commissionRate}%
  >
  > (조건부) {messageBody}
  >
  > 내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.
  >
  > [상품 확인하기] → {acceptUrl}
- **참고**: subject prefix가 `[크넥샵]`이 아닌 `[{brandName}]`

---

### 15. bulkSendReportMessage
- **카테고리**: 운영CS
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    sentCount: number
    failedCount: number
    channelBreakdown: Record<string, number>
    paidCount: number
    paidAmount: number
    reportLink: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName, sentCount, failedCount, channelBreakdown, paidCount, paidAmount
- **subject**: `[크넥샵] 일괄 발송 완료 — {sentCount}건 전송`
- **email 핵심 텍스트**:
  > 일괄 발송이 완료되었습니다
  >
  > 총 발송: {sentCount}건
  > (조건부) 실패: {failedCount}건
  >
  > 채널별 발송
  > {channel}: {count}건 (channelBreakdown 반복)
  >
  > (조건부) 유료 발송: {paidCount}건 x 500원 = {paidAmount}원
  >
  > [발송 내역 보기] → {reportLink}
- **참고**: 이메일 전용 (inApp: null, kakao: null)

---

### 16. creatorApplicationSubmittedMessage
- **카테고리**: 회원
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName
- **subject**: `[크넥샵] 크리에이터 가입 신청이 완료됐어요`
- **email 핵심 텍스트**:
  > {creatorName}님, 가입 신청이 완료됐어요
  >
  > 1~2영업일 내 심사 결과를 알려드릴게요.
  > 승인되면 바로 내 샵을 열 수 있어요!
  >
  > ✉️ 이메일로 심사 결과를 보내드려요
  > 🎁 승인 시 가입 축하 3,000원 자동 지급
  >
  > [크넥샵 둘러보기] → {SITE_URL}
- **참고**: infoBox 안에 이모지(✉️, 🎁) 하드코딩 — 마이그레이션 시 제거 대상

---

### 17. creatorApprovedMessage
- **카테고리**: 회원
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName
- **subject**: `[크넥샵] 축하해요! 크리에이터 가입이 승인됐어요`
- **email 핵심 텍스트**:
  > 축하드려요! {creatorName}님
  >
  > 크넥샵 크리에이터 가입이 승인됐어요.
  > 지금 바로 내 샵을 열어보세요!
  >
  > [가입 축하 포인트 강조 박스] 3,000원
  >
  > [내 샵 시작하기] → {SITE_URL}/creator/dashboard

---

### 18. creatorRejectedMessage
- **카테고리**: 회원
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    reason: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, reason
- **subject**: `[크넥샵] 크리에이터 가입 심사 결과 안내`
- **email 핵심 텍스트**:
  > {creatorName}님, 심사 결과를 안내드려요
  >
  > 아쉽게도 이번 심사에서는 승인이 어려웠어요.
  >
  > 사유: {reason}
  >
  > 정보를 보완해서 다시 신청하실 수 있어요.
  >
  > [재신청하기] → {SITE_URL}/creator/pending

---

### 19. brandApprovedTemplate ✅ 디자인V2 마이그레이션 완료
- **카테고리**: 회원
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName, recipientEmail
- **subject**: `[크넥샵] 브랜드 승인이 완료되었습니다`
- **email 핵심 텍스트** (V2 renderEmail 사용):
  > [preheader] 크넥샵에서 {brandName} 브랜드의 입점이 승인되었습니다
  >
  > {brandName} 브랜드 입점이 승인되었습니다
  > 지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요
  >
  > [정보 테이블]
  > 브랜드명: {brandName}
  > 입점 일시: {now} (formatKDate)
  > (조건부) 담당자 이메일: {recipientEmail}
  >
  > [안내 박스] 상품 등록 후 어드민 검토를 거쳐 노출됩니다 (영업일 기준 1~2일 소요)
  >
  > [상품 등록하기] → {SITE_URL}/ko/brand/products/new
  > [브랜드 대시보드] → {SITE_URL}/ko/brand/dashboard

---

### 20. brandRejectedTemplate
- **카테고리**: 회원
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName
- **subject**: `[크넥샵] 브랜드 등록 심사 결과 안내`
- **email 핵심 텍스트**:
  > {brandName} 등록이 거절되었습니다
  >
  > 자세한 사항은 관리자에게 문의해주세요.
  >
  > [문의하기] → {SITE_URL}/support

---

### 21. brandStatusChangedTemplate
- **카테고리**: 회원
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    brandName: string
    status: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: brandName, status
- **subject**: `[크넥샵] 브랜드 상태가 변경되었습니다`
- **email 핵심 텍스트**:
  > {brandName} 상태가 변경되었습니다
  >
  > 변경 상태: {status}
  >
  > 자세한 사항은 관리자에게 문의해주세요.
  >
  > [브랜드 관리] → {SITE_URL}/brand/dashboard

---

### 22. orderCancelledByBrandTemplate
- **카테고리**: 운영CS
- **수신자**: 구매자
- **파라미터**:
  ```
  {
    orderNumber: string
    cancelReason: string
    recipientEmail?: string
    orderLinkUrl?: string
  }
  ```
- **사용 변수**: orderNumber, cancelReason
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  >
  > 주문번호: {orderNumber}
  > 취소 사유: {cancelReason}
  >
  > 결제하신 금액은 영업일 기준 3~5일 내 환불됩니다.
  >
  > [주문 상세보기] → {SITE_URL}{orderLinkUrl | /buyer/orders}

---

### 23. orderCancelledByBrandToCreatorTemplate
- **카테고리**: 운영CS
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    orderNumber: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: orderNumber
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  >
  > 주문번호: {orderNumber}
  >
  > 브랜드에 의해 주문이 취소되었습니다.
  >
  > [주문 현황 보기] → {SITE_URL}/creator/orders

---

### 24. orderCancelledByBuyerTemplate
- **카테고리**: 운영CS
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    orderNumber: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: orderNumber
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  >
  > 주문번호: {orderNumber}
  >
  > 구매자에 의해 주문이 취소되었습니다.
  >
  > [주문 관리하기] → {SITE_URL}/brand/orders

---

### 25. orderCancelledByBuyerToCreatorTemplate
- **카테고리**: 운영CS
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    orderNumber: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: orderNumber
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  >
  > 주문번호: {orderNumber}
  >
  > 구매자에 의해 주문이 취소되었습니다.
  >
  > [판매 현황 보기] → {SITE_URL}/creator/sales

---

### 26. exchangeRequestedTemplate
- **카테고리**: 운영CS
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    orderNumber: string
    reason: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: orderNumber, reason
- **subject**: `[크넥샵] 교환 신청이 접수되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 교환 신청이 접수되었습니다
  >
  > 주문번호: {orderNumber}
  > 사유: {reason}
  >
  > 빠른 확인 부탁드립니다.
  >
  > [문의 관리하기] → {SITE_URL}/brand/inquiries

---

### 27. refundRequestedTemplate
- **카테고리**: 운영CS
- **수신자**: 브랜드
- **파라미터**:
  ```
  {
    orderNumber: string
    refundType: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: orderNumber, refundType
- **subject**: `[크넥샵] 환불 신청이 접수되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 환불 신청이 접수되었습니다
  >
  > 주문번호: {orderNumber}
  > 환불 유형: {refundType}
  >
  > 빠른 확인 부탁드립니다.
  >
  > [문의 관리하기] → {SITE_URL}/brand/inquiries

---

### 28. campaignParticipationRejectedTemplate
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    creatorName: string
    campaignTitle: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: creatorName, campaignTitle
- **subject**: `[크넥샵] 캠페인 참여가 거절되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 캠페인 참여가 거절되었습니다
  >
  > 캠페인: {campaignTitle}
  >
  > 다른 캠페인에 참여해보세요.
  >
  > [캠페인 둘러보기] → {SITE_URL}/creator/campaigns

---

### 29. campaignRecruitingStartedTemplate
- **카테고리**: 캠페인판매
- **수신자**: 크리에이터
- **파라미터**:
  ```
  {
    campaignTitle: string
    recipientEmail?: string
  }
  ```
- **사용 변수**: campaignTitle
- **subject**: `[크넥샵] 새 캠페인이 오픈됐어요 - {campaignTitle}`
- **email 핵심 텍스트**:
  > 새 캠페인이 오픈됐어요
  >
  > 캠페인: {campaignTitle}
  >
  > 지금 확인하고 참여해보세요!
  >
  > [캠페인 확인하기] → {SITE_URL}/creator/campaigns

---

## 공통 사항

- 모든 함수는 `recipientEmail?: string` 파라미터 보유 (푸터 수신거부 링크 생성용, 변수 카운트에서 제외)
- `SITE_URL` = `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cnecshop.com'`
- 금액은 `formatPrice()` → `{amount}.toLocaleString('ko-KR') + '원'` 형식
- #19만 디자인V2(renderEmail) 사용, 나머지 28개는 레거시(emailLayout) 사용
