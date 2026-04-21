# 가격 시스템 구현 전 코드베이스 감사 리포트

조사일: 2026-04-21  
조사자: Claude Code (선행 조사)

---

## 1. Executive Summary

- **신규 구현 비율**: 약 35% 신규 / 40% 확장(수정) / 25% 재사용
- **위험도**: **중** (enum 값 변경 + 단가 변경이 핵심 위험)
- **주의 필요 사항 Top 3**:
  1. `SubscriptionPlan` enum이 이미 `FREE | STARTER | PRO | ENTERPRISE` 4개 값으로 존재 → v3 설계의 `TRIAL | STANDARD | PRO`와 **완전히 다름**. enum 값 변경 시 운영 DB 마이그레이션 필수.
  2. `MessageCredit.pricePerMessage` 기본값이 **₩500** (plans.ts의 `MESSAGE_PRICE_KRW = 500`) → v3 설계는 **₩700**. 기존 결제 이력과의 정합성 보존 필요.
  3. 구독 관리 UI(`/brand/subscription/`)와 API(`/api/brand/subscription`)가 **이미 풀스택 구현**됨 → 재구현이 아니라 확장/수정해야 함.

---

## 2. 기존 자산 (재사용 가능)

| 자산 | 위치 | 설명 | 재사용 방안 |
|---|---|---|---|
| BrandSubscription 모델 | `prisma/schema.prisma` | plan, monthlyFee, includedMessageQuota, currentMonthUsed 등 완비 | 필드 의미 재정의 + enum 변경으로 활용 |
| MessageCredit 모델 | `prisma/schema.prisma` | 건별 과금 추적 (type, cost, pricePerMessage, channels) | pricePerMessage default 변경만 필요 |
| SubscriptionPayment 모델 | `prisma/schema.prisma` | 결제 이력 (amount, plan, portOnePaymentId, period) | 그대로 재사용 |
| 구독 관리 페이지 | `src/app/[locale]/(brand)/brand/subscription/page.tsx` (451줄) | 현재 플랜, 쿼터 사용량, 일별 차트, 결제 이력 테이블 | UI 수정하여 재사용 |
| 구독 API | `src/app/api/brand/subscription/route.ts` (136줄) | GET: 구독 상태+요약+결제이력, POST: placeholder | GET 확장, POST 실제 구현 |
| canSendMessage() | `src/lib/subscription/check.ts` | 플랜별 발송 가능 여부 + 쿼터 체크 | 분기 로직 수정 |
| consumeMessageCredit() | `src/lib/subscription/check.ts` | 건별 과금 트랜잭션 (쿼터 내 무료 / 초과 유료) | MESSAGE_PRICE_KRW 변경 |
| SUBSCRIPTION_PLANS 상수 | `src/lib/subscription/plans.ts` | 플랜별 요금/쿼터 정의 | 값 전면 수정 |
| 브랜드 사이드바 | `src/components/layout/brand-sidebar.tsx` | "구독" 섹션 이미 존재 (line 110-114) | 메뉴 항목 추가만 |
| ExportColumnsDialog | `src/components/brand/ExportColumnsDialog.tsx` | 엑셀 컬럼 선택 다이얼로그 | v3에서 프로 플랜 게이팅 추가 |
| PortOne V2 결제 | `src/app/api/payments/` (prepare, complete, webhook) | 상품 결제 파이프라인 완비 | 구독 결제에 별도 flow 구축 시 참고 |
| DmSendQueue 시스템 | `prisma/schema.prisma` + `src/app/api/brand/dm-queue/` | 인스타 DM 발송 큐/로그 | Phase 2 그대로 활용 |
| CreatorProposal 멀티채널 | `prisma/schema.prisma` | inApp/email/kakao/dm 채널별 상태 추적 | 그대로 활용 |

---

## 3. 충돌 항목 (해결 방안 명시)

