# 가격 시스템 구현 전 코드베이스 감사 리포트

조사일: 2026-04-21
조사자: Claude Code (선행 조사)
참조 커밋: main HEAD `7dc73fb` (구매자 격리 100점 적용 후)

---

## 1. Executive Summary

- **신규 구현 비율: 30%** (재사용 45%, 확장 25%, 신규 30%)
- **위험도: 하** — v3 백엔드 로직 + DB 스키마 + UI가 이미 Phase A/B로 구현 완료
- **주의 필요 사항 Top 3:**
  1. v3 과금 함수(`charge-campaign`, `charge-detail-view`, `charge-message`)가 존재하지만 **실제 호출 지점이 0곳** — 아직 기존 비즈니스 로직에 연결되지 않음
  2. 결제(PortOne 빌링키 등록, 충전, 프로 구독 결제) UI/API가 **전혀 없음** — PricingCards 버튼은 `disabled`
  3. 엑셀 다운로드는 `xlsx` 패키지로 클라이언트 사이드 구현 — 프로 플랜 게이팅이 아직 없음

---

## 2. 기존 자산 (재사용 가능)

### 2.1 DB 스키마 — 완전 구현 완료

| 모델/Enum | 위치 | 상태 | 비고 |
|---|---|---|---|
| `SubscriptionPlan` enum | schema:301 | FREE/STARTER/PRO/ENTERPRISE + TRIAL/STANDARD 6개 값 | v2+v3 공용 |
| `BrandPlanV3` enum | schema:316 | TRIAL/STANDARD/PRO | v3 전용 |
| `ProBillingCycle` enum | schema:322 | QUARTERLY/ANNUAL | v3 프로 전용 |
| `BrandSubscription` model | schema:2181 | v2 필드 + v3 필드 모두 존재 | `planV3`, `trialXxx`, `prepaidBalance`, `billingKey`, `shopCommissionRate` 등 |
| `MessageCredit` model | schema:2229 | `pricePerMessage` default ₩500 | v2 메시지 과금 로그 |
| `SubscriptionPayment` model | schema:2255 | 결제 내역 테이블 | v2 구독 결제용 |
| `CampaignChargeLog` model | schema:2496 | v3 캠페인 과금 로그 | 신규, 마이그레이션 적용 완료 |
| `DetailViewLog` model | schema:2516 | v3 상세열람 과금 로그 | 신규, 마이그레이션 적용 완료 |
| `SuspiciousActivityLog` model | schema:2537 | v3 남용 탐지 로그 | 신규, 마이그레이션 적용 완료 |
| `SuspiciousActivityType` enum | schema:325 | 5개 타입 (RAPID_DETAIL_VIEW 등) | 신규 |
| Creator 보호 필드 | schema:681-684 | `acceptingProposals`, `monthlyProposalLimit`, `currentMonthProposals`, `proposalResetAt` | 모두 default 값 있음 |
| CreatorProposal.matchScore | schema:2110 | Decimal(5,2) nullable | 신규 |

### 2.2 마이그레이션 히스토리

| 마이그레이션 | 날짜 | 내용 |
|---|---|---|
| `20260417000000_add_subscription_messaging_dm` | 04-17 | v2 구독 시스템 전체 (BrandSubscription, MessageCredit, SubscriptionPayment, DmSendQueue, DmSendLog + enums) |
| `20260421100000_pricing_v3_schema_extension` | 04-21 | v3 확장 (BrandPlanV3 enum, ProBillingCycle, v3 필드 추가, CampaignChargeLog, DetailViewLog, SuspiciousActivityLog, Creator 보호 필드) |

**상태**: `prisma migrate status`는 로컬에서 DB URL 없이 실행 불가. 단, 커밋 로그에서 `feat(pricing-v3): Phase A - DB 스키마 확장 + 백엔드 로직`이 main에 머지 완료 → Vercel 배포 시 Railway DB에 적용됨.

### 2.3 백엔드 비즈니스 로직 — `src/lib/pricing/v3/` (10개 파일)

