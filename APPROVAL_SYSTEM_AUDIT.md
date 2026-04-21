# 크넥샵 승인 시스템 구현 점검 리포트

- 점검 일시: 2026-04-21
- 환경: macOS (Darwin 25.3.0 arm64, iMac T8103)
- 브랜치: claude/buyer-isolation-100
- 최신 커밋: 7170f35 Merge feat/pricing-v3-phase-b: Phase B - UI + 엑셀 정책
- DB: Railway (nozomi.proxy.rlwy.net)

---

## 항목별 점검 결과

### [항목 1] DB 스키마 — 승인 상태 필드

**실행 커맨드:**
```bash
cat frontend/kviewshop/prisma/schema.prisma
grep -n "status|Status|approval|Approval|approved|pending|PENDING|APPROVED|REJECTED" prisma/schema.prisma
grep -n "enum " prisma/schema.prisma
```

**발견 내용:**

#### Creator 모델 (Lines 526-728, 약 138개 필드)
주요 승인 관련 필드:
- `onboardingCompleted` (Boolean) — default: false
- `onboardingStatus` (String) — default: "PENDING"
- `status` (String) — default: "ACTIVE" (ACTIVE/SUSPENDED)
- `cnecJoinStatus` (CreatorCnecJoinStatus enum) — default: NOT_JOINED
- `cnecVerificationStatus` (String?) — max 20 chars

**승인 전용 필드 없음.** `status`는 ACTIVE/SUSPENDED 토글용이며 가입 승인과 무관.

#### Brand 모델 (Lines 423-520, 57개 필드)
승인 관련 필드:
- **`approved` (Boolean)** — default: false ✅
- **`approvedAt` (DateTime?)** ✅
- `@@index([approved])` — 인덱스 존재

**누락 필드:** `rejectionReason`, `reviewedBy`, `submittedAt` 없음.

#### CreatorApplication 모델 (Lines 1844-1847)
- `status` (String) — default: "pending"
- `reviewedBy` (String?) — 심사한 admin ID
- `reviewedAt` (DateTime?)
- `rejectionReason` (String?)

#### 관련 enum 전체 (55개 중 승인 관련):

| Enum | 값 | 용도 |
|------|-----|------|
| UserStatus | pending, active, suspended | 유저 상태 |
| CampaignParticipationStatus | PENDING, APPROVED, REJECTED | 캠페인 참여 |
| SampleRequestStatus | pending, approved, shipped, received, rejected, cancelled, decided | 체험 신청 |
| CreatorApplicationStatus | pending, approved, rejected | 크리에이터 전환 신청 |
| ProposalStatus | PENDING, ACCEPTED, REJECTED, EXPIRED | 브랜드→크리에이터 제안 |
| CreatorCnecJoinStatus | NOT_JOINED, JOINED, VERIFIED | CNEC 가입 |

**구현 상태:** ⚠️ 부분 구현

**누락 사항:**
- Brand 모델에 `rejectionReason`, `reviewedBy` 없음
- Creator 모델에 가입 승인 필드 자체가 없음 (CreatorApplication 별도 모델로 분리)
- Brand `approved`가 Boolean이라 상태 추적 한계 (enum이 아님)

**예상 보완 작업:** 2~3시간 (Brand에 rejectionReason 추가, Creator 승인 플로우 정의)

---

### [항목 2] 가입 API 엔드포인트

**실행 커맨드:**
```bash
grep -rn "prisma.creator.create|prisma.brand.create|prisma.user.create" frontend/kviewshop/src/ --include="*.ts" --include="*.tsx"
find frontend/kviewshop/src/app -type d -name "signup" -o -name "register"
grep -rn "signup|register" frontend/kviewshop/src/app/api/ --include="route.ts"
```

**발견 내용:**

#### 가입 API 파일:
- `/src/app/api/auth/register/route.ts` — 메인 가입 (brand_admin, creator, buyer)
- `/src/app/api/auth/signup/route.ts` — buyer 전용 대안 엔드포인트
- `/src/lib/auth.ts` — OAuth 소셜 로그인 자동 가입

#### 가입 시 status 초기값:

