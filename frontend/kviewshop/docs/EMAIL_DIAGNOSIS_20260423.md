# 크넥샵 이메일 알림 전수 진단 리포트

**진단일**: 2026-04-23
**진단 범위**: `src/lib/notifications/`, 전체 `sendNotification()` 호출처

---

## 1. 결론 요약

1. **이메일 발송 구현 자체는 완성되어 있다** — `nodemailer` + Naver Works SMTP 기반 `sendEmail()` 함수가 존재하고, HTML 이메일 템플릿도 구축됨.
2. **문제의 핵심: 43개 sendNotification 호출 중 33개(77%)가 `emailTemplate` 파라미터를 전달하지 않아 이메일이 발송되지 않는다.** `sendNotification()`은 `email` + `emailTemplate` 두 파라미터가 모두 있어야 이메일을 보내는 구조.
3. **SMTP 환경변수는 로컬에 설정되어 있으나**, Vercel 환경에도 설정되어 있는지는 Vercel 대시보드에서 별도 확인 필요.

---

## 2. sendNotification 함수 실체

### 2-1. 정의 위치

`src/lib/notifications/index.ts:44`

### 2-2. 내부 구조

```
sendNotification(params)
  ├─ 1. 수신 설정 조회 (preferences.ts)
  ├─ 2. 앱 내 알림 (prisma.notification.create) — userId 있으면 항상
  ├─ 3. 알림톡 (kakao.ts → popbill sendATS) — phone + kakaoTemplate 있으면
  └─ 4. 이메일 (email.ts → nodemailer) — email + emailTemplate 있으면
```

| 채널 | 구현 여부 | silent fail 여부 | 조건부 스킵 여부 |
|------|----------|-----------------|----------------|
| 인앱 알림 (DB) | O | O (try/catch) | userId 없으면 스킵, prefs.inApp=false면 스킵 |
| 카카오 알림톡 | O | O (try/catch) | phone + kakaoTemplate 없으면 스킵, prefs.kakao=false면 스킵, POPBILL 환경변수 없으면 early return |
| 이메일 (SMTP) | O | O (try/catch) | email + emailTemplate 없으면 스킵, prefs.email=false면 스킵, SMTP 환경변수 없으면 early return |

### 2-3. 알림 모듈 파일 구조

```
src/lib/notifications/
├── index.ts          — sendNotification 메인 함수 + 재export
├── email.ts          — nodemailer SMTP 발송 (Naver Works)
├── email-utils.ts    — escapeHtml, safeUrl
├── email-footer.ts   — 수신거부 링크 포함 푸터
├── kakao.ts          — 팝빌 알림톡 발송
├── templates.ts      — 17종 메시지 템플릿 (카카오/이메일/인앱)
├── preferences.ts    — 수신 설정 조회 (거래성은 무조건 발송)
├── unsubscribe.ts    — 수신거부 처리
├── utils.ts          — normalizePhone, isValidEmail
└── logger.ts         — 알림 전용 로거
```

---

## 3. 호출 지점 매핑 — emailTemplate 전달 여부

### 이메일이 발송되는 호출 (10개)

| 파일 | 라인 | 이벤트 | 수신자 |
|------|------|--------|--------|
| `api/auth/register/route.ts` | 259 | 크리에이터 가입 신청 | 크리에이터 |
| `api/auth/complete-social-profile/route.ts` | 87 | 소셜 가입 완료 | 크리에이터 |
| `api/payments/complete/route.ts` | 230 | 결제 완료 | 구매자 |
| `api/payments/complete/route.ts` | 262 | 결제 완료 | 브랜드 |
| `api/payments/complete/route.ts` | 288 | 판매 발생 | 크리에이터 |
| `actions/admin.ts` | 579 | 크리에이터 승인 | 크리에이터 |
| `actions/admin.ts` | 630 | 크리에이터 거절 | 크리에이터 |
| `actions/admin.ts` | 686 | 크리에이터 일괄 승인 | 크리에이터 |
| `actions/admin.ts` | 1091 | 정산 확인 | 크리에이터 |
| `actions/trial.ts` | 131 | 체험 신청 접수 | 브랜드 |
| `actions/trial.ts` | 485/528/582 | 체험 승인/발송/결정 | 크리에이터 |
| `actions/brand.ts` | 511 | 캠페인 참여 승인 | 크리에이터 |
| `actions/brand.ts` | 731/752 | 배송 시작/완료 | 구매자 |
| `actions/brand.ts` | 902 | 송장 업데이트 | 구매자 |
| `actions/brand.ts` | 1665 | 캠페인 시작 | 크리에이터 |
| `actions/shop.ts` | 176/204/234 | 주문 완료 알림 | 구매자/브랜드/크리에이터 |
| `api/cron/shipping-reminder/route.ts` | 67 | 송장 독촉 | 브랜드 |