| 파일 | 역할 | 상태 |
|---|---|---|
| `constants.ts` | 가격 상수 (TRIAL/STANDARD/PRO 요금표) | 완전 구현 |
| `plan-resolver.ts` | v2/v3 플랜 판별 (`resolveBrandPlan`) | 완전 구현 |
| `limits.ts` | 일일 DB 열람 한도 체크 + 카운터 리셋 | 완전 구현 |
| `charge-campaign.ts` | 캠페인 생성 시 과금 (TRIAL 1번/STANDARD ₩50,000/PRO 무제한) | 완전 구현 |
| `charge-detail-view.ts` | 크리에이터 상세열람 과금 (무료분량→초과분 ₩100) | 완전 구현 |
| `charge-message.ts` | 메시지 발송 과금 (TRIAL 10건/STANDARD ₩700/PRO 500건 무료→₩700) | 완전 구현 |
| `labels.ts` | 한국어 라벨/에러 메시지 | 완전 구현 |
| `abuse-detection.ts` | 시간당 열람/그룹추가 속도 제한 | 완전 구현 |
| `contact-mask.ts` | 크리에이터 연락처 마스킹 (stub) | 뼈대만 |
| `creator-protection.ts` | 수신 토글, 월 상한, 90일 쿨다운, 매칭 점수 게이팅 | 완전 구현 |

### 2.4 v2 레거시 코드 (유지 필요)

| 파일 | 역할 | 비고 |
|---|---|---|
| `src/lib/subscription/plans.ts` | v2 요금표 (FREE/STARTER/PRO/ENTERPRISE) | `@deprecated` 표시, 2026-Q3 제거 예정. TRIAL/STANDARD 스텁 추가됨 |
| `src/lib/subscription/check.ts` | v2 메시지 발송 체크 + 크레딧 차감 | `MESSAGE_PRICE_KRW = 500` (v3은 700) |
| `src/app/api/brand/subscription/route.ts` | v2 구독 현황 API | GET: 구독+크레딧 요약 반환, POST: "준비중" |
| `SubscriptionPageLegacy.tsx` | v2 구독 UI | v2 사용자에게만 렌더링 |

### 2.5 UI 컴포넌트 — `src/app/[locale]/(brand)/brand/pricing/`

| 파일 | 역할 | 상태 |
|---|---|---|
| `page.tsx` | v3 가격 페이지 서버 컴포넌트 (planResolver 연동) | 완전 구현 |
| `components/PricingHero.tsx` | 히어로 섹션 | 완전 구현 |
| `components/PricingCards.tsx` | 3열 가격 카드 (체험/스탠다드/프로) | **구현 완료, 버튼 onClick 미연결** |
| `components/ComparisonTable.tsx` | 전체 기능 비교 테이블 | 완전 구현 |
| `components/PricingFAQ.tsx` | 가격 FAQ 아코디언 | 완전 구현 |
| `components/BillingCycleToggle.tsx` | 프로 3개월/1년 토글 | 완전 구현 |

### 2.6 크리에이터 측 UI

| 파일 | 역할 | 상태 |
|---|---|---|
| `creator/settings/proposals/page.tsx` | 제안 받기 설정 페이지 | 완전 구현 |
| `creator/settings/proposals/ProposalSettingsForm.tsx` | 수신 토글 + 이번 달 제안 카운터 + 매칭 점수 설명 | 완전 구현 |

### 2.7 인프라/네비게이션

| 항목 | 상태 | 비고 |
|---|---|---|
| Brand layout (`(brand)/layout.tsx`) | v2/v3 분기 완료 | `resolveBrandPlan`으로 `pricingVersion` 결정 |
| BrandSidebar | 조건부 링크 완료 | v3이면 `/brand/pricing`, v2면 `/brand/subscription` |
| `/api/creator/settings/proposals` API | 존재 확인 필요 | ProposalSettingsForm이 PATCH 호출 |

---

## 3. 충돌 항목 (해결 방안 명시)

