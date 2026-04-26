# 카카오 알림톡 템플릿 등록 문서 (팝빌용)

> 작성일: 2026-04-26
> 총 55개 (기존 22개 + 신규 33개)
> 도메인: https://www.cnecshop.com
> 광고성(CNECSHOP_029) 1개는 친구톡 전용 → 알림톡 등록 제외 → **실제 알림톡 등록 54개**

---

## 공통 주의사항

1. 본문은 한 글자, 줄바꿈, 공백도 다르면 630 에러 발생
2. 변수는 `#{변수명}` 형식으로 등록
3. 버튼 URL 도메인: `https://www.cnecshop.com`
4. 본문 1,000자 이내 (전체 충족)
5. `\n`은 실제 줄바꿈으로 등록
6. 조건부 변수가 있는 템플릿은 값이 없을 때 빈 문자열 또는 "확인 중"으로 채워서 전송
7. 카카오 심사 1~3영업일 소요

---

## 카테고리별 정리표

| 구분 | 코드 범위 | 건수 |
|------|----------|------|
| 주문/배송 | 001~006 | 6 |
| 캠페인/체험 | 007~011 | 5 |
| 정산 | 012, 026~028 | 4 |
| 제안 | 013~014 | 2 |
| 회원 | 015~017, 065~066 | 5 |
| 정보성 공지 | 030 | 1 |
| 구독/결제 | 031~043 | 13 |
| 리뷰/문의 | 046, 048 | 2 |
| 관리(정지/복원) | 051~052 | 2 |
| 캠페인 추가 | 053, 059~060 | 3 |
| 주문취소/CS | 055~058, 061~064 | 8 |
| **마케팅 (친구톡)** | 029 | **(제외)** |

---

## 기존 등록 완료 (22개)

> 아래는 이미 등록 완료된 템플릿. 본문 확인용으로 포함.

---

### CNECSHOP_001 — 주문 완료 (구매자)
- **카테고리**: 구매 > 구매완료
- **템플릿명**: 주문 완료 (구매자)

```
[크넥샵] 주문 완료

#{buyerName}님, 주문이 완료되었습니다.

주문번호: #{orderNumber}
상품: #{productName}
결제금액: #{totalAmount}

배송이 시작되면 알려드리겠습니다.
```

| 변수 | 설명 | 예시 |
|------|------|------|
| buyerName | 구매자명 | 김철수 |
| orderNumber | 주문번호 | ORD-20260426-001 |
| productName | 상품명 | 글로우 세럼 |
| totalAmount | 결제금액 (포맷) | 39,000원 |

**버튼**: 웹링크 `주문 상세 보기` → `https://www.cnecshop.com/ko/buyer/orders`

---

### CNECSHOP_002 — 배송 시작 (구매자)
- **카테고리**: 배송 > 배송시작
- **템플릿명**: 배송 시작 (구매자)

```
[크넥샵] 배송 시작

#{buyerName}님, 상품이 발송되었습니다.

주문번호: #{orderNumber}
상품: #{productName}
택배사: #{courierName}
운송장번호: #{trackingNumber}
```

| 변수 | 설명 |
|------|------|
| buyerName | 구매자명 |
| orderNumber | 주문번호 |
| productName | 상품명 |
| courierName | 택배사 (없으면 "확인 중") |
| trackingNumber | 운송장번호 (없으면 "확인 중") |

**버튼**: `배송 추적하기` → `https://www.cnecshop.com/ko/buyer/orders`

---

### CNECSHOP_003 — 배송 완료 (구매자)
- **카테고리**: 배송 > 배송완료
- **템플릿명**: 배송 완료 (구매자)

```
[크넥샵] 배송 완료

#{buyerName}님, 상품이 배달 완료되었습니다.

주문번호: #{orderNumber}
상품: #{productName}

상품이 마음에 드셨다면 리뷰를 남겨주세요!
```

**버튼**: `리뷰 작성하기` → `https://www.cnecshop.com/ko/buyer/reviews`

---

