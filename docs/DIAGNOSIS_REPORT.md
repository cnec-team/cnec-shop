# 크넥샵 전체 현황 진단 리포트

**진단일:** 2026-03-28
**프로젝트:** cnec-shop (frontend/kviewshop)
**스택:** Next.js 16 + TypeScript + Prisma + PostgreSQL + NextAuth + TailwindCSS v4

---

## 섹션 A: 페이지별 상태표

### Admin (6 페이지)

| 페이지 | 경로 | DB연동 | CRUD | 네비 | loading/error | 상태 |
|--------|------|--------|------|------|---------------|------|
| 대시보드 | /admin/dashboard | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 브랜드 관리 | /admin/brands | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 크리에이터 관리 | /admin/creators | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 가이드 관리 | /admin/guides | ✅ | CRUD | ✅ | ✅/✅ | 운영 가능 |
| 정산 | /admin/settlements | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 설정 | /admin/settings | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |

### Auth (8 페이지)

| 페이지 | 경로 | DB연동 | CRUD | 네비 | loading/error | 상태 |
|--------|------|--------|------|------|---------------|------|
| 통합 로그인 | /login | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 통합 회원가입 | /signup | ✅ | C | ✅ | ✅/✅ | 운영 가능 |
| 회원가입 완료 | /signup/complete | - | - | ✅ | ✅/✅ | 운영 가능 |
| 페르소나 선택 | /signup/persona | ✅ | U | ✅ | ✅/✅ | 운영 가능 |
| 브랜드 로그인 | /brand/login | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 크리에이터 로그인 | /creator/login | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 구매자 로그인 | /buyer/login | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 구매자 회원가입 | /buyer/signup | ✅ | C | ✅ | ✅/✅ | 운영 가능 |

### Brand (17 페이지)

| 페이지 | 경로 | DB연동 | CRUD | 네비 | loading/error | 상태 |
|--------|------|--------|------|------|---------------|------|
| 대시보드 | /brand/dashboard | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 상품 목록 | /brand/products | ✅ | RD | ✅ | ✅/✅ | 운영 가능 |
| 상품 등록 | /brand/products/new | ✅ | C | ✅ | ✅/✅ | 운영 가능 |
| 상품 상세/수정 | /brand/products/[id] | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 상품 일괄등록 | /brand/products/bulk | ✅ | C | ✅ | ✅/✅ | 운영 가능 |
| 공구 캠페인 | /brand/campaigns/gonggu | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 상시 캠페인 | /brand/campaigns/always | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 캠페인 생성 | /brand/campaigns/new | ✅ | C | ✅ | ✅/✅ | 운영 가능 |
| 캠페인 상세 | /brand/campaigns/[id] | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 크리에이터 | /brand/creators | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 대기 크리에이터 | /brand/creators/pending | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 크리에이터 성과 | /brand/creators/performance | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 주문 관리 | /brand/orders | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 정산 | /brand/settlements | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 가이드 | /brand/guides | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 가이드 상세 | /brand/guides/[id] | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| MoCRA | /brand/mocra | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 설정 | /brand/settings | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 고객지원 | /brand/support | ✅ | CR | ✅ | ✅/✅ | 운영 가능 |

### Creator (19 페이지)

| 페이지 | 경로 | DB연동 | CRUD | 네비 | loading/error | 상태 |
|--------|------|--------|------|------|---------------|------|
| 대시보드 | /creator/dashboard | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 캠페인 탐색 | /creator/campaigns | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 내 캠페인 | /creator/campaigns/my | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 상품 관리 | /creator/products | ✅ | RUD | ✅ | ✅/✅ | 운영 가능 |
| 내 샵 관리 | /creator/shop | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 판매 현황 | /creator/sales | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 주문 관리 | /creator/orders | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 정산 | /creator/settlements | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 컬렉션 | /creator/collections | ✅ | CRUD | ✅ | ✅/✅ | 운영 가능 |
| 루틴 | /creator/routines | ✅ | CRUD | ✅ | ✅/✅ | 운영 가능 |
| 배너 | /creator/banners | ✅ | CRUD | ✅ | ✅/✅ | 운영 가능 |
| 등급 | /creator/grade | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 포인트 | /creator/points | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 추천인 | /creator/referral | ✅ | CR | ✅ | ✅/✅ | 운영 가능 |
| 가이드 | /creator/guides | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 가이드 상세 | /creator/guides/[id] | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 라이브 | /creator/live | ✅ | CRUD | ✅ | ✅/✅ | 운영 가능 |
| 알림 | /creator/notifications | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 설정 | /creator/settings | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |

