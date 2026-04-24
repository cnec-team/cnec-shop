# 크넥샵 모바일 UX 전수 진단 리포트

**진단일**: 2026-04-24  
**진단 범위**: src/ 전체 (561개 TSX/TS 파일)  
**기준 뷰포트**: 375px (iPhone SE/13 mini) ~ 430px (iPhone 15 Pro Max)

---

## 1. 요약

| 항목 | 수치 |
|------|------|
| 점검한 주요 페이지 | 15개 |
| Critical 이슈 | 1건 |
| High 이슈 | 5건 |
| Medium 이슈 | 6건 |
| Low 이슈 | 5건 |
| **총 이슈** | **17건** |

---

## 2. Critical 이슈 (결제/주문 차단 수준)

### C-1. iOS Safari safe-area 미대응 (전역)

**현상**: iPhone 노치/Dynamic Island/홈바 영역과 콘텐츠가 겹칠 수 있음  
**영향 범위**: 전역 (모든 페이지)  
**상세**:
- `env(safe-area-inset-*)` 사용: **거의 없음** (globals.css, 공통 레이아웃에 미적용)
- 예외: 체크아웃 결제 버튼(`checkout/page.tsx`)과 상품 상세 구매 버튼만 `safe-area-inset-bottom` 적용
- 나머지 fixed bottom 요소(BottomNav, ShopBottomNav 등)는 미적용

**수정 방향**: 
- `globals.css`에 전역 safe-area 변수 설정
- 모든 fixed bottom 컴포넌트에 `pb-[env(safe-area-inset-bottom)]` 추가

---

## 3. High 이슈 (주요 페이지 사용성 저하)

### H-1. iOS Safari 100vh 버그 (81개 파일)

**현상**: `h-screen` / `min-h-screen` 사용 시 iOS Safari에서 주소바+탭바 높이가 포함되어 콘텐츠가 잘림  
**영향 파일**: 체크아웃, 장바구니, 레이아웃, 로그인 등 81개 파일  
**수정 방향**: `h-screen` → `h-dvh` (Tailwind v4 기본 지원), `min-h-screen` → `min-h-dvh`

### H-2. 장바구니 수량 버튼 터치 영역 부족

**파일**: `src/app/[locale]/(shop)/[username]/cart/page.tsx`  
**현상**: 수량 +/- 버튼이 `w-7 h-7` (28px) — WCAG 최소 44px 미달  
**영향**: 모바일에서 수량 변경 시 오조작 빈번  
**수정 방향**: `w-9 h-9` (36px) 이상, 이상적으로 `w-11 h-11` (44px)

### H-3. 체크아웃 수량 버튼도 동일 문제

**파일**: `src/app/[locale]/(shop)/[username]/checkout/page.tsx`  
**현상**: 수량 +/- 버튼 `w-7 h-7` (28px)  
**수정 방향**: H-2와 동일

### H-4. 상품 상세 위시리스트 버튼 터치 영역 부족

**파일**: `src/components/shop/product-detail.tsx`  
**현상**: 하트(위시리스트) 아이콘 `w-4 h-4` (16px) — 터치 영역 극도로 작음  
**수정 방향**: 아이콘 크기 유지하되 버튼 패딩으로 터치 영역 44px 확보 (`p-3` 추가)

### H-5. bare `<img>` 태그 16건 (이미지 최적화 누락)

**파일**: OnboardingTutorial.tsx, CreatorContentPreview.tsx, ImagesSection.tsx 등 11개 파일  
**현상**: `next/image` 미사용 → 모바일 LTE에서 원본 이미지 다운로드, 느림  
**수정 방향**: `<img>` → `<Image>` 전환, `sizes` prop으로 모바일 최적화

---

## 4. Medium 이슈 (부분 UX 문제)

### M-1. 관리자/브랜드 테이블 모바일 비대응 (20+ 페이지)

**현상**: 대부분의 admin/brand 페이지가 `<Table>` + `overflow-x-auto`로만 처리  
**영향 페이지**: 크리에이터 관리, 상품 관리, 캠페인 관리, 주문 관리 등  
**판단**: 브랜드/관리자는 데스크톱 우선이므로 Medium. 단, 크리에이터 대시보드는 모바일 사용 가능성 있음  
**수정 방향**: 크리에이터 대시보드만 카드 뷰 전환 우선 적용

### M-2. 전화번호 input에 type="tel" 미사용

**영향 파일**: 체크아웃, 회원가입 등 폼 페이지  
**현상**: 전화번호 필드에 `type="tel"` 미적용 → 모바일에서 숫자 키패드 대신 일반 키보드 표시  
**수정 방향**: 전화번호 필드에 `type="tel"` 또는 `inputMode="tel"` 추가

### M-3. 이메일 input에 inputMode 미설정

**현상**: 이메일 필드에 `inputMode="email"` 미적용 → @ 키 표시 안 될 수 있음  
**수정 방향**: `type="email"` 확인 (이미 사용 중이면 OK)

