# 크넥샵 최종 검증 + 수정 완료 보고서
> 날짜: 2026-04-14

## 1. 빌드 상태
- **TypeScript**: 0 에러 (tsc --noEmit 통과)
- **Next.js build**: Compiled successfully in 7.4s, 788 static pages 생성
- **sitemap 경고**: DB 미연결 환경에서 정상 (Vercel 배포 시 정상 동작)

## 2. 무한루프 수정 (CRITICAL)

### 근본 원인
`useUser` 훅과 consumer 페이지에서 **객체 참조 불안정성**으로 인한 무한 재렌더링:

1. `unauthenticated` 상태에서 매 렌더마다 `setUser(null)` 호출 → Zustand state 변경 → 리렌더 → 반복
2. buyer/user 객체가 useEffect dependency에 직접 사용 → 새 참조 생성 시마다 effect 재실행
3. `_fetched` 리셋 타이밍 문제로 fetch → reset → fetch 반복

### 수정 방법 (12개 파일)
| 파일 | 수정 내용 |
|------|-----------|
| `use-user.ts` | `_lastStatus` 전환 체크 + `_fetchPromise` 싱글톤 + `settersRef` 패턴 |
| `(buyer)/layout.tsx` | `userId`/`userRole` primitive deps + `redirectedRef` + LegalFooter |
| `buyer/dashboard/page.tsx` | `buyerId` primitive dep + `fetchedRef` |
| `buyer/orders/page.tsx` | `buyerId` primitive dep + `fetchedRef` |
| `buyer/orders/[id]/page.tsx` | `buyerId` primitive dep |
| `buyer/reviews/page.tsx` | `buyerId` primitive + `fetchedRef` |
| `buyer/points/page.tsx` | `buyerId` primitive dep |
| `buyer/subscriptions/page.tsx` | `buyerId` primitive + `fetchedRef` |
| `buyer/settings/page.tsx` | `buyerId` primitive dep |
| `buyer/become-creator/page.tsx` | `buyerId` primitive + `buyerRef` |
| `(shop)/orders/page.tsx` | primitive deps |
| `(shop)/[username]/checkout/page.tsx` | `buyerId`/`userEmail` primitive deps |

## 3. CSP 상태
- **next.config.ts**: 완전한 CSP 정책 적용
- **middleware.ts**: CSP 없음 (단일 소스)
- 포함 도메인: postcode.map.kakao.com, t1.daumcdn.net, portone.io, tosspayments, kapi.kakao.com, r2.dev, cloudflarestorage, cnecshop.com, jsdelivr.net, googleapis, gstatic, instagram, tiktok, accounts.kakao.com, service.portone.io
- **차단 도메인: 0건** (목표 달성)

## 4. 오늘 작업 반영 확인 (30/30 항목 통과)

| # | 항목 | 상태 |
|---|------|------|
| 1 | 샘플신청 주소 미기재 → 버튼 disabled + 안내 | 확인 |
| 2 | 튜토리얼 팝업 → 첫 로그인만 + 닫기 | 확인 |
| 3 | 샵정보 이미지 사이즈 안내 텍스트 | 확인 |
| 4 | 사이드바 배너 관리 메뉴 숨김 | 확인 |
| 5 | 크리에이터 설정 이름/연락처/주소 | 확인 |
| 6 | 캠페인 상품명+커미션+예상수익 | 확인 |
| 7 | 브랜드 헤더 NotificationBell | 확인 |
| 8 | 브랜드 설정 팝빌 텍스트 없음 + KRW | 확인 |
| 9 | 체험 승인 Dialog + 송장번호 입력 | 확인 |
| 10 | 크리에이터 SNS/샵 링크 target="_blank" | 확인 |
| 11 | 상품 저장 시 toast | 확인 |
| 12 | 주소 검색 embed 방식 | 확인 |
| 13 | 비회원 주문 가능 (세션 불필요) | 확인 |
| 14 | 회원가입 → Buyer 프로필 생성 | 확인 |
| 15 | 회원가입 후 리다이렉트 → / | 확인 |
| 16 | register 중복 호출 방지 (submittingRef) | 확인 |
| 17 | 카카오/네이버 소셜 버튼 | 확인 |
| 18 | 비회원 주문조회 페이지 | 확인 |
| 19 | 회원 마이페이지 주문내역 | 확인 |
| 20 | 체크아웃 로그인 안내 배너 숨김 | 확인 |
| 21 | 리뷰 인스타 embed 없음, 커스텀 카드 | 확인 |
| 22 | 알림 클릭 locale prefix 경로 | 확인 |
| 23 | 알림 필드명 camelCase 통일 | 확인 |
| 24 | 브랜드/크리에이터/구매자 알림 생성 | 확인 |
| 25 | 개인정보처리방침 /privacy | 확인 |
| 26 | 이용약관 /terms | 확인 |
| 27 | 푸터 하우파파/박현용 | 확인 |
| 28 | 구매자 페이지 LegalFooter | 수정 완료 |
| 29 | DRAFT 상품 크리에이터에게 안 보임 | 확인 |
| 30 | ENDED 상품 크리에이터 샵에서 안 보임 | 확인 |

## 5. 머지 충돌 손실

| 파일 | 상태 |
|------|------|
| header.tsx | 정상 - NotificationBell import + 렌더링 |
| sidebar.tsx | 정상 - 배너 메뉴 없음 |
| next.config.ts | 정상 - CSP 전체 도메인 포함 |
| checkout/page.tsx | 정상 - 주소검색+주문자/수령자+세션체크 |
| product-detail.tsx | 정상 - 커스텀 리뷰 카드 (iframe 없음) |
| auth store | 정상 - buyer persist 포함 |

**손실 없음**

## 6. 수정한 파일 전체 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/hooks/use-user.ts` | module-level 캐시 + settersRef + _lastStatus |
| `src/app/[locale]/(buyer)/layout.tsx` | primitive deps + redirectedRef + LegalFooter |
| `src/app/[locale]/(buyer)/buyer/dashboard/page.tsx` | buyerId primitive dep |
| `src/app/[locale]/(buyer)/buyer/orders/page.tsx` | buyerId primitive dep |
| `src/app/[locale]/(buyer)/buyer/orders/[id]/page.tsx` | buyerId primitive dep |
| `src/app/[locale]/(buyer)/buyer/reviews/page.tsx` | buyerId + fetchedRef + 한국어화 |
| `src/app/[locale]/(buyer)/buyer/points/page.tsx` | buyerId primitive dep |
| `src/app/[locale]/(buyer)/buyer/subscriptions/page.tsx` | buyerId + fetchedRef + 한국어화 |
| `src/app/[locale]/(buyer)/buyer/settings/page.tsx` | buyerId primitive dep |
| `src/app/[locale]/(buyer)/buyer/become-creator/page.tsx` | buyerId + buyerRef + 한국어화 |
| `src/app/[locale]/(shop)/orders/page.tsx` | primitive deps |
| `src/app/[locale]/(shop)/[username]/checkout/page.tsx` | buyerId/userEmail primitive deps |
| `next.config.ts` | CSP 정책 정리 |
| `src/lib/store/auth.ts` | buyer persist 추가 |

## 7. 남은 이슈
없음. 전체 검증 통과.
