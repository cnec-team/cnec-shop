# 토스 결제 통합 진단 리포트 — 공식 문서 기준 100점 점검

**진단일**: 2026-04-24  
**대상**: 고객 상품 결제 + 브랜드 구독 결제

---

## 1. SDK 버전

| 항목 | 결과 |
|------|------|
| 설치 패키지 | `@tosspayments/tosspayments-sdk` `^2.5.0` |
| 분류 | **SDK v2 (권장)** ✅ |
| v1 (`@tosspayments/payment-widget-sdk`) | 미사용 ✅ |
| v1/v2 혼용 | 없음 ✅ |

### import 경로

| 파일 | import | 방식 |
|------|--------|------|
| `checkout/page.tsx` (고객) | `await import('@tosspayments/tosspayments-sdk')` | 동적 import ✅ |
| `CheckoutClient.tsx` (빌링) | `import { loadTossPayments } from '@tosspayments/tosspayments-sdk'` | 정적 import ✅ |

### 초기화 패턴

```
loadTossPayments(clientKey)           ← v2 ✅
  → tossPayments.payment({ customerKey }) ← v2 ✅
    → payment.requestPayment({...})       ← v2 ✅
```

**판정: SDK v2 정상 사용 ✅**

---

## 2. 환경변수 매칭 결과

### 고객 결제 — ❌ 3개 전부 불일치

| # | 코드가 참조 | Vercel에 설정 | 일치 |
|---|------------|--------------|------|
| 1 | `TOSS_PAYMENTS_SECRET_KEY` | `TOSS_PAYMENTS_WIDGET_SECRET_KEY` | ❌ |
| 2 | `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` | ❌ |
| 3 | `TOSS_PAYMENTS_WEBHOOK_SECRET` | *(미설정)* | ❌ |

**참조 위치 상세:**

| 환경변수 | 참조 파일 (라인) |
|----------|-----------------|
| `TOSS_PAYMENTS_SECRET_KEY` | `payment-env.ts:6`, `complete/route.ts:86`, `order-customer.ts:66` |
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | `payment-env.ts:21`, `checkout/page.tsx:421,468` |
| `TOSS_PAYMENTS_WEBHOOK_SECRET` | `payment-env.ts:11`, `webhook/route.ts:17` |

### 브랜드 구독 결제 — ✅ 전부 일치

| # | 코드가 참조 | Vercel에 설정 | 일치 |
|---|------------|--------------|------|
| 4 | `TOSS_PAYMENTS_BILLING_SECRET_KEY` | `TOSS_PAYMENTS_BILLING_SECRET_KEY` | ✅ |
| 5 | `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` | `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` | ✅ |
| 6 | `PAYMENT_MODE` | `PAYMENT_MODE` | ✅ |

### 기타 — ✅ 일치

| # | 코드가 참조 | Vercel에 설정 | 일치 |
|---|------------|--------------|------|
| 7 | `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` | `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` | ✅ (미사용*) |
| 8 | `NEXT_PUBLIC_PAYMENT_FAIL_URL` | `NEXT_PUBLIC_PAYMENT_FAIL_URL` | ✅ (미사용*) |

> *코드는 `window.location.origin` 기반으로 URL을 직접 생성하므로 이 환경변수는 실제 사용되지 않음

---

## 3. 키 타입 검증 (결제위젯 vs API 개별)

토스 공식 문서 경고:
> "결제위젯에 API 개별 연동 키를 사용하면 안 됩니다"

### SDK v2에서의 키 구분

| 키 종류 | 클라이언트 키 접두어 | 시크릿 키 접두어 | 용도 |
|---------|-------------------|-----------------|------|
| **결제위젯 연동 키** | `test_ck_` / `live_ck_` | `test_gsk_` / `live_gsk_` | `loadTossPayments()` + `payment()` |
| API 개별 연동 키 | `test_ck_` / `live_ck_` | `test_sk_` / `live_sk_` | REST API 직접 호출 |

**중요**: SDK v2의 `loadTossPayments()` → `payment()` 패턴은 **결제위젯 연동 키**를 사용해야 합니다.

- 클라이언트 키: `ck_` 접두어는 위젯/API 모두 동일 — 구분 불가
- **시크릿 키가 핵심**: `gsk_` = 위젯용 ✅ / `sk_` = API 개별용 ❌

