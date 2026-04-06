# CLAUDE.md

## Project

CNEC Shop — K-뷰티 크리에이터 커머스 플랫폼 (Next.js + Prisma + PostgreSQL + Supabase)

## Repository Structure

- `frontend/kviewshop/` — Next.js app (App Router, TypeScript, Tailwind CSS)
  - `src/app/` — 페이지 라우트 (locale 기반)
  - `src/components/` — 공통 컴포넌트
  - `src/lib/actions/` — Server actions (brand.ts, creator.ts, buyer.ts, shop.ts, admin.ts)
  - `src/lib/store/` — Zustand stores (auth, cart)
  - `src/lib/utils/` — 유틸리티 (date.ts 등)
  - `prisma/schema.prisma` — DB 스키마

## Deployment

- **Vercel**로 배포 (Netlify 사용하지 않음)
- main 브랜치에 머지 시 Vercel 자동 배포 트리거
- 도메인: `www.cnecshop.com`

## Git Rules

- 변경사항 완료 후 항상 **커밋 → 푸시 → PR 생성 → squash 머지**까지 자동으로 진행
- 별도 지시 없는 한 main 브랜치에 머지하여 배포 트리거
- PR 제목은 한국어로 간결하게 작성
- 커밋 메시지는 conventional commits (feat/fix/chore) 형식

## Code Style

- 한국어 UI 텍스트 사용 (알림, 버튼, 메시지 등)
- Prisma camelCase ↔ DB snake_case 혼용 주의 (`as any` 캐스팅 패턴 존재)
- D-day 계산은 `src/lib/utils/date.ts`의 공유 유틸 사용 (Math.ceil 기준)
- Server actions에서 알림 생성 시 try/catch로 감싸서 알림 실패가 주요 로직에 영향 주지 않도록
- lucide-react 아이콘 사용
- sonner로 토스트 메시지 표시

## Key Patterns

- Campaign status flow: DRAFT → RECRUITING → ACTIVE → ENDED
- Campaign type: GONGGU (공구) | ALWAYS (상시)
- Notification types: ORDER, SHIPPING, SETTLEMENT, CAMPAIGN, SYSTEM
- Cart: Zustand persist store (`cnec-cart` localStorage key)
- Payment: PortOne SDK 연동