| 역할 | 생성 코드 | status 초기값 |
|------|-----------|--------------|
| Brand | `prisma.brand.create({ approved: false })` | `approved: false` (boolean) |
| Creator | `prisma.creator.create({ shopId, displayName, ... })` | 승인 필드 없음, `status: "ACTIVE"` (스키마 default) |
| Buyer | `prisma.buyer.create({ nickname, phone })` | 승인 필드 없음 |

#### 역할 분기:
- `register/route.ts`에서 `validatedData.role`로 분기
- Brand: `role === 'brand_admin'` → Brand 레코드 생성
- Creator: `role === 'creator'` → Creator 레코드 생성 + shopId 자동 생성
- Buyer: `role === 'buyer'` → Buyer 레코드 생성

#### NextAuth signIn callback:
- **승인 상태 체크 없음.** 역할만 확인하고 통과.
- OAuth 가입 시 buyer로 자동 생성 (Kakao, Naver, Apple)

**구현 상태:** ⚠️ 부분 구현

**누락 사항:**
- Creator 가입 시 승인 대기 상태 설정 없음 (즉시 ACTIVE)
- signIn callback에서 `user.status === 'pending'` 체크 없음
- Brand는 `approved: false`로 생성되지만 접근 차단 로직 없음

**예상 보완 작업:** 3~4시간

---

### [항목 3] 가입 완료 후 안내 페이지

**실행 커맨드:**
```bash
find frontend/kviewshop/src/app -type d -name "pending" -o -name "waiting" -o -name "review" -o -name "complete"
grep -rn "심사|대기|승인.*대기|pending|review.*progress" frontend/kviewshop/src/app/ --include="*.tsx" | head -50
```

**발견 내용:**

#### 가입 후 리다이렉트 경로:

| 역할 | 리다이렉트 | 내용 |
|------|-----------|------|
| Creator | `/signup/persona` → `/signup/complete` → `/creator/dashboard` | 뷰티 퍼소나 퀴즈 → 완료 → 대시보드 |
| Brand | `/brand/dashboard` 직접 이동 | 대시보드 바로 진입 |
| Buyer | 로그인 후 홈 | 별도 플로우 없음 |

#### "/signup/complete" 페이지:
- "가입 완료!" 텍스트 표시
- 포인트 안내 (3,000P 가입 + 2,000P 퍼소나)
- "내 샵 바로가기" 버튼 → `/creator/dashboard`
- **"심사 중" 안내 UI 없음**

#### "승인 대기" 안내 페이지:
- **존재하지 않음.** Brand/Creator 모두 가입 즉시 대시보드 접근 가능.
- `/brand/creators/pending/` — 브랜드가 캠페인 참여 크리에이터를 승인하는 페이지 (브랜드 자체 승인 대기가 아님)

**구현 상태:** ❌ 미구현

**누락 사항:**
- Brand 가입 후 "승인 대기 중" 안내 페이지 없음
- Creator 가입 후 승인 대기 플로우 자체가 없음
- 재방문 시 상태 표시 로직 없음

**예상 보완 작업:** 4~5시간 (대기 페이지 UI + 리다이렉트 로직)

---

### [항목 4] 어드민 승인 관리 페이지

**실행 커맨드:**
```bash
find frontend/kviewshop/src/app -path "*admin*" -name "page.tsx"
grep -rn "approve|reject|승인|거절" frontend/kviewshop/src/app/ --include="*.tsx" | grep -i "admin" | head -30
```

**발견 내용:**

#### 어드민 라우트 구조:
```
/admin/
├── dashboard/page.tsx    — 대시보드
├── brands/page.tsx       — 브랜드 관리 ✅ 승인/거절/정지 UI 있음
├── creators/page.tsx     — 크리에이터 관리 ⚠️ 활성/정지만 (승인 없음)
├── campaigns/page.tsx    — 캠페인 관리
├── samples/page.tsx      — 체험 신청 관리 (읽기 전용)
├── settlements/page.tsx  — 정산 관리
└── settings/page.tsx     — 설정
```

#### Brand 승인 페이지 (`/admin/brands/page.tsx`): ✅ 존재