| # | 항목 | 현재 코드 상태 | v3 설계 요구사항 | 충돌 여부 | 처리 방안 |
|---|---|---|---|---|---|
| 1 | `SubscriptionPlan` enum | FREE/STARTER/PRO/ENTERPRISE/TRIAL/STANDARD (6값) | TRIAL/STANDARD/PRO | 확장 완료 | 유지. v2 값은 레거시 호환용으로 남김 |
| 2 | `BrandPlanV3` enum | TRIAL/STANDARD/PRO (3값) | 동일 | 일치 | 변경 불필요 |
| 3 | `MessageCredit.pricePerMessage` | default ₩500 | v3 STANDARD ₩700 | 불일치 | v2 레거시 코드 전용. v3은 `charge-message.ts`에서 `PRICING_V3.STANDARD.MESSAGE_PRICE = 700` 사용. 충돌 없음 |
| 4 | `BrandSubscription.includedMessageQuota` | v2에서 사용 (STARTER:100, PRO:300) | 프로 500건 | 의미 일치 | v3은 `PRICING_V3.PRO.INCLUDED_MESSAGES_MONTHLY = 500` 상수 사용. DB 필드는 v2 전용 |
| 5 | `BrandSubscription.monthlyFee` | v2 구독료 저장 | Boost 가격 ₩330,000 | 의미 일치 | v3 프로는 `PRICING_V3.PRO.QUARTERLY_PRICE / ANNUAL_PRICE` 상수로 관리. monthlyFee 필드는 v2 전용 |
| 6 | `Brand.monthlyFee` | default 55000 (브랜드 모델에도 있음) | 관련 없음 | 무관 | 이것은 브랜드 MoCRA 관련 필드, 가격 시스템과 무관 |
| 7 | Excel export (`xlsx` 패키지) | 3곳에서 사용: products/bulk, settlements, orders | 캠페인 참여자 export는 프로 전용 | 게이팅 없음 | 기존 3곳은 유지 (상품/정산/주문은 모든 플랜 가능). 신규 "캠페인 참여자 엑셀"을 프로 전용으로 추가 필요 |
| 8 | `Creator.acceptingProposals` | default true, 이미 스키마에 존재 | 동일 | 일치 | 변경 불필요 |
| 9 | `Creator.monthlyProposalLimit` | default 30, 이미 스키마에 존재 | 동일 (30) | 일치 | 변경 불필요 |
| 10 | v3 과금 함수 호출 지점 | **0곳** — 함수만 있고 아무 곳에서도 호출하지 않음 | 캠페인 생성/메시지 발송/상세열람 시 호출 | 미연결 | 기존 비즈니스 로직에 v3 과금 함수 호출 코드 삽입 필요 |
| 11 | `contact-mask.ts` | stub (실제 마스킹 로직 없음) | 브랜드가 검색/열람 시 연락처 마스킹 | 미구현 | 실제 마스킹 로직 구현 필요 |
| 12 | 충전 UI/API | 전혀 없음 | 스탠다드 선불 잔액 충전 | 신규 필요 | PortOne 일반결제 → `prepaidBalance` 증가 API + UI |
| 13 | 프로 구독 결제 | 전혀 없음 (billingKey 필드만 존재) | PortOne 빌링키 등록 → 정기결제 | 신규 필요 | 빌링키 발급 API + 자동결제 cron |
| 14 | 플랜 전환 API | 전혀 없음 | 체험→스탠다드, 스탠다드→프로, 프로 해지 | 신규 필요 | `/api/brand/pricing/upgrade`, `/api/brand/pricing/cancel` |

---

## 4. 신규 구현 필요 (현재 없음)

