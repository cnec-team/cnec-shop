# 크넥샵 고객 결제 시스템 현재 상태 감사

**조사일**: 2026-04-21
**조사 범위**: 결제 API, 체크아웃 페이지, DB 스키마, 웹훅, SDK 의존성

---

## 1. 결제 스택 요약

| 항목 | 현재 상태 |
|------|----------|
| **프로덕션 결제** | **PortOne V2** (메인) + 무통장입금 |
| **레거시 코드** | Toss Payments 직접 연동 (`confirm/route.ts`) — **미사용, 레거시** |
| **SDK 패키지** | `@portone/browser-sdk: ^0.1.3` (활성), `@tosspayments/tosspayments-sdk: ^2.5.0` (미사용) |

**근거:**
- 체크아웃 페이지(`checkout/page.tsx`)는 `@portone/browser-sdk/v2`의 `requestPayment()`를 호출
- `complete/route.ts`는 `https://api.portone.io/payments/` API로 결제 검증
- `webhook/route.ts`는 PortOne 서명 검증 + PortOne API 이중 검증
- `confirm/route.ts`는 Toss Payments API(`api.tosspayments.com`)를 직접 호출하나, **어떤 프론트엔드 코드에서도 이 엔드포인트를 호출하지 않음**
- `payment/success/page.tsx` 주석에 `// Call PortOne complete endpoint (not Toss confirm)` 명시

---

## 2. API 라우트 구조

| 경로 | 역할 | 사용 여부 |
|------|------|----------|
| `POST /api/payments/prepare` | 주문 생성 + 재고 차감 + orderNumber 발급 | **활성** |
| `POST /api/payments/complete` | PortOne API로 결제 검증 → PAID 상태 변경 + 알림 발송 | **활성** |
| `POST /api/payments/webhook` | PortOne 웹훅 수신 (HMAC-SHA256 서명 검증 + 이중 금액 확인) | **활성** |
| `POST /api/payments/confirm` | Toss Payments 직접 confirm API | **미사용 (레거시)** |

---

## 3. 고객 결제 플로우

### 카드/간편결제 (PortOne V2)
```
체크아웃 → POST /api/payments/prepare (주문생성)
         → PortOne.requestPayment() (SDK 팝업)
         → 결과 콜백 or 리다이렉트
         → POST /api/payments/complete (서버 검증)
         → 주문완료 페이지
```

### 무통장입금
```
체크아웃 → POST /api/payments/prepare (paymentMethod=BANK_TRANSFER)
         → PortOne 스킵, 바로 주문완료 페이지
         → 관리자가 수동 확인 후 상태 변경
```

### 체크아웃 페이지 위치
- `src/app/[locale]/(shop)/[username]/checkout/page.tsx`

### 지원 결제 수단 (PortOne 경유)
- 신용카드 (`CARD`)
- 카카오페이 (`EASY_PAY` + `KAKAOPAY`)
- 네이버페이 (`EASY_PAY` + `NAVERPAY`)
- 토스페이 (`EASY_PAY` + `TOSSPAY`) — PortOne 경유, Toss 직접 연동 아님
- 무통장입금 (`BANK_TRANSFER`) — PortOne 미경유

### 리다이렉트 결제 성공 페이지
- `src/app/[locale]/payment/success/page.tsx` — PortOne 리다이렉트 후 `/api/payments/complete` 호출

---

## 4. DB 스키마 — 결제 관련 필드

**Order 모델** (`prisma/schema.prisma:1011`):

| 필드 | DB 컬럼 | 타입 | 용도 |
|------|---------|------|------|
| `paymentMethod` | `payment_method` | VarChar(50) | CARD, EASY_PAY, BANK_TRANSFER 등 |
| `paymentKey` | `payment_key` | VarChar(100) | Toss 레거시용 (현재 미사용) |
| `paymentIntentId` | `payment_intent_id` | String? | 미사용 (과거 Stripe용 추정) |
| `pgTransactionId` | `pg_transaction_id` | VarChar(200) | PortOne paymentId 저장 |
| `pgProvider` | `pg_provider` | VarChar(50) | 'portone' 또는 'toss' |
| `paidAt` | `paid_at` | Timestamptz | 결제 완료 시각 |
| `cancelledAt` | `cancelled_at` | Timestamptz | 취소 시각 |
| `cancelReason` | `cancel_reason` | String? | 취소 사유 |

