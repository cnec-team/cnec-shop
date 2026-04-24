# 크넥샵 알림 템플릿 인벤토리

> 추출일: 2026-04-23
> 소스: `src/lib/notifications/templates.ts`
> 총 29개 (코드 주석 기준 #1~#29)

---

## 카테고리별 분류 표

| # | 함수명 | 카테고리 | 수신자 | 카카오 | 디자인V2 |
|---|--------|---------|--------|--------|---------|
| 1 | orderCompleteMessage | 주문 | 구매자 | CNECSHOP_001 | X |
| 2 | shippingStartMessage | 주문 | 구매자 | CNECSHOP_002 | X |
| 3 | deliveryCompleteMessage | 주문 | 구매자 | CNECSHOP_003 | X |
| 4 | newOrderBrandMessage | 주문 | 브랜드 | CNECSHOP_004 | X |
| 5 | invoiceReminderMessage | 주문 | 브랜드 | CNECSHOP_005 | X |
| 6 | saleOccurredMessage | 주문 | 크리에이터 | CNECSHOP_006 | X |
| 7 | campaignApprovedMessage | 캠페인 | 크리에이터 | CNECSHOP_007 | X |
| 8 | campaignStartedMessage | 캠페인 | 크리에이터 | CNECSHOP_008 | X |
| 9 | trialApprovedMessage | 체험 | 크리에이터 | CNECSHOP_009 | X |
| 10 | trialShippedMessage | 체험 | 크리에이터 | CNECSHOP_010 | X |
| 11 | trialRequestedMessage | 체험 | 브랜드 | CNECSHOP_011 | X |
| 12 | settlementConfirmedMessage | 정산 | 크리에이터 | CNECSHOP_012 | X |
| 13 | proposalGongguInviteMessage | 제안 | 크리에이터 | CNECSHOP_013 | X |
| 14 | proposalProductPickMessage | 제안 | 크리에이터 | CNECSHOP_014 | X |
| 15 | bulkSendReportMessage | 운영 | 브랜드 | X | X |
| 16 | creatorApplicationSubmittedMessage | 회원 | 크리에이터 | CNECSHOP_015 | X |
| 17 | creatorApprovedMessage | 회원 | 크리에이터 | CNECSHOP_016 | X |
| 18 | creatorRejectedMessage | 회원 | 크리에이터 | CNECSHOP_017 | X |
| 19 | brandApprovedTemplate | 회원 | 브랜드 | X | O |
| 20 | brandRejectedTemplate | 회원 | 브랜드 | X | X |
| 21 | brandStatusChangedTemplate | 회원 | 브랜드 | X | X |
| 22 | orderCancelledByBrandTemplate | 주문취소 | 구매자 | X | X |
| 23 | orderCancelledByBrandToCreatorTemplate | 주문취소 | 크리에이터 | X | X |
| 24 | orderCancelledByBuyerTemplate | 주문취소 | 브랜드 | X | X |
| 25 | orderCancelledByBuyerToCreatorTemplate | 주문취소 | 크리에이터 | X | X |
| 26 | exchangeRequestedTemplate | CS | 브랜드 | X | X |
| 27 | refundRequestedTemplate | CS | 브랜드 | X | X |
| 28 | campaignParticipationRejectedTemplate | 캠페인 | 크리에이터 | X | X |
| 29 | campaignRecruitingStartedTemplate | 캠페인 | 크리에이터 | X | X |

---

## 수신자별 집계

| 수신자 | 건수 | 번호 |
|--------|------|------|
| 구매자 | 4 | 1, 2, 3, 22 |
| 브랜드 | 8 | 4, 5, 11, 15, 19, 20, 21, 24, 26, 27 |
| 크리에이터 | 17 | 6, 7, 8, 9, 10, 12, 13, 14, 16, 17, 18, 23, 25, 28, 29 |

---

## 각 템플릿 상세

---

### 1. orderCompleteMessage
- **카테고리**: 주문
- **수신자**: 구매자
- **파라미터**: `{ buyerName: string, orderNumber: string, productName: string, totalAmount: number, recipientEmail?: string, orderLinkUrl?: string }`
- **subject**: `[크넥샵] 주문이 완료되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > {buyerName}님, 주문이 완료되었습니다
  > 주문번호: {orderNumber} / 상품: {productName} / 결제금액: {totalAmount}원
  > 배송이 시작되면 알림을 보내드리겠습니다.
  > [주문 상세보기] → {SITE_URL}{orderLinkUrl}
- **inApp**:
  - title: `주문이 완료되었습니다`
  - message: `{productName} - {totalAmount}원`
  - linkUrl: `/buyer/orders`
- **kakao**: CNECSHOP_001

---

### 2. shippingStartMessage
- **카테고리**: 주문
- **수신자**: 구매자
- **파라미터**: `{ buyerName: string, orderNumber: string, productName: string, trackingNumber?: string, courierName?: string, recipientEmail?: string, orderLinkUrl?: string }`
- **subject**: `[크넥샵] 상품이 발송되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > {buyerName}님, 상품이 발송되었습니다
  > 주문번호: {orderNumber} / 상품: {productName}
  > (조건부) 택배사: {courierName} / 운송장번호: {trackingNumber}
  > [배송 추적하기] → {SITE_URL}{orderLinkUrl}
- **inApp**:
  - title: `상품이 발송되었습니다`
  - message: `{productName} (운송장: {trackingNumber})`
  - linkUrl: `/buyer/orders`
- **kakao**: CNECSHOP_002

---

### 3. deliveryCompleteMessage
- **카테고리**: 주문
- **수신자**: 구매자
- **파라미터**: `{ buyerName: string, orderNumber: string, productName: string, recipientEmail?: string, orderLinkUrl?: string }`
- **subject**: `[크넥샵] 배송이 완료되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > {buyerName}님, 배송이 완료되었습니다
  > 주문번호: {orderNumber} / 상품: {productName}
  > 상품이 마음에 드셨다면 리뷰를 남겨주세요!
  > [리뷰 작성하기] → {SITE_URL}{orderLinkUrl}
- **inApp**:
  - title: `배송이 완료되었습니다`
  - message: `{productName} - 리뷰를 남겨주세요!`
  - linkUrl: `/buyer/reviews`
- **kakao**: CNECSHOP_003

---

### 4. newOrderBrandMessage
- **카테고리**: 주문
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, orderNumber: string, productName: string, quantity: number, totalAmount: number, buyerName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 새 주문이 접수되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 새 주문이 접수되었습니다
  > 주문번호: {orderNumber} / 상품: {productName} x {quantity} / 결제금액: {totalAmount}원 / 구매자: {buyerName}
  > 빠른 배송 준비를 부탁드립니다.
  > [주문 관리하기] → /brand/orders
- **inApp**:
  - title: `새 주문이 접수되었습니다`
  - message: `{productName} x {quantity} - {totalAmount}원`
  - linkUrl: `/brand/orders`
- **kakao**: CNECSHOP_004

---

### 5. invoiceReminderMessage
- **카테고리**: 주문
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, orderNumber: string, productName: string, orderDate: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 송장 입력을 완료해주세요 ({orderNumber})`
- **email 핵심 텍스트**:
  > 송장 입력이 필요합니다
  > 아래 주문의 송장이 아직 입력되지 않았습니다.
  > 주문번호: {orderNumber} / 상품: {productName} / 주문일: {orderDate}
  > [송장 입력하기] → /brand/orders
- **inApp**:
  - title: `송장 입력을 완료해주세요`
  - message: `{orderNumber} - {productName}`
  - linkUrl: `/brand/orders`
- **kakao**: CNECSHOP_005

---

### 6. saleOccurredMessage
- **카테고리**: 주문
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, productName: string, orderAmount: number, commissionAmount: number, recipientEmail?: string }`
- **subject**: `[크넥샵] 판매가 발생했습니다! (+{commissionAmount}원)`
- **email 핵심 텍스트**:
  > {creatorName}님, 판매가 발생했습니다!
  > 상품: {productName} / 판매금액: {orderAmount}원
  > [내 수익 강조 박스] {commissionAmount}원
  > [판매 현황 보기] → /creator/sales
- **inApp**:
  - title: `판매가 발생했습니다!`
  - message: `{productName} - 내 수익 {commissionAmount}원`
  - linkUrl: `/creator/sales`
- **kakao**: CNECSHOP_006

---

### 7. campaignApprovedMessage
- **카테고리**: 캠페인
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, brandName: string, campaignTitle: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 캠페인 참여가 승인되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 캠페인 참여가 승인되었습니다
  > 브랜드: {brandName} / 캠페인: {campaignTitle}
  > 이제 해당 상품을 내 샵에서 판매할 수 있습니다.
  > [내 샵 확인하기] → /creator/shop
- **inApp**:
  - title: `캠페인 참여가 승인되었습니다`
  - message: `{brandName} - {campaignTitle}`
  - linkUrl: `/creator/campaigns`
- **kakao**: CNECSHOP_007

---

### 8. campaignStartedMessage
- **카테고리**: 캠페인
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, brandName: string, campaignTitle: string, endDate?: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 캠페인이 시작되었습니다 - {campaignTitle}`
- **email 핵심 텍스트**:
  > 캠페인이 시작되었습니다!
  > 브랜드: {brandName} / 캠페인: {campaignTitle} / (조건부) 종료일: {endDate}
  > 지금부터 판매가 가능합니다. 내 팔로워들에게 공유해보세요!
  > [내 샵 확인하기] → /creator/shop
