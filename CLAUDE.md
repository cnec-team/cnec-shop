# CLAUDE.md

## Project

CNEC Shop -- K-뷰티 크리에이터 커머스 플랫폼 (Next.js + Prisma + Railway PostgreSQL + NextAuth v5 + PortOne V2 + Cloudflare R2)

## Development Environment

- 카이는 항상 맥(iMac)에서 Claude Code 실행
- WSL/Linux 환경 가정 금지
- .env.local DATABASE_URL = Railway 연결 기준 (127.0.0.1 가정 금지)
- 환경 확인 질문 생략, 바로 작업 시작

## Package Manager
- 이 프로젝트는 **pnpm** 사용. `npm install` 절대 금지.
- 패키지 설치: `pnpm add [패키지명]`
- 개발 의존성: `pnpm add -D [패키지명]`
- `npm install` 사용 시 Vercel 빌드 실패함

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

### 제품 체험 신청 (시딩 플로우)

크리에이터가 제품을 직접 써보고 공구 여부를 결정하는 구조.
시딩 프로세스를 플랫폼 안에 내재화한 기능.

**플로우:**
1. 크리에이터가 상품 카탈로그에서 "체험 신청" 클릭
2. 브랜드가 크리에이터 프로필 확인 후 승인/거절
3. 승인 → 브랜드가 샘플 발송
4. 크리에이터가 제품 사용
5. 공구 진행 여부 크리에이터가 결정
   → 진행 O: 공구 캠페인 참여 또는 크리에이터픽 추가
   → 진행 X: 패스 (불이익 없음)

**왜 이 구조인가:**
- 브랜드: 승인권 보유 → 원하는 크리에이터에게만 타겟 시딩
- 크리에이터: 직접 써본 제품만 추천 → 팔로워 신뢰도 상승
- 플랫폼: 체험→공구 전환 데이터 축적 → 매칭 고도화
- 대기 고객사 1,000개+ 규모에서 수동 시딩은 한계 → 시스템화 필수

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

## Git 자동화 규칙
- 작업 완료 후 반드시 커밋 + 푸시 + main 머지까지 자동 실행
- PR 생성 불필요, 직접 머지
- git checkout main && git pull origin main && git merge [브랜치] --no-ff && git push origin main
- 중간에 질문하지 말고 끝까지 자율 실행

## Prompt Authoring Rules (claude.ai → Claude Code)

claude.ai에서 Claude Code용 실행 프롬프트를 작성할 때 항상 아래 규칙을 따른다.
카이가 추가로 지시하지 않아도 기본 적용되는 규칙.

### 1. 포맷
- 반드시 마크다운 코드블록(```)으로 감싸서 제공 — 카이가 바로 복사·붙여넣기 가능하도록
- 프롬프트 외부 설명은 최소화. 프롬프트 자체에 모든 컨텍스트 포함
- 여러 단계로 쪼개지 말고 하나의 블록에 완결시킴 (STEP 0 ~ STEP N 구조)

### 2. 필수 헤더 (모든 프롬프트 최상단에 포함)
승인 없이 끝까지 실행. 질문하지 말고 진행.
에러 발생 시 스스로 해결 시도.
작업 완료 후 커밋+푸시+main 머지까지 자동 실행 (PR 불필요).
git 명령 순서: git checkout main && git pull origin main && git merge [브랜치] --no-ff && git push origin main

### 3. 구조 (7단계 고정)
1. **작업 개요** — 무엇을 왜 하는지 3~5줄
2. **브랜치명** — `feat/` `fix/` `chore/` `docs/` prefix + kebab-case + v1/v2 suffix
3. **STEP 0: 현황 파악** — 수정 전 반드시 실행할 grep/find 명령어 묶음
4. **STEP 1 ~ N: 작업 단계** — 각 단계마다 대상 파일 + Before/After 코드 + 주의사항
5. **100점 체크리스트** — 완료 후 검증할 항목을 STEP별로 분리 + 공통 검증 + Git 완료 3개 그룹
6. **완료 후 보고 포맷** — 변경 파일 목록 / build 결과 / 커밋 해시 / 체크리스트 통과 여부
7. **(선택) 롤백 시나리오** — 중대 변경(migration, 대량 삭제) 시에만 포함

### 4. STEP 0 현황 파악 의무
- 기존 코드를 수정하는 모든 프롬프트는 STEP 0 필수
- grep → 수정 → grep 재검증 원칙을 프롬프트에도 반영
- 파악 항목: 대상 파일 위치, 기존 구현 흔적, 중복 구현 여부, 관련 DB 스키마

### 5. Before/After 코드 블록
- 설명만 적지 말고 실제 코드 스니펫을 Before/After로 제시
- Claude Code가 추측하게 만들지 않음
- 타입, import 문, props 전부 명시

### 6. 기술 규칙 자동 포함
모든 프롬프트에 다음이 자연스럽게 녹아있어야 함:
- TypeScript strict mode
- shadcn/ui 컴포넌트 사용
- lucide-react 아이콘만 (이모지 금지)
- sonner 토스트
- 한국어 UI (영어 노출 금지)
- Decimal → Number() 변환
- Prisma migration 후 `npx prisma generate`
- sendNotification 호출 시 try/catch 감싸기
- `npm run build` 통과 + TypeScript 에러 0개

### 7. 100점 체크리스트 원칙
- STEP별로 검증 항목 분리 (STEP 1 검증 / STEP 2 검증 / ...)
- 공통 검증 그룹 (build, 반응형, 회귀 테스트)
- Git 완료 그룹 (브랜치, 커밋, 머지, 푸시)
- 각 항목은 `- [ ]` 체크박스 형식
- "정상 동작" 같은 모호한 표현 금지 → "A 클릭 시 B 페이지로 이동" 같이 구체적으로
- 항목 하나하나가 실제로 눈으로 확인 가능해야 함

### 8. 병렬 작업 판단
- 파일 충돌 위험이 있으면 순차 실행 지시
- 독립적 작업이면 병렬 실행 가능 명시
- 카이가 병렬 가능 여부를 먼저 물어볼 가능성 → 프롬프트에 미리 표시

### 9. 완료 후 보고 포맷 강제
✅ 완료: [작업명]
변경 파일:

path/to/file1.tsx — [변경 요약]
path/to/file2.ts — [변경 요약]

체크리스트 전체 통과 여부: O/X
npm run build 결과: 통과/실패
커밋 해시: xxx
main 머지 해시: xxx

### 10. 금지 사항
- "~하면 좋을 것 같습니다" 같은 모호한 지시
- "기존 코드 스타일 참고" 같은 추상적 지시
- STEP 0 없는 수정 프롬프트
- 체크리스트 없는 완료 조건
- Before/After 코드 없는 UI 변경 지시
- 파일럿/MVP/최소 기능 프레이밍