### Buyer (8 페이지)

| 페이지 | 경로 | DB연동 | CRUD | 네비 | loading/error | 상태 |
|--------|------|--------|------|------|---------------|------|
| 대시보드 | /buyer/dashboard | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 장바구니 | /buyer/cart | ✅ | CRUD | ✅ | ✅/✅ | 운영 가능 |
| 주문 내역 | /buyer/orders | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 주문 상세 | /buyer/orders/[id] | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 포인트 | /buyer/points | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 리뷰 | /buyer/reviews | ✅ | CR | ✅ | ✅/✅ | 운영 가능 |
| 구독 | /buyer/subscriptions | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 크리에이터 전환 | /buyer/become-creator | ✅ | CU | ✅ | ✅/✅ | 운영 가능 |

### Shop/Public (9 페이지)

| 페이지 | 경로 | DB연동 | CRUD | 네비 | loading/error | 상태 |
|--------|------|--------|------|------|---------------|------|
| 메인 | / | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 크리에이터 샵 | /[username] | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 상품 상세 | /[username]/product/[id] | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 체크아웃 | /[username]/checkout | ✅ | C | ✅ | ✅/✅ | ⚠️ 결제 SDK 미연동 |
| 크리에이터 목록 | /creators | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 상품 목록 | /products | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 주문 조회 | /orders | ✅ | R | ✅ | ✅/✅ | 운영 가능 |
| 결제 성공 | /payment/success | ✅ | RU | ✅ | ✅/✅ | 운영 가능 |
| 결제 실패 | /payment/fail | - | - | ✅ | ✅/✅ | 운영 가능 |

**요약:** 84개 페이지 전체 DB 연동 완료. loading.tsx 80개, error.tsx 80개 배치됨.

---

## 섹션 B: 플로우별 끊김 지점

### 🏢 브랜드 플로우

```
상품 등록 폼 submit
  ↓ handleSave() → createProduct() 서버 액션 호출
  ✅ prisma.product.create() → DB insert 완료
  ↓ router.push('../products') 리다이렉트
  ✅ 상품 목록 → getBrandProducts() → prisma.product.findMany()
  ↓ 상품 클릭 → /brand/products/[id]
  ✅ 상세 페이지 → getBrandProductById() → prisma.product.findUnique()
  ↓ 캠페인 생성 → /brand/campaigns/new
  ✅ 4단계 폼 → createCampaign() → prisma.campaign.create() + campaignProduct.createMany()
  ↓ 상태 변경 (DRAFT → RECRUITING → ACTIVE → ENDED)
  ✅ updateCampaignStatus() → 상태 머신 + 자동 샵 아이템 생성
  ↓ 주문 목록 → /brand/orders
  ✅ getBrandOrders() → prisma.order.findMany({ include: items, creator })
```

**끊기는 지점: 없음 ✅ 전체 체인 연결됨**

### 🎨 크리에이터 플로우

```
캠페인 탐색 → /creator/campaigns
  ✅ getAvailableCampaigns() → prisma.campaign.findMany({ where: status IN ['RECRUITING','ACTIVE'] })
  ↓ 캠페인 카드 클릭
  ⚠️ 전용 상세 페이지 없음 → 인라인 Dialog로 표시
  ↓ 참여 신청 버튼 (OPEN: "바로 참여" / APPROVAL: "참여하기")
  ✅ applyCampaignParticipation() → prisma.campaignParticipation.create()
  ↓ OPEN 타입: 자동 상품 추가
  ✅ addCampaignShopItems() → prisma.creatorShopItem.create() (type: 'GONGGU')
  ❌ APPROVAL 타입: 승인 후 상품 자동 추가 로직 없음 (브랜드 측 updateCampaignStatus→ACTIVE에서 처리)
  ↓ 판매 현황 → /creator/sales
  ✅ getCreatorSalesData() → prisma.conversion/shopVisit/settlement 조회
```

**끊기는 지점:**
- ⚠️ 캠페인 전용 상세 페이지 부재 (Dialog 사용 → 직접 링크 공유 불가)
- ⚠️ APPROVAL 타입 승인 후 상품 추가는 브랜드가 캠페인을 ACTIVE로 변경할 때에만 동작

### 🛒 구매자 플로우

