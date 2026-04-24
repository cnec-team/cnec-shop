# 크넥샵 카카오 알림톡 등록 대기 목록

> 작성일: 2026-04-24
> 기등록: CNECSHOP_001~017, 026~028 (20종)
> 신규 등록 필요: 27종 (CNECSHOP_018~025, 029~047)

## 등록 절차

1. 팝빌 콘솔 > 알림톡 > 템플릿 관리 > 신규 등록
2. 템플릿 코드 / 카피 / 변수 / 버튼 입력
3. 카카오 심사 제출 (영업일 1~3일)
4. 승인 후 templates.ts KAKAO_TEMPLATES 상수에 추가
5. 해당 함수의 kakao 필드 연결

## 분류 기준

- **거래성 (I)**: 수신동의 불필요, 심사 통과율 높음
- **마케팅성 (A)**: 수신동의 필수, 심사 엄격, 야간(21~08시) 발송 금지

---

## 신규 등록 대상 27종

### 회원/브랜드 (3종, 거래성)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_018 | 19 | brandApprovedTemplate | I | [크넥샵] 브랜드 입점 승인\n\n#{brandName} 입점이 승인됐어요.\n지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요. | brandName | 상품 등록하기 → /ko/brand/products/new |
| CNECSHOP_019 | 20 | brandRejectedTemplate | I | [크넥샵] 입점 심사 결과\n\n#{brandName} 입점이 보류됐어요.\n사유 확인 후 보완해서 다시 신청 가능해요.\n문의: support@cnecshop.com | brandName | 문의하기 → /ko/support |
| CNECSHOP_020 | 21 | brandStatusChangedTemplate | I | [크넥샵] 운영 상태 변경\n\n#{brandName} 운영 상태가 #{status}로 변경됐어요.\n자세한 내용은 대시보드에서 확인해주세요. | brandName, status | 대시보드 → /ko/brand/dashboard |

### 주문/결제 (6종, 거래성)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_021 | 28 | campaignParticipationRejectedTemplate | I | [크넥샵] 캠페인 참여 결과\n\n아쉽게도 #{campaignTitle} 캠페인 참여가 어려웠어요.\n다른 캠페인에서 좋은 기회를 만나보세요. | campaignTitle | 캠페인 보기 → /ko/creator/campaigns |
| CNECSHOP_022 | 29 | campaignRecruitingStartedTemplate | I | [크넥샵] 새 캠페인 오픈\n\n#{campaignTitle} 캠페인이 오픈됐어요.\n먼저 신청하면 더 많은 판매 기회를 잡을 수 있어요. | campaignTitle | 캠페인 보기 → /ko/creator/campaigns |
| CNECSHOP_029 | 31 | paymentFailedMessage | I | [크넥샵] 결제 실패\n\n#{buyerName}님, #{productName} 결제가 처리되지 않았어요.\n사유: #{reason}\n30분 내 다시 시도해주세요. | buyerName, productName, reason | 다시 결제 → /ko/buyer/orders |
| CNECSHOP_030 | 32 | shippingDelayedMessage | I | [크넥샵] 배송 지연 안내\n\n#{buyerName}님, #{productName} 발송이 지연되고 있어요.\n빠른 해결을 위해 노력 중이에요. | buyerName, productName | 주문 보기 → /ko/buyer/orders |
| CNECSHOP_031 | 33 | returnPickedUpMessage | I | [크넥샵] 반품 수거 완료\n\n#{buyerName}님, 반품 상품이 수거됐어요.\n확인 후 #{expectedRefundDate}까지 환불 처리해드릴게요. | buyerName, expectedRefundDate | 반품 보기 → /ko/buyer/orders |
| CNECSHOP_032 | 34 | refundCompletedMessage | I | [크넥샵] 환불 완료\n\n#{buyerName}님, #{refundMethod}로 환불이 완료됐어요.\n카드 환불은 영업일 3~5일 소요돼요. | buyerName, refundMethod | 환불 내역 → /ko/buyer/orders |

### 교환/환불 응답 (2종, 거래성)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_033 | 35 | exchangeRespondedMessage | I | [크넥샵] 교환 #{status}\n\n#{buyerName}님, #{productName} 교환이 #{statusText}.\n#{detail} | buyerName, productName, status, statusText, detail | 주문 보기 → /ko/buyer/orders |
| CNECSHOP_034 | 36 | refundRespondedMessage | I | [크넥샵] 환불 #{status}\n\n#{buyerName}님, #{productName} 환불이 #{statusText}.\n#{detail} | buyerName, productName, status, statusText, detail | 주문 보기 → /ko/buyer/orders |