| 기능 | 상태 |
|------|------|
| 승인 버튼 (Check 아이콘) | ✅ |
| 거절 버튼 (X 아이콘) | ✅ |
| 정지 버튼 | ✅ |
| 재승인 버튼 | ✅ |
| 상태 배지 (approved/pending/suspended) | ✅ |
| 확인 다이얼로그 | ✅ |
| 상세 Sheet 패널 | ✅ |

상태 판별 로직:
```typescript
if (brand.approved) return 'approved';
if (brand.approvedAt) return 'suspended';  // 한번 승인 후 취소된 케이스
return 'pending';
```

#### Creator 승인 페이지: ❌ 없음
- `/admin/creators/page.tsx`는 기존 크리에이터의 활성/정지/등급 관리만 제공
- **CreatorApplication 심사 UI가 없음**

**구현 상태:** ⚠️ 부분 구현

**누락 사항:**
- CreatorApplication 심사/승인/거절 어드민 페이지 없음
- Brand 승인 시 거절 사유 입력 UI 없음 (API에도 rejectionReason 필드 없음)

**예상 보완 작업:** 6~8시간 (CreatorApplication 어드민 페이지 + 거절 사유 UI)

---

### [항목 5] 승인/거절 API

**실행 커맨드:**
```bash
grep -rn "approve|reject|승인" frontend/kviewshop/src/app/api/ --include="route.ts"
grep -rn "status.*APPROVED|status.*REJECTED|approvedAt|rejectedAt" frontend/kviewshop/src/app/api/ --include="*.ts"
grep -rn "approveBrand|updateBrandStatus|approveTrialRequest|rejectTrialRequest" frontend/kviewshop/src/lib/actions/ --include="*.ts"
```

**발견 내용:**

#### 승인 API/Server Actions 전체 맵:

| 기능 | 타입 | 파일 | 함수 | 권한 체크 |
|------|------|------|------|-----------|
| Brand 승인 | Server Action | admin.ts | `approveBrand()` | super_admin ✅ |
| Brand 상태 변경 | Server Action | admin.ts | `updateBrandStatus(action: approve/suspend/reject)` | super_admin ✅ |
| Creator 상태 변경 | Server Action | admin.ts | `updateCreatorStatus(status)` | super_admin ✅ |
| Creator 등급 변경 | Server Action | admin.ts | `updateCreatorGrade(grade)` | super_admin ✅ |
| 체험 승인 | Server Action | brand.ts | `approveTrialRequest()` | brand_admin + 소유권 ✅ |
| 체험 거절 | Server Action | brand.ts | `rejectTrialRequest()` | brand_admin + 소유권 ✅ |
| 캠페인 참여 승인 | Server Action | brand.ts | `updateCampaignParticipation()` | brand_admin + 소유권 ✅ |
| 제안 수락/거절 | API Route | /api/creator/proposals/[id] | PATCH | creator + 소유권 ✅ |

#### Brand 승인 상세 (admin.ts):
```
approveBrand(id):
  → approved = true, approvedAt = new Date()
  → 알림: "브랜드 승인 완료" (In-App, type: SYSTEM)
  → 링크: '/brand/products/new'

updateBrandStatus(brandId, 'reject'):
  → approved = false
  → 알림: "브랜드 등록 거절" (In-App, type: SYSTEM)

updateBrandStatus(brandId, 'suspend'):
  → approved = false
  → 알림: "브랜드 정지" (In-App, type: SYSTEM)
```

#### 거절 사유 파라미터:
- Brand 승인/거절: **rejectionReason 파라미터 없음** ❌
- 체험 거절: `rejectReason` 파라미터 있음 ✅
- 캠페인 참여 거절: 별도 사유 없음 ❌
- 제안 거절: `rejectionReason` 파라미터 있음 ✅

**구현 상태:** ⚠️ 부분 구현

**누락 사항:**
- CreatorApplication 승인/거절 Server Action 없음
- Brand 거절 사유 저장 미지원
- DB 업데이트 → 알림 순서는 올바름 (try-catch 감싸져 있음)

**예상 보완 작업:** 4~5시간

---

### [항목 6] 알림 발송 통합

**실행 커맨드:**
```bash
grep -rn "CNECSHOP_" frontend/kviewshop/src/lib/ --include="*.ts"
grep -rn "sendNotification" frontend/kviewshop/src/lib/actions/ --include="*.ts" | head -30
cat frontend/kviewshop/src/lib/notifications/templates.ts | head -50
```