**기타 결제 관련 모델:**
- `BuyerPaymentMethod` — 구매자 저장 결제 수단
- 일부 모델에 `portOnePaymentId` 필드 존재 (`schema.prisma:2264`)

---

## 5. 웹훅

| 항목 | 내용 |
|------|------|
| **엔드포인트** | `POST /api/payments/webhook` |
| **인증** | HMAC-SHA256 서명 검증 (`x-portone-signature` 헤더) |
| **이중 검증** | 결제 완료 시 PortOne API 직접 호출로 금액/상태 재확인 |
| **처리 이벤트** | `payment.paid`, `payment.confirmed` → PAID |
|  | `payment.cancelled`, `payment.failed` → CANCELLED |
|  | `payment.refunded` → REFUNDED |
| **금액 불일치** | 자동 취소 API 호출 + CANCELLED 처리 |

---

## 6. 운영 데이터

> DB 접속 환경변수(`DATABASE_URL`)가 로컬에 설정되어 있지 않아 직접 쿼리 불가.
> 프로덕션 DB 확인이 필요합니다.

확인 필요 항목:
- 총 주문 수
- 실제 결제 완료(PAID) 주문 수
- 최근 7일 주문 수
- pg_provider별 분포 (portone vs toss)

**Vercel/Railway 대시보드에서 확인 권장:**
```sql
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid,
  COUNT(CASE WHEN pg_provider = 'portone' THEN 1 END) as portone,
  COUNT(CASE WHEN pg_provider = 'toss' THEN 1 END) as toss,
  COUNT(CASE WHEN payment_method = 'BANK_TRANSFER' THEN 1 END) as bank_transfer,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_7d
FROM orders;
```

---

## 7. 환경변수 사용 현황

### PortOne (활성 사용 중)
| 환경변수 | 사용 파일 | 용도 |
|---------|----------|------|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | checkout, IdentityVerification | SDK storeId |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | checkout | SDK channelKey (결제) |
| `NEXT_PUBLIC_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY` | IdentityVerification | 본인인증 채널 |
| `PORTONE_API_SECRET` | complete, webhook, order-customer | 서버 API 인증 |
| `PORTONE_WEBHOOK_SECRET` | webhook | 웹훅 서명 검증 |
| `PORTONE_V2_API_SECRET` | verify-identity | 본인인증 검증 (fallback to PORTONE_API_SECRET) |

### Toss (레거시 — 미사용)
| 환경변수 | 사용 파일 | 용도 |
|---------|----------|------|
| `TOSS_SECRET_KEY` | confirm/route.ts | Toss confirm API 인증 |

### 기타 (무통장입금)
| 환경변수 | 사용 파일 | 용도 |
|---------|----------|------|
| `BANK_TRANSFER_BANK_NAME` | prepare | 무통장입금 안내 |
| `BANK_TRANSFER_ACCOUNT_NUMBER` | prepare | 계좌번호 |
| `BANK_TRANSFER_ACCOUNT_HOLDER` | prepare | 예금주 |

---

## 8. 토스 직접 연동으로 마이그레이션 시 영향 범위 평가

### 수정 필요 파일 목록

| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| `checkout/page.tsx` | PortOne SDK → Toss SDK 교체, payMethod 구조 변경 | **상** |
| `api/payments/complete/route.ts` | PortOne API → Toss API 검증 로직 교체 | **상** |
| `api/payments/webhook/route.ts` | PortOne 서명 → Toss 서명 검증, 이벤트 매핑 변경 | **상** |
| `api/payments/prepare/route.ts` | 주문 생성 로직 자체는 PG 독립적이나, paymentId 생성 방식 변경 가능 | **하** |
| `api/payments/confirm/route.ts` | 이미 Toss 코드 존재 — 재활용 가능하나 리팩토링 필요 | **중** |
| `payment/success/page.tsx` | 리다이렉트 파라미터 변경 (paymentId → paymentKey) | **중** |
| `lib/actions/order-customer.ts` | 주문 취소 시 PortOne cancel API → Toss cancel API | **중** |
| `IdentityVerificationButton.tsx` | 본인인증은 PortOne 유지 or 별도 분리 필요 | **중** |
| `package.json` | `@portone/browser-sdk` 제거, `@tosspayments/tosspayments-sdk` 활성화 | **하** |
| `prisma/schema.prisma` | `paymentKey` 필드 이미 존재 — 추가 마이그레이션 불필요 | **하** |
| `.env` / Vercel 환경변수 | PORTONE → TOSS 환경변수 교체 | **하** |

### 요약 수치

| 항목 | 수치 |
|------|------|
| **수정 필요 파일 수** | 약 8~10개 |
| **핵심 수정 파일** | 3개 (checkout, complete, webhook) |
| **DB 마이그레이션** | 불필요 (`paymentKey`, `pgTransactionId`, `pgProvider` 필드 이미 존재) |
| **기존 PortOne 결제 건** | `pgTransactionId`에 PortOne paymentId로 저장됨. 과거 건 환불 시 PortOne API 호출 필요 → 전환기 동안 이중 PG 로직 필요 |
| **위험도** | **중** |

### 세부 위험 요소

1. **과거 결제 건 환불**: PortOne으로 결제된 주문의 환불은 PortOne API를 통해야 함. 마이그레이션 후에도 일정 기간 PortOne 시크릿 유지 + 분기 로직 필요
2. **본인인증**: PortOne의 본인인증(`IdentityVerificationButton`)은 결제와 독립적. Toss 마이그레이션과 무관하게 PortOne 유지 가능
3. **간편결제**: 현재 카카오페이/네이버페이/토스페이를 PortOne 경유로 제공 중. Toss 직접 연동 시 간편결제 지원 범위 확인 필요
4. **웹훅**: PortOne 웹훅 → Toss 웹훅으로 전면 교체 필요. 이벤트 타입, 서명 방식, 페이로드 구조 모두 다름

---

## 9. 권장 사항

### 현재 상태 평가
- PortOne V2 연동이 **완성도 높게 구현**되어 있음 (HMAC 서명 검증, 이중 금액 확인, 자동 취소, 3채널 알림)
- Toss 레거시 코드(`confirm/route.ts`)는 **완전히 미사용** 상태이므로 삭제해도 무방
- `@tosspayments/tosspayments-sdk` 패키지도 미사용이므로 제거 가능

### 마이그레이션 전략: 점진적 전환 권장

**Phase 1 — 정리** (즉시 가능)
- `api/payments/confirm/route.ts` 삭제 (Toss 레거시)
- `@tosspayments/tosspayments-sdk` package.json에서 제거
- `TOSS_SECRET_KEY` 환경변수 제거

**Phase 2 — Toss 직접 연동 구현** (별도 브랜치)
- Toss SDK 클라이언트 결제 요청 구현
- Toss confirm API 엔드포인트 신규 구현
- Toss 웹훅 엔드포인트 구현
- `pgProvider` 기반 분기 로직 (환불 시 PortOne/Toss 자동 판별)

**Phase 3 — 전환**
- 새 결제를 Toss로 라우팅
- PortOne 환경변수는 과거 건 환불을 위해 일정 기간 유지
- 환불 기간(보통 6개월~1년) 경과 후 PortOne 완전 제거

### 마이그레이션 전 확인 필요 사항
1. **Toss 가맹점 등록 및 API 키 발급 여부**
2. **간편결제(카카오/네이버/토스페이) 지원 범위** — Toss 직접 연동 시에도 동일 수준 제공 가능한지
3. **프로덕션 주문 데이터** — pg_provider별 분포, 환불 가능 기간 내 PortOne 결제 건수

---

*조사자: Claude Code (read-only audit)*