- **inApp**:
  - title: `캠페인이 시작되었습니다`
  - message: `{brandName} - {campaignTitle}`
  - linkUrl: `/creator/campaigns`
- **kakao**: CNECSHOP_008

---

### 9. trialApprovedMessage
- **카테고리**: 체험
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, brandName: string, productName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 체험 신청이 승인되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 체험 신청이 승인되었습니다
  > 브랜드: {brandName} / 상품: {productName}
  > 곧 체험 상품이 발송될 예정입니다.
  > [체험 현황 보기] → /creator/trial/my
- **inApp**:
  - title: `체험 신청이 승인되었습니다`
  - message: `{brandName} - {productName}`
  - linkUrl: `/creator/trial/my`
- **kakao**: CNECSHOP_009

---

### 10. trialShippedMessage
- **카테고리**: 체험
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, brandName: string, productName: string, trackingNumber?: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 체험 상품이 발송되었습니다`
- **email 핵심 텍스트**:
  > 체험 상품이 발송되었습니다
  > 브랜드: {brandName} / 상품: {productName} / (조건부) 운송장번호: {trackingNumber}
  > [체험 현황 보기] → /creator/trial/my
- **inApp**:
  - title: `체험 상품이 발송되었습니다`
  - message: `{brandName} - {productName}`
  - linkUrl: `/creator/trial/my`
- **kakao**: CNECSHOP_010

---

### 11. trialRequestedMessage
- **카테고리**: 체험
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, creatorName: string, productName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 새 체험 신청이 접수되었습니다`
- **email 핵심 텍스트**:
  > 새 체험 신청이 접수되었습니다
  > 크리에이터: {creatorName} / 상품: {productName}
  > 승인 여부를 결정해주세요.
  > [체험 신청 관리] → /brand/trial
