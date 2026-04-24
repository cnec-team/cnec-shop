# 토스 환경변수 이름 불일치 진단 리포트

**진단일**: 2026-04-24  
**증상**: Vercel 환경변수 설정했는데 "Payment service not configured" 에러 발생

---

## 원인: 환경변수 이름 불일치 (WIDGET 접두어)

Vercel에는 `_WIDGET_`이 들어간 이름으로 설정했지만, 코드는 `_WIDGET_` 없는 이름을 참조.

---

## 불일치 매트릭스

### 고객 결제 (Phase D) — ❌ 3개 전부 불일치

| 코드가 참조하는 이름 | Vercel에 설정된 이름 | 일치? |
|---|---|---|
| `TOSS_PAYMENTS_SECRET_KEY` | `TOSS_PAYMENTS_WIDGET_SECRET_KEY` | ❌ |
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` | ❌ |
| `TOSS_PAYMENTS_WEBHOOK_SECRET` | *(미설정)* | ❌ |

### 브랜드 구독 결제 (billing) — ✅ 일치

| 코드가 참조하는 이름 | Vercel에 설정된 이름 | 일치? |
|---|---|---|
| `TOSS_PAYMENTS_BILLING_SECRET_KEY` | `TOSS_PAYMENTS_BILLING_SECRET_KEY` | ✅ |
| `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` | `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` | ✅ |
| `PAYMENT_MODE` | `PAYMENT_MODE` | ✅ |

### 기타 결제 관련

| 코드가 참조하는 이름 | Vercel에 설정된 이름 | 일치? |
|---|---|---|
| `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` | `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` | ✅ |
| `NEXT_PUBLIC_PAYMENT_FAIL_URL` | `NEXT_PUBLIC_PAYMENT_FAIL_URL` | ✅ |

---

## 에러 발생 지점

| 파일 | 라인 | 조건 | 에러 메시지 |
|------|------|------|------------|
| `src/lib/toss/payment-env.ts` | 6-8 | `TOSS_PAYMENTS_SECRET_KEY` 없으면 | `[TossPayments] 환경변수 누락: TOSS_PAYMENTS_SECRET_KEY` |
| `src/app/api/payments/complete/route.ts` | 86-91 | `TOSS_PAYMENTS_SECRET_KEY` 없으면 | `Payment service not configured` (500) |
| `src/app/api/payments/webhook/route.ts` | 17 | `TOSS_PAYMENTS_WEBHOOK_SECRET` 없으면 | 서명 검증 실패 |
| `checkout/page.tsx` | 421, 468 | `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` 없으면 | 토스 SDK 초기화 실패 |

---

## 코드의 전체 토스 환경변수 참조 목록

```
# 고객 결제 (payment-env.ts, complete/route.ts, webhook/route.ts, checkout/page.tsx, order-customer.ts)
TOSS_PAYMENTS_SECRET_KEY              → 5곳에서 참조
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY  → 3곳에서 참조
TOSS_PAYMENTS_WEBHOOK_SECRET          → 2곳에서 참조

# 브랜드 구독 결제 (billing-env.ts, CheckoutClient.tsx)
TOSS_PAYMENTS_BILLING_SECRET_KEY              → 1곳
NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY  → 1곳
TOSS_PAYMENTS_BILLING_WEBHOOK_SECRET          → 1곳
PAYMENT_MODE                                  → 1곳
```

---

## 해결 방법

### 권장: A — Vercel 환경변수명을 코드에 맞게 변경

Vercel 대시보드에서 3개 변수 이름 수정:

| 현재 (Vercel) | 변경 후 |
|---|---|
| `TOSS_PAYMENTS_WIDGET_SECRET_KEY` | **`TOSS_PAYMENTS_SECRET_KEY`** |
| `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` | **`NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`** |
| *(신규 추가)* | **`TOSS_PAYMENTS_WEBHOOK_SECRET`** |

> **값은 그대로 유지**, 이름만 변경.  
> `TOSS_PAYMENTS_WEBHOOK_SECRET`은 토스 개발자센터 → 웹훅 → 시크릿 키 값으로 설정.  
> 웹훅 시크릿 미설정 시 `TOSS_PAYMENTS_SECRET_KEY`와 동일 값으로 fallback됨 (payment-env.ts:11).

### 비권장: B — 코드를 Vercel에 맞게 변경

코드 6곳 + payment-env.ts 수정 필요 → 변경 범위 넓고, 빌링과 네이밍 불일치 발생.

### 비권장: C — 기존 WIDGET 변수 유지 + 코드 이름으로 중복 추가

환경변수 중복 → 유지보수 혼란.

---

## 변경 후 체크리스트

- [ ] Vercel에서 `TOSS_PAYMENTS_WIDGET_SECRET_KEY` → `TOSS_PAYMENTS_SECRET_KEY`로 이름 변경 (값 동일)
- [ ] Vercel에서 `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` → `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`로 이름 변경 (값 동일)
- [ ] Vercel에서 `TOSS_PAYMENTS_WEBHOOK_SECRET` 신규 추가 (토스 웹훅 시크릿 값)
- [ ] Vercel 재배포 (환경변수 변경은 재배포 필요)
- [ ] 테스트 결제 1건 실행 → 성공 확인

---

*Generated: 2026-04-24*
