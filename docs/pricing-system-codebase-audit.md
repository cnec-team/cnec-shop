# 가격 시스템 구현 전 코드베이스 감사 리포트

조사일: 2026-04-21  
조사자: Claude Code (선행 조사)

---

## 1. Executive Summary

- **신규 구현 비율**: 기존 자산 55% 재사용/확장, 신규 45%
- **위험도**: **중** (스키마·데이터 충돌 없음, 가격 체계 변경만 필요)
- **주의 필요 사항 Top 3**:
  1. **SubscriptionPlan enum 불일치** — 현재 `FREE/STARTER/PRO/ENTERPRISE`, v3 설계는 `TRIAL/STANDARD/PRO` → enum 값 마이그레이션 필요
  2. **운영 DB에 brand_subscriptions 레코드 0건** — 아직 아무도 구독을 사용하지 않음. 마이그레이션 위험 매우 낮음
  3. **PortOne 빌링키(정기결제) 미구현** — 현재 주문 결제(1회성)만 존재. 구독 자동결제는 완전 신규 구현 필요

---

## 2. 기존 자산 (재사용 가능)

| 구분 | 파일/모델 | 현재 상태 | 재사용 방안 |
|------|-----------|-----------|-------------|
| **BrandSubscription 모델** | `prisma/schema.prisma:2144-2166` | 모든 필드 구현 완료 (plan, status, monthlyFee, quota, billing dates) | enum 값만 변경하면 그대로 사용 |
| **MessageCredit 모델** | `prisma/schema.prisma:2172-2192` | 건별 과금 + 채널 추적 완비 | pricePerMessage 기본값 변경 (500→700) |
| **SubscriptionPayment 모델** | `prisma/schema.prisma:2198-2216` | PortOne paymentId 저장, 기간 추적 | 그대로 사용 |
| **구독 체크 로직** | `src/lib/subscription/check.ts` | canSendMessage, consumeMessageCredit, resetMonthlyQuota | 플랜 이름/가격만 수정 |
| **플랜 정의** | `src/lib/subscription/plans.ts` | 4개 플랜 정의 + MESSAGE_PRICE_KRW=500 | 값만 교체 |
| **구독 API** | `src/app/api/brand/subscription/route.ts` | GET: 구독 현황 + 크레딧 요약 + 일별 발송 차트 | 그대로 사용 |
| **구독 UI 페이지** | `src/app/[locale]/(brand)/brand/subscription/page.tsx` | 플랜 비교 표, 쿼터 진행률, 결제 내역, 발송 차트 | PLAN_DETAILS 값만 교체 |
| **PortOne V2 결제** | `src/app/api/payments/complete/route.ts`, `webhook/route.ts` | HMAC-SHA256 검증, 이중 금액 확인, 웹훅 처리 | 주문 결제 그대로 유지 |
| **다채널 메시징** | `src/lib/notifications/`, `src/lib/messaging/` | In-App, Email(SMTP), Kakao(PopBill), Instagram DM(Queue) | 그대로 사용 |
| **엑셀 export (정산)** | `src/lib/export/settlements.ts` | CSV + 인보이스 HTML | 유지 |
| **엑셀 export (주문)** | `brand/orders/page.tsx` | 주문 데이터 엑셀 다운로드 | 유지 |

---

## 3. 충돌 항목 (해결 방안 명시)