- **inApp**:
  - title: `새 체험 신청이 접수되었습니다`
  - message: `{creatorName} - {productName}`
  - linkUrl: `/brand/trial`
- **kakao**: CNECSHOP_011

---

### 12. settlementConfirmedMessage
- **카테고리**: 정산
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, period: string, netAmount: number, paymentDate: string, recipientEmail?: string }`
- **subject**: `[크넥샵] {period} 정산이 확정되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 정산이 확정되었습니다
  > 정산 기간: {period} / 입금예정일: {paymentDate}
  > [정산 금액 강조 박스] {netAmount}원
  > [정산 내역 보기] → /creator/settlements
- **inApp**:
  - title: `정산이 확정되었습니다`
  - message: `{period} - {netAmount}원`
  - linkUrl: `/creator/settlements`
- **kakao**: CNECSHOP_012

---

### 13. proposalGongguInviteMessage
- **카테고리**: 제안
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, brandName: string, campaignName: string, commissionRate?: number, messageBody?: string, acceptUrl: string, recipientEmail?: string }`
- **subject**: `[{brandName}] 공구 초대가 도착했어요`
- **email 핵심 텍스트**:
  > {creatorName}님, 새로운 공구 초대가 도착했어요
  > 브랜드: {brandName} / 캠페인: {campaignName} / (조건부) 커미션: {commissionRate}%
  > (조건부) {messageBody}
  > 답장이나 수락은 크넥샵에 로그인 후 처리해주세요.
  > [자세히 보기] → {acceptUrl}
- **inApp**:
  - title: `{brandName}에서 공구 초대가 왔어요`
  - message: `{campaignName} 캠페인`
  - linkUrl: `/creator/proposals`
- **kakao**: CNECSHOP_013
- **참고**: subject에 `[크넥샵]` 대신 `[{brandName}]` 사용

---

### 14. proposalProductPickMessage
- **카테고리**: 제안
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, brandName: string, productName: string, commissionRate?: number, messageBody?: string, acceptUrl: string, recipientEmail?: string }`
- **subject**: `[{brandName}] 상품 추천 요청이 도착했어요`
- **email 핵심 텍스트**:
  > {creatorName}님, 새로운 상품 추천 요청이 도착했어요
  > 브랜드: {brandName} / 상품: {productName} / (조건부) 커미션: {commissionRate}%
  > (조건부) {messageBody}
  > 내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.
  > [상품 확인하기] → {acceptUrl}