| 항목 | 현재 코드 상태 | v3 설계 요구사항 | 충돌 여부 | 처리 방안 |
|---|---|---|---|---|
| **SubscriptionPlan enum** | `FREE \| STARTER \| PRO \| ENTERPRISE` (4개) | `TRIAL \| STANDARD \| PRO` (3개) | **충돌** | DB migration으로 enum 변경. `FREE→TRIAL`, `STARTER→STANDARD` 매핑. `ENTERPRISE` 제거 또는 유지(legacy). PRO는 그대로. |
| **MESSAGE_PRICE_KRW** | `500` (plans.ts:16) | `700` | **충돌** | plans.ts 상수 변경. 기존 MessageCredit 레코드의 pricePerMessage=500은 **과거 단가로 보존** (변경 불가). 신규 건만 700 적용. |
| **MessageCredit.pricePerMessage default** | schema default `500` | `700` | **충돌** | schema default 변경 + migration. 기존 데이터 불변. |
| **SUBSCRIPTION_PLANS 상수** | FREE(0원/0건), STARTER(50만/100건), PRO(100만/300건), ENTERPRISE(200만/1000건) | TRIAL(0원/0건), STANDARD(?원/?건), PRO(33만/500건) | **충돌** | plans.ts 전면 수정. 기존 UI의 PLAN_DETAILS도 동시 수정 필요. |
| **BrandSubscription.monthlyFee** | Decimal default 0, 현재 STARTER=50만, PRO=100만 등 | PRO=33만 (Boost 가격) | **의미 변경** | 기존 필드 재사용. 값만 변경. 기존 결제 이력(SubscriptionPayment.amount)은 보존. |
| **BrandSubscription.includedMessageQuota** | Int default 0, STARTER=100, PRO=300 | PRO=500 | **값 변경** | 기존 필드 재사용. 플랜 변경 시 값 업데이트. |
| **구독 페이지 PLAN_DETAILS** | 4개 플랜 하드코딩 (page.tsx:71-100) | 3개 플랜 | **충돌** | UI 코드 수정 필요 |
| **`/api/brand/creators/export`** | 존재 (91줄), 전체 크리에이터 엑셀 다운로드 | v3: 삭제 또는 프로 게이팅 | **처리 필요** | UI: CreatorExplorerList.tsx:277 ExportColumnsDialog에서 호출. **삭제 시 UI도 동시 제거 필수.** |
| **`/api/brand/creator-groups/[id]/export`** | 존재 (97줄), 그룹 멤버 엑셀 다운로드 | v3: 삭제 또는 프로 게이팅 | **처리 필요** | UI: groups/page.tsx:187, groups/[id]/page.tsx:291,339,425,475에서 호출. **삭제 시 5곳 UI 동시 제거 필수.** |
| **Creator.acceptingProposals** | 존재하지 않음 | 신규 추가 필요 | **신규** | migration 추가. default true로 백필. |
| **Creator.monthlyProposalLimit** | 존재하지 않음 | 신규 추가 필요 | **신규** | migration 추가. default null (무제한). |
| **Creator.matchScore** | 존재하지 않음 | 신규 추가 필요 | **신규** | migration 추가. default null. |
| **구독 POST API** | `return { message: '준비중입니다' }` (route.ts:134) | 실제 플랜 변경/결제 처리 | **미구현** | POST 핸들러 실제 구현 필요 |

---

## 4. 신규 구현 필요 (현재 없음)