### 이메일이 발송되지 않는 호출 (33개) — emailTemplate 미전달

| 파일 | 라인 | 이벤트 | 수신자 | 심각도 |
|------|------|--------|--------|--------|
| **actions/admin.ts** | 130 | 브랜드 승인 | 브랜드 | **높음** |
| actions/admin.ts | 153 | 브랜드 승인 (상태 변경) | 브랜드 | **높음** |
| actions/admin.ts | 166 | 브랜드 정지 | 브랜드 | 중간 |
| actions/admin.ts | 178 | 브랜드 거절 | 브랜드 | **높음** |
| actions/admin.ts | 328 | 크리에이터 정지/활성 | 크리에이터 | 중간 |
| actions/admin.ts | 356 | 크리에이터 등급 변경 | 크리에이터 | 낮음 |
| actions/admin.ts | 1260 | 주문 상태 변경 | 구매자 | 중간 |
| **actions/brand.ts** | 524 | 캠페인 참여 거절 | 크리에이터 | **높음** |
| actions/brand.ts | 769 | 주문 상태 변경 (기타) | 구매자 | 낮음 |
| actions/brand.ts | 817 | 주문 취소 | 구매자 | **높음** |
| actions/brand.ts | 838 | 취소 알림 (크리에이터) | 크리에이터 | 중간 |
| actions/brand.ts | 1527 | 문의 답변 | 구매자 | 중간 |
| actions/brand.ts | 1635 | 캠페인 모집 시작 | 크리에이터 | 중간 |
| actions/brand.ts | 1680 | 캠페인 종료 | 크리에이터 | 낮음 |
| **actions/creator.ts** | 286 | 캠페인 참여 신청 | 브랜드 | 중간 |
| actions/creator.ts | 711 | 상품 추천 추가 | 브랜드 | 낮음 |
| actions/creator.ts | 821 | 포인트 출금 요청 | 관리자 | 낮음 |
| **actions/buyer.ts** | 151 | 크리에이터 신청 | 관리자 | 낮음 |
| actions/buyer.ts | 362 | 구매 확정 | 크리에이터 | 중간 |
| actions/buyer.ts | 530 | 리뷰 작성 | 브랜드 | 낮음 |
| **actions/order-customer.ts** | 86 | 주문 취소 | 크리에이터 | 중간 |
| actions/order-customer.ts | 95 | 주문 취소 | 브랜드 | **높음** |
| **actions/exchange-refund.ts** | 53 | 교환 요청 | 브랜드 | **높음** |
| actions/exchange-refund.ts | 122 | 환불 요청 | 브랜드 | **높음** |
| **actions/inquiry.ts** | 79 | 문의 접수 | 브랜드 | 중간 |
| actions/inquiry.ts | 93 | 문의 접수 | 관리자 | 낮음 |
| **actions/brand-inquiry.ts** | 202 | 문의 답변 | 구매자 | 중간 |
| **api/brand/proposals/route.ts** | 194 | 제안 알림 | 크리에이터 | 중간 |
| **api/brand/proposals/bulk/route.ts** | 265 | 대량 제안 | 크리에이터 | 중간 |
| **api/billing/refund-request/route.ts** | 47 | 환불 요청 | 관리자 | 낮음 |
| **api/admin/billing/refund-approve/route.ts** | 37 | 환불 거절 | 브랜드 | 중간 |
| api/admin/billing/refund-approve/route.ts | 74 | 환불 승인 | 브랜드 | 중간 |
| **api/cron/pricing-daily/route.ts** | 36 | 체험 만료 임박 | 크리에이터 | 낮음 |
| api/cron/pricing-daily/route.ts | 73 | Pro 만료 임박 | 크리에이터 | 낮음 |

### 이벤트 유형별 이메일 발송 현황