### M-4. 코드 스플리팅 미적용

**현상**: `dynamic()` 사용 1건(admin 대시보드)만 존재  
**영향**: 모바일 초기 로딩 번들 크기 증가  
**수정 방향**: 무거운 컴포넌트(차트, 에디터, 관리자 페이지)에 `dynamic()` 적용

### M-5. 바텀시트 패턴 미사용

**현상**: 모바일 상세 보기가 Side Sheet(좌/우 슬라이드)로 구현  
**판단**: 모바일에서는 바텀시트가 더 자연스러운 UX  
**수정 방향**: 선택적 개선 — Sheet 컴포넌트에 `side="bottom"` 옵션 추가

### M-6. wildcard import 37건

**파일**: 생성 코드 제외 시 활성 컴포넌트에서도 다수  
**영향**: 번들 크기 증가, 모바일 로딩 느림  
**수정 방향**: named import로 전환

---

## 5. Low 이슈 (선택 개선)

### L-1. Tailwind config 파일 부재

**현상**: `tailwind.config.*` 파일 없음 (Tailwind v4 CSS-first config 사용)  
**영향**: 커스텀 breakpoint 설정이 필요할 때 확장 어려움  
**판단**: 현재 기본 breakpoint로 충분하므로 Low

### L-2. lazy loading 전략 부재

**현상**: React.lazy() 0건, next/dynamic 1건  
**수정 방향**: 라우트별 코드 스플리팅은 Next.js App Router가 자동 처리하므로 개별 컴포넌트 단위만 필요

### L-3. 비회원 주문조회 주소 표시 320px 줄바꿈

**파일**: `src/app/[locale]/(shop)/orders/page.tsx`  
**현상**: 극소 화면(320px)에서 주소 텍스트 `text-right + ml-4`로 줄바꿈 어색  
**판단**: 320px 기기는 극소수이므로 Low

### L-4. max-w-[480px] 사용 (BuyerHomePage 등)

**파일**: BuyerHomePage.tsx, 일부 레이아웃  
**현상**: 375px 뷰포트에서 480px 제한은 문제 없음 (padding으로 실제 콘텐츠 좁아짐)  
**판단**: 실제 overflow 발생하지 않음, Low

### L-5. 크리에이터 대시보드 모바일 대응 미비

**현상**: 데스크톱 중심 레이아웃  
**판단**: 크리에이터는 주로 모바일 사용하므로 향후 개선 필요하나 현재는 Low

---

## 6. 페이지별 상세 리포트

### 6-1. 체크아웃 페이지
- **경로**: `/[locale]/[username]/checkout`
- **파일**: `src/app/[locale]/(shop)/[username]/checkout/page.tsx`
- **컨테이너**: `max-w-lg mx-auto px-4` ✅
- **결제 버튼**: fixed bottom + safe-area ✅
- **위젯 컨테이너**: `w-full`, overflow 제한 없음 ✅
- **문제**: 수량 버튼 28px (H-3)

### 6-2. 결제 성공 페이지
- **경로**: `/[locale]/payment/success`
- **파일**: `src/app/[locale]/payment/success/page.tsx`
- **컨테이너**: `max-w-md px-4` ✅
- **문제**: 없음

### 6-3. 결제 실패 페이지
- **경로**: `/[locale]/payment/fail`
- **파일**: `src/app/[locale]/payment/fail/page.tsx`
- **컨테이너**: `max-w-md px-4` ✅
- **문제**: 없음

### 6-4. 크리에이터 샵
- **경로**: `/[locale]/[username]`
- **파일**: `src/components/shop/creator-shop.tsx`
- **컨테이너**: `max-w-[480px] mx-auto` ✅
- **상품 그리드**: `grid-cols-2 gap-3` ✅
- **문제**: 없음

### 6-5. 상품 상세
- **경로**: `/[locale]/[username]/product/[productId]`
- **파일**: `src/components/shop/product-detail.tsx`
- **컨테이너**: `max-w-lg mx-auto` ✅
- **구매 버튼**: fixed bottom + safe-area ✅
- **문제**: 위시리스트 하트 16px (H-4)

### 6-6. 장바구니
- **경로**: `/[locale]/[username]/cart`
- **파일**: `src/app/[locale]/(shop)/[username]/cart/page.tsx`
- **컨테이너**: `max-w-lg mx-auto` ✅
- **결제 버튼**: fixed bottom ✅
- **문제**: 수량 버튼 28px (H-2)

### 6-7. 로그인
- **경로**: `/[locale]/buyer/login`
- **파일**: `src/app/[locale]/(auth)/buyer/login/page.tsx`
- **컨테이너**: `max-w-md p-4` ✅
- **버튼**: `h-12` (48px) ✅
- **문제**: 없음