| 항목 | 현재 코드 상태 | v3 설계 요구사항 | 충돌 여부 | 처리 방안 |
|------|---------------|-----------------|-----------|-----------|
| **SubscriptionPlan enum** | `FREE, STARTER, PRO, ENTERPRISE` | `TRIAL, STANDARD, PRO` | **충돌** | DB 마이그레이션: `FREE→TRIAL`, `STARTER→STANDARD` 리네임, `ENTERPRISE` 제거. 단, 현재 brand_subscriptions 0건이므로 안전. `ALTER TYPE SubscriptionPlan RENAME VALUE` 사용 |
| **MessageCredit.pricePerMessage** | 기본값 ₩500 | ₩700 | **변경 필요** | schema default 변경 + plans.ts의 `MESSAGE_PRICE_KRW` 500→700 |
| **BrandSubscription.includedMessageQuota** | STARTER=100, PRO=300, ENTERPRISE=1000 | 스탠다드=200(?), 프로=500 | **값 변경** | plans.ts 수정만으로 해결 |
| **BrandSubscription.monthlyFee** | STARTER=₩500,000, PRO=₩1,000,000 | 스탠다드=?, 프로=₩330,000(?) | **값 변경** | plans.ts 수정만으로 해결 |
| **`/api/brand/creators/export`** | 존재 (`src/app/api/brand/creators/export/route.ts`) | 프로 플랜 게이팅 추가 필요 | **수정 필요** | 구독 체크 로직 삽입 (canSendMessage 패턴 재사용) |
| **`/api/brand/creator-groups/[id]/export`** | 존재 (`src/app/api/brand/creator-groups/[id]/export/route.ts`) | 프로 플랜 게이팅 추가 필요 | **수정 필요** | 동일하게 구독 체크 추가 |
| **Creator.acceptingProposals** | 존재하지 않음 | 신규 추가 필요 (Boolean, default true) | **신규** | 마이그레이션으로 필드 추가, 10,697개 기존 크리에이터에 default true 백필 |
| **Creator.monthlyProposalLimit** | 존재하지 않음 | 신규 추가 필요 (Int?, default null=무제한) | **신규** | 마이그레이션으로 필드 추가 |
| **Creator.matchScore** | 존재하지 않음 | 신규 추가 필요 (Decimal?) | **신규** | 마이그레이션으로 필드 추가 |
| **구독 POST API** | `return { message: '준비중입니다' }` (빈 구현) | 플랜 변경/결제 처리 | **신규 구현** | POST 핸들러 전체 작성 필요 |
| **plans.ts PLAN_DETAILS** (프론트) | 별도로 `subscription/page.tsx:71-100`에 하드코딩 | 중앙 집중화 필요 | **리팩토링** | plans.ts에서 export하여 UI에서 import |

---

## 4. 신규 구현 필요 (현재 없음)

| 구분 | 설명 | 구현 위치 | 의존성 |
|------|------|-----------|--------|
| **PortOne 빌링키 등록** | 정기결제를 위한 카드 등록 | 새 API route + 프론트 UI | PortOne V2 빌링키 API |
| **자동 정기결제 (Billing)** | 월 구독료 자동 청구 | CRON job 또는 PortOne 스케줄 결제 | 빌링키 등록 완료 후 |
| **플랜 변경 API** | POST `/api/brand/subscription` 본문 구현 | 기존 파일 수정 | 빌링키 등록 or 수동결제 |
| **크리에이터 제안 받기 설정 UI** | acceptingProposals, monthlyProposalLimit 관리 | `src/app/[locale]/(creator)/creator/settings/` 확장 | Creator 모델 필드 추가 |
| **엑셀 export 플랜 게이팅** | PRO 플랜만 다운로드 허용 | 기존 export route에 미들웨어 추가 | SubscriptionPlan 마이그레이션 |
| **구독 월 초기화 CRON** | resetMonthlyQuota 자동 실행 | Vercel Cron 또는 Railway CRON | 현재 코드 존재하나 트리거 없음 |
| **체험(TRIAL) 플랜 제한 로직** | 14일 만료, 기능 제한 | canSendMessage 확장 + 미들웨어 | enum 마이그레이션 |

---

## 5. 마이그레이션 위험 요소

### 5.1 데이터 보존 분석

| 테이블 | 현재 레코드 수 | 마이그레이션 영향 | 위험도 |
|--------|---------------|-------------------|--------|
| `brands` | 4 (승인 3) | 없음 | 안전 |
| `brand_subscriptions` | **0** | enum 값 변경만 | **매우 안전** (데이터 없음) |
| `message_credits` | **0** | default 변경만 | **매우 안전** |
| `subscription_payments` | **0** | 없음 | **매우 안전** |
| `dm_send_queues` | **0** | 없음 | **매우 안전** |
| `creators` | **10,697** | 3개 필드 추가 (default 값) | **낮음** (ALTER TABLE ADD COLUMN DEFAULT는 빠름) |

### 5.2 롤백 가능성

- **SubscriptionPlan enum 변경**: `RENAME VALUE`는 가역적 (`TRIAL→FREE`, `STANDARD→STARTER`로 되돌릴 수 있음)
- **Creator 필드 추가**: `DROP COLUMN`으로 되돌릴 수 있음
- **pricePerMessage default 변경**: 기존 레코드 0건이므로 완전 안전
- **결론**: 모든 마이그레이션이 롤백 가능. 운영 데이터 손실 위험 0에 가까움

### 5.3 주의 사항