- **inApp**:
  - title: `{brandName}에서 상품 추천 요청`
  - message: `{productName}`
  - linkUrl: `/creator/proposals`
- **kakao**: CNECSHOP_014
- **참고**: subject에 `[크넥샵]` 대신 `[{brandName}]` 사용

---

### 15. bulkSendReportMessage
- **카테고리**: 운영
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, sentCount: number, failedCount: number, channelBreakdown: Record<string, number>, paidCount: number, paidAmount: number, reportLink: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 일괄 발송 완료 — {sentCount}건 전송`
- **email 핵심 텍스트**:
  > 일괄 발송이 완료되었습니다
  > 총 발송: {sentCount}건 / (조건부) 실패: {failedCount}건
  > 채널별 발송: {channelBreakdown}
  > (조건부) 유료 발송: {paidCount}건 x 500원 = {paidAmount}원
  > [발송 내역 보기] → {reportLink}
- **inApp**: null (인앱 알림 없음)
- **kakao**: null (카카오 없음)
- **참고**: 이메일 전용 템플릿

---

### 16. creatorApplicationSubmittedMessage
- **카테고리**: 회원
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 크리에이터 가입 신청이 완료됐어요`
- **email 핵심 텍스트**:
  > {creatorName}님, 가입 신청이 완료됐어요
  > 1~2영업일 내 심사 결과를 알려드릴게요. 승인되면 바로 내 샵을 열 수 있어요!
  > 이메일로 심사 결과를 보내드려요 / 승인 시 가입 축하 3,000원 자동 지급
  > [크넥샵 둘러보기] → {SITE_URL}
- **inApp**:
  - title: `크리에이터 가입 신청이 완료됐어요`
  - message: `1~2영업일 내 심사 결과를 알려드릴게요.`
  - linkUrl: `/creator/pending`
- **kakao**: CNECSHOP_015
- **참고**: infoBox 안에 이모지(envelope, gift) 사용 중 — 디자인V2 마이그레이션 시 제거 대상

---