| 이벤트 유형 | 이메일 발송 | 비고 |
|------------|-----------|------|
| 회원가입 — 크리에이터 | O | register/route.ts, complete-social-profile |
| 회원가입 — 브랜드 | **X** | 가입 시 sendNotification 호출 자체 없음 |
| 회원가입 — 구매자 | **X** | 가입 시 sendNotification 호출 자체 없음 |
| 결제 완료 | O | payments/complete, shop.ts |
| 배송 시작/완료 | O | brand.ts |
| 캠페인 참여 승인 | O | brand.ts |
| 캠페인 참여 거절 | **X** | emailTemplate 미전달 |
| 캠페인 생성 | **X** | sendNotification 호출 자체 없음 |
| 크리에이터 승인/거절 | O | admin.ts |
| 브랜드 승인/거절 | **X** | emailTemplate 미전달 |
| 정산 확인 | O | admin.ts |
| 주문 취소 | **X** | emailTemplate 미전달 |
| 교환/환불 요청 | **X** | emailTemplate 미전달 |
| 문의 답변 | **X** | emailTemplate 미전달 |
| 체험 신청 | O | trial.ts |
| 송장 독촉 | O | cron/shipping-reminder |

---

## 4. 환경변수 체크리스트

### 이메일(SMTP) 관련

| 환경변수 | 용도 | 로컬 .env.local | Vercel 설정 |
|----------|------|:---------------:|:-----------:|
| `SMTP_HOST` | SMTP 서버 주소 | O | 확인 필요 |
| `SMTP_PORT` | SMTP 포트 | O | 확인 필요 |
| `SMTP_USER` | SMTP 계정 | O | 확인 필요 |
| `SMTP_PASSWORD` | SMTP 비밀번호 | O | 확인 필요 |
| `EMAIL_FROM` | 발신자 주소 | O | 확인 필요 |

### 알림톡(팝빌) 관련

| 환경변수 | 용도 | 로컬 .env.local | Vercel 설정 |
|----------|------|:---------------:|:-----------:|
| `POPBILL_LINK_ID` | 팝빌 링크 ID | O | 확인 필요 |
| `POPBILL_SECRET_KEY` | 팝빌 시크릿 | O | 확인 필요 |
| `POPBILL_CORP_NUM` | 사업자등록번호 | O | 확인 필요 |
| `POPBILL_KAKAO_SENDER_KEY` | 알림톡 발신프로필 | O | 확인 필요 |
| `POPBILL_IS_TEST` | 테스트 모드 | O | 확인 필요 |

**참고**: `SMTP_USER`/`SMTP_PASSWORD`/`EMAIL_FROM` 중 하나라도 빈 문자열이면 `sendEmail()`은 early return하여 이메일을 보내지 않음 (email.ts:27-29).

---

## 5. 패키지 설치 상태

| 패키지 | 설치 여부 | 용도 |
|--------|----------|------|
| `nodemailer` | O (^8.0.5) | SMTP 이메일 발송 |
| `@types/nodemailer` | O (^8.0.0) | TypeScript 타입 |
| `popbill` | O (^1.64.0) | 카카오 알림톡 (팝빌) |

---

## 6. 테스트 스크립트

| 항목 | 존재 여부 |
|------|----------|
| `scripts/test-notification-dry-run.ts` | O (템플릿 출력 + 환경변수 체크) |
| `scripts/backfill-creator-emails.ts` | O (크리에이터 이메일 백필) |
| `package.json test:notification` | O |

---

## 7. 다음 액션 제안 (우선순위 순)

### 1순위: Vercel 환경변수 확인 (즉시)

Vercel 대시보드에서 `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` 5개가 설정되어 있는지 확인.
**설정 안 되어 있으면 로컬에서만 이메일이 나가고, 프로덕션에서는 모든 이메일이 silent fail.**

### 2순위: 고심각도 호출처에 emailTemplate 추가 (6건)

다음 6개 이벤트는 사용자 경험에 직접 영향을 주므로 우선 처리:

1. **브랜드 승인/거절** (`admin.ts` 130, 153, 178) — 브랜드가 승인됐는지 이메일로 모름
2. **주문 취소** (`brand.ts` 817, `order-customer.ts` 95) — 취소 사실을 이메일로 알려야
3. **교환/환불 요청** (`exchange-refund.ts` 53, 122) — 브랜드가 요청 사실을 이메일로 모름

각 호출처에 `templates.ts`에 해당 이벤트용 템플릿 함수를 추가하고, `emailTemplate: tmpl.email` + `email: recipientEmail`을 전달하면 됨.

### 3순위: 이메일 발송 E2E 테스트

`scripts/test-notification-dry-run.ts`를 확장하여 실제 SMTP 발송 테스트를 추가하거나, 별도 스크립트로 `sendEmail({ to: 'kai@cnecshop.com', subject: '테스트', html: '<p>테스트</p>' })` 호출하여 SMTP 연결 확인.

---

*진단 완료. 코드 수정 없음.*