### 6-8. 회원가입
- **경로**: `/[locale]/signup`
- **파일**: `src/app/[locale]/(auth)/buyer/signup/page.tsx`
- **컨테이너**: `max-w-md p-6` ✅
- **버튼**: `h-12` ✅
- **문제**: 없음

### 6-9. 주문 내역
- **경로**: `/[locale]/buyer/orders`
- **파일**: `src/app/[locale]/(buyer)/buyer/orders/page.tsx`
- **레이아웃**: 카드 기반 (테이블 아님) ✅
- **필터 탭**: `overflow-x-auto` 가로 스크롤 ✅
- **문제**: 없음

### 6-10. 주문 상세
- **경로**: `/[locale]/buyer/orders/[id]`
- **파일**: `src/app/[locale]/(buyer)/buyer/orders/[id]/page.tsx`
- **레이아웃**: `lg:grid-cols-3` → 모바일 단일 컬럼 ✅
- **문제**: 없음

### 6-11. 홈/랜딩
- **경로**: `/[locale]`
- **파일**: `src/components/home/LandingContent.tsx`
- **그리드**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` ✅
- **컨테이너**: `max-w-[1200px] mx-auto px-5` ✅
- **문제**: 없음

---

## 7. 수정 우선순위 제안

### Phase A: 결제/주문 플로우 (최우선, 1일)
| 이슈 | 작업 | 난이도 |
|------|------|--------|
| H-2/H-3 | 수량 버튼 터치 영역 확대 (w-7→w-9) | 쉬움 |
| C-1 | 체크아웃 이외 fixed bottom에 safe-area 추가 | 쉬움 |
| H-4 | 위시리스트 버튼 터치 영역 확대 | 쉬움 |

### Phase B: 전역 iOS 대응 (중요, 2일)
| 이슈 | 작업 | 난이도 |
|------|------|--------|
| H-1 | h-screen → h-dvh 전환 (81파일, 일괄 치환 가능) | 중간 |
| C-1 | BottomNav, ShopBottomNav에 safe-area 추가 | 쉬움 |
| M-2/M-3 | input type="tel", inputMode 추가 | 쉬움 |

### Phase C: 이미지 최적화 (3일)
| 이슈 | 작업 | 난이도 |
|------|------|--------|
| H-5 | bare `<img>` → next/image 전환 (16건) | 중간 |

### Phase D: 대시보드 모바일 대응 (선택)
| 이슈 | 작업 | 난이도 |
|------|------|--------|
| M-1 | 크리에이터 대시보드 테이블 → 카드 뷰 | 높음 |
| M-5 | Sheet side → bottom 전환 | 중간 |
| M-4/M-6 | 코드 스플리팅, wildcard import 정리 | 중간 |

---

## 8. 카이가 실기기로 확인해야 할 체크리스트

### iPhone (Safari)
- [ ] 체크아웃 페이지 → 결제 버튼이 홈바와 겹치지 않는지
- [ ] 체크아웃 페이지 → 토스 결제 UI(카드사 아이콘, 간편결제 탭)가 전부 보이는지
- [ ] 체크아웃 페이지 → 토스 약관 체크박스가 화면 안에 보이는지
- [ ] 체크아웃 페이지 → 결제 버튼 클릭 → 토스 결제창 정상 표시
- [ ] 장바구니 → 수량 +/- 버튼 정확히 탭 가능한지
- [ ] 상품 상세 → 이미지 스와이프 정상
- [ ] 상품 상세 → 위시리스트 하트 누르기 쉬운지
- [ ] 주문 완료 페이지 → 주문번호 전체 표시
- [ ] 홈 화면 → 가로 스크롤 발생하지 않는지
- [ ] 크리에이터 샵 프로필 헤더 → 텍스트 잘림 없는지
- [ ] iOS Safari 주소바 숨김 시 페이지 하단 콘텐츠 가려지는지 (100vh 버그)

### Android (Chrome)
- [ ] 체크아웃 결제 UI 정상 렌더링
- [ ] 전화번호 입력 시 숫자 키패드 뜨는지
- [ ] 결제 후 리다이렉트 정상
- [ ] 이미지 로딩 속도 체감 (LTE 환경)

---

## 9. 긍정적 발견 (잘 되어 있는 것)

- 모든 구매자 대면 페이지가 `max-w-lg` / `max-w-md` + `px-4`로 적절히 제한
- 상품 그리드가 `grid-cols-2`로 모바일 최적화
- 주문 내역이 카드 기반 (테이블 아님) — 모바일 친화적
- 체크아웃/상품상세 결제 버튼 fixed bottom + safe-area 적용
- input 컴포넌트가 `text-base` (16px) 사용 — iOS 자동 확대 방지
- viewport 메타 태그 올바르게 설정 (`width=device-width, initial-scale=1, maximum-scale=5`)
- 주소 검색이 embed 방식 — 모바일 팝업 차단 우회

---

*Generated: 2026-04-24 (읽기 전용 진단, 코드 수정 없음)*