### 17. creatorApprovedMessage
- **카테고리**: 회원
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 축하해요! 크리에이터 가입이 승인됐어요`
- **email 핵심 텍스트**:
  > 축하드려요! {creatorName}님
  > 크넥샵 크리에이터 가입이 승인됐어요. 지금 바로 내 샵을 열어보세요!
  > [가입 축하 포인트 강조 박스] 3,000원
  > [내 샵 시작하기] → /creator/dashboard
- **inApp**:
  - title: `크리에이터 가입이 승인됐어요!`
  - message: `지금 바로 내 샵을 열어보세요. 가입 축하 3,000원이 지급됐어요!`
  - linkUrl: `/creator/dashboard`
- **kakao**: CNECSHOP_016

---

### 18. creatorRejectedMessage
- **카테고리**: 회원
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, reason: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 크리에이터 가입 심사 결과 안내`
- **email 핵심 텍스트**:
  > {creatorName}님, 심사 결과를 안내드려요
  > 아쉽게도 이번 심사에서는 승인이 어려웠어요.
  > 사유: {reason}
  > 정보를 보완해서 다시 신청하실 수 있어요.
  > [재신청하기] → /creator/pending
- **inApp**:
  - title: `크리에이터 가입 심사 결과`
  - message: `아쉽게도 승인이 어려웠어요. 사유: {reason}`
  - linkUrl: `/creator/pending`
- **kakao**: CNECSHOP_017

---

### 19. brandApprovedTemplate (디자인V2 마이그레이션 완료)
- **카테고리**: 회원
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 브랜드 승인이 완료되었습니다`
- **email 핵심 텍스트** (V2):
  > {brandName} 브랜드 입점이 승인되었습니다
  > 지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요
  > [테이블] 브랜드명: {brandName} / 입점 일시: {now} / (조건부) 담당자 이메일: {recipientEmail}
  > [안내] 상품 등록 후 어드민 검토를 거쳐 노출됩니다 (영업일 기준 1~2일 소요)
  > [상품 등록하기] → /ko/brand/products/new
  > [브랜드 대시보드] → /ko/brand/dashboard
- **inApp**:
  - title: `브랜드 승인 완료`
  - message: `{brandName}가 승인되었어요. 지금 바로 상품을 등록해보세요!`
  - linkUrl: `/brand/products/new`
- **kakao**: 사용 안 함

---

### 20. brandRejectedTemplate
- **카테고리**: 회원
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 브랜드 등록 심사 결과 안내`
- **email 핵심 텍스트**:
  > {brandName} 등록이 거절되었습니다
  > 자세한 사항은 관리자에게 문의해주세요.
  > [문의하기] → /support
- **inApp**:
  - title: `브랜드 등록 거절`
  - message: `{brandName} 등록이 거절되었습니다. 자세한 사항은 관리자에게 문의하세요.`
  - linkUrl: `/support`
- **kakao**: 사용 안 함

---

### 21. brandStatusChangedTemplate
- **카테고리**: 회원
- **수신자**: 브랜드
- **파라미터**: `{ brandName: string, status: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 브랜드 상태가 변경되었습니다`
- **email 핵심 텍스트**:
  > {brandName} 상태가 변경되었습니다
  > 변경 상태: {status}
  > 자세한 사항은 관리자에게 문의해주세요.
  > [브랜드 관리] → /brand/dashboard
- **inApp**:
  - title: `브랜드 상태 변경`
  - message: `{brandName} 상태가 변경되었습니다.`
  - linkUrl: `/brand/dashboard`
- **kakao**: 사용 안 함

---

### 22. orderCancelledByBrandTemplate
- **카테고리**: 주문취소
- **수신자**: 구매자
- **파라미터**: `{ orderNumber: string, cancelReason: string, recipientEmail?: string, orderLinkUrl?: string }`
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  > 주문번호: {orderNumber} / 취소 사유: {cancelReason}
  > 결제하신 금액은 영업일 기준 3~5일 내 환불됩니다.
  > [주문 상세보기] → {SITE_URL}{orderLinkUrl}