### 보안 (5종, 거래성)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_035 | 41 | passwordChangedMessage | I | [크넥샵] 비밀번호 변경\n\n계정 비밀번호가 변경됐어요.\n본인이 아니라면 즉시 비밀번호를 재설정해주세요.\n문의: support@cnecshop.com | (없음) | 비밀번호 재설정 → /ko/account/reset-password |
| CNECSHOP_036 | 42 | loginFromNewDeviceMessage | I | [크넥샵] 새 기기 로그인\n\n새로운 기기에서 로그인됐어요.\n일시: #{loginAt}\n본인이 아니라면 비밀번호를 변경해주세요. | loginAt | 비밀번호 변경 → /ko/account/reset-password |
| CNECSHOP_037 | 43 | loginAbnormalDetectedMessage | I | [크넥샵] 이상 접속 감지\n\n평소와 다른 위치에서 접속이 감지됐어요.\n일시: #{loginAt}\n본인이 아니라면 즉시 비밀번호를 변경해주세요. | loginAt | 비밀번호 변경 → /ko/account/reset-password |
| CNECSHOP_038 | 44 | dormantWarningMessage | I | [크넥샵] 휴면 전환 예정\n\n1년 이상 미접속으로 #{dormantDate}에 휴면 전환 예정이에요.\n계속 이용하려면 지금 로그인해주세요.\n로그인 시 즉시 복구돼요. | dormantDate | 로그인하기 → /ko/login |
| CNECSHOP_039 | 45 | dormantTransitionedMessage | I | [크넥샵] 휴면 전환 완료\n\n휴면 계정으로 전환됐어요.\n로그인하시면 바로 복구돼요. | (없음) | 계정 복구 → /ko/login |

### 법적 (4종, 거래성)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_040 | 61 | termsChangedMessage | I | [크넥샵] 이용약관 변경 안내\n\n#{effectiveDate}부터 변경된 이용약관이 적용돼요.\n#{summary}\n계속 이용 시 동의한 것으로 간주돼요. | effectiveDate, summary | 약관 보기 → #{termsUrl} |
| CNECSHOP_041 | 62 | privacyPolicyChangedMessage | I | [크넥샵] 개인정보 처리방침 변경\n\n#{effectiveDate}부터 변경된 처리방침이 적용돼요.\n#{summary} | effectiveDate, summary | 방침 보기 → #{privacyUrl} |
| CNECSHOP_042 | 63 | accountDeletedMessage | I | [크넥샵] 탈퇴 완료\n\n#{userName}님의 탈퇴가 완료됐어요.\n그동안 이용해주셔서 감사해요.\n개인정보 보유: #{retentionMonths}개월 | userName, retentionMonths | (버튼 없음) |
| CNECSHOP_043 | 64 | emailVerificationMessage | I | [크넥샵] 이메일 인증\n\n인증 코드: #{verificationCode}\n#{expiresInMinutes}분 동안 유효해요.\n본인이 요청하지 않았다면 무시해주세요. | verificationCode, expiresInMinutes | (버튼 없음) |

### 마케팅/리텐션 (6종, 마케팅성 — 심사 엄격)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_044 | 46 | cartReminderMessage | A | [크넥샵] 장바구니 안내\n\n#{buyerName}님, 장바구니에 #{itemCount}개 상품이 기다리고 있어요.\n인기 상품은 품절될 수 있어요. | buyerName, itemCount | 장바구니 → /ko/cart |
| CNECSHOP_045 | 47 | restockNotificationMessage | A | [크넥샵] 재입고 완료\n\n#{buyerName}님, 요청하신 #{productName}이 재입고됐어요.\n인기 상품이라 빠르게 품절될 수 있어요. | buyerName, productName | 지금 구매 → #{productUrl} |
| - | 48 | couponIssuedMessage | A | (심사 기준상 쿠폰 발급 알림톡은 거절 가능성 높음 — 이메일만 운영 권장) | - | - |
| - | 49 | couponExpiringMessage | A | (쿠폰 만료 알림도 동일 — 이메일만 권장) | - | - |
| - | 50 | repurchaseReminderMessage | A | (재구매 유도는 마케팅 심사 까다로움 — 이메일만 권장) | - | - |
| - | 51 | interestCreatorNewCampaignMessage | A | (팔로우 기반 알림 — 이메일만 권장) | - | - |

### 리포트 (1종, 거래성)

| 코드 | # | 함수명 | 분류 | 카피 | 변수 | 버튼 |
|------|---|--------|------|------|------|------|
| CNECSHOP_046 | 54 | lowStockAlertMessage | I | [크넥샵] 재고 소진 임박\n\n#{productName} 재고가 #{currentStock}개 남았어요.\n품절 시 크리에이터 판매에 영향이 있어요. | productName, currentStock | 재고 보충 → /ko/brand/products |

> #52, #53, #55, #56, #57 리포트 알림은 이메일 전용 (알림톡 불필요)

---

## 요약

| 구분 | 등록 대상 | 이메일만 | 합계 |
|------|----------|---------|------|
| 거래성 (I) | 21종 | - | 21 |
| 마케팅성 (A) | 2종 | 4종 | 6 |
| 합계 | **23종** | **4종** | **27** |

## 팝빌 등록 순서 (우선도)

1. **즉시 등록** (P0): CNECSHOP_029~032 (결제/배송), 035~039 (보안), 040~043 (법적)
2. **다음 배치** (P1): CNECSHOP_018~022 (회원/캠페인), 033~034 (교환/환불), 046 (재고)
3. **보류** (이메일만): #48~51 (쿠폰/재구매/팔로우 — 마케팅 심사 까다로움)
4. **불필요**: #52~53, #55~57 (리포트 — 이메일 전용)