### 코드의 시크릿 키 사용처

| 용도 | 파일 | API 호출 | 필요한 키 |
|------|------|----------|----------|
| 결제 승인 (confirm) | `complete/route.ts:95-106` | `POST /v1/payments/confirm` | 시크릿 키 |
| 결제 취소 | `payment-cancel.ts:22` | `POST /v1/payments/{key}/cancel` | 시크릿 키 |
| 금액 불일치 자동 취소 | `complete/route.ts:127-131` | `POST /v1/payments/{key}/cancel` | 시크릿 키 |

> **카이 확인 필요**: Vercel의 `TOSS_PAYMENTS_WIDGET_SECRET_KEY` 값이 `test_gsk_` 또는 `live_gsk_`로 시작하는지 확인.  
> `test_sk_` / `live_sk_`로 시작하면 **API 개별 연동 키**이므로 결제위젯과 호환되지 않음.

---

## 4. customerKey 규칙 준수

### 공식 스펙
- 영문 대소문자 + 숫자 + 특수문자(`-_=.@`) 중 최소 1개
- 2~50자

### 코드 구현

| 사용처 | 생성 방식 | 예시 값 | 규칙 준수 |
|--------|----------|---------|----------|
| 회원 (고객 결제) | `buyer.id` (UUID) | `a1b2c3d4-e5f6-...` | ✅ (`-` 포함, 36자) |
| 비회원 (고객 결제) | `crypto.randomUUID()` | `a1b2c3d4-e5f6-...` | ✅ (`-` 포함, 36자) |
| 브랜드 (구독 결제) | `brand_${brandId}` | `brand_clxyz123...` | ✅ (`_` 포함) |

**판정: customerKey 규칙 준수 ✅**

> Note: SDK v2에서 비회원 결제 시 `PaymentWidget.ANONYMOUS` 대신 세션 UUID 사용 중 — v2에서는 customerKey를 직접 생성하는 방식이 표준이므로 문제 없음.

---

## 5. 에러 throw 지점 + 조건

### 카이가 본 에러: "결제 시스템 설정이 완료되지 않았습니다"

| # | 파일:라인 | 조건 | 에러 메시지 | 도달 가능성 |
|---|----------|------|------------|------------|
| 1 | `checkout/page.tsx:421-424` | `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` 없음 | "결제 시스템 설정이 완료되지 않았습니다. 관리자에게 문의해주세요." | **🔴 높음** — Vercel에 `_WIDGET_` 이름으로 설정 |
| 2 | `complete/route.ts:86-91` | `TOSS_PAYMENTS_SECRET_KEY` 없음 | "Payment service not configured" (500) | **🔴 높음** — 위와 동일 이유 |
| 3 | `payment-env.ts:6-8` | `TOSS_PAYMENTS_SECRET_KEY` 없음 | "[TossPayments] 환경변수 누락: TOSS_PAYMENTS_SECRET_KEY" (throw) | 🔴 `cancelTossPayment` 호출 시 |
| 4 | `billing-env.ts:5-7` | `TOSS_PAYMENTS_BILLING_SECRET_KEY` 없음 | "[TossPayments Billing] 환경변수 누락" (throw) | ✅ 낮음 — Vercel에 설정됨 |
| 5 | `CheckoutClient.tsx:60-63` | `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` 없음 | "결제 설정이 완료되지 않았어요" | ✅ 낮음 — Vercel에 설정됨 |

**에러 #1이 카이가 본 에러와 정확히 일치** → `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`가 undefined이기 때문.

---

## 6. PAYMENT_MODE 역할 + 영향

```typescript
// billing-env.ts:15
mode: (process.env.PAYMENT_MODE ?? 'test') as 'test' | 'live',
```

| 항목 | 결과 |
|------|------|
| 사용 위치 | `billing-env.ts`만 (브랜드 구독 결제) |
| 고객 결제와 관련? | **아니오** — `payment-env.ts`에는 mode 없음 |
| 기본값 | `'test'` |
| 현재 에러와 관련? | **아니오** |

---

## 7. 가장 가능성 높은 원인 TOP 3

### 🥇 1순위: 환경변수 이름 불일치 (확실도 99%)