### CNECSHOP_004 — 새 주문 발생 (브랜드)
- **카테고리**: 구매 > 구매완료
- **템플릿명**: 새 주문 발생 (브랜드)

```
[크넥샵] 새 주문 발생

#{brandName}님, 새로운 주문이 들어왔습니다.

주문번호: #{orderNumber}
상품: #{productName} x #{quantity}
결제금액: #{totalAmount}
구매자: #{buyerName}
```

**버튼**: `주문 처리하기` → `https://www.cnecshop.com/ko/brand/orders`

---

### CNECSHOP_005 — 송장 입력 요청 (브랜드)
- **카테고리**: 배송 > 배송안내
- **템플릿명**: 송장 입력 요청 (브랜드)

```
[크넥샵] 송장 입력 요청

#{brandName}님, 아직 송장이 입력되지 않은 주문이 있습니다.

주문번호: #{orderNumber}
상품: #{productName}
주문일: #{orderDate}

빠른 배송 처리를 부탁드립니다.
```

**버튼**: `송장 등록하기` → `https://www.cnecshop.com/ko/brand/orders`

---

### CNECSHOP_006 — 판매 발생 (크리에이터)
- **카테고리**: 구매 > 구매완료
- **템플릿명**: 판매 발생 (크리에이터)

```
[크넥샵] 판매 발생

#{creatorName}님, 내 샵에서 판매가 발생했습니다!

상품: #{productName}
판매금액: #{orderAmount}
내 수익: #{commissionAmount}
```

**버튼**: `판매 현황 보기` → `https://www.cnecshop.com/ko/creator/sales`

---

### CNECSHOP_007 — 캠페인 참여 승인 (크리에이터)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 캠페인 참여 승인

```
[크넥샵] 캠페인 참여 승인

#{creatorName}님, 캠페인 참여가 승인되었습니다.

브랜드: #{brandName}
캠페인: #{campaignTitle}

이제 해당 상품을 내 샵에서 판매할 수 있습니다.
```

**버튼**: `내 샵 확인하기` → `https://www.cnecshop.com/ko/creator/shop`

---

### CNECSHOP_008 — 캠페인 시작 (크리에이터)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 캠페인 시작

```
[크넥샵] 캠페인 시작

#{creatorName}님, 참여 중인 캠페인이 시작되었습니다.

브랜드: #{brandName}
캠페인: #{campaignTitle}
종료일: #{endDate}

지금부터 판매가 가능합니다!
```

**버튼**: `내 샵 확인하기` → `https://www.cnecshop.com/ko/creator/shop`
> endDate 없으면 "상시" 입력

---

### CNECSHOP_009 — 체험 신청 승인 (크리에이터)

```
[크넥샵] 체험 신청 승인

#{creatorName}님, 체험 신청이 승인되었습니다.

브랜드: #{brandName}
상품: #{productName}

곧 체험 상품이 발송될 예정입니다.
```

**버튼**: `체험 현황 보기` → `https://www.cnecshop.com/ko/creator/trial/my`

---

### CNECSHOP_010 — 체험 상품 발송 (크리에이터)

```
[크넥샵] 체험 상품 발송

#{creatorName}님, 체험 상품이 발송되었습니다.

브랜드: #{brandName}
상품: #{productName}
운송장번호: #{trackingNumber}
```

**버튼**: `체험 현황 보기` → `https://www.cnecshop.com/ko/creator/trial/my`
> trackingNumber 없으면 "확인 중" 입력

---

### CNECSHOP_011 — 체험 신청 접수 (브랜드)

```
[크넥샵] 체험 신청 접수

#{brandName}님, 새로운 체험 신청이 접수되었습니다.

크리에이터: #{creatorName}
상품: #{productName}

승인 여부를 결정해주세요.
```

**버튼**: `체험 신청 검토하기` → `https://www.cnecshop.com/ko/brand/trial`

---

### CNECSHOP_012 — 정산 확정 (크리에이터)

```
[크넥샵] 정산 확정

#{creatorName}님, #{period} 정산이 확정되었습니다.

정산금액: #{netAmount}
입금예정일: #{paymentDate}
```