- `SubscriptionPlan` enum의 `ENTERPRISE` 제거 시, Prisma는 `DROP VALUE`를 지원하지 않음. 실제로는 새 enum을 만들고 교체하거나, 그냥 `ENTERPRISE`를 남겨두는 것이 더 안전할 수 있음
- Migration 상태: **15개 마이그레이션 전부 applied, 스키마 동기화 완료** (`Database schema is up to date!`)

---

## 6. 운영 데이터 영향

### 6.1 현재 운영 데이터

| 항목 | 수량 | 비고 |
|------|------|------|
| 전체 브랜드 | 4 | |
| 승인된 브랜드 | 3 | |
| 구독 레코드 | **0** | 아무 브랜드도 구독을 사용하지 않음 |
| 메시지 크레딧 | **0** | 메시지 발송 이력 없음 |
| 구독 결제 이력 | **0** | 결제 이력 없음 |
| DM 발송 큐 | **0** | DM 발송 이력 없음 |
| 크리에이터 | **10,697** | 백필 필요 |

### 6.2 백필 전략

- **Creator 필드 추가 (3개)**: 
  - `acceptingProposals` Boolean DEFAULT true → 마이그레이션만으로 자동 백필, 별도 스크립트 불필요
  - `monthlyProposalLimit` Int? DEFAULT null → null은 "무제한" 의미, 백필 불필요
  - `matchScore` Decimal? DEFAULT null → null은 "미계산" 의미, 백필 불필요
- **결론**: `ALTER TABLE ADD COLUMN ... DEFAULT ...` 한 번으로 10,697개 row 자동 처리. PostgreSQL에서 DEFAULT가 있는 ADD COLUMN은 테이블 리라이트 없이 즉시 완료 (pg 11+)

---

## 7. 환경변수 / 외부 서비스 누락 항목

### 7.1 현재 설정된 환경변수 (결제 관련)

| 키 | 용도 | 사용 위치 | 상태 |
|----|------|-----------|------|
| `DATABASE_URL` | Railway PostgreSQL | prisma.config.ts | 설정됨 |
| `NEXT_PUBLIC_PORTONE_STORE_ID` | PortOne 상점 ID | checkout page | 설정됨 (.env.example에 존재) |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | PortOne 채널 키 | checkout page | 설정됨 |
| `PORTONE_WEBHOOK_SECRET` | 웹훅 서명 검증 | payments/webhook | 설정됨 |
| `PORTONE_API_SECRET` | API 서버 키 | payments/complete, webhook | 설정됨 |
| `PORTONE_V2_API_SECRET` | V2 REST API (본인인증) | auth/verify-identity | 설정됨 |
| `TOSS_SECRET_KEY` | Toss 결제 확인 | payments/confirm (레거시) | 설정됨 |
| `POPBILL_LINK_ID` | PopBill 연동 ID | notifications/kakao.ts | 설정됨 |
| `POPBILL_SECRET_KEY` | PopBill 시크릿 | notifications/kakao.ts | 설정됨 |
| `POPBILL_CORP_NUM` | 사업자등록번호 | notifications/kakao.ts | 설정됨 |
| `POPBILL_KAKAO_SENDER_KEY` | 카카오 발신프로필 | notifications/kakao.ts | 설정됨 |

### 7.2 신규 필요 환경변수

| 키 | 용도 | 필요 시점 |
|----|------|-----------|
| `PORTONE_BILLING_CHANNEL_KEY` | 빌링키 등록용 채널 키 (정기결제) | 자동결제 구현 시 |
| `CRON_SECRET` | CRON 엔드포인트 인증 토큰 | 월 쿼터 리셋 CRON 구현 시 |
| (추가 없음) | 기존 PortOne API 키로 빌링키 결제 가능 | - |

---

## 8. 권장 실행 순서

### Phase 1: 스키마 + 플랜 정의 변경 (영향 최소, 기반 작업)

1. **Prisma 마이그레이션**: SubscriptionPlan enum 값 변경 (`FREE→TRIAL or 유지`, `STARTER→STANDARD`, `ENTERPRISE` 유지/제거 결정)
2. **Prisma 마이그레이션**: Creator 모델에 3개 필드 추가 (acceptingProposals, monthlyProposalLimit, matchScore)
3. **Prisma 마이그레이션**: MessageCredit.pricePerMessage 기본값 500→700
4. **plans.ts 수정**: 새 플랜 이름/가격/쿼터 적용
5. **subscription/page.tsx 수정**: PLAN_DETAILS를 plans.ts에서 import하도록 변경