| 코드 | Vercel | 차이 |
|------|--------|------|
| `TOSS_PAYMENTS_SECRET_KEY` | `TOSS_PAYMENTS_WIDGET_SECRET_KEY` | `_WIDGET_` 추가 |
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` | `_WIDGET_` 추가 |

**근거**: 코드 5곳에서 `_WIDGET_` 없는 이름을 `process.env`로 직접 참조. Vercel에는 `_WIDGET_` 포함된 이름으로 설정. → 런타임에서 `undefined` → 에러 throw.

**카이가 본 에러 메시지 "결제 시스템 설정이 완료되지 않았습니다"는 `checkout/page.tsx:423`에서 발생하며, `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`가 falsy일 때 트리거됨.**

### 🥈 2순위: 시크릿 키 타입 오류 (확실도 30%)

환경변수 이름을 수정한 뒤에도 에러가 나면, Vercel에 입력된 시크릿 키가 `test_sk_` (API 개별)인지 `test_gsk_` (결제위젯)인지 확인 필요.

SDK v2 `loadTossPayments()` → `payment.requestPayment()`는 결제위젯 키를 요구.

### 🥉 3순위: TOSS_PAYMENTS_WEBHOOK_SECRET 미설정 (확실도 100% 미설정)

Vercel에 이 변수가 없음. 단, `webhook/route.ts:19-20`에서 `webhookSecret`이 falsy이면 서명 검증을 건너뛰는 로직이 있어 **즉시 장애는 아님**. 하지만 보안 취약점이므로 반드시 설정 필요.

```typescript
// webhook/route.ts:19-20 — 서명 검증 우회됨
if (webhookSecret && signature) { ... }
```

---

## 8. 추가 발견 사항

### 8-1. 웹훅 서명 헤더

| 항목 | 코드 | 토스 공식 |
|------|------|----------|
| 서명 헤더 | `toss-signature` (line 16) | 확인 필요 |

> 토스 공식 웹훅 헤더명이 `toss-signature`인지 확인 필요. 잘못된 헤더명이면 서명 검증이 항상 실패하거나 건너뛰게 됨.

### 8-2. 데드코드

`checkout/page.tsx:521-529` — `return` 문 이후의 코드가 절대 실행되지 않는 데드코드로 남아있음. 기능 영향 없음.

### 8-3. NEXT_PUBLIC_PAYMENT_SUCCESS_URL / FAIL_URL 미사용

Vercel에 설정되어 있지만, 코드에서는 `window.location.origin` 기반으로 URL을 직접 생성. 이 환경변수는 참조되지 않으므로 삭제해도 무방.

---

## 9. 카이가 해야 할 확인 작업 체크리스트

### 즉시 조치 (환경변수 이름 수정)

- [ ] Vercel에서 `TOSS_PAYMENTS_WIDGET_SECRET_KEY` → **`TOSS_PAYMENTS_SECRET_KEY`**로 이름 변경 (값 유지)
- [ ] Vercel에서 `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` → **`NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`**로 이름 변경 (값 유지)
- [ ] Vercel에서 **`TOSS_PAYMENTS_WEBHOOK_SECRET`** 신규 추가 (토스 개발자센터 → 웹훅 시크릿)
- [ ] Vercel 재배포 트리거 (환경변수 변경 후 재배포 필요)

### 키 타입 확인

- [ ] 토스 개발자센터 → API 키 → **"결제위젯 연동 키"** 섹션에서 발급된 키인지 확인
- [ ] 클라이언트 키 접두어: `test_ck_` 또는 `live_ck_`
- [ ] 시크릿 키 접두어: **`test_gsk_`** 또는 **`live_gsk_`** (⚠️ `sk_`이면 API 개별 키 → 교체 필요)

### 배포 후 검증

- [ ] 체크아웃 페이지 접속 → "결제 시스템 설정이 완료되지 않았습니다" 에러 사라짐
- [ ] 테스트 결제 1건 → 토스 결제창 정상 표시
- [ ] 결제 완료 → `/payment/success` 리다이렉트 정상
- [ ] Vercel Runtime Logs → `TOSS_PAYMENTS_SECRET_KEY is not configured` 에러 0건
- [ ] 브라우저 Console → 에러 0건

### 웹훅 설정

- [ ] 토스 개발자센터 → 웹훅 URL: `https://www.cnecshop.com/api/payments/webhook`
- [ ] 웹훅 이벤트: `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED`, `DEPOSIT_CALLBACK`

---

*Generated: 2026-04-24*
