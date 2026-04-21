# Phase C 선행 조사 결과

조사일: 2026-04-21

---

## 1. sendNotification

- **경로:** `src/lib/notifications/index.ts:44`
- **import:** `import { sendNotification } from '@/lib/notifications'`
- **시그니처:**
  ```ts
  export async function sendNotification(params: SendNotificationParams): Promise<void>

  interface SendNotificationParams {
    userId?: string
    type: string
    title: string
    message: string
    linkUrl?: string
    phone?: string
    receiverName?: string
    kakaoTemplate?: { templateCode: string; message: string }
    email?: string
    emailTemplate?: { subject: string; html: string }
  }
  ```
- **지원 채널:** 3개
  1. 앱 내 알림 (DB INSERT) - `userId` 있을 때만
  2. 카카오 알림톡 - `phone` + `kakaoTemplate` 있을 때
  3. 이메일 - `email` + `emailTemplate` 있을 때
- **호출 예시:**
  ```ts
  // 1. 구매 완료 (buyer) — src/app/api/payments/complete/route.ts:230
  await sendNotification({
    userId: buyerUserId ?? undefined,
    ...tmpl.inApp,
    phone: buyerPhone,
    kakaoTemplate: buyerPhone ? tmpl.kakao : undefined,
    email: buyerEmail,
    emailTemplate: buyerEmail ? tmpl.email : undefined,
  })

  // 2. 브랜드 신규 주문 — src/app/api/payments/complete/route.ts:262
  await sendNotification({ userId: brand.userId, ...tmpl.inApp, ... })

  // 3. 체험 승인 — src/lib/actions/trial.ts:131
  sendNotification({ userId, ...tmpl.inApp, phone, kakaoTemplate, email, emailTemplate })
  ```
- **템플릿 함수들:** `src/lib/notifications/templates.ts`에서 export
  - `orderCompleteMessage`, `newOrderBrandMessage`, `saleOccurredMessage` 등
  - 각 함수가 `{ inApp: {type, title, message, linkUrl}, kakao: {...}, email: {...} }` 구조 반환

---

## 2. 인증 헬퍼

- **함수명:** `getAuthUser()`
- **경로:** `src/lib/auth-helpers.ts`
- **코드:**
  ```ts
  import { auth } from './auth'
  export async function getAuthUser() {
    const session = await auth()
    if (!session?.user) return null
    return session.user
  }
  ```
- **반환 객체:** `{ id: string, email: string, role: string, ... }` (NextAuth session.user)
  - `role` 값: `'brand_admin'` | `'creator'` | `'buyer'` | `'super_admin'`
  - `id`는 User 테이블 PK
- **저수준 auth:** `src/lib/auth.ts`에서 NextAuth v5 `auth()` export
- **세션 전략:** JWT (`session: { strategy: 'jwt' }` — `src/lib/auth.config.ts:9`)
- **브랜드 조회 표준 패턴:**
  ```ts
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') return 401

  const brand = await prisma.brand.findFirst({ where: { userId: authUser.id } })
  // 또는
  const brand = await prisma.brand.findUnique({ where: { userId: authUser.id } })
  ```
  - `Brand.userId`는 `@unique`이므로 `findUnique({ where: { userId } })` 사용 가능
- **API 라우트에서의 직접 auth:**
  ```ts
  import { auth } from '@/lib/auth'
  const session = await auth()
  // session.user.id 사용
  ```

---

## 3. 기존 결제 플로우 (상품 결제 — PortOne V2)

### 파일 구조
```
src/app/api/payments/
├── prepare/route.ts    ← 주문 생성 + 재고 차감
├── complete/route.ts   ← PortOne API 검증 + PENDING→PAID
├── webhook/route.ts    ← HMAC-SHA256 서명 검증 + 이중 금액 확인
└── confirm/route.ts    ← 레거시 Toss (미사용)
```

