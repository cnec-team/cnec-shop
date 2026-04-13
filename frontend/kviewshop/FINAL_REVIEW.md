# 크넥샵 최종 검증 리포트
> 날짜: 2026-04-13

## 빌드 상태
- **TypeScript (`tsc --noEmit`)**: 0 에러
- **Next.js build (`next build`)**: 성공 (sitemap DB 연결 경고만 — 로컬 DB 미실행 환경이라 정상)

## 오늘 작업 반영 확인

### 크리에이터 센터

| 항목 | 상태 | 비고 |
|------|------|------|
| 샘플신청 시 배송지 미기재 → 신청 버튼 비활성 | ⚠️ 부분 | toast 차단 + 모달 gating 존재하나, 버튼 `disabled` 속성에 `!savedAddress` 미포함 (`trial/page.tsx:365`) |
| 튜토리얼 팝업 neverShowAgain 로직 | ✅ 완료 | `OnboardingTutorial.tsx:60,78` — `neverShowAgain` 상태 + 조건 분기 |
| 샵정보 이미지 업로드 사이즈 안내 | ✅ 완료 | `creator/shop/page.tsx:283,295` — 프로필 400x400, 배너 1200x400 안내 |
| 사이드바 배너 관리 메뉴 숨김 | ✅ 완료 | `sidebar.tsx` — 배너 메뉴 항목 제거됨, banners 페이지도 리다이렉트 처리 |
| 크리에이터 설정 이름/연락처/주소 | ✅ 완료 | `creator/settings/page.tsx:295,303,338-350` |
| 캠페인 클릭 시 상세 정보 표시 | ⚠️ 부분 | 카드에 브랜드/예상수익/종료일 표시됨. 상품명 미표시, 전용 상세 페이지 없음 (클릭 시 신청 다이얼로그만 열림) |

### 브랜드 어드민

| 항목 | 상태 | 비고 |
|------|------|------|
| 헤더 NotificationBell import | ✅ 완료 | `header.tsx:18,71` — import + 렌더링 정상 |
| 설정 페이지 "팝빌" 텍스트 없음 | ✅ 완료 | 브랜드 전 파일에 "팝빌" 텍스트 0건 |
| 최소 지급액 KRW 표시 | ✅ 완료 | `brand/settings/page.tsx:416-420` — ₩ 기호 포함 |
| 체험 승인 후 안내 Dialog | ✅ 완료 | `brand/trial/page.tsx:336-358` — "승인 완료" Dialog + CheckCircle2 아이콘 |
| 크리에이터 SNS 링크 target="_blank" | ✅ 완료 | `brand/creators/page.tsx`, `trial/page.tsx`, `pending/page.tsx` — `target="_blank" rel="noopener noreferrer"` |
| 상품 저장 시 toast("저장되었습니다") | ❌ 미반영 | 상품 생성/수정 페이지에 toast 없음. 저장 후 바로 redirect만 수행 |

### 구매자 플로우

| 항목 | 상태 | 비고 |
|------|------|------|
| CSP frame-src postcode.map.kakao.com | ✅ 완료 | `next.config.ts:28` |
| 체크아웃 주소 검색 embed 방식 | ✅ 완료 | `checkout/page.tsx:207-247` — `.embed()` 방식 |
| 비회원 주문 가능 | ✅ 완료 | `payments/prepare/route.ts:145-151` — 세션 없이 주문 생성 허용 |
| 회원가입 API Buyer 프로필 생성 | ✅ 완료 | `api/auth/register/route.ts:91-99` — `prisma.buyer.create()` |
| 카카오/네이버 소셜 로그인 버튼 | ✅ 완료 | `buyer/login/page.tsx:120-144` — env 없으면 숨김 (`/api/auth/providers-status`) |
| 비회원 주문조회 페이지 | ✅ 완료 | `(shop)/orders/page.tsx` — 주문번호+전화번호 조회 |
| 회원 마이페이지 주문내역 | ✅ 완료 | `buyer/orders/page.tsx` + `buyer/orders/[id]/page.tsx` |