**버튼**: `정산 내역 보기` → `https://www.cnecshop.com/ko/creator/settlements`

---

### CNECSHOP_013 — 공구 초대 (크리에이터)

```
[크넥샵] 공구 초대

#{creatorName}님, 새로운 공구 초대가 도착했어요.

브랜드: #{brandName}
캠페인: #{campaignName}
커미션: #{commissionRate}%

아래 링크에서 상세 내용을 확인해주세요.
```

**버튼**: `캠페인 자세히 보기` → `https://www.cnecshop.com/ko/creator/proposals`
> commissionRate 없으면 "협의" 입력
> 버튼 URL 고정 (동적 URL 불가)

---

### CNECSHOP_014 — 상품 추천 요청 (크리에이터)

```
[크넥샵] 상품 추천 요청

#{creatorName}님, 새로운 상품 추천 요청이 도착했어요.

브랜드: #{brandName}
상품: #{productName}
커미션: #{commissionRate}%

내 샵에 상시 추천 상품으로 등록하실지 확인해주세요.
```

**버튼**: `상품 자세히 보기` → `https://www.cnecshop.com/ko/creator/proposals`
> commissionRate 없으면 "협의" 입력

---

### CNECSHOP_015 — 가입 신청 완료 (크리에이터)

```
[크넥샵] 가입 신청 완료

#{creatorName}님, 크넥샵 크리에이터 가입 신청이 완료됐어요.

1~2영업일 내 심사 결과를 알려드릴게요.
승인되면 바로 내 샵을 열 수 있어요!
```

**버튼**: `크넥샵 둘러보기` → `https://www.cnecshop.com/ko`

---

### CNECSHOP_016 — 가입 승인 완료 (크리에이터)

```
[크넥샵] 가입 승인 완료

축하드려요! #{creatorName}님의 크넥샵 크리에이터 가입이 승인됐어요.

지금 바로 내 샵을 열어보세요.
가입 축하 3,000원이 지급됐어요!
```

**버튼**: `내 샵 시작하기` → `https://www.cnecshop.com/ko/creator/dashboard`

---

### CNECSHOP_017 — 가입 심사 결과 (크리에이터)

```
[크넥샵] 가입 심사 결과

#{creatorName}님, 아쉽게도 이번 심사에서는 승인이 어려웠어요.

사유: #{reason}

보완 후 재신청이 가능합니다.
```

**버튼**: `다시 신청하기` → `https://www.cnecshop.com/ko/creator/pending`

---

### CNECSHOP_026 — 정산 지급 완료

```
[크넥샵] 정산 완료

#{recipientName}님, 정산이 완료되었어요.

정산금액: #{amount}
정산일시: #{paidAt}
메모: #{memo}
```

**버튼**: `정산 내역 보기` → `https://www.cnecshop.com/ko/brand/settlements`

---

### CNECSHOP_027 — 정산 보류

```
[크넥샵] 정산 보류

#{recipientName}님, 정산이 일시 보류되었어요.

사유: #{reason}

자세한 내용은 고객센터로 문의해주세요.
```

**버튼**: `문의하기` → `https://www.cnecshop.com/ko/support`

---

### CNECSHOP_028 — 정산 취소

```
[크넥샵] 정산 취소

#{recipientName}님, 정산이 취소되었어요.

사유: #{reason}

재정산 관련 문의는 고객센터로 연락주세요.
```

**버튼**: `문의하기` → `https://www.cnecshop.com/ko/support`

---

### CNECSHOP_030 — 정보성 공지

```
#{recipientName}님, 크넥샵 서비스 공지입니다.

#{content}
```

**버튼**: `크넥샵 바로가기` → `https://www.cnecshop.com/ko`

---

## 신규 등록 필요 (33개)

---

### CNECSHOP_031 — 구독 결제 완료 (브랜드)
- **카테고리**: 결제 > 결제완료
- **템플릿명**: 구독 결제 완료

```
[크넥샵] 결제 완료

#{brandName}님, #{purposeLabel} 결제가 완료되었습니다.

결제금액: #{amount}
#{billingCycleInfo}
```

