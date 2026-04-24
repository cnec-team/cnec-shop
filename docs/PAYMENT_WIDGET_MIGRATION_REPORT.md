# 결제위젯 전환 리포트 (결제창 → 결제위젯)

**작업일**: 2026-04-24  
**브랜치**: `claude/payment-widget-migration`

---

## 변경 파일

| 파일 | 변경 요약 |
|------|----------|
| `src/app/[locale]/(shop)/[username]/checkout/page.tsx` | `tossPayments.payment()` → `tossPayments.widgets()` 전환. 결제 UI/약관 UI를 체크아웃 페이지에 직접 렌더링. 기존 결제수단 라디오 버튼 제거. 무통장입금은 체크박스 토글로 분리. 데드코드 정리. |

## 신규/삭제 파일
- 신규: 없음
- 삭제: 없음

---

## 변경 상세

### Before (결제창 방식)
```ts
const tossPayments = await loadTossPayments(clientKey);
const payment = tossPayments.payment({ customerKey });
await payment.requestPayment({
  method: 'CARD',
  amount: { currency: 'KRW', value: totalAmount },
  orderId, orderName, successUrl, failUrl,
  card: { useEscrow: false, flowMode: 'DEFAULT', ... }
});
```
- 버튼 클릭 → PG 결제창 팝업/리다이렉트
- 결제수단 라디오 버튼 5개 (카드/카카오/네이버/토스/무통장)

### After (결제위젯 방식)
```ts
const tossPayments = await loadTossPayments(clientKey);
const widgets = tossPayments.widgets({ customerKey });
await widgets.setAmount({ currency: 'KRW', value: totalAmount });
await Promise.all([
  widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
  widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
]);
await widgets.requestPayment({ orderId, orderName, successUrl, failUrl, ... });
```
- 결제 UI + 약관 UI가 페이지 안에 직접 렌더링
- 결제수단 선택/약관 동의가 위젯 내에서 처리
- 무통장입금은 별도 체크박스로 분리 (위젯 미사용)

---

## 빌링 결제 영향 없음

아래 파일은 수정하지 않음:
- `src/app/[locale]/(brand)/brand/billing/checkout/CheckoutClient.tsx`
- `src/lib/toss/billing-env.ts`
- `src/lib/toss/billing-client.ts`
- `src/app/api/billing/**`

---

## 환경변수

| 변수명 | 용도 | 변경 |
|--------|------|------|
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | 고객 결제 클라이언트 키 | 변경 없음 |
| `TOSS_PAYMENTS_SECRET_KEY` | 고객 결제 시크릿 키 | 변경 없음 |
| `TOSS_PAYMENTS_WEBHOOK_SECRET` | 웹훅 서명 검증 | 변경 없음 |
| `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` | 빌링 키 | **미수정** |
| `TOSS_PAYMENTS_BILLING_SECRET_KEY` | 빌링 키 | **미수정** |

---

## 빌드/린트 결과

- `pnpm tsc --noEmit`: 에러 0건
- `pnpm build`: 성공
- 결제창 방식 잔재 (고객 결제): 0건
- 결제창 방식 (빌링): 1건 — `CheckoutClient.tsx` (정상, 수정 대상 아님)

---

## 카이가 할 것

1. Vercel 환경변수 이름 수정 (이전 진단 리포트 참고):
   - `TOSS_PAYMENTS_WIDGET_SECRET_KEY` → `TOSS_PAYMENTS_SECRET_KEY`
   - `NEXT_PUBLIC_TOSS_PAYMENTS_WIDGET_CLIENT_KEY` → `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`
2. Vercel Redeploy
3. 토스 개발자센터에서 **결제위젯 연동 키** 확인 (시크릿 키 접두어 `gsk_`)
4. 테스트 결제 1건
5. 토스 어드민(dashboard.tosspayments.com)에서 결제 UI 커스터마이즈 가능

---

## 테스트 체크리스트

- [ ] 체크아웃 페이지 접속 → 결제 UI 위젯 로딩 (1~2초)
- [ ] 결제수단 선택 (카드/간편결제) 가능
- [ ] 약관 UI 표시 및 체크 가능
- [ ] 위젯 로딩 전 결제 버튼 비활성화
- [ ] 테스트 카드 결제 성공
- [ ] `/payment/success` 페이지 정상 도착
- [ ] DB Order.status=PAID, paymentKey, paidAt 기록
- [ ] 무통장입금 체크 → 기존 무통장입금 플로우 정상
- [ ] 결제 실패 시 `/payment/fail` 도착
- [ ] 모바일 환경에서 결제 UI 렌더링 정상

---

*Generated: 2026-04-24*