### 플로우
1. **prepare** (POST): body에서 items/buyer/shipping 받음 → `prisma.order.create` → `decrementStock` → orderId 반환
2. **클라이언트**: PortOne Browser SDK `requestPayment()` 호출 (`src/app/[locale]/(shop)/[username]/checkout/page.tsx`)
3. **complete** (POST): `{ orderId, paymentId, pgProvider }` 받음 → PortOne REST API로 결제 검증 → 금액 비교 → `order.update({ status: 'PAID' })` → 알림 3채널
4. **webhook** (POST): HMAC-SHA256 서명 검증 → PortOne API 이중 검증 → 금액 불일치 시 자동 취소

### 트랜잭션 사용: **No**
- `prisma.$transaction` 미사용
- prepare에서 order 생성 → orderItem 생성 → stock 차감을 순차 호출, 실패 시 수동 rollback (`prisma.order.delete`)
- complete에서도 단건 update

### 금액 재검증 방식
- **complete:** `paymentData.amount.total !== Number(order.totalAmount)` → 400 에러
- **webhook:** 동일 검증 + 불일치 시 PortOne 자동 취소 API 호출 + order CANCELLED 처리

### PortOne API 호출 패턴
```ts
const portoneApiSecret = process.env.PORTONE_API_SECRET
const res = await fetch(
  `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
  { headers: { 'Authorization': `PortOne ${portoneApiSecret}` } }
)
```

---

## 4. 세션/인증

- **방식:** JWT (쿠키 기반, NextAuth v5 beta.30)
- **설정:** `src/lib/auth.config.ts` — Edge 호환 (Prisma 미사용)
- **미들웨어:** `src/middleware.ts` (275줄)
- **보호 경로:**
  | 경로 패턴 | 필요 role |
  |-----------|-----------|
  | `/{locale}/admin/*` | `super_admin` |
  | `/{locale}/brand/*` | `brand_admin` |
  | `/{locale}/creator/*` | `creator` |
  | `/{locale}/buyer/*` | `buyer` |
  | 로그인/회원가입 페이지 | 인증 불필요 |
  | 크리에이터 샵 (`/{locale}/{username}`) | 인증 불필요 |
- **미인증 시:** `/{locale}/login?returnUrl=...` 으로 redirect
- **buyer 전용 경로:** `/{locale}/buyer/login?returnUrl=...` 으로 redirect

---

## 5. Suspense 패턴

- **useSearchParams 사용 파일:** 10개+
- **Suspense로 감싼 예시:** 2건
  1. `src/components/brand/CreatorExplorerList.tsx:274` — `<Suspense fallback={...}>`
  2. `src/app/[locale]/unsubscribe/page.tsx:7` — `<Suspense fallback={...}>`
- **결론:** 기존 프로젝트에서 useSearchParams를 Suspense로 감싸는 패턴 **있음** (일부만). Next.js 16에서는 useSearchParams가 Suspense 필요.

---

## 6. 어드민 페이지 구조

- **경로 패턴:** `src/app/[locale]/(admin)/admin/{section}/page.tsx`
- **기존 섹션:**
  ```
  admin/dashboard
  admin/orders
  admin/campaigns
  admin/creators
  admin/creator-data (+ import 하위 페이지)
  admin/brands
  admin/settlements
  admin/samples
  admin/guides
  admin/settings
  ```
- **권한 체크:**
  - 미들웨어: `adminRouteRegex.test(pathname) && userRole !== 'super_admin'` → redirect
  - 레이아웃: `src/app/[locale]/(admin)/layout.tsx:18` — `session.user.role !== 'super_admin'` → redirect

---

## 요약 (한 줄씩)

- **sendNotification:** `@/lib/notifications` — `SendNotificationParams { userId, type, title, message, phone?, email?, kakaoTemplate?, emailTemplate? }` — 앱/알림톡/이메일 3채널
- **인증:** `getAuthUser()` (`@/lib/auth-helpers`) → `{ id, email, role }` / 저수준 `auth()` (`@/lib/auth`) — JWT 세션
- **결제 패턴:** 트랜잭션 N / PortOne REST API fetch + `paymentData.amount.total !== order.totalAmount` 금액 검증 / 웹훅 HMAC-SHA256 + 불일치 자동 취소
- **어드민:** `app/[locale]/(admin)/admin/...` — 미들웨어 + 레이아웃 이중 `super_admin` 체크
- **Suspense:** useSearchParams 감싸는 패턴 존재 (부분적)