| 변수 | 설명 | 예시 |
|------|------|------|
| brandName | 브랜드명 | 글로우랩 |
| purposeLabel | 결제 항목 | 프로 구독 |
| amount | 결제금액 | 330,000원 |
| billingCycleInfo | 결제 주기 (조건부) | 결제 주기: 월간 |

**버튼**: `구독 관리` → `https://www.cnecshop.com/ko/brand/billing/history`

---

### CNECSHOP_032 — 구독 결제 실패 (브랜드)
- **카테고리**: 결제 > 결제안내
- **템플릿명**: 구독 결제 실패

```
[크넥샵] 결제 실패

#{brandName}님, #{purposeLabel} 결제가 실패했습니다.

결제금액: #{amount}
실패 사유: #{errorReason}

다시 시도해주세요.
```

**버튼**: `다시 결제하기` → `https://www.cnecshop.com/ko/brand/billing/checkout`
> errorReason 없으면 "결제 처리 중 오류 발생" 입력

---

### CNECSHOP_033 — 구독 갱신 예정 (브랜드)
- **카테고리**: 결제 > 결제안내
- **템플릿명**: 구독 갱신 예정

```
[크넥샵] 구독 갱신 예정

#{brandName}님, #{planName} 구독이 #{renewalDate}에 자동 갱신됩니다.

갱신금액: #{amount}

변경이 필요하시면 미리 수정해주세요.
```

**버튼**: `구독 관리` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_034 — 구독 만료 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 구독 만료

```
[크넥샵] 구독 만료

#{brandName}님, #{planName} 구독이 만료되었습니다.

서비스를 계속 이용하시려면 구독을 갱신해주세요.
```

**버튼**: `구독 갱신하기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_035 — 플랜 변경 완료 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 플랜 변경 완료

```
[크넥샵] 플랜 변경 완료

#{brandName}님, 플랜이 변경되었습니다.

변경 전: #{fromPlan}
변경 후: #{toPlan}
```

**버튼**: `플랜 상세 보기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_036 — 결제 환불 완료 (브랜드)
- **카테고리**: 결제 > 환불안내
- **템플릿명**: 결제 환불 완료

```
[크넥샵] 환불 완료

#{brandName}님, 환불이 완료되었습니다.

환불금액: #{refundAmount}

카드사 정책에 따라 3~5영업일 걸릴 수 있습니다.
```

**버튼**: `결제 내역 보기` → `https://www.cnecshop.com/ko/brand/billing/history`

---

### CNECSHOP_037 — 결제 환불 거절 (브랜드)
- **카테고리**: 결제 > 환불안내
- **템플릿명**: 결제 환불 거절

```
[크넥샵] 환불 거절

#{brandName}님, 환불 요청이 거절되었습니다.

사유: #{reason}

문의: support@cnecshop.com
```

**버튼**: `문의하기` → `https://www.cnecshop.com/ko/support`

---

### CNECSHOP_038 — 무료체험 종료 D-1 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 무료체험 종료 예정

```
[크넥샵] 체험 종료 예정

#{brandName}님, 무료 체험이 내일 종료됩니다.

종료일: #{trialEndsDate}

스탠다드 또는 프로 플랜으로 전환해주세요.
```

**버튼**: `플랜 선택하기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_039 — 무료체험 종료 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 무료체험 종료

```
[크넥샵] 체험 종료

#{brandName}님, 무료 체험이 종료되었습니다.

#{restrictedUntilDate}까지 결제하시면 데이터를 유지할 수 있습니다.
```

**버튼**: `플랜 선택하기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_040 — 프로 만료 D-7 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 프로 만료 예정

```
[크넥샵] 프로 만료 예정

#{brandName}님, 프로 플랜이 #{proExpiresDate}에 만료됩니다.

미리 연장하시면 끊김 없이 이용 가능합니다.
```

**버튼**: `프로 연장하기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_041 — 프로 만료 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 프로 만료

```
[크넥샵] 프로 만료