| 항목 | 설명 | 예상 작업량 |
|---|---|---|
| PortOne 빌링키 등록 flow | 구독 정기결제를 위한 빌링키 발급 API/UI | 중 |
| 구독 플랜 변경 API | POST `/api/brand/subscription` 실제 구현 (업그레이드/다운그레이드/취소) | 중 |
| 구독 자동결제 cron | 매월 nextBillingAt 도래 시 자동 결제 처리 | 중 |
| 쿼터 자동 리셋 cron | 매월 currentMonthUsed 초기화 (resetMonthlyQuota 함수는 존재) | 소 |
| 크리에이터 제안 받기 설정 UI | `/creator/settings/` 내 acceptingProposals, monthlyProposalLimit 설정 | 소 |
| 크리에이터 보호 장치 API | 제안 수락/거절 + 일일/월간 제한 체크 로직 | 소 |
| 플랜별 기능 게이팅 미들웨어 | 엑셀 다운로드, 고급 필터, DM 발송 등 프로 전용 기능 체크 | 중 |
| 가격 정책 랜딩 페이지 | 외부 노출용 가격 비교 페이지 (마케팅) | 소 |

---

## 5. 마이그레이션 위험 요소

### 5.1 SubscriptionPlan enum 변경

**위험도: 상**

현재 enum 값: `FREE, STARTER, PRO, ENTERPRISE`  
목표 enum 값: `TRIAL, STANDARD, PRO`

PostgreSQL에서 enum 값 변경은 다음 순서로 진행해야 안전:
1. 새 값 추가 (`ALTER TYPE "SubscriptionPlan" ADD VALUE 'TRIAL'`, `ADD VALUE 'STANDARD'`)
2. 기존 데이터 UPDATE (`FREE → TRIAL`, `STARTER → STANDARD`)
3. 기존 값 제거 (PostgreSQL에서 enum 값 제거는 불가 → 새 enum 타입 생성 후 교체 필요)

**롤백 가능성**: enum 값 추가는 트랜잭션 외부에서 실행되므로 롤백 불가. 신중하게 진행 필요.

**대안**: `FREE`와 `STARTER`를 제거하지 않고 deprecated로 유지하되, 코드에서만 TRIAL/STANDARD로 표시. 이 방식이 더 안전.

### 5.2 pricePerMessage 변경

**위험도: 중**

기존 MessageCredit 레코드의 `pricePerMessage = 500`은 과거 거래 단가이므로 변경하면 안 됨.
- schema default만 500 → 700으로 변경
- plans.ts의 MESSAGE_PRICE_KRW만 500 → 700으로 변경  
- 기존 데이터 무변경

### 5.3 BrandSubscription 기존 row 업데이트

**위험도: 중**

이미 FREE 플랜으로 BrandSubscription이 생성된 브랜드가 있을 수 있음.
- plan: FREE → TRIAL로 UPDATE 필요
- monthlyFee, includedMessageQuota는 플랜에 따라 재계산

---

## 6. 운영 데이터 영향

### 6.1 운영 DB 쿼리 결과

> ⚠️ `prisma migrate status` 실행 불가 (로컬에 DATABASE_URL이 올바르게 설정되지 않음).
> 운영 DB 직접 쿼리도 로컬 환경에서 접근 불가.

**추정치 (코드 기반)**:
- 마이그레이션 15개 모두 적용 상태로 추정 (최신: `20260421000000_add_identity_verification`)
- 구독 시스템은 `20260417000000` 마이그레이션에서 추가됨 (4일 전)
- 아직 초기 단계이므로 유료 구독 브랜드 수는 매우 적을 것으로 추정

### 6.2 백필 전략

| 대상 | 백필 내용 | 전략 |
|---|---|---|
| BrandSubscription (기존 row) | plan: FREE→TRIAL | `UPDATE brand_subscriptions SET plan = 'TRIAL' WHERE plan = 'FREE'` |
| Creator (전체) | acceptingProposals 추가 | `ALTER ... ADD COLUMN ... DEFAULT true` — 자동 백필 |
| Creator (전체) | monthlyProposalLimit 추가 | `ALTER ... ADD COLUMN ... DEFAULT NULL` — 자동 백필 |
| MessageCredit (기존) | pricePerMessage 500 유지 | 변경 불필요 (새 건만 700) |

---

## 7. 환경변수 / 외부 서비스 누락 항목

### 7.1 현재 존재하는 결제 관련 환경변수

