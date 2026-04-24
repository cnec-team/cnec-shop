# Phase D 검증 리포트 (PortOne → 토스 전환)

**검증일**: 2026-04-24  
**대상 커밋**: `aaa2a47` — `feat(payments): 고객 결제 PortOne → 토스 위젯 SDK 전환 (Phase D)`

---

## 1. 커밋 이력 확인

| 항목 | 결과 |
|------|------|
| 커밋 aaa2a47 존재? | ✅ 존재 |
| main 브랜치에 머지? | ✅ main 포함 확인 |
| 커밋 메시지 | `feat(payments): 고객 결제 PortOne → 토스 위젯 SDK 전환 (Phase D)` |
| 변경 파일 수 | 11 files changed, 320 insertions(+), 486 deletions(-) |

---

## 2. 파일 존재/삭제 상태

### 신규 생성 (Phase D)
| 파일 | 상태 |
|------|------|
| `src/lib/toss/payment-env.ts` | ✅ 존재 |
| `src/lib/toss/payment-cancel.ts` | ✅ 존재 |
| `src/app/[locale]/payment/success/page.tsx` | ✅ 존재 (커밋에서 수정 확인) |

### 삭제 대상 (레거시)
| 파일 | 상태 |
|------|------|
| `src/app/api/payments/confirm/route.ts` | ✅ 삭제됨 (빈 디렉토리만 잔존 — 무해) |

---

## 3. PortOne 결제 잔재 검사

### 결제 경로 PortOne 잔재
| 파일 | 라인 | 내용 | 판정 |
|------|------|------|------|
| `api/payments/complete/route.ts` | 15 | `// Legacy PortOne fields (kept for backward compat)` | ⚠️ 주석만 잔존 (코드 아님, 무해) |
| `checkout/page.tsx` | 435 | `// 무통장입금: PortOne 스킵` | ⚠️ 주석만 잔존 (코드 아님, 무해) |

### 본인인증 경로 (정상 유지)
| 파일 | 용도 |
|------|------|
| `IdentityVerificationButton.tsx` | PortOne 본인인증 SDK — 정상 유지 |
| `verify-identity/route.ts` | PortOne 본인인증 API — 정상 유지 |
| `signup/page.tsx` | PortOne 본인인증 플래그 — 정상 유지 |

### UI 텍스트 잔재
| 파일 | 라인 | 내용 | 판정 |
|------|------|------|------|
| `order-detail-client.tsx` | 156, 224, 253 | "PortOne에서 실제 환불" 문구 | ⚠️ **UI 텍스트 미전환** — 토스 취소로 바뀌었지만 UI 문구는 여전히 PortOne 표기 |
| `terms/page.tsx` | 87 | "포트원(PortOne) 결제 대행 서비스" | ⚠️ 약관 텍스트 — 토스 전환 반영 필요 여부 검토 |
| `privacy/page.tsx` | 111 | "포트원 (PortOne) 결제 처리" | ⚠️ 개인정보 처리방침 — 토스 전환 반영 필요 여부 검토 |

**결론**: 결제 로직에서 PortOne 코드 호출 0건. 주석·UI 텍스트만 잔존.

---

## 4. 토스 API 구현 확인

| 라우트 | 토스 API 사용 | 상세 |
|--------|--------------|------|
| `api/payments/complete/route.ts` | ✅ | `https://api.tosspayments.com/v1/payments/confirm` 호출 |
| `api/payments/webhook/route.ts` | ✅ | HMAC-SHA256 서명 검증 (`createHmac`) |
| `checkout/page.tsx` | ✅ | `@tosspayments/tosspayments-sdk` → `loadTossPayments` 호출 |
| `payment/success/page.tsx` | ✅ | 토스 파라미터(paymentKey, orderId, amount) 처리 |

---

## 5. 환경변수 참조 확인

| 환경변수 | 참조 파일 | 상태 |
|----------|----------|------|
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | `payment-env.ts`, `checkout/page.tsx` | ✅ 참조 있음 |
| `TOSS_PAYMENTS_SECRET_KEY` | `payment-env.ts`, `complete/route.ts`, `order-customer.ts` | ✅ 참조 있음 |
| `TOSS_PAYMENTS_WEBHOOK_SECRET` | `payment-env.ts`, `webhook/route.ts` | ✅ 참조 있음 |

---

## 6. DB 스키마 확인

| 필드 | 존재 여부 | 비고 |
|------|----------|------|
| `paymentKey` | ✅ | `@map("payment_key") @db.VarChar(100)` |
| `pgProvider` | ✅ | `@map("pg_provider") @db.VarChar(50)` |
| `pgTransactionId` | ✅ | `@map("pg_transaction_id") @db.VarChar(200)` |
| `paymentMethod` | ✅ | `@map("payment_method") @db.VarChar(50)` |

> Note: 별도 `tossPaymentKey`, `tossOrderId` 필드는 없음 — 기존 `paymentKey`, `orderNumber` 필드를 재활용하는 구조.

---

## 7. package.json 의존성

| 패키지 | 상태 | 비고 |
|--------|------|------|
| `@portone/browser-sdk` | ✅ 유지 (`^0.1.5`) | 본인인증용 — 정상 |
| `@tosspayments/tosspayments-sdk` | ✅ 설치 (`^2.5.0`) | 고객 결제용 — 정상 |

---

## 8. forceCancelOrder / cancelOrder 전환 확인

| 함수 | 파일 | 전환 상태 |
|------|------|----------|
| `forceCancelOrder` | `admin-orders-force.ts` | ✅ `cancelTossPayment()` 사용 (line 8, 107) |
| `cancelOrder` | `order-customer.ts` | ✅ `api.tosspayments.com/v1/payments/.../cancel` 직접 호출 (line 71) |

---

## 9. 최종 판정

### ✅ 완료 — Phase D 반영 확인

커밋 `aaa2a47`이 main에 머지되어 있으며, 고객 결제 플로우가 PortOne → 토스페이먼츠로 전환 완료.

**전환 완료 항목:**
- 체크아웃: 토스 위젯 SDK (`loadTossPayments`)
- 결제 완료: 토스 confirm API
- 웹훅: 토스 HMAC-SHA256 서명 검증
- 취소/환불: 토스 취소 API (`cancelTossPayment`)
- 환경변수 헬퍼: `payment-env.ts`
- 레거시 confirm route: 삭제됨

**경미한 잔재 (기능 영향 없음):**
- `order-detail-client.tsx` — admin 환불 다이얼로그에 "PortOne" UI 텍스트 3곳 잔존
- `terms/page.tsx`, `privacy/page.tsx` — 법적 문서에 "포트원" 표기 잔존
- `api/payments/confirm/` — 빈 디렉토리만 잔존 (route.ts 삭제됨)

---

## 10. 카이가 확인해야 할 것

| 항목 | 확인 방법 |
|------|----------|
| Vercel 환경변수 `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | Vercel 대시보드 → Settings → Environment Variables |
| Vercel 환경변수 `TOSS_PAYMENTS_SECRET_KEY` | 위와 동일 |
| Vercel 환경변수 `TOSS_PAYMENTS_WEBHOOK_SECRET` | 위와 동일 |
| 토스 개발자센터 웹훅 URL 등록 | `https://www.cnecshop.com/api/payments/webhook` |
| 테스트 결제 성공 여부 | 테스트 모드 or 실결제 1건 |
| admin 환불 다이얼로그 "PortOne" 문구 수정 여부 | 다음 작업에서 텍스트 수정 가능 |
| 약관/개인정보 페이지 "포트원" 표기 수정 여부 | 법적 검토 후 결정 |

---

*Generated: 2026-04-24*