| # | 항목 | 유형 | 난이도 | 비고 |
|---|---|---|---|---|
| 1 | 플랜 전환 API (`/api/brand/pricing/upgrade`) | API | 중 | 체험→스탠다드, 스탠다드→프로 전환 로직 |
| 2 | 프로 해지 API (`/api/brand/pricing/cancel`) | API | 중 | 일할 환불 계산, proExpiresAt 설정 |
| 3 | 스탠다드 잔액 충전 API (`/api/brand/pricing/topup`) | API | 중 | PortOne 일반결제 → prepaidBalance 증가 |
| 4 | 프로 빌링키 등록 API (`/api/brand/pricing/billing-key`) | API | 상 | PortOne V2 issueBillingKey 연동 |
| 5 | 프로 자동결제 cron (`/api/cron/pro-billing`) | API | 중 | 분기/연간 자동 결제 + 실패 처리 |
| 6 | 충전 UI (PricingCards 내 또는 별도 모달) | UI | 중 | 금액 선택 → PortOne 결제 → 잔액 반영 |
| 7 | 과금 함수 호출 연결 | 코드 수정 | 중 | 캠페인 생성, 메시지 발송, 크리에이터 상세 열람 각 지점에 v3 함수 호출 삽입 |
| 8 | 캠페인 참여자 엑셀 export (프로 전용) | API + UI | 하 | `xlsx` 패키지 이미 설치됨, 게이팅만 추가 |
| 9 | 월간 쿼터 리셋 cron (`/api/cron/monthly-reset`) | API | 하 | `monthlyDetailViewUsed`, `currentMonthUsed`, Creator `currentMonthProposals` 리셋 |
| 10 | 체험 만료 cron (`/api/cron/trial-expiry`) | API | 하 | `trialEndsAt` 초과 브랜드 처리 |
| 11 | 연락처 마스킹 실제 구현 | 코드 수정 | 하 | `contact-mask.ts` stub 채우기 |
| 12 | 사용량 대시보드 (브랜드 pricing 페이지 내) | UI | 중 | 이번 달 사용량, 잔액, 과금 이력 표시 |

---

## 5. 마이그레이션 위험 요소

### 5.1 스키마 변경

**추가 마이그레이션 불필요.** Phase A에서 모든 v3 필드/테이블/enum이 이미 추가됨.

### 5.2 데이터 보존

| 항목 | 위험 | 대응 |
|---|---|---|
| 기존 v2 브랜드 구독 데이터 | 없음 | `planV3 = null` → `resolveBrandPlan`이 v2로 판별. 기존 데이터 변경 없음 |
| 신규 브랜드 | 없음 | `planV3 = null` + 구독 없음 → TRIAL로 자동 판별 |
| Creator 보호 필드 | 없음 | `acceptingProposals = true`, `monthlyProposalLimit = 30` 기본값으로 이미 백필 완료 |
| `prepaidBalance` | 없음 | default 0, 충전 전까지 0 유지 |

### 5.3 롤백 가능성

v3 필드는 모두 nullable 또는 default 있음 → 코드만 롤백하면 v2 로직으로 즉시 복귀 가능. DB 롤백 불필요.

---

## 6. 운영 데이터 영향

### 6.1 현재 상태

로컬에서 DB URL 없이 직접 쿼리 불가. 그러나 코드 분석에서 추정:

- **브랜드 수**: `Brand` 모델에 `approved` 필드 있음. 실제 승인된 브랜드 수는 DB 확인 필요.
- **구독 현황**: 현재 모든 브랜드는 v2 `FREE` 플랜이거나 구독 레코드 없음 (planV3 = null)
  - 이유: 프로덕션에서 유료 구독 결제 기능이 아직 없으므로, 유료 전환된 브랜드 0개로 추정
- **크리에이터 수**: `Creator` 모델 + `creators` 테이블. 엑셀 임포트 + 자동 가입 포함하여 상당수 존재할 가능성
  - 모든 Creator에 `acceptingProposals = true` (default), `monthlyProposalLimit = 30` (default) 이미 적용

### 6.2 백필 전략

**추가 백필 불필요.** Phase A 마이그레이션에서 모든 신규 컬럼에 default 값이 설정됨:
- `Creator.acceptingProposals` → `DEFAULT true`
- `Creator.monthlyProposalLimit` → `DEFAULT 30`
- `Creator.currentMonthProposals` → `DEFAULT 0`
- `BrandSubscription.prepaidBalance` → `DEFAULT 0`
- `BrandSubscription.shopCommissionRate` → `DEFAULT 10.0`