#{brandName}님, 프로 플랜이 만료되어 스탠다드로 전환되었습니다.

프로 기능을 다시 이용하시려면 재구독해주세요.
```

**버튼**: `프로 재구독` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_042 — 계정 비활성화 D-7 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 계정 비활성화 예정

```
[크넥샵] 계정 비활성화 예정

#{brandName}님, 7일 후 계정이 비활성화됩니다.

기한: #{restrictedUntilDate}

지금 결제하면 데이터를 유지할 수 있습니다.
```

**버튼**: `지금 결제하기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_043 — 계정 비활성화 (브랜드)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 계정 비활성화

```
[크넥샵] 계정 비활성화

#{brandName}님, 계정이 비활성화되었습니다.

데이터는 #{retentionDays}일간 보존됩니다.
결제하시면 복구됩니다.
```

**버튼**: `계정 복구하기` → `https://www.cnecshop.com/ko/brand/pricing`

---

### CNECSHOP_046 — 문의 답변 완료 (구매자)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 문의 답변 완료

```
[크넥샵] 문의 답변 완료

#{buyerName}님, 문의하신 내용에 답변이 등록되었습니다.

상품: #{productName}
주문번호: #{orderNumber}

크넥샵에서 확인해주세요.
```

| 변수 | 조건부 |
|------|--------|
| productName | 없으면 빈 문자열 → 줄 자체 생략 불가이므로 "일반 문의" 입력 |
| orderNumber | 없으면 "없음" 입력 |

**버튼**: `답변 확인하기` → `https://www.cnecshop.com/ko/my/inquiries`

---

### CNECSHOP_048 — 체험 신청 거절 (크리에이터)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 체험 신청 결과

```
[크넥샵] 체험 신청 결과

#{creatorName}님, 아쉽게도 체험 신청이 거절되었습니다.

브랜드: #{brandName}
상품: #{productName}
사유: #{reason}

다른 상품에 체험 신청해보세요.
```

**버튼**: `다른 체험 보기` → `https://www.cnecshop.com/ko/creator/trial`
> reason 없으면 "브랜드 정책에 의한 결정" 입력

---

### CNECSHOP_051 — 브랜드 정지

```
[크넥샵] 브랜드 정지

#{brandName}님, 브랜드 계정이 정지되었습니다.

사유: #{reason}

문의: support@cnecshop.com
```

**버튼**: `문의하기` → `https://www.cnecshop.com/ko/support`

---

### CNECSHOP_052 — 크리에이터 정지

```
[크넥샵] 계정 정지

#{creatorName}님, 크리에이터 계정이 정지되었습니다.

사유: #{reason}

문의: support@cnecshop.com
```

**버튼**: `문의하기` → `https://www.cnecshop.com/ko/support`

---

### CNECSHOP_053 — 캠페인 종료 (크리에이터)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 캠페인 종료

```
[크넥샵] 캠페인 종료

#{creatorName}님, 참여하신 캠페인이 종료되었습니다.

브랜드: #{brandName}
캠페인: #{campaignTitle}

판매 현황을 확인해보세요.
```

**버튼**: `판매 현황 보기` → `https://www.cnecshop.com/ko/creator/sales`

---

### CNECSHOP_055 — 주문 취소 (구매자)
- **카테고리**: 구매 > 구매취소/환불
- **템플릿명**: 주문 취소 (구매자)

```
[크넥샵] 주문 취소

주문이 취소되었습니다.

주문번호: #{orderNumber}
취소 사유: #{cancelReason}

결제하신 금액은 영업일 기준 3~5일 내 환불됩니다.
```

**버튼**: `주문 상세 보기` → `https://www.cnecshop.com/ko/buyer/orders`

---

### CNECSHOP_056 — 주문 취소 (브랜드)
- **카테고리**: 구매 > 구매취소/환불
- **템플릿명**: 주문 취소 (브랜드)

```
[크넥샵] 주문 취소

주문이 취소되었습니다.

주문번호: #{orderNumber}

구매자에 의해 주문이 취소되었습니다.
```