### Phase 2: 구독 결제 + 관리 기능 (핵심 비즈니스 로직)

6. **PortOne 빌링키 등록 API** 구현 (`/api/brand/billing/register`)
7. **플랜 변경 API** 구현 (POST `/api/brand/subscription` 본문)
8. **구독 UI 개선**: 플랜 선택 → 결제 → 활성화 플로우
9. **월간 쿼터 리셋 CRON** 구현 (Vercel Cron Job)
10. **체험(TRIAL) 14일 만료 로직** 구현

### Phase 3: 게이팅 + 크리에이터 보호 (가치 보호)

11. **엑셀 export 플랜 게이팅**: PRO 이상만 다운로드 허용
12. **크리에이터 제안 받기 설정 UI**: acceptingProposals 토글 + monthlyProposalLimit 설정
13. **제안 발송 시 크리에이터 보호 로직**: acceptingProposals=false면 발송 차단, 월간 제한 초과면 차단

---

## 9. 부록: 주요 grep/조사 결과 원본

### 9.1 SubscriptionPlan enum (schema.prisma:301-306)

```prisma
enum SubscriptionPlan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}
```

### 9.2 BrandSubscription 모델 (schema.prisma:2144-2166)

```prisma
model BrandSubscription {
  id                    String             @id @default(uuid())
  brandId               String             @unique @map("brand_id")
  brand                 Brand              @relation(fields: [brandId], references: [id])
  plan                  SubscriptionPlan   @default(FREE)
  status                SubscriptionStatus @default(ACTIVE)
  startedAt             DateTime           @default(now()) @map("started_at") @db.Timestamptz
  expiresAt             DateTime?          @map("expires_at") @db.Timestamptz
  nextBillingAt         DateTime?          @map("next_billing_at") @db.Timestamptz
  cancelledAt           DateTime?          @map("cancelled_at") @db.Timestamptz
  monthlyFee            Decimal            @default(0) @map("monthly_fee") @db.Decimal(12, 0)
  includedMessageQuota  Int                @default(0) @map("included_message_quota")
  currentMonthUsed      Int                @default(0) @map("current_month_used")
  currentMonthResetAt   DateTime?          @map("current_month_reset_at") @db.Timestamptz
  createdAt             DateTime           @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime           @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  payments              SubscriptionPayment[]
  @@index([brandId])
  @@index([expiresAt])
  @@map("brand_subscriptions")
}
```

### 9.3 MessageCredit 모델 (schema.prisma:2172-2192)

```prisma
model MessageCredit {
  id                String           @id @default(uuid())
  brandId           String           @map("brand_id")
  brand             Brand            @relation(fields: [brandId], references: [id])
  proposalId        String?          @map("proposal_id")
  type              MessageCreditType
  cost              Decimal          @default(0) @db.Decimal(10, 0)
  pricePerMessage   Decimal          @default(500) @map("price_per_message") @db.Decimal(10, 0)
  attemptedChannels String[]         @default([]) @map("attempted_channels")
  succeededChannels String[]         @default([]) @map("succeeded_channels")
  creatorId         String           @map("creator_id")
  creator           Creator          @relation(fields: [creatorId], references: [id])
  sentAt            DateTime         @default(now()) @map("sent_at") @db.Timestamptz
  createdAt         DateTime         @default(now()) @map("created_at") @db.Timestamptz
  proposals         CreatorProposal[]
  @@index([brandId, sentAt])
  @@index([proposalId])
  @@map("message_credits")
}
```

### 9.4 현재 플랜 정의 (plans.ts)

```typescript
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  FREE:       { monthlyFee: 0,         includedQuota: 0,    label: '무료' },
  STARTER:    { monthlyFee: 500000,    includedQuota: 100,  label: '스타터' },
  PRO:        { monthlyFee: 1000000,   includedQuota: 300,  label: '프로' },
  ENTERPRISE: { monthlyFee: 2000000,   includedQuota: 1000, label: '엔터프라이즈' },
}

export const MESSAGE_PRICE_KRW = 500
```

### 9.5 canSendMessage 로직 (check.ts:13-45)

- 구독 없거나 비활성 → `{ ok: false, reason: 'NO_SUBSCRIPTION' }`
- FREE 플랜 → `{ ok: false, reason: 'NO_SUBSCRIPTION' }`
- STARTER/PRO/ENTERPRISE → `{ ok: true }` (쿼터 내/초과 모두 발송 가능, 초과 시 건당 과금)