| 변수명 | 용도 | 상태 |
|---|---|---|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | 클라이언트 결제 위젯 | 설정됨 |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | PG 채널 선택 | 설정됨 |
| `PORTONE_WEBHOOK_SECRET` | 웹훅 서명 검증 | 설정됨 |
| `PORTONE_API_SECRET` | 서버 결제 조회/취소 | 설정됨 |
| `PORTONE_V2_API_SECRET` | 본인인증 검증 | 설정됨 |
| `POPBILL_LINK_ID` | 팝빌 링크 | 설정됨 |
| `POPBILL_SECRET_KEY` | 팝빌 시크릿 | 설정됨 |
| `POPBILL_CORP_NUM` | 사업자번호 | 설정됨 |
| `POPBILL_KAKAO_SENDER_KEY` | 카카오 알림톡 | 설정됨 |

### 7.2 구독 결제 구현 시 추가 필요한 환경변수

| 변수명 | 용도 | 비고 |
|---|---|---|
| `PORTONE_BILLING_CHANNEL_KEY` | 빌링키 발급용 PG 채널 (정기결제) | PortOne 콘솔에서 별도 채널 생성 필요 |
| `CRON_SECRET` | cron API 인증 (자동결제/쿼터리셋) | Vercel Cron 설정 시 필요 |

### 7.3 Toss Payments (레거시)

- `TOSS_SECRET_KEY` — `/api/payments/confirm/route.ts`에서 사용 중 (레거시)
- CLAUDE.md에 "미사용, 향후 제거 대상"으로 명시됨
- 구독 시스템과 무관. 정리 시 별도 처리.

---

## 8. 권장 실행 순서

### Phase 1: DB 스키마 + 핵심 로직 (안전한 확장)

1. **SubscriptionPlan enum 확장** — TRIAL, STANDARD 값 추가 (기존 값 유지)
2. **Creator 모델 필드 추가** — acceptingProposals, monthlyProposalLimit, matchScore
3. **plans.ts 수정** — 새로운 플랜 체계 반영 (TRIAL/STANDARD/PRO)
4. **check.ts 수정** — canSendMessage, consumeMessageCredit 로직 업데이트
5. **MESSAGE_PRICE_KRW 변경** — 500 → 700
6. **Migration 실행 + 백필 SQL**

### Phase 2: API + UI 수정

7. **구독 API POST 구현** — 플랜 변경 로직
8. **구독 페이지 UI 수정** — PLAN_DETAILS 3개 플랜으로, 새 가격 반영
9. **엑셀 export 게이팅** — 프로 플랜 체크 추가 (API + UI 버튼 조건부 표시)
10. **크리에이터 설정 UI** — 제안 받기 설정 페이지
11. **브랜드 사이드바 업데이트** — 필요 시 메뉴 항목 추가

### Phase 3: 결제 + 자동화

12. **PortOne 빌링키 등록 flow** — 구독 정기결제
13. **자동결제 cron** — 매월 결제 처리
14. **쿼터 리셋 cron** — 매월 사용량 초기화
15. **가격 정책 랜딩 페이지** — 외부 마케팅용

---

## 9. 부록: 주요 파일 경로 맵

### Prisma / DB
```
prisma/schema.prisma                          — 전체 스키마 (SubscriptionPlan enum L301, BrandSubscription L2144, MessageCredit L2172, SubscriptionPayment L2198)
prisma/migrations/20260417000000_*             — 구독/메시징/DM 시스템 마이그레이션
```

### 구독 비즈니스 로직
```
src/lib/subscription/plans.ts                  — SUBSCRIPTION_PLANS 상수, MESSAGE_PRICE_KRW = 500
src/lib/subscription/check.ts                  — canSendMessage(), consumeMessageCredit(), resetMonthlyQuota()
```