**발견 내용:**

#### 팝빌 카카오 알림톡 템플릿 전체 (14개):

| 번호 | 상수명 | 용도 | 승인 관련 |
|------|--------|------|-----------|
| CNECSHOP_001 | ORDER_COMPLETE | 주문 완료 | - |
| CNECSHOP_002 | SHIPPING_START | 배송 시작 | - |
| CNECSHOP_003 | DELIVERY_COMPLETE | 배송 완료 | - |
| CNECSHOP_004 | NEW_ORDER_BRAND | 주문 발생 → 브랜드 | - |
| CNECSHOP_005 | INVOICE_REMINDER | 송장 미입력 | - |
| CNECSHOP_006 | SALE_OCCURRED | 판매 발생 → 크리에이터 | - |
| **CNECSHOP_007** | **CAMPAIGN_APPROVED** | **캠페인 참여 승인 → 크리에이터** | **✅** |
| CNECSHOP_008 | CAMPAIGN_STARTED | 캠페인 시작 | - |
| **CNECSHOP_009** | **TRIAL_APPROVED** | **체험 승인 → 크리에이터** | **✅** |
| CNECSHOP_010 | TRIAL_SHIPPED | 체험 발송 | - |
| **CNECSHOP_011** | **TRIAL_REQUESTED** | **체험 신청 접수 → 브랜드** | **✅** |
| CNECSHOP_012 | SETTLEMENT_CONFIRMED | 정산 확정 | - |
| CNECSHOP_013 | PROPOSAL_GONGGU | 공구 초대 | - |
| CNECSHOP_014 | PROPOSAL_PRODUCT_PICK | 상품 추천 요청 | - |

#### 승인별 알림 채널:

| 승인 유형 | In-App | 카카오 | 이메일 |
|-----------|--------|--------|--------|
| 캠페인 참여 승인 | ✅ | ✅ CNECSHOP_007 | ✅ |
| 체험 신청 승인 | ✅ | ✅ CNECSHOP_009 | ✅ |
| **Brand 승인** | ✅ | **❌ 템플릿 없음** | **❌ 미구현** |
| **Brand 거절** | ✅ | **❌ 템플릿 없음** | **❌ 미구현** |
| 체험 거절 | ✅ | ❌ | ❌ |
| 캠페인 참여 거절 | ✅ | ❌ | ❌ |

#### 알림 시스템 아키텍처:
- `sendNotification()` — 3채널 통합 발송 (In-App DB + 카카오 PopBill + Email)
- 설정 파일: `/src/lib/notifications/index.ts`, `/kakao.ts`, `/templates.ts`
- PopBill 환경변수: `POPBILL_LINK_ID`, `POPBILL_SECRET_KEY`, `POPBILL_CORP_NUM`, `POPBILL_KAKAO_SENDER_KEY`

**구현 상태:** ⚠️ 부분 구현

**누락 사항:**
- Brand 승인/거절 전용 카카오 템플릿 없음 (현재 In-App만)
- Brand 승인 이메일 알림 없음
- 거절 알림은 모든 유형에서 카카오/이메일 미지원 (In-App만)

**예상 보완 작업:** 3~4시간 (템플릿 등록 + 발송 로직 추가)

---

### [항목 7] 권한 체크 미들웨어 + Server Component

**실행 커맨드:**
```bash
cat frontend/kviewshop/src/middleware.ts
grep -rn "status.*PENDING|approval|isApproved|brand.*approved" frontend/kviewshop/src/middleware.ts frontend/kviewshop/src/app/ --include="*.ts" --include="*.tsx" | head -30
grep -rn "auth()" frontend/kviewshop/src/app/ --include="*.ts" --include="*.tsx" | head -20
```

**발견 내용:**

#### middleware.ts (281줄):
- **역할 기반 접근 제어만 구현**
- `/admin` → `super_admin` 필수
- `/brand` → `brand_admin` 필수
- `/creator` → `creator` 필수
- `/buyer` → `buyer` 필수

#### 승인 상태 체크: ❌ 없음
- `user.status` (UserStatus enum) 체크 없음
- `brand.approved` 체크 없음
- PENDING 유저 리다이렉트 로직 없음