```
/[username] (크리에이터 샵)
  ✅ getCreatorByShopId() + getShopItems() → 크리에이터 정보 + 상품 목록
  ↓ 상품 클릭 → /[username]/product/[productId]
  ✅ getProduct() + getCampaignProduct() → 상품 상세 + 캠페인 가격
  ↓ 구매하기 버튼
  ✅ handleBuy() → useCartStore.addItem() → router.push checkout
  ↓ 체크아웃 페이지 → /[username]/checkout
  ✅ 주문 정보 입력 폼 (배송지, 결제수단 선택 UI)
  ↓ 결제하기 버튼
  ✅ createOrder() → prisma.order.create() (status: PENDING)
  ↓ 결제 SDK 호출
  ❌ TossPayments/PortOne SDK 실제 호출 코드 없음
     - SDK 패키지는 설치됨 (@tosspayments/tosspayments-sdk)
     - CSP에 토스/포트원 도메인 허용됨
     - 결제수단 선택 UI는 있으나, SDK.requestPayment() 호출 구현 안 됨
     - 주문만 PENDING으로 생성되고 결제 진행되지 않음
  ↓ (결제 완료 후) 콜백 → /payment/success
  ✅ TossPayments confirm API 호출 → 주문 상태 PAID 업데이트
  ↓ 웹훅 → /api/payments/webhook
  ✅ HMAC-SHA256 서명 검증 + PortOne API 이중 검증 + 주문 상태 업데이트
  ↓ 주문 확인 → /buyer/orders/[id]
  ✅ getBuyerOrderDetail() → 주문 상세 조회
```

**끊기는 지점:**
- ❌ **체크아웃 → 결제 SDK 호출 (P0 CRITICAL)**
  - 원인: checkout 페이지에서 `handleCheckout()` 함수가 `createOrder()`만 호출하고, TossPayments SDK `requestPayment()` 호출이 없음
  - 결과: 주문은 PENDING으로 생성되지만 실제 결제가 진행되지 않음
  - 백엔드(webhook, confirm, complete)는 모두 구현 완료 상태

---

## 섹션 C: P0/P1/P2 우선순위 분류

### 🔴 P0 — 런칭 전 필수 (이거 안 되면 파일럿 불가)

| # | 항목 | 현재 상태 | 필요 작업 |
|---|------|-----------|-----------|
| 1 | **결제 SDK 연동** | 주문 생성만 됨, 결제 미진행 | checkout 페이지에서 TossPayments SDK `requestPayment()` 호출 구현 |
| 2 | **루트 .env에 실제 API 키 노출** | 3개 Gemini + 1개 YouTube 키 하드코딩 | .env git rm --cached, 키 로테이션 |
| 3 | **결제 API 라우트 인증 부재** | /api/payments/prepare,complete,confirm에 사용자 인증 없음 | 세션 검증 또는 주문-사용자 매칭 추가 |

### 🟡 P1 — 파일럿 중 수정

| # | 항목 | 현재 상태 | 필요 작업 |
|---|------|-----------|-----------|
| 4 | 상품 설명 XSS | `dangerouslySetInnerHTML={{ __html: product.description }}` | DOMPurify로 HTML 새니타이징 |
| 5 | 캠페인 상세 페이지 부재 | Dialog로만 표시, 직접 링크 불가 | /creator/campaigns/[id] 페이지 생성 |
| 6 | APPROVAL 캠페인 승인 후 알림 | 브랜드가 승인해도 크리에이터에게 알림 없음 | 알림 생성 로직 추가 |
| 7 | /api/track 크리에이터 ID 검증 없음 | 아무 ID로 방문 기록 생성 가능 | DB에서 크리에이터 존재 확인 |
| 8 | Rate Limiting 미적용 | 결제/등록 API에 제한 없음 | middleware에 rate limiter 추가 |

### 🟢 P2 — Phase 1 확장 (나중에)

| # | 항목 | 설명 |
|---|------|------|
| 9 | PortOne 웹훅 IP allowlist | 현재 서명 검증만, IP 제한 추가 권장 |
| 10 | 결제 수단별 분기 처리 | 카카오페이/네이버페이/카드 등 PG사별 분기 |
| 11 | 크리에이터 캠페인 상세 SEO | 캠페인 공유 시 OG 태그 필요 |
| 12 | 다국어 메시지 검증 | 11개 언어 파일 존재하나 누락 키 검증 필요 |
| 13 | 이미지 최적화 | Next.js Image 컴포넌트 활용도 점검 |
| 14 | DB 쿼리 최적화 | N+1 문제 가능성 있는 서버 액션 점검 |