- **inApp**:
  - title: `주문이 취소되었어요`
  - message: `주문번호 {orderNumber} (사유: {cancelReason})`
  - linkUrl: `{orderLinkUrl}` (기본값 `/buyer/orders`)
- **kakao**: 사용 안 함

---

### 23. orderCancelledByBrandToCreatorTemplate
- **카테고리**: 주문취소
- **수신자**: 크리에이터
- **파라미터**: `{ orderNumber: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  > 주문번호: {orderNumber}
  > 브랜드에 의해 주문이 취소되었습니다.
  > [주문 현황 보기] → /creator/orders
- **inApp**:
  - title: `주문이 취소되었어요`
  - message: `주문번호 {orderNumber}`
  - linkUrl: `/creator/orders`
- **kakao**: 사용 안 함

---

### 24. orderCancelledByBuyerTemplate
- **카테고리**: 주문취소
- **수신자**: 브랜드
- **파라미터**: `{ orderNumber: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  > 주문번호: {orderNumber}
  > 구매자에 의해 주문이 취소되었습니다.
  > [주문 관리하기] → /brand/orders
- **inApp**:
  - title: `주문이 취소됐어요`
  - message: `주문 {orderNumber}이 취소되었습니다.`
  - linkUrl: `/brand/orders`
- **kakao**: 사용 안 함

---

### 25. orderCancelledByBuyerToCreatorTemplate
- **카테고리**: 주문취소
- **수신자**: 크리에이터
- **파라미터**: `{ orderNumber: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 주문이 취소되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 주문이 취소되었습니다
  > 주문번호: {orderNumber}
  > 구매자에 의해 주문이 취소되었습니다.
  > [판매 현황 보기] → /creator/sales
- **inApp**:
  - title: `주문이 취소됐어요`
  - message: `주문 {orderNumber}이 취소되었습니다.`
  - linkUrl: `/creator/sales`
- **kakao**: 사용 안 함

---

### 26. exchangeRequestedTemplate
- **카테고리**: CS
- **수신자**: 브랜드
- **파라미터**: `{ orderNumber: string, reason: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 교환 신청이 접수되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 교환 신청이 접수되었습니다
  > 주문번호: {orderNumber} / 사유: {reason}
  > 빠른 확인 부탁드립니다.
  > [문의 관리하기] → /brand/inquiries
- **inApp**:
  - title: `교환 신청이 접수됐어요`
  - message: `주문 {orderNumber} - {reason}`
  - linkUrl: `/brand/inquiries`
- **kakao**: 사용 안 함

---

### 27. refundRequestedTemplate
- **카테고리**: CS
- **수신자**: 브랜드
- **파라미터**: `{ orderNumber: string, refundType: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 환불 신청이 접수되었습니다 ({orderNumber})`
- **email 핵심 텍스트**:
  > 환불 신청이 접수되었습니다
  > 주문번호: {orderNumber} / 환불 유형: {refundType}
  > 빠른 확인 부탁드립니다.
  > [문의 관리하기] → /brand/inquiries
- **inApp**:
  - title: `환불 신청이 접수됐어요`
  - message: `주문 {orderNumber} - {refundType} 환불`
  - linkUrl: `/brand/inquiries`
- **kakao**: 사용 안 함

---

### 28. campaignParticipationRejectedTemplate
- **카테고리**: 캠페인
- **수신자**: 크리에이터
- **파라미터**: `{ creatorName: string, campaignTitle: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 캠페인 참여가 거절되었습니다`
- **email 핵심 텍스트**:
  > {creatorName}님, 캠페인 참여가 거절되었습니다
  > 캠페인: {campaignTitle}
  > 다른 캠페인에 참여해보세요.
  > [캠페인 둘러보기] → /creator/campaigns
- **inApp**:
  - title: `공구 참여 거절`
  - message: `"{campaignTitle}" 참여가 거절되었습니다.`
  - linkUrl: `/creator/campaigns`
- **kakao**: 사용 안 함

---

### 29. campaignRecruitingStartedTemplate
- **카테고리**: 캠페인
- **수신자**: 크리에이터
- **파라미터**: `{ campaignTitle: string, recipientEmail?: string }`
- **subject**: `[크넥샵] 새 캠페인이 오픈됐어요 - {campaignTitle}`
- **email 핵심 텍스트**:
  > 새 캠페인이 오픈됐어요
  > 캠페인: {campaignTitle}
  > 지금 확인하고 참여해보세요!
  > [캠페인 확인하기] → /creator/campaigns
- **inApp**:
  - title: `새 캠페인이 오픈됐어요`
  - message: `"{campaignTitle}" 캠페인 모집이 시작되었어요. 지금 확인해보세요!`
  - linkUrl: `/creator/campaigns`
- **kakao**: 사용 안 함

---

## 공통 파라미터 패턴

모든 템플릿은 `recipientEmail?: string`을 공통으로 가짐 (이메일 푸터 수신거부 링크 생성용).

## 톤 불일치 목록

| # | 함수명 | 현재 톤 | 비고 |
|---|--------|--------|------|
| 1~12 | Message 계열 | 격식체 (~습니다) + 일부 반말체 (~어요) 혼용 | subject는 격식체, inApp은 반말체 |
| 13~14 | Proposal 계열 | 반말체 (~어요) | subject/email 모두 반말체 |
| 15 | bulkSendReport | 격식체 | 일관됨 |
| 16~18 | Creator 회원 | 반말체 (~어요) | 전체 반말체 |
| 19~21 | Brand 회원 | 격식체 (~습니다) | 전체 격식체 |
| 22~27 | 취소/CS | 격식체 + 반말체 혼용 | inApp만 반말체 (~어요) |
| 28~29 | 캠페인 | 격식체 + 반말체 혼용 | subject 격식체, inApp 반말체 |

## CTA 버튼 텍스트 전수

| # | 버튼 텍스트 | 링크 |
|---|-----------|------|
| 1 | 주문 상세보기 | {SITE_URL}{orderLinkUrl} |
| 2 | 배송 추적하기 | {SITE_URL}{orderLinkUrl} |
| 3 | 리뷰 작성하기 | {SITE_URL}{orderLinkUrl} |
| 4 | 주문 관리하기 | /brand/orders |
| 5 | 송장 입력하기 | /brand/orders |
| 6 | 판매 현황 보기 | /creator/sales |
| 7 | 내 샵 확인하기 | /creator/shop |
| 8 | 내 샵 확인하기 | /creator/shop |
| 9 | 체험 현황 보기 | /creator/trial/my |
| 10 | 체험 현황 보기 | /creator/trial/my |
| 11 | 체험 신청 관리 | /brand/trial |
| 12 | 정산 내역 보기 | /creator/settlements |
| 13 | 자세히 보기 | {acceptUrl} |
| 14 | 상품 확인하기 | {acceptUrl} |
| 15 | 발송 내역 보기 | {reportLink} |
| 16 | 크넥샵 둘러보기 | {SITE_URL} |
| 17 | 내 샵 시작하기 | /creator/dashboard |
| 18 | 재신청하기 | /creator/pending |
| 19 | 상품 등록하기 + 브랜드 대시보드 | /ko/brand/products/new + /ko/brand/dashboard |
| 20 | 문의하기 | /support |
| 21 | 브랜드 관리 | /brand/dashboard |
| 22 | 주문 상세보기 | {SITE_URL}{orderLinkUrl} |
| 23 | 주문 현황 보기 | /creator/orders |
| 24 | 주문 관리하기 | /brand/orders |
| 25 | 판매 현황 보기 | /creator/sales |
| 26 | 문의 관리하기 | /brand/inquiries |
| 27 | 문의 관리하기 | /brand/inquiries |
| 28 | 캠페인 둘러보기 | /creator/campaigns |
| 29 | 캠페인 확인하기 | /creator/campaigns |
