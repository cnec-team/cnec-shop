# Phase C 테스트 가이드

## 환경변수 (Vercel에 입력)

| 환경변수 | 설명 |
|---------|------|
| `NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY` | 토스 클라이언트 키 (test_ck_ 또는 live_ck_) |
| `TOSS_PAYMENTS_BILLING_SECRET_KEY` | 토스 시크릿 키 (test_sk_ 또는 live_sk_) |
| `TOSS_PAYMENTS_BILLING_WEBHOOK_SECRET` | 토스 웹훅 시크릿 |
| `PAYMENT_MODE` | test (심사 통과 전) |
| `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` | https://www.cnecshop.com/ko/brand/billing/success |
| `NEXT_PUBLIC_PAYMENT_FAIL_URL` | https://www.cnecshop.com/ko/brand/billing/fail |
| `CRON_SECRET` | Vercel Cron 인증 시크�� (기존 것 사용) |

## 토스 웹훅 등록

토스 개발자센터 → 웹훅 → 웹훅 등록:
- **URL**: `https://www.cnecshop.com/api/billing/webhook`
- **이벤트**: `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED`
- **시크릿** 복사 → `TOSS_PAYMENTS_BILLING_WEBHOOK_SECRET`에 입력

## 테스트 카드 (토스 공식)

| 항목 | 값 |
|------|---|
| 카드번호 | 4330-1234-1234-1234 |
| 유효기간 | 12/28 |
| CVC | 123 |
| 비밀번호 앞 2자리 | 00 |
| 생년월일 | 910101 |

## 테스트 시나리오

### 1. 프로 3개월 결제
1. `/brand/pricing` → "프로로 시작하기"
2. `/brand/billing/checkout` 진입
3. "결제하기" 클릭 → 토스 결제창 팝업
4. 테스트 카드 입력 → 승인
5. `/brand/billing/success` 진입, "결제 완료" 확인
6. DB에서 `BrandSubscription.planV3=PRO`, `proExpiresAt=3개월 뒤` 확인

### 2. 스탠다드 충전
1. `/brand/billing/charge` → ₩50,000 선택
2. 결제 완료
3. `BrandSubscription.prepaidBalance = 50000` 확인

### 3. 환불 플로우
1. `/brand/billing/history` → "환불 요청"
2. `/admin/billing/refunds` → "승인"
3. `BrandSubscription` 플랜 롤백 확인

### 4. 결제 내역 확인
1. `/brand/billing/history` 접속
2. 결제 목록 표시 확인
3. 상태 뱃지 정상 표시 확인

### 5. Cron 수동 트리거 (로컬)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/pricing-daily
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/pricing-monthly-reset
```

## 기존 고객 결제 (/api/payments/*)

이번 Phase에서 건드리지 않음. Phase D에서 토스 위젯으로 마이그레이션 예정.