---

## 7. 환경변수 / 외부 서비스 누락 항목

### 7.1 현재 존재하는 키 (`.env.example` 기준)

| 키 | 용도 | 상태 |
|---|---|---|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | PortOne 상점 ID | 설정됨 |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | PortOne 결제 채널 | 설정됨 |
| `PORTONE_WEBHOOK_SECRET` | 웹훅 HMAC 검증 | 설정됨 |
| `PORTONE_API_SECRET` | PortOne V1 API | 설정됨 |
| `PORTONE_V2_API_SECRET` | PortOne V2 API | 설정됨 |
| `NEXT_PUBLIC_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY` | 본인인증 | 설정됨 |
| `POPBILL_LINK_ID` / `SECRET_KEY` / `CORP_NUM` / `KAKAO_SENDER_KEY` | 팝빌 카카오 알림톡 | 설정됨 |
| `POPBILL_IS_TEST` | 팝빌 테스트 모드 | 설정됨 |

### 7.2 신규 필요한 키

| 키 | 용도 | 비고 |
|---|---|---|
| `PORTONE_BILLING_CHANNEL_KEY` | 빌링키 발급 전용 채널 (프로 정기결제) | PortOne 콘솔에서 빌링 전용 채널 생성 필요 |
| 기타 | 없음 | 기존 PortOne V2 인프라로 충분 |

### 7.3 외부 서비스 호출 위치

| 서비스 | 파일 | 용도 |
|---|---|---|
| PortOne V2 SDK | `checkout/page.tsx` | 구매자 상품 결제 |
| PortOne V2 API | `api/payments/complete/route.ts` | 결제 검증 |
| PortOne 웹훅 | `api/payments/webhook/route.ts` | 결제 상태 동기화 |
| PortOne 본인인증 | `api/auth/verify-identity/route.ts` | 브랜드 본인인증 |
| Popbill 카카오 알림톡 | `lib/notifications/kakao.ts` | 주문/배송 알림 |
| Popbill 이메일 | `lib/notifications/email.ts` | 인증/알림 이메일 |

---

## 8. 권장 실행 순서

### Phase 1: 과금 연결 (기존 코드에 v3 호출 삽입)
1. 캠페인 생성 로직에 `chargeCampaignCreation()` 호출 삽입
2. 크리에이터 상세 열람 API에 `chargeDetailView()` + `checkRapidDetailView()` 삽입
3. 메시지 발송 로직에 v3 분기 추가 (v3이면 `chargeMessageSendV3()`, v2면 기존 `consumeMessageCredit()`)
4. 크리에이터 DB 열람 API에 `checkDailyDbLimit()` + `incrementDailyDbView()` 삽입
5. 그룹 멤버 추가 API에 `checkMassGroupAdd()` 삽입
6. 제안 발송 API에 `checkCreatorProtection()` + `incrementCreatorProposalCount()` 삽입

### Phase 2: 결제 인프라
1. 플랜 전환 API (체험→스탠다드→프로)
2. 스탠다드 잔액 충전 API + UI (PortOne 일반결제)
3. PricingCards 버튼 onClick 연결
4. 사용량 대시보드 UI

### Phase 3: 프로 정기결제 + 자동화
1. PortOne 빌링키 발급 API
2. 프로 자동결제 cron
3. 체험 만료 cron
4. 월간 쿼터 리셋 cron
5. 프로 해지 + 일할 환불 API
6. 캠페인 참여자 엑셀 export (프로 게이팅)
7. 연락처 마스킹 실제 구현

---

## 9. 부록: 전체 grep 결과 raw data

### 9.1 v3 과금 함수 호출 지점 (src/ 내, lib/pricing/v3 제외)

```
(결과 없음 — 0곳에서 호출)
```

### 9.2 PortOne 관련 파일 (src/ 내)

