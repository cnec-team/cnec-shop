# CLAUDE.md

## Project

CNEC Shop -- K-뷰티 크리에이터 커머스 플랫폼 (Next.js + Prisma + Railway PostgreSQL + NextAuth v5 + PortOne V2 + Cloudflare R2)

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **ORM**: Prisma 7 + Railway PostgreSQL
- **Auth**: NextAuth.js v5 (beta.30), Credentials provider
- **Payment**: PortOne V2 SDK (`@portone/browser-sdk/v2`)
- **Storage**: Cloudflare R2 (AWS S3 호환)
- **State**: Zustand (auth, cart stores)
- **UI**: shadcn/ui + Radix UI + lucide-react 아이콘
- **Toast**: sonner

## Repository Structure

- `frontend/kviewshop/` -- Next.js app (App Router, TypeScript, Tailwind CSS)
  - `src/app/` -- 페이지 라우트 (locale 기반)
  - `src/components/` -- 공통 컴포넌트
  - `src/lib/actions/` -- Server actions (brand.ts, creator.ts, buyer.ts, shop.ts, admin.ts)
  - `src/lib/store/` -- Zustand stores (auth, cart)
  - `src/lib/utils/` -- 유틸리티 (date.ts 등)
  - `src/lib/stock.ts` -- 재고 차감/복원 (Prisma 트랜잭션)
  - `prisma/schema.prisma` -- DB 스키마

## Payment Flow

1. `POST /api/payments/prepare` -- 주문 생성 + 재고 차감 (atomic transaction)
2. Client: PortOne SDK `requestPayment()` 호출
3. `POST /api/payments/complete` -- PortOne API로 결제 검증 + PENDING->PAID
4. `POST /api/payments/webhook` -- HMAC-SHA256 서명 검증 + 이중 금액 확인

## Deployment

- **Vercel**로 배포 (Netlify 사용하지 않음)
- main 브랜치에 머지 시 Vercel 자동 배포 트리거
- 도메인: `www.cnecshop.com`

## Git Rules

- 변경사항 완료 후 항상 **커밋 -> 푸시 -> PR 생성 -> squash 머지**까지 자동으로 진행
- 별도 지시 없는 한 main 브랜치에 머지하여 배포 트리거
- PR 제목은 한국어로 간결하게 작성
- 커밋 메시지는 conventional commits (feat/fix/chore) 형식

## Code Style

- 한국어 UI 텍스트 사용 (알림, 버튼, 메시지 등)
- Prisma camelCase <-> DB snake_case 혼용 주의 (`as any` 캐스팅 패턴 존재)
- Decimal 필드는 반드시 `Number()`로 변환 후 사용
- D-day 계산은 `src/lib/utils/date.ts`의 공유 유틸 사용 (Math.ceil 기준)
- Server actions에서 알림 생성 시 try/catch로 감싸서 알림 실패가 주요 로직에 영향 주지 않도록
- lucide-react 아이콘 사용 (이모지 사용 금지)
- sonner로 토스트 메시지 표시
- 환경 변수 fallback에 실제 키값 하드코딩 절대 금지

## Key Patterns

- Campaign status flow: DRAFT -> RECRUITING -> ACTIVE -> ENDED
- Campaign type: GONGGU (공구) | ALWAYS (상시)
- Notification types: ORDER, SHIPPING, SETTLEMENT, CAMPAIGN, SYSTEM
- Cart: Zustand persist store (`cnec-cart` localStorage key)
- Payment: PortOne V2 SDK 연동 (prepare -> SDK -> complete -> webhook)

## Security (2026-04-08 완료)

- 결제 웹훅 HMAC-SHA256 서명 검증
- 결제 완료 시 PortOne API 이중 검증 (금액 + 상태)
- 금액 불일치 시 자동 취소 + 주문 CANCELLED 처리
- 주문 소유권 검증 (로그인 유저: buyerId, 비회원: email+phone)

## Known Issues & TODO

- `api/payments/confirm/route.ts` -- 레거시 Toss Payments 코드 (미사용, 향후 제거 대상)
- `@tosspayments/tosspayments-sdk` -- package.json에 남아있음 (향후 제거 대상)

---

*최종 업데이트: 2026-04-08*