#### Server Component 레벨:
- 각 대시보드 페이지에서도 승인 상태 체크 없음
- Brand 대시보드: 승인 여부 무관하게 전체 기능 노출
- Creator 대시보드: `onboardingStatus` 무관하게 접근 가능

#### PENDING 유저 리다이렉트: ❌ 미구현
- 미승인 Brand가 상품 등록, 캠페인 생성 등 모든 기능 사용 가능
- 미승인 상태의 브랜드가 실제 매출에 영향 주는 기능까지 접근 가능

**구현 상태:** ❌ 미구현

**누락 사항:**
- middleware.ts에 status 체크 추가 필요
- Server Component에서 `brand.approved === false` 시 기능 차단 필요
- PENDING → 대기 페이지 리다이렉트 필요
- SUSPENDED → 정지 안내 페이지 리다이렉트 필요

**예상 보완 작업:** 4~6시간

---

### [항목 8] 어드민 UI 완성도

**실행 커맨드:**
```bash
grep -rn "pending.*count|count.*pending|대기.*개|대기중" frontend/kviewshop/src/app/**/admin/ --include="*.tsx"
grep -rn "일괄|bulk|batch|selectAll|체크박스" frontend/kviewshop/src/app/**/admin/ --include="*.tsx"
```

**발견 내용:**

#### Brand 관리 (/admin/brands):

| UI 요소 | 상태 |
|---------|------|
| 대기 개수 Stats 카드 | ✅ "대기중" 카운트 표시 |
| 상태 필터 (all/approved/pending/suspended) | ✅ |
| 검색 (브랜드명, 회사명, 사업자번호, 이메일) | ✅ |
| 승인/거절 액션 버튼 | ✅ |
| 사업자등록증 링크 표시 | ✅ |
| 대표자명, 연락처 | ✅ |
| 일괄 승인 | ❌ 없음 |
| 거절 사유 입력 | ❌ 없음 |

#### Creator 관리 (/admin/creators):

| UI 요소 | 상태 |
|---------|------|
| 활성/정지 개수 Stats 카드 | ✅ |
| 상태 필터 (ACTIVE/SUSPENDED) | ✅ |
| 등급 필터 (ROOKIE~PLATINUM) | ✅ |
| 검색 (이름, shopId, 이메일, 인스타) | ✅ |
| SNS 링크 표시 | ✅ |
| 팔로워 수 표시 | ⚠️ (igFollowers 필드 존재하나 UI 확인 필요) |
| 등급 변경 UI | ✅ |
| **CreatorApplication 심사 UI** | **❌ 없음** |

#### Sample 관리 (/admin/samples):

| UI 요소 | 상태 |
|---------|------|
| 상태별 개수 Stats | ✅ (pending/approved/shipped/received/decided/rejected) |
| 상태 필터 | ✅ |
| 브랜드 필터 | ✅ |
| 검색 | ✅ |
| 어드민 메모 저장 | ✅ |
| 승인/거절 액션 | ❌ (읽기 전용, 브랜드만 액션 가능) |

**구현 상태:** ⚠️ 부분 구현

**누락 사항:**
- CreatorApplication 전용 어드민 페이지 없음 (가장 큰 갭)
- 일괄 승인 UI 없음
- Brand 거절 사유 입력 UI 없음
- 대시보드에 "승인 대기" 알림 뱃지 없음

**예상 보완 작업:** 8~10시간

---

## 종합 요약

### 전체 완성도

| 항목 | 상태 | 점수 |
|------|------|------|
| 1. DB 스키마 | ⚠️ 부분 구현 | Brand ✅ / Creator ❌ |
| 2. 가입 API | ⚠️ 부분 구현 | Brand approved:false ✅ / 접근차단 ❌ |
| 3. 가입 후 안내 | ❌ 미구현 | 대기 페이지 없음 |
| 4. 어드민 페이지 | ⚠️ 부분 구현 | Brand ✅ / CreatorApplication ❌ |
| 5. 승인/거절 API | ⚠️ 부분 구현 | Brand ✅ / CreatorApp ❌ / 거절사유 ❌ |
| 6. 알림 발송 | ⚠️ 부분 구현 | 캠페인/체험 ✅ / Brand 승인 카카오 ❌ |
| 7. 권한 미들웨어 | ❌ 미구현 | 상태 체크 없음 |
| 8. 어드민 UI 완성도 | ⚠️ 부분 구현 | Brand ✅ / Creator심사 ❌ / 일괄 ❌ |