### API 라우트
```
src/app/api/brand/subscription/route.ts        — GET(구독 상태), POST(placeholder)
src/app/api/brand/creators/export/route.ts     — 크리에이터 엑셀 export
src/app/api/brand/creator-groups/[id]/export/route.ts — 그룹 엑셀 export
src/app/api/brand/dm-queue/route.ts            — DM 큐 관리
src/app/api/brand/proposals/route.ts           — 제안 발송 (MessageCredit 연동)
src/app/api/brand/proposals/bulk/route.ts      — 대량 제안 발송
```

### UI 페이지/컴포넌트
```
src/app/[locale]/(brand)/brand/subscription/page.tsx — 구독 관리 페이지 (451줄, 풀 구현)
src/components/brand/ExportColumnsDialog.tsx    — 엑셀 컬럼 선택 다이얼로그
src/components/brand/CreatorExplorerList.tsx    — ExportColumnsDialog 호출 (L277)
src/components/layout/brand-sidebar.tsx         — 브랜드 네비게이션 (구독 섹션 L110-114)
src/app/[locale]/(brand)/brand/creators/groups/page.tsx — 그룹 엑셀 버튼 (L187, L191)
src/app/[locale]/(brand)/brand/creators/groups/[id]/page.tsx — 그룹 상세 엑셀 버튼 (L291, L425, L475)
```

### 엑셀 Export UI 호출 맵 (삭제/수정 시 참조)

| API | 호출 UI 위치 | 라인 |
|---|---|---|
| `/api/brand/creators/export` | `ExportColumnsDialog.tsx` → `CreatorExplorerList.tsx` | L55 → L277 |
| `/api/brand/creator-groups/[id]/export` | `brand/creators/groups/page.tsx` | L187 |
| `/api/brand/creator-groups/[id]/export` | `brand/creators/groups/[id]/page.tsx` | L291, L425, L475 |

---

## 10. 카이님의 Claude.ai 채팅에 붙여넣을 현재 상태 요약

```
[크넥샵 가격 시스템 코드베이스 현재 상태 — 2026-04-21 감사 결과]

1. SubscriptionPlan enum: FREE | STARTER | PRO | ENTERPRISE (4개 값 존재)
   → v3의 TRIAL | STANDARD | PRO와 충돌. enum 확장 후 기존 값 deprecated 방식 권장.

2. 메시지 단가: MESSAGE_PRICE_KRW = 500 (plans.ts), schema default도 500
   → v3의 700으로 변경 필요. 기존 MessageCredit 레코드(500원)는 보존.

3. 기존 플랜 구조: FREE(0원/0건), STARTER(50만/100건), PRO(100만/300건), ENTERPRISE(200만/1000건)
   → plans.ts + subscription page UI 양쪽 하드코딩. 전면 수정 필요.

4. 구독 시스템 이미 구현됨:
   - DB: BrandSubscription, MessageCredit, SubscriptionPayment 모델 완비
   - API: GET /api/brand/subscription 동작 중, POST는 placeholder("준비중입니다")
   - UI: /brand/subscription/ 페이지 451줄 풀 구현 (플랜비교, 차트, 결제이력)
   - 로직: canSendMessage(), consumeMessageCredit() 함수 동작 중

5. 엑셀 Export 2개 API 존재:
   - /api/brand/creators/export — UI 1곳에서 호출 (ExportColumnsDialog)
   - /api/brand/creator-groups/[id]/export — UI 3곳에서 호출 (groups page, group detail)
   삭제 시 UI 5곳 동시 처리 필수.

6. Creator 모델에 acceptingProposals, monthlyProposalLimit, matchScore 필드 없음 → 신규 migration 필요.

7. PortOne V2 빌링키(정기결제) 미구현. 상품 결제만 구현됨.

8. 구독 자동결제 cron, 쿼터 리셋 cron 미구현. resetMonthlyQuota() 함수만 존재.

v4 프롬프트 작성 시: 위 상태를 기반으로 "enum 확장(추가만, 삭제X)" + "기존 UI/API 수정" + "신규 빌링/cron 구현" 3단계로 나누는 것을 권장합니다.
```
