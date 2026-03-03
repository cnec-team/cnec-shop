# KviewShop (CNEC Commerce) - 완전 재구축 가이드

> K-Beauty 크리에이터 공동구매(공구) 커머스 플랫폼
> 이 문서는 사이트를 처음부터 동일하게 재구축하기 위한 모든 정보를 포함합니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [환경변수](#4-환경변수)
5. [프론트엔드 설정 파일](#5-프론트엔드-설정-파일)
6. [디자인 시스템 (CSS)](#6-디자인-시스템-css)
7. [데이터베이스 스키마 (Supabase)](#7-데이터베이스-스키마-supabase)
8. [TypeScript 타입 정의](#8-typescript-타입-정의)
9. [인프라 코드](#9-인프라-코드)
10. [API 엔드포인트](#10-api-엔드포인트)
11. [페이지 구조](#11-페이지-구조)
12. [컴포넌트 구조](#12-컴포넌트-구조)
13. [백엔드 (FastAPI)](#13-백엔드-fastapi)
14. [다국어 (i18n)](#14-다국어-i18n)
15. [배포 설정](#15-배포-설정)
16. [설정 순서](#16-설정-순서)
17. [테스트 계정](#17-테스트-계정)

---

## 1. 프로젝트 개요

**KviewShop** = 크리에이터 셀렉트샵 플랫폼

- **크리에이터**: 자신만의 셀렉트샵 운영, 브랜드 상품 큐레이션/판매, 수수료 수익
- **브랜드**: 상품 등록, 캠페인(공구/상시) 생성, 크리에이터에게 제품 제공, 주문/배송 관리
- **구매자**: 크리에이터 숍에서 상품 구매, 포인트, 리뷰, 구독
- **관리자**: 플랫폼 전체 관리, 브랜드 승인, 정산 감독

### 4가지 사용자 역할

| 역할 | 코드 | 설명 |
|------|------|------|
| 플랫폼 관리자 | `super_admin` | 브랜드/크리에이터 관리, 정산 감독, 설정 |
| 브랜드 운영자 | `brand_admin` | 상품 등록, 캠페인 생성, 주문/정산 관리 |
| 크리에이터 | `creator` | 숍 운영, 상품 큐레이션, 공구 참여 |
| 구매자 | `buyer` | 상품 구매, 포인트, 리뷰, 장바구니 |

### 핵심 비즈니스 로직

```
직접 전환(DIRECT): 캠페인 설정 수수료율 (기본 10%)
간접 전환(INDIRECT): 3%
플랫폼 수수료: 3%
원천징수세: 3.3%
쿠키 윈도우: 24시간
```

**캠페인 타입:**
- **공구(GONGGU)**: 기간 한정 공동구매 (D-Day 카운트다운)
- **상시(ALWAYS)**: 크리에이터 픽 (항시 판매)

**주문 상태 흐름:**
```
PENDING → PAID → PREPARING → SHIPPING → DELIVERED → CONFIRMED
                                                   → CANCELLED / REFUNDED
```

---

## 2. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Frontend** | Next.js (App Router) | 16.1.6 |
| **React** | React + React DOM | 19.2.3 |
| **Language** | TypeScript | 5.9.3 |
| **CSS** | Tailwind CSS (다크모드 기본) | 4 |
| **UI** | shadcn/ui + Radix UI | new-york style |
| **상태관리** | Zustand (auth, cart) | 5.0.11 |
| **서버 상태** | React Query (@tanstack/react-query) | 5.90.20 |
| **인증/DB** | Supabase (Auth + PostgreSQL + Storage) | 2.93.3 |
| **결제** | TossPayments SDK | 2.5.0 |
| **i18n** | next-intl (11개 언어) | 4.8.2 |
| **아이콘** | Lucide React | 0.563.0 |
| **애니메이션** | Framer Motion | 12.30.0 |
| **폼** | React Hook Form + Zod | 7.71.1 / 4.3.6 |
| **토스트** | Sonner | 2.0.7 |
| **Backend** | FastAPI (Python) | - |
| **AI** | Google Gemini API | gemini-2.5-flash |
| **외부 API** | YouTube Data API v3 | - |
| **배포 (FE)** | Netlify | - |
| **배포 (BE)** | Render | - |

---

## 3. 프로젝트 구조

```
cnec-shop/
├── .env.example
├── .gitignore
├── render.yaml               # Render 배포 설정
├── build.sh                  # 빌드 스크립트
├── requirements.txt          # Python 의존성
│
├── backend/                  # FastAPI 백엔드
│   └── app/
│       ├── main.py
│       ├── core/config.py
│       ├── db/database.py, supabase_client.py
│       ├── models/models.py
│       ├── schemas/schemas.py
│       ├── api/reports.py, creators.py, sponsorships.py,
│       │    prediction.py, trends.py, newsletter.py
│       ├── services/predictor.py, video_analyzer.py,
│       │    youtube_collector.py
│       └── utils/youtube_api.py
│
└── frontend/kviewshop/       # Next.js 프론트엔드
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── components.json        # shadcn/ui 설정
    ├── postcss.config.mjs
    ├── netlify.toml
    ├── supabase/migrations/   # DB 마이그레이션 (6개)
    ├── scripts/seed-users.ts
    └── src/
        ├── middleware.ts      # 인증/i18n/라우팅
        ├── app/
        │   ├── layout.tsx     # 루트 레이아웃
        │   ├── globals.css    # 디자인 시스템
        │   ├── api/           # API Routes (8개)
        │   │   ├── payments/prepare/route.ts
        │   │   ├── payments/complete/route.ts
        │   │   ├── payments/webhook/route.ts
        │   │   ├── payment/confirm/route.ts
        │   │   ├── orders/[id]/cancel/route.ts
        │   │   ├── notifications/route.ts
        │   │   ├── track/route.ts
        │   │   └── seed/route.ts
        │   └── [locale]/
        │       ├── layout.tsx
        │       ├── page.tsx   # 랜딩
        │       ├── (auth)/    # 로그인/회원가입 (6개)
        │       ├── (shop)/    # 크리에이터 숍 (4개)
        │       ├── (creator)/ # 크리에이터 대시보드 (15개)
        │       ├── (buyer)/   # 구매자 (10개)
        │       ├── (brand)/   # 브랜드 대시보드 (14개)
        │       ├── (admin)/   # 관리자 (6개)
        │       └── payment/   # 결제 결과 (2개)
        ├── components/
        │   ├── providers.tsx
        │   ├── ui/            # shadcn/ui (28개)
        │   ├── layout/header.tsx, sidebar.tsx, notification-bell.tsx
        │   └── shop/creator-shop.tsx, product-detail.tsx, legal-footer.tsx
        ├── lib/
        │   ├── utils.ts
        │   ├── supabase/client.ts, server.ts, middleware.ts, storage.ts
        │   ├── i18n/config.ts, request.ts
        │   ├── store/auth.ts  # Zustand (인증 + 장바구니)
        │   ├── hooks/use-user.ts
        │   ├── export/settlements.ts
        │   └── shipping-countries.ts
        ├── types/database.ts  # 전체 DB 스키마 타입
        └── messages/          # 11개 언어 JSON
```

---

## 4. 환경변수

### `.env.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# TossPayments (결제)
NEXT_PUBLIC_TOSS_CLIENT_KEY=your-toss-client-key
TOSS_SECRET_KEY=your-toss-secret-key

# Backend
YOUTUBE_API_KEY=your-youtube-key
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
SECRET_KEY=your-secret-key
```

---

## 5. 프론트엔드 설정 파일

### `package.json`

```json
{
  "name": "kviewshop",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "seed": "tsx scripts/seed-users.ts"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-slider": "^1.3.6",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.93.3",
    "@tanstack/react-query": "^5.90.20",
    "@tosspayments/tosspayments-sdk": "^2.5.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.30.0",
    "lucide-react": "^0.563.0",
    "next": "16.1.6",
    "next-intl": "^4.8.2",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-day-picker": "^9.13.0",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.71.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@netlify/plugin-nextjs": "^5.15.7",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "tsx": "^4.21.0",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3"
  }
}
```

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

### `components.json` (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

---

## 6. 디자인 시스템 (CSS)

> 파일: `src/app/globals.css`
> 다크모드 기본, 라이트모드는 `.light` 클래스

### 색상 체계

| 토큰 | 다크(기본) | 라이트(.light) | 용도 |
|------|-----------|---------------|------|
| `--background` | `#09090B` | `#FAFAFA` | 배경 |
| `--foreground` | `#FAFAFA` | `#09090B` | 텍스트 |
| `--primary` | `#2563EB` | `#2563EB` | CTA 버튼 (Deep Blue) |
| `--accent` | `#F43F5E` | `#F43F5E` | 강조 (Rose) |
| `--card` | `#18181B` | `#FFFFFF` | 카드 배경 |
| `--muted` | `#27272A` | `#F4F4F5` | 보조 배경 |
| `--border` | `#27272A` | `#E4E4E7` | 테두리 |
| `--success` | `#22C55E` | `#22C55E` | 성공 |
| `--warning` | `#F59E0B` | `#F59E0B` | 경고 |
| `--destructive` | `#EF4444` | `#EF4444` | 오류 |

### 폰트

```css
font-family: 'Inter', 'Montserrat', var(--font-geist-sans), sans-serif;
```

### 커스텀 클래스

- `.text-gold-gradient` - 로고 그라데이션 (blue → purple → rose)
- `.card-hover` - 카드 호버 효과 (lift + border color)
- `.btn-gold` - 기본 CTA 버튼 스타일
- `.badge-accent` - 강조 배지
- `.stat-value` - 통계 수치 (2xl bold)
- `.mocra-green/yellow/red` - MoCRA 신호등 표시
- `.animate-shimmer` - 로딩 스켈레톤

---

## 7. 데이터베이스 스키마 (Supabase)

### 마이그레이션 실행 순서

1. `001_cnec_commerce.sql` - 핵심 테이블 (users, brands, creators, products, campaigns, orders, etc.)
2. `002_cnec_v1_1.sql` - 배송, 배너, 알림, 루틴 스텝
3. `003_buyer_shorturl_subscription_features.sql` - 구매자, 단축URL, 구독, 커뮤니티, 리뷰, 레벨, 라이브

### 주요 테이블 목록

**핵심:**
- `users` - 모든 사용자 (role: super_admin/brand_admin/creator/buyer)
- `brands` - 브랜드 정보 (사업자, 은행, 배송 설정)
- `creators` - 크리에이터 (shop_id, 뷰티 프로필, SNS, 수익)
- `buyers` - 구매자 (포인트, 통계, 크리에이터 전환 자격)
- `products` - 상품 (가격, 배송, 이미지, 커미션율)

**캠페인:**
- `campaigns` - 공구/상시 캠페인
- `campaign_products` - 캠페인-상품 연결 (공구가 설정)
- `campaign_participations` - 크리에이터 참여 신청/승인

**크리에이터 숍:**
- `creator_shop_items` - 숍에 진열된 상품 (GONGGU/PICK)
- `collections` - 테마별 컬렉션
- `beauty_routines` / `routine_steps` - 뷰티 루틴
- `banners` - 배너 관리

**주문/정산:**
- `orders` / `order_items` - 주문
- `conversions` - 전환 기록 (DIRECT/INDIRECT)
- `settlements` - 정산

**구매자 기능:**
- `mall_subscriptions` - 숍 구독
- `community_posts` / `community_comments` / `community_likes` - 커뮤니티
- `product_questions` / `product_reviews` - Q&A, 리뷰
- `points_history` - 포인트 이력
- `buyer_wishlist` / `buyer_cart` - 위시리스트, 장바구니

**크리에이터 레벨:**
- `creator_levels` - 레벨 정의 (Bronze → Diamond)
- `creator_level_history` - 레벨 변경 이력

**라이브 쇼핑:**
- `live_sessions` / `live_products` - 라이브 세션
- `live_bot_settings` / `live_chat_messages` - 챗봇

**기타:**
- `short_urls` / `short_url_analytics` - 단축 URL
- `notifications` - 알림
- `shop_visits` - 방문 추적
- `promotion_kits` - 홍보 키트
- `legal_content` - 법적 문서 (다국어)
- `support_tickets` - 고객 지원
- `creator_applications` - 구매자→크리에이터 전환 신청

### Supabase Storage 버킷

- `products` - 상품 이미지
- `profiles` - 프로필 이미지

---

## 8. TypeScript 타입 정의

> 파일: `src/types/database.ts`

### Enum 타입

```typescript
export type UserRole = 'super_admin' | 'brand_admin' | 'creator' | 'buyer';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type CampaignType = 'GONGGU' | 'ALWAYS';
export type CampaignStatus = 'DRAFT' | 'RECRUITING' | 'ACTIVE' | 'ENDED';
export type RecruitmentType = 'OPEN' | 'APPROVAL';
export type ParticipationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ShopItemType = 'GONGGU' | 'PICK';
export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
export type ConversionType = 'DIRECT' | 'INDIRECT';
export type ConversionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type SettlementStatus = 'PENDING' | 'COMPLETED' | 'CARRIED_OVER';
export type SkinType = 'combination' | 'dry' | 'oily' | 'normal' | 'oily_sensitive';
export type PersonalColor = 'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool';
export type ProductCategory = 'skincare' | 'makeup' | 'hair' | 'body' | 'etc';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type ShippingFeeType = 'FREE' | 'PAID' | 'CONDITIONAL_FREE';
export type BannerType = 'HORIZONTAL' | 'VERTICAL';
export type BannerLinkType = 'EXTERNAL' | 'COLLECTION' | 'PRODUCT';
export type NotificationType = 'ORDER' | 'SHIPPING' | 'SETTLEMENT' | 'CAMPAIGN' | 'SYSTEM';
```

### 상수

```typescript
export const INDIRECT_COMMISSION_RATE = 0.03;  // 3%
export const COOKIE_WINDOW_HOURS = 24;
export const PLATFORM_FEE_RATE = 0.03;         // 3%
export const WITHHOLDING_TAX_RATE = 0.033;     // 3.3%
```

### 한국어 라벨

```typescript
export const SKIN_TYPE_LABELS = { combination: '복합성', dry: '건성', oily: '지성', normal: '중성', oily_sensitive: '수부지' };
export const PERSONAL_COLOR_LABELS = { spring_warm: '봄웜', summer_cool: '여름쿨', autumn_warm: '가을웜', winter_cool: '겨울쿨' };
export const PRODUCT_CATEGORY_LABELS = { skincare: '스킨케어', makeup: '메이크업', hair: '헤어', body: '바디', etc: '기타' };
export const ORDER_STATUS_LABELS = { PENDING: '결제대기', PAID: '결제완료', PREPARING: '배송준비', SHIPPING: '배송중', DELIVERED: '배송완료', CONFIRMED: '구매확정', CANCELLED: '취소', REFUNDED: '환불' };
export const COURIER_LABELS = { cj: 'CJ대한통운', hanjin: '한진택배', logen: '로젠택배', epost: '우체국택배', lotte: '롯데택배' };
```

---

## 9. 인프라 코드

### 9.1 미들웨어 (`src/middleware.ts`)

주요 기능:
- `/@username` 라우트 → `/username`으로 rewrite
- IP 기반 지역 감지 → 자동 locale 리다이렉트
- Supabase 세션 갱신
- 역할 기반 접근 제어 (admin, brand, creator, buyer)
- next-intl 미들웨어 적용

### 9.2 Supabase 클라이언트

**Browser (`src/lib/supabase/client.ts`):**
- `createClient()` - 브라우저용 클라이언트
- `getClient()` - 싱글톤 패턴

**Server (`src/lib/supabase/server.ts`):**
- `createClient()` - 서버 컴포넌트용 (cookies 사용)

**Middleware (`src/lib/supabase/middleware.ts`):**
- `updateSession()` - getSession() 사용 (getUser()보다 빠름)

**Storage (`src/lib/supabase/storage.ts`):**
- `uploadProductImage()` - 상품 이미지 업로드
- `deleteProductImage()` - 이미지 삭제

### 9.3 i18n 설정 (`src/lib/i18n/config.ts`)

지원 언어: `en, ja, ko, es, it, ru, ar, zh, fr, pt, de`

유틸리티 함수:
- `formatCurrency(amount, currency)` - 통화 포맷
- `formatNumber(amount, locale)` - 숫자 포맷
- `formatDate(date, locale)` - 날짜 포맷
- `isRTL(locale)` - 아랍어 RTL 감지

### 9.4 상태관리 (`src/lib/store/auth.ts`)

**Auth Store (Zustand + persist):**
```typescript
// 저장: user, brand, creator
// key: 'cnec-auth'
useAuthStore: { user, brand, creator, buyer, isLoading, setUser, setBrand, setCreator, logout }
```

**Cart Store (Zustand + persist):**
```typescript
// key: 'cnec-cart'
useCartStore: { items, addItem, removeItem, updateQuantity, clearCart, getTotal }
```

### 9.5 사용자 훅 (`src/lib/hooks/use-user.ts`)

- 마운트 시 `getSession()` → 사용자 데이터 로드
- 역할별 데이터 fetch (brands/creators/buyers 테이블)
- auth 변경 리스닝
- 5초 안전 타임아웃
- 동시 fetch 방지 (`fetchingRef`)

---

## 10. API 엔드포인트

### Frontend API Routes

| 경로 | 메서드 | 기능 |
|------|--------|------|
| `/api/payments/prepare` | POST | 주문 생성 (CNEC-YYYYMMDD-XXXXX), 재고 차감 |
| `/api/payments/complete` | POST | 결제 완료 → 전환 기록 생성 |
| `/api/payments/webhook` | POST | PortOne 웹훅 처리 |
| `/api/payment/confirm` | POST | TossPayments 결제 확인 (Basic auth) |
| `/api/orders/[id]/cancel` | POST | 주문 취소 + 재고 복구 (RPC) |
| `/api/notifications` | GET/PATCH | 알림 조회/읽음 처리 |
| `/api/track` | POST | 숍 방문 기록 (쿠키 기반) |
| `/api/seed` | GET | 테스트 데이터 시딩 |

### Backend API (FastAPI)

| 경로 | 기능 |
|------|------|
| `POST /api/reports/generate` | YouTube 영상 AI 분석 (Gemini) |
| `GET /api/reports/` | 리포트 목록 |
| `GET /api/reports/top/success` | 성공 리포트 TOP |
| `CRUD /api/creators/` | 크리에이터 프로필 |
| `CRUD /api/sponsorships/` | 스폰서십 중개 |
| `POST /api/prediction/` | 떡상 예측 |
| `GET /api/trends/weekly` | 주간 트렌드 |
| `POST /api/newsletter/subscribe` | 뉴스레터 구독 |

---

## 11. 페이지 구조

### 랜딩 (`[locale]/page.tsx`)
- 히어로 섹션 (CTA: 크리에이터/브랜드 시작)
- 공구 상품 캐러셀
- How it works (3단계)
- 크리에이터/브랜드별 혜택
- 통계 (상품수, 크리에이터수, 배송국)

### 인증 (6개 페이지)
- `/login` - 통합 로그인
- `/signup` - 통합 회원가입
- `/brand/login` - 브랜드 전용
- `/creator/login` - 크리에이터 전용
- `/buyer/login` - 구매자 전용
- `/buyer/signup` - 구매자 회원가입

### 크리에이터 숍 (4개)
- `/[username]` - 숍 메인 (공구/픽 탭, 뷰티 프로필, 컬렉션)
- `/[username]/product/[id]` - 상품 상세 (이미지 슬라이더, 카운트다운, 구매)
- `/[username]/checkout` - 결제 (TossPayments)
- `/orders` - 주문 조회

### 크리에이터 대시보드 (15개)
- `dashboard` - 방문/주문/매출/전환율
- `shop` - 숍 정보 편집
- `products` - 상품 관리 (브랜드 상품 추가/제거)
- `collections` - 컬렉션 CRUD
- `routines` - 뷰티 루틴 편집
- `banners` - 배너 관리
- `campaigns` - 공구 캠페인 목록
- `campaigns/my` - 내 참여 캠페인
- `orders` - 주문 현황
- `sales` - 판매 분석 (직접/간접 전환)
- `settlements` - 정산 내역
- `notifications` - 알림
- `settings` - 프로필/정산정보/뷰티프로필
- `live` - 라이브 쇼핑

### 구매자 대시보드 (10개)
- `dashboard`, `cart`, `orders`, `orders/[id]`
- `points`, `reviews`, `subscriptions`, `become-creator`

### 브랜드 대시보드 (14개)
- `dashboard` - 통계/공구 현황
- `products` / `products/new` - 상품 CRUD
- `campaigns/gonggu` / `campaigns/always` / `campaigns/new` - 캠페인
- `orders` - 주문 관리 (배송 처리)
- `creators` / `creators/pending` - 크리에이터 관리
- `settlements` - 정산
- `settings` - 6탭 설정 (일반, 브랜드라인, 배송국, 인증, 커미션, 정산)
- `support` - 고객지원 티켓
- `mocra` - FDA MoCRA 규정 준수

### 관리자 대시보드 (6개)
- `dashboard` - GMV, 주문, 브랜드, 크리에이터
- `brands` / `creators` - 승인/관리
- `settlements` - 정산 처리 (엑셀/PDF)
- `settings` - 플랫폼 설정

---

## 12. 컴포넌트 구조

### shadcn/ui 컴포넌트 (28개)
alert, avatar, badge, button, calendar, card, checkbox, command, dialog,
dropdown-menu, form, image-upload, input, label, popover, progress,
radio-group, scroll-area, select, separator, sheet, skeleton, slider,
sonner, switch, table, tabs, textarea

### 레이아웃 컴포넌트
- `header.tsx` - 상단 네비게이션 (로고, 언어 전환, 유저 메뉴)
- `sidebar.tsx` - 사이드바 (역할별 메뉴, 모바일 반응형)
- `notification-bell.tsx` - 실시간 알림 (30초 폴링)

### 숍 컴포넌트
- `creator-shop.tsx` - 크리에이터 숍 메인 (프로필, 뷰티태그, 공구/픽 탭, 컬렉션)
- `product-detail.tsx` - 상품 상세 (이미지 슬라이더, 카운트다운, 수량, 배송/환불)
- `legal-footer.tsx` - 법적 푸터 (KR/US/JP 자동 감지)

---

## 13. 백엔드 (FastAPI)

### 구조
```
backend/app/
├── main.py              # FastAPI 앱 + CORS + 라우터 등록
├── core/config.py       # 설정 (Supabase URL/Key, API 키)
├── db/
│   ├── database.py      # SQLAlchemy 연결
│   └── supabase_client.py # Supabase 클라이언트
├── models/models.py     # ORM (VideoData, NewsletterSubscriber, WeeklyReport, PredictionLog)
├── schemas/schemas.py   # Pydantic 스키마
├── api/                 # 6개 라우터
└── services/            # 비즈니스 로직
    ├── predictor.py     # 규칙 기반 떡상 예측
    ├── video_analyzer.py # Gemini + YouTube API 영상 분석
    └── youtube_collector.py # 뷰티 영상 수집
```

### Python 의존성 (주요)
```
fastapi, uvicorn, sqlalchemy, psycopg2-binary
google-generativeai, google-api-python-client
openai, pydantic, python-dotenv
pandas, numpy, beautifulsoup4
gunicorn, schedule
```

---

## 14. 다국어 (i18n)

### 지원 언어 (11개)

| 코드 | 언어 | 통화 | 국가 |
|------|------|------|------|
| `ko` | 한국어 | KRW | KR |
| `en` | English | USD | US |
| `ja` | 日本語 | JPY | JP |
| `zh` | 中文 | CNY | CN |
| `es` | Español | EUR | ES |
| `fr` | Français | EUR | FR |
| `de` | Deutsch | EUR | DE |
| `pt` | Português | BRL | BR |
| `it` | Italiano | EUR | IT |
| `ru` | Русский | RUB | RU |
| `ar` | العربية (RTL) | AED | AE |

### 번역 구조 (`src/messages/{locale}.json`)

```json
{
  "common": { "loading", "error", "save", "cancel", "delete", ... },
  "auth": { "login", "logout", "signup", "email", "password", ... },
  "nav": { "home", "dashboard", "products", "orders", "settlements", ... },
  "shop": { "addToCart", "buyNow", "outOfStock", "gonggu", "creatorPick", ... },
  "product": { "name", "price", "stock", "category", "commission", ... },
  "campaign": { "gonggu", "always", "createCampaign", "commissionRate", ... },
  "order": { "orderNumber", "status", "trackingNumber", "PENDING", "PAID", ... },
  "creator": { "myShop", "shopUrl", "pickProducts", "beautyProfile", ... },
  "brand": { "dashboard", "products", "campaigns", "orders", "creators", ... },
  "settlement": { "title", "period", "amount", "netAmount", ... },
  "dashboard": { "welcome", "totalRevenue", "totalOrders", ... },
  "home": { "title", "subtitle", "creatorCta", "brandCta", ... },
  "admin": { "brandManagement", "creatorManagement", ... },
  "footer": { "copyright", "terms", "privacy", "contact" }
}
```

---

## 15. 배포 설정

### Netlify (프론트엔드) - `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = ".next"
[build.environment]
  NODE_VERSION = "20"
[[plugins]]
  package = "@netlify/plugin-nextjs"
[[redirects]]
  from = "/"
  to = "/en/login"
  status = 302
[[redirects]]
  from = "/@*"
  to = "/en/@:splat"
  status = 302
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Render (백엔드) - `render.yaml`

```yaml
services:
  - type: web
    name: cnecplus
    runtime: python
    region: singapore
    rootDir: ./backend
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        value: sqlite:///./cnecplus.db
      - key: SECRET_KEY
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false
      - key: YOUTUBE_API_KEY
        sync: false
```

---

## 16. 설정 순서

### Step 1: Supabase 프로젝트 생성
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 마이그레이션 순서대로 실행:
   - `001_cnec_commerce.sql`
   - `002_cnec_v1_1.sql`
   - `003_buyer_shorturl_subscription_features.sql`
3. Storage 버킷 생성: `products`, `profiles`
4. Project URL, Anon Key, Service Role Key 복사

### Step 2: 프론트엔드 설치
```bash
cd frontend/kviewshop
npm install
```

### Step 3: 환경변수 설정
```bash
cp ../../.env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 등 입력
```

### Step 4: 시드 데이터
```bash
npm run seed
# 또는 브라우저에서 /api/seed 호출
```

### Step 5: 프론트엔드 실행
```bash
npm run dev  # http://localhost:3000
```

### Step 6: 백엔드 설치/실행
```bash
cd ../../backend
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

### Step 7: 배포
- **프론트엔드**: Netlify에 `frontend/kviewshop` 연결
- **백엔드**: Render에 `backend` 디렉토리 연결

---

## 17. 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | `admin@kviewshop.com` | `admin123!@#` |
| 브랜드 | `brand@kviewshop.com` | `brand123!@#` |
| 크리에이터 | `creator@kviewshop.com` | `creator123!@#` |

---

## 부록: 주요 코드 참조 위치

| 파일 | 위치 |
|------|------|
| 루트 레이아웃 | `src/app/layout.tsx` |
| 디자인 시스템 | `src/app/globals.css` |
| 미들웨어 | `src/middleware.ts` |
| DB 타입 | `src/types/database.ts` |
| Supabase 클라이언트 | `src/lib/supabase/client.ts` |
| Supabase 서버 | `src/lib/supabase/server.ts` |
| i18n 설정 | `src/lib/i18n/config.ts` |
| 인증 스토어 | `src/lib/store/auth.ts` |
| 유저 훅 | `src/lib/hooks/use-user.ts` |
| 결제 생성 | `src/app/api/payments/prepare/route.ts` |
| 결제 완료 | `src/app/api/payments/complete/route.ts` |
| 크리에이터 숍 | `src/components/shop/creator-shop.tsx` |
| 상품 상세 | `src/components/shop/product-detail.tsx` |
| 사이드바 | `src/components/layout/sidebar.tsx` |
| 시드 스크립트 | `scripts/seed-users.ts` |
| 마이그레이션 | `supabase/migrations/` |
| 한국어 번역 | `src/messages/ko.json` |

---

*이 문서는 KviewShop 프로젝트를 완전히 재구축하기 위한 종합 가이드입니다.*
*소스코드 전체는 이 레포지토리에 포함되어 있습니다.*