**버튼**: `주문 처리하기` → `https://www.cnecshop.com/ko/brand/orders`

---

### CNECSHOP_057 — 교환 요청 접수 (브랜드)
- **카테고리**: 구매 > 교환안내
- **템플릿명**: 교환 요청 접수

```
[크넥샵] 교환 요청 접수

교환 요청이 접수되었습니다.

주문번호: #{orderNumber}
사유: #{reason}

빠른 확인 부탁드립니다.
```

**버튼**: `교환 요청 처리하기` → `https://www.cnecshop.com/ko/brand/inquiries`

---

### CNECSHOP_058 — 환불 요청 접수 (브랜드)
- **카테고리**: 구매 > 구매취소/환불
- **템플릿명**: 환불 요청 접수

```
[크넥샵] 환불 요청 접수

환불 요청이 접수되었습니다.

주문번호: #{orderNumber}
환불 유형: #{refundType}

빠른 확인 부탁드립니다.
```

**버튼**: `환불 요청 처리하기` → `https://www.cnecshop.com/ko/brand/inquiries`

---

### CNECSHOP_059 — 캠페인 참여 거절 (크리에이터)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 캠페인 참여 결과

```
[크넥샵] 캠페인 참여 결과

#{creatorName}님, 아쉽게도 이번 캠페인은 참여가 어려웠어요.

캠페인: #{campaignTitle}

다른 캠페인에 참여해보세요.
```

**버튼**: `다른 캠페인 보기` → `https://www.cnecshop.com/ko/creator/campaigns`

---

### CNECSHOP_060 — 새 캠페인 오픈 (크리에이터)
- **카테고리**: 서비스이용 > 이용안내/공지
- **템플릿명**: 새 캠페인 오픈

```
[크넥샵] 새 캠페인 오픈

새 캠페인이 오픈됐어요.

캠페인: #{campaignTitle}

지금 확인하고 참여해보세요!
```

**버튼**: `캠페인 자세히 보기` → `https://www.cnecshop.com/ko/creator/campaigns`

---

### CNECSHOP_061 — 환불 완료 (구매자)
- **카테고리**: 구매 > 구매취소/환불
- **템플릿명**: 환불 완료

```
[크넥샵] 환불 완료

#{buyerName}님, 환불이 완료되었습니다.

주문번호: #{orderNumber}
환불금액: #{refundAmount}
환불수단: #{refundMethod}
```

**버튼**: `환불 내역 보기` → `https://www.cnecshop.com/ko/buyer/orders`

---

### CNECSHOP_062 — 결제 실패 (구매자)
- **카테고리**: 결제 > 결제안내
- **템플릿명**: 결제 실패

```
[크넥샵] 결제 실패

#{buyerName}님, 결제가 완료되지 않았습니다.

주문번호: #{orderNumber}
상품: #{productName}
실패 사유: #{reason}

30분 내 재시도 가능합니다.
```

**버튼**: `다시 결제하기` → `https://www.cnecshop.com/ko/buyer/orders`

---

### CNECSHOP_063 — 교환 승인/거절 (구매자)
- **카테고리**: 구매 > 교환안내
- **템플릿명**: 교환 결과

> **2개 버전 필요** (승인/거절)

**승인 버전 (CNECSHOP_063_A):**
```
[크넥샵] 교환 승인

#{buyerName}님, 교환이 승인되었습니다.

주문번호: #{orderNumber}
상품: #{productName}
```

**거절 버전 (CNECSHOP_063_B):**
```
[크넥샵] 교환 거절

#{buyerName}님, 교환이 어렵습니다.

주문번호: #{orderNumber}
상품: #{productName}
사유: #{reason}
```

**버튼**: `주문 상세 보기` → `https://www.cnecshop.com/ko/buyer/orders`

> 코드에서 isApproved에 따라 다른 메시지 생성. 카카오는 조건부 불가 → **2개 템플릿 코드로 분리 등록** 필요. 코드에서 templateCode를 분기하도록 수정 필요.

---