- 구현됨: 0/8
- 부분 구현: 6/8
- 미구현: 2/8
- **완성도: 약 40%**

### P0 (런칭 전 필수)

1. **미들웨어 승인 상태 체크 추가** — 미승인 Brand가 상품 등록/캠페인 생성 등 핵심 기능 사용 가능한 보안 이슈
2. **Brand 승인 대기 페이지** — 미승인 Brand 가입 후 대시보드 대신 대기 안내 표시
3. **CreatorApplication 어드민 심사 페이지** — buyer→creator 전환 신청 심사할 UI가 없음
4. **CreatorApplication 승인/거절 Server Action** — admin.ts에 해당 함수 없음
5. **Brand 거절 사유 저장** — DB 필드 + API + UI 모두 필요

### P1 (런칭 후 1~2주)

1. Brand 승인/거절 카카오 알림톡 템플릿 등록 (PopBill)
2. Brand 승인 이메일 알림 추가
3. 어드민 대시보드에 "승인 대기" 뱃지/카운트 표시
4. 거절 알림 카카오/이메일 채널 확대 (현재 In-App만)

### P2 (Phase 2)

1. 일괄 승인 UI (체크박스 + 일괄 액션)
2. Creator 가입 승인 워크플로우 도입 (현재는 즉시 ACTIVE)
3. 승인 이력 로그 (누가 언제 승인/거절했는지 audit trail)
4. SUSPENDED 유저 전용 안내 페이지

### 총 예상 작업 시간
- **P0: 20~25시간**
- **P1: 8~10시간**
- **P2: 15~20시간**

## 권장 작업 순서

1. DB 마이그레이션: Brand에 `rejectionReason` 필드 추가 (30분)
2. middleware.ts에 `brand.approved` 체크 + 리다이렉트 추가 (2시간)
3. Brand 승인 대기 페이지 UI 생성 (3시간)
4. CreatorApplication 승인/거절 Server Action 작성 (3시간)
5. CreatorApplication 어드민 심사 페이지 생성 (6시간)
6. Brand 거절 사유 UI + API 연동 (2시간)
7. 알림 템플릿 등록 + 발송 로직 보강 (4시간)

## 발견된 주요 파일 경로 모음

| 용도 | 파일 경로 |
|------|-----------|
| DB 스키마 | `frontend/kviewshop/prisma/schema.prisma` |
| 가입 API | `frontend/kviewshop/src/app/api/auth/register/route.ts` |
| NextAuth 설정 | `frontend/kviewshop/src/lib/auth.ts` |
| 어드민 Server Actions | `frontend/kviewshop/src/lib/actions/admin.ts` |
| Brand Server Actions | `frontend/kviewshop/src/lib/actions/brand.ts` |
| Buyer Server Actions | `frontend/kviewshop/src/lib/actions/buyer.ts` |
| 어드민 Brand 페이지 | `frontend/kviewshop/src/app/[locale]/(admin)/admin/brands/page.tsx` |
| 어드민 Creator 페이지 | `frontend/kviewshop/src/app/[locale]/(admin)/admin/creators/page.tsx` |
| 어드민 Sample 페이지 | `frontend/kviewshop/src/app/[locale]/(admin)/admin/samples/page.tsx` |
| 알림 템플릿 | `frontend/kviewshop/src/lib/notifications/templates.ts` |
| 알림 발송 | `frontend/kviewshop/src/lib/notifications/index.ts` |
| 카카오 알림톡 | `frontend/kviewshop/src/lib/notifications/kakao.ts` |
| 미들웨어 | `frontend/kviewshop/src/middleware.ts` |
| 가입 완료 페이지 | `frontend/kviewshop/src/app/[locale]/(auth)/signup/complete/page.tsx` |
| 크리에이터 제안 API | `frontend/kviewshop/src/app/api/creator/proposals/[id]/route.ts` |

---

*점검 완료: 2026-04-21 | 코드 수정: 0건*