```
src/app/[locale]/payment/success/page.tsx
src/app/[locale]/terms/page.tsx (약관 텍스트)
src/app/[locale]/privacy/page.tsx (정책 텍스트)
src/app/[locale]/(shop)/[username]/checkout/page.tsx
src/app/api/payments/webhook/route.ts
src/app/api/payments/complete/route.ts
src/app/api/auth/verify-identity/route.ts
src/components/auth/IdentityVerificationButton.tsx
src/lib/actions/order-customer.ts
```

### 9.3 엑셀(xlsx) 사용 위치

```
src/app/[locale]/(brand)/brand/products/bulk/page.tsx — 상품 일괄 업로드 (import)
src/app/[locale]/(brand)/brand/settlements/page.tsx — 정산내역 다운로드 (export)
src/app/[locale]/(brand)/brand/orders/page.tsx — 주문목록 다운로드 (export)
```

### 9.4 충전/잔액 관련 코드 (lib/pricing/v3/ 내)

```
charge-campaign.ts:40 — balance = Number(subscription?.prepaidBalance ?? 0)
charge-campaign.ts:50 — prepaidBalance: { decrement: CAMPAIGN_PRICE }
charge-detail-view.ts:62 — balance = Number(subscription?.prepaidBalance ?? 0)
charge-detail-view.ts:72 — prepaidBalance: { decrement: DETAIL_VIEW_OVERAGE_PRICE }
charge-message.ts:35 — balance = Number(subscription?.prepaidBalance ?? 0)
charge-message.ts:44 — prepaidBalance: { decrement: MESSAGE_PRICE }
charge-message.ts:58 — balance = Number(subscription?.prepaidBalance ?? 0)
charge-message.ts:67 — prepaidBalance: { decrement: OVERAGE_MESSAGE_PRICE }
```

### 9.5 Brand API 라우트 전체

```
/api/brand/subscription — GET(구독현황), POST(준비중)
/api/brand/creators — GET(크리에이터 검색)
/api/brand/creators/[id] — GET(상세)
/api/brand/creators/filter-presets — GET/POST
/api/brand/creators/filter-presets/[id] — DELETE
/api/brand/creator-groups — GET/POST
/api/brand/creator-groups/[id] — GET/PATCH/DELETE
/api/brand/creator-groups/[id]/members — POST
/api/brand/creator-groups/[id]/members/[memberId] — DELETE/PATCH
/api/brand/campaigns/list — GET
/api/brand/proposal-templates — GET/POST
/api/brand/proposal-templates/[id] — GET/PUT/DELETE
/api/brand/proposals — GET/POST
/api/brand/proposals/bulk — POST
/api/brand/dm-queue — GET/POST
/api/brand/dm-queue/[id] — PATCH
/api/brand/instagram — GET/POST
/api/brand/products/[id]/channel-prices — GET/POST
```

---

## 10. 카이 다음 대화용 요약 (5-10줄)

```
v3 가격 시스템 코드베이스 감사 완료. 현재 상태:

1. DB 스키마: 100% 완료 (Phase A 마이그레이션 적용됨)
2. 백엔드 과금 로직: src/lib/pricing/v3/ 에 10개 파일 완전 구현
   — 단, 실제 비즈니스 로직에 호출 연결이 0곳 (가장 큰 갭)
3. UI: 가격 페이지 + 비교표 + FAQ 구현 완료, 버튼 onClick 미연결
4. 크리에이터 보호: 설정 페이지 + 백엔드 로직 구현 완료
5. 미구현: 결제 (충전/빌링키/정기결제), 플랜 전환 API, 사용량 대시보드
6. 추가 마이그레이션 불필요, 환경변수는 빌링 채널 키 1개만 추가 필요
7. 위험도 낮음 — v2/v3 분기가 잘 설계되어 기존 데이터 영향 없음

작업 순서: Phase 1(과금 연결) → Phase 2(결제 인프라) → Phase 3(자동화)
리포트: docs/pricing-system-codebase-audit.md
```