### CNECSHOP_064 — 환불 승인/거절 (구매자)
- **카테고리**: 구매 > 구매취소/환불
- **템플릿명**: 환불 결과

> **2개 버전 필요** (승인/거절)

**승인 버전 (CNECSHOP_064_A):**
```
[크넥샵] 환불 승인

#{buyerName}님, 환불이 승인되었습니다.

주문번호: #{orderNumber}
상품: #{productName}
```

**거절 버전 (CNECSHOP_064_B):**
```
[크넥샵] 환불 거절

#{buyerName}님, 환불이 어렵습니다.

주문번호: #{orderNumber}
상품: #{productName}
사유: #{reason}
```

**버튼**: `주문 상세 보기` → `https://www.cnecshop.com/ko/buyer/orders`

> 063과 동일 이슈. 2개 템플릿 코드로 분리 등록 필요.

---

### CNECSHOP_065 — 브랜드 승인 (브랜드)
- **카테고리**: 서비스이용 > 회원가입/탈퇴
- **템플릿명**: 브랜드 승인

```
[크넥샵] 브랜드 승인 완료

#{brandName} 브랜드 입점이 승인되었습니다.

지금 바로 상품을 등록하고 크리에이터와 함께 판매를 시작해보세요.
```

**버튼**: `상품 등록하기` → `https://www.cnecshop.com/ko/brand/products/new`

---

### CNECSHOP_066 — 브랜드 거절 (브랜드)
- **카테고리**: 서비스이용 > 회원가입/탈퇴
- **템플릿명**: 입점 심사 결과

```
[크넥샵] 입점 심사 결과

#{brandName} 입점이 어려웠습니다.

자세한 사항은 관리자에게 문의해주세요.
```

**버튼**: `문의하기` → `https://www.cnecshop.com/ko/support`

---

## 코드 수정 필요 사항

### CNECSHOP_063, 064 조건부 분기 이슈

코드에서 `exchangeRespondedMessage`와 `refundRespondedMessage`는 `isApproved` 조건에 따라 다른 kakaoMsg를 생성합니다. 카카오는 조건부 메시지를 지원하지 않으므로:

**방법 1 (권장)**: 승인/거절을 별도 템플릿 코드로 분리
- `CNECSHOP_063_A` (교환 승인) / `CNECSHOP_063_B` (교환 거절)
- `CNECSHOP_064_A` (환불 승인) / `CNECSHOP_064_B` (환불 거절)
- 코드에서 `isApproved ? KAKAO_TEMPLATES.EXCHANGE_RESPONDED_APPROVED : KAKAO_TEMPLATES.EXCHANGE_RESPONDED_REJECTED`

**방법 2**: 하나의 템플릿에 결과 변수 포함
- `#{result}` 변수에 "승인" 또는 "거절" 텍스트를 넣고, reason이 없으면 빈 문자열

→ **방법 1이 카카오 심사 통과율 높음** (명확한 정보성 메시지)

---

## 전체 등록 체크리스트