### 알림

| 항목 | 상태 | 비고 |
|------|------|------|
| 알림 클릭 시 locale prefix 경로 | ✅ 완료 | `notification-bell.tsx:208-219` — locale 접두사 확인 후 추가 |
| 알림 필드명 camelCase 통일 | ✅ 완료 | `linkUrl` 일관 사용, snake_case 0건 |
| 브랜드/크리에이터/구매자 알림 생성 | ✅ 완료 | `brand.ts`, `creator.ts`, `buyer.ts`, `shop.ts` 모두 `sendNotification` 호출 |

### 법적고지

| 항목 | 상태 | 비고 |
|------|------|------|
| 개인정보처리방침 (/privacy) | ✅ 완료 | `[locale]/privacy/page.tsx` — 하우파파/박현용 정보 포함 |
| 이용약관 (/terms) | ✅ 완료 | `[locale]/terms/page.tsx` — 하우파파 정보 포함 |
| 푸터 회사정보 | ✅ 완료 | `legal-footer.tsx:97` + 메인 `page.tsx:924` |
| 모든 샵 페이지 푸터 노출 | ⚠️ 부분 | `[username]/layout.tsx`에 LegalFooter 포함. 비회원 주문조회(`orders/page.tsx`)와 최상위 샵 페이지에는 미포함 |

### 상품 노출 로직

| 항목 | 상태 | 비고 |
|------|------|------|
| DRAFT 상품 크리에이터 탐색 숨김 | ✅ 완료 | `creator.ts:465-466` — RECRUITING/ACTIVE만 조회 |
| ENDED 상품 크리에이터 샵 숨김 | ✅ 완료 | `[username]/page.tsx:39-43` — ACTIVE 캠페인만 표시 |

## 머지 충돌 손실

| 파일 | 상태 | 비고 |
|------|------|------|
| header.tsx | ✅ 정상 | NotificationBell import + 렌더링 유지 |
| sidebar.tsx | ✅ 정상 | 배너 메뉴 숨김 유지 |
| next.config.ts | ✅ 정상 | CSP 모든 도메인 포함 (kakao, daumcdn, portone, R2 등) |

머지 충돌 아티팩트(`<<<<<<<`, `=======`, `>>>>>>>`) 0건. 이전 머지 내용 덮어쓴 흔적 없음.

## 발견된 문제

1. **상품 저장 toast 미구현** — `brand/products/new/page.tsx`, `brand/products/[id]/page.tsx`에서 저장 성공 시 toast 없이 바로 redirect. `brand/settings/page.tsx`에는 정상 적용되어 있어 누락으로 판단.

2. **샘플신청 버튼 disabled 조건 불완전** — `creator/trial/page.tsx:365`에서 버튼 disabled가 `submitting || !savedName || !savedPhone`만 체크. `!savedAddress`가 누락됨. 모달 열기 시 toast 차단은 존재하나 버튼 자체는 주소 없이도 활성화됨.

3. **캠페인 상세 정보 뷰 불완전** — 크리에이터 캠페인 카드에 브랜드/예상수익/종료일은 표시되나, 상품명이 UI에 미표시. 클릭 시 신청 다이얼로그만 열리며 전용 상세 페이지 없음.

4. **일부 샵 페이지 LegalFooter 미노출** — 비회원 주문조회 페이지(`/orders`)와 최상위 샵 랜딩 페이지에 `LegalFooter` 컴포넌트 미포함.

## 미반영 항목

| 항목 | 설명 |
|------|------|
| 상품 저장 toast | 브랜드 상품 생성/수정 시 "저장되었습니다" toast 호출 필요 |

## 총 점검 결과

- **전체 항목**: 27개
- **완료**: 22개 (81%)
- **부분 완료**: 4개 (15%) — 동작은 하나 개선 필요
- **미반영**: 1개 (4%) — 상품 저장 toast
- **머지 충돌 손실**: 0건
- **빌드/타입 에러**: 0건