---

## 섹션 D: 보안/환경변수 체크리스트

### 🔐 보안 점검

| 항목 | 상태 | 상세 |
|------|------|------|
| **하드코딩 API 키** | ❌ CRITICAL | 루트 `.env`에 Gemini(3개)+YouTube(1개) 실제 키 노출. git 히스토리에 남아있음 |
| **웹훅 서명 검증** | ✅ 안전 | HMAC-SHA256 + timingSafeEqual + PortOne API 이중 검증 |
| **/api/seed 운영 보호** | ✅ 안전 | `NODE_ENV === 'production'` 체크 → 403 반환 |
| **미들웨어 인증** | ✅ 안전 | 역할 기반 접근 제어 (admin/brand/creator/buyer) |
| **비밀번호 해싱** | ✅ 안전 | bcryptjs salt rounds 12 |
| **세션 관리** | ✅ 안전 | NextAuth JWT 전략 |
| **SQL Injection** | ✅ 안전 | Prisma ORM 사용, raw SQL 없음 |
| **XSS** | ⚠️ 주의 | `product-detail.tsx:344` dangerouslySetInnerHTML (상품 설명) |
| **CORS** | ✅ 안전 | Next.js 기본 same-origin 정책 |
| **결제 API 인증** | ❌ 위험 | /payments/prepare,complete,confirm에 사용자 인증 없음 |

### 🔑 환경변수 체크리스트

| 변수 | 용도 | 필수 | .env.example |
|------|------|------|-------------|
| `DATABASE_URL` | PostgreSQL 연결 | ✅ 필수 | ✅ 있음 |
| `NEXTAUTH_SECRET` | 세션 암호화 | ✅ 필수 | ✅ 있음 |
| `NEXTAUTH_URL` | 콜백 URL | ✅ 필수 | ✅ 있음 |
| `TOSS_SECRET_KEY` | 토스 결제 승인 | ✅ 필수 | ✅ 있음 |
| `NEXT_PUBLIC_PORTONE_STORE_ID` | 포트원 상점 ID | ✅ 필수 | ✅ 있음 |
| `PORTONE_WEBHOOK_SECRET` | 웹훅 서명 검증 | ✅ 필수 | ✅ 있음 |
| `PORTONE_API_SECRET` | 포트원 서버 API | ✅ 필수 | ✅ 있음 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 공유 | ⚠️ 선택 | ✅ 있음 |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL | ⚠️ 선택 | ✅ 있음 |
| `R2_ACCOUNT_ID` | R2 스토리지 | ✅ 업로드용 | ✅ 있음 |
| `R2_ACCESS_KEY_ID` | R2 인증 | ✅ 업로드용 | ✅ 있음 |
| `R2_SECRET_ACCESS_KEY` | R2 시크릿 | ✅ 업로드용 | ✅ 있음 |
| `R2_BUCKET_NAME` | R2 버킷 | ✅ 업로드용 | ✅ 있음 |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | R2 퍼블릭 URL | ✅ 이미지용 | ✅ 있음 |
| `RESEND_API_KEY` | 이메일 발송 | ⚠️ 선택 | ✅ 있음 |

---

## 섹션 E: 종합 진단 요약

### 전체 통계

- **총 페이지:** 84개 (전부 DB 연동)
- **loading.tsx:** 80개 배치
- **error.tsx:** 80개 배치
- **API 라우트:** 23개
- **서버 액션 파일:** 6개 (admin, auth, brand, buyer, creator, shop)
- **Prisma 모델:** 30+ 모델
- **지원 언어:** 11개

### 플로우별 완성도

| 플로우 | 완성도 | 블로커 |
|--------|--------|--------|
| 브랜드 (상품→캠페인→주문) | **95%** ✅ | 없음 |
| 크리에이터 (캠페인→참여→판매) | **85%** ⚠️ | 캠페인 상세 페이지 부재 (기능은 Dialog로 동작) |
| 구매자 (쇼핑→결제→주문확인) | **70%** ❌ | **결제 SDK 미연동 (P0)** |

### 한 줄 요약

> **백엔드(서버 액션, API, 웹훅, DB)는 거의 완성. 유일한 P0 블로커는 체크아웃에서 TossPayments SDK `requestPayment()` 호출이 빠져있는 것. 이것만 연결하면 결제 플로우가 끝까지 돈다.**