| # | 코드 | 등록 | 심사 | 비고 |
|---|------|------|------|------|
| 1 | CNECSHOP_001 | [ ] | [ ] | 기존 |
| 2 | CNECSHOP_002 | [ ] | [ ] | 기존, 조건부변수 |
| 3 | CNECSHOP_003 | [ ] | [ ] | 기존 |
| 4 | CNECSHOP_004 | [ ] | [ ] | 기존 |
| 5 | CNECSHOP_005 | [ ] | [ ] | 기존 |
| 6 | CNECSHOP_006 | [ ] | [ ] | 기존 |
| 7 | CNECSHOP_007 | [ ] | [ ] | 기존 |
| 8 | CNECSHOP_008 | [ ] | [ ] | 기존, 조건부변수 |
| 9 | CNECSHOP_009 | [ ] | [ ] | 기존 |
| 10 | CNECSHOP_010 | [ ] | [ ] | 기존, 조건부변수 |
| 11 | CNECSHOP_011 | [ ] | [ ] | 기존 |
| 12 | CNECSHOP_012 | [ ] | [ ] | 기존 |
| 13 | CNECSHOP_013 | [ ] | [ ] | 기존, 조건부변수 |
| 14 | CNECSHOP_014 | [ ] | [ ] | 기존, 조건부변수 |
| 15 | CNECSHOP_015 | [ ] | [ ] | 기존 |
| 16 | CNECSHOP_016 | [ ] | [ ] | 기존 |
| 17 | CNECSHOP_017 | [ ] | [ ] | 기존 |
| 18 | CNECSHOP_026 | [ ] | [ ] | 기존 |
| 19 | CNECSHOP_027 | [ ] | [ ] | 기존 |
| 20 | CNECSHOP_028 | [ ] | [ ] | 기존 |
| 21 | CNECSHOP_030 | [ ] | [ ] | 기존, 정보성 |
| 22 | CNECSHOP_031 | [ ] | [ ] | **신규** 결제완료 |
| 23 | CNECSHOP_032 | [ ] | [ ] | **신규** 결제실패 |
| 24 | CNECSHOP_033 | [ ] | [ ] | **신규** 갱신예정 |
| 25 | CNECSHOP_034 | [ ] | [ ] | **신규** 구독만료 |
| 26 | CNECSHOP_035 | [ ] | [ ] | **신규** 플랜변경 |
| 27 | CNECSHOP_036 | [ ] | [ ] | **신규** 환불완료 |
| 28 | CNECSHOP_037 | [ ] | [ ] | **신규** 환불거절 |
| 29 | CNECSHOP_038 | [ ] | [ ] | **신규** 체험D-1 |
| 30 | CNECSHOP_039 | [ ] | [ ] | **신규** 체험종료 |
| 31 | CNECSHOP_040 | [ ] | [ ] | **신규** 프로D-7 |
| 32 | CNECSHOP_041 | [ ] | [ ] | **신규** 프로만료 |
| 33 | CNECSHOP_042 | [ ] | [ ] | **신규** 비활성화D-7 |
| 34 | CNECSHOP_043 | [ ] | [ ] | **신규** 비활성화 |
| 35 | CNECSHOP_046 | [ ] | [ ] | **신규** 문의답변 |
| 36 | CNECSHOP_048 | [ ] | [ ] | **신규** 체험거절 |
| 37 | CNECSHOP_051 | [ ] | [ ] | **신규** 브랜드정지 |
| 38 | CNECSHOP_052 | [ ] | [ ] | **신규** 크리에이터정지 |
| 39 | CNECSHOP_053 | [ ] | [ ] | **신규** 캠페인종료 |
| 40 | CNECSHOP_055 | [ ] | [ ] | **신규** 주문취소→구매자 |
| 41 | CNECSHOP_056 | [ ] | [ ] | **신규** 주문취소→브랜드 |
| 42 | CNECSHOP_057 | [ ] | [ ] | **신규** 교환요청 |
| 43 | CNECSHOP_058 | [ ] | [ ] | **신규** 환불요청 |
| 44 | CNECSHOP_059 | [ ] | [ ] | **신규** 캠페인거절 |
| 45 | CNECSHOP_060 | [ ] | [ ] | **신규** 캠페인오픈 |
| 46 | CNECSHOP_061 | [ ] | [ ] | **신규** 환불완료(구매자) |
| 47 | CNECSHOP_062 | [ ] | [ ] | **신규** 결제실패(구매자) |
| 48 | CNECSHOP_063_A | [ ] | [ ] | **신규** 교환승인 |
| 49 | CNECSHOP_063_B | [ ] | [ ] | **신규** 교환거절 |
| 50 | CNECSHOP_064_A | [ ] | [ ] | **신규** 환불승인 |
| 51 | CNECSHOP_064_B | [ ] | [ ] | **신규** 환불거절 |
| 52 | CNECSHOP_065 | [ ] | [ ] | **신규** 브랜드승인 |
| 53 | CNECSHOP_066 | [ ] | [ ] | **신규** 브랜드거절 |

> 총 53개 (CNECSHOP_029 친구톡 제외, 063/064 분리 포함)