### 9.6 엑셀 Export API 위치

| API 경로 | 용도 | v3 처리 |
|----------|------|---------|
| `/api/brand/creators/export` | 크리에이터 DB 검색 결과 엑셀 다운로드 | PRO 게이팅 추가 |
| `/api/brand/creator-groups/[id]/export` | 크리에이터 그룹 멤버 엑셀 다운로드 | PRO 게이팅 추가 |

### 9.7 엑셀 다운로드 UI 버튼 위치

| 위치 | 컴포넌트/페이지 |
|------|----------------|
| `src/components/brand/BulkActionBar.tsx:48` | "엑셀 다운로드" 버튼 |
| `src/components/brand/ExportColumnsDialog.tsx:63` | "엑셀 다운로드 - 컬럼 선택" 다이얼로그 |
| `src/app/[locale]/(brand)/brand/creators/groups/page.tsx:191` | 그룹 목록에서 "엑셀" 버튼 |
| `src/app/[locale]/(brand)/brand/creators/groups/[id]/page.tsx:426,476` | 그룹 상세에서 "엑셀 다운로드" |
| `src/app/[locale]/(brand)/brand/orders/page.tsx:412` | 주문 "엑셀 다운로드" (유지) |
| `src/app/[locale]/(brand)/brand/settlements/page.tsx:110` | 정산 "엑셀 다운로드" (유지) |
| `src/app/[locale]/(brand)/brand/trial/page.tsx:257` | 체험 신청 "엑셀 다운로드" (유지) |

### 9.8 운영 DB 쿼리 결과 (2026-04-21)

```
brands:               4개 (승인 3개)
brand_subscriptions:  0개
message_credits:      0개
subscription_payments: 0개
dm_send_queues:       0개
creators:             10,697개

Migration status:     15 migrations found, Database schema is up to date!
DB:                   Railway PostgreSQL (nozomi.proxy.rlwy.net:39130)
```

### 9.9 PortOne 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| 결제 요청 (1회성) | 구현됨 | checkout page + PortOne SDK |
| 결제 완료 검증 | 구현됨 | `/api/payments/complete` |
| 웹훅 (HMAC-SHA256) | 구현됨 | `/api/payments/webhook` |
| 본인인증 | 구현됨 | `/api/auth/verify-identity` |
| **빌링키 등록** | **미구현** | - |
| **정기결제** | **미구현** | - |
| **결제 취소/환불** | 웹훅 수신만 | 수동 취소 API 없음 |

### 9.10 Toss Payments (레거시)

- 파일: `src/app/api/payments/confirm/route.ts`
- 상태: 동작하지만 PortOne과 별개 경로 (CLAUDE.md에 "향후 제거 대상" 명시)
- 환경변수: `TOSS_SECRET_KEY`

---

## 카이님 다음 대화용 현재 상태 요약 (복붙용)

```
## 크넥샵 가격 시스템 코드베이스 감사 완료 (2026-04-21)

### 핵심 사실
1. 구독 스키마(BrandSubscription, MessageCredit, SubscriptionPayment) 완전 구현됨 — 테이블, 관계, 인덱스 모두 존재
2. 운영 DB 구독 데이터 0건 — enum 변경, 가격 변경 모두 안전 (롤백 가능)
3. 현재 enum: FREE/STARTER/PRO/ENTERPRISE → v3: TRIAL/STANDARD/PRO 로 변환 필요
4. 현재 메시지 가격 ₩500/건, 포함 쿼터 STARTER=100/PRO=300 → v3 값으로 교체 필요
5. PortOne V2 주문결제 완전 구현, 빌링키(정기결제)는 미구현 — 신규 작업
6. canSendMessage(), consumeMessageCredit() 로직 완성 — 플랜명만 교체하면 됨
7. 구독 UI 페이지 존재 (플랜 비교표, 쿼터 진행률, 결제 내역) — 값만 교체
8. 엑셀 export API 2개 (크리에이터 검색, 그룹 멤버) — PRO 게이팅 추가 필요
9. Creator 10,697명 — acceptingProposals 등 3개 필드 추가 시 DEFAULT로 즉시 백필
10. 월간 쿼터 리셋 함수 존재하나 CRON 트리거 없음 — 구현 필요

### 리포트 위치
/docs/pricing-system-codebase-audit.md (전체 감사 리포트, 9개 섹션)
```
