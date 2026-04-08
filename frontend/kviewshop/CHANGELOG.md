# 변경 이력 (Changelog)

모든 주요 변경 사항이 이 파일에 기록됩니다.

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)

---

## [1.2.0] - 2026-04-08

### 추가 (Added)
- 결제 시스템 PortOne V2 연동
  - `POST /api/payments/prepare` -- 주문 생성 + 원자적 재고 차감
  - `POST /api/payments/complete` -- PortOne API 결제 검증 + 주문 상태 갱신
  - `POST /api/payments/webhook` -- HMAC-SHA256 웹훅 서명 검증
  - 체크아웃 페이지 PortOne SDK (`@portone/browser-sdk/v2`) 연동
  - 신용카드, 카카오페이, 네이버페이, 토스페이 결제 수단 지원

- 보안 인프라
  - 웹훅 HMAC-SHA256 서명 검증 (timing-safe comparison)
  - 결제 완료 시 PortOne API 이중 검증 (금액 + 상태)
  - 금액 불일치 자동 취소 + CANCELLED 처리
  - 주문 소유권 검증 (로그인: buyerId / 비회원: email+phone)

- error.tsx / loading.tsx 전 라우트 커버리지 (70+ 페이지)

- 상품 등록 UX 개선
  - 커미션 미리보기 계산기
  - 이미지 최소 해상도(800x800) 경고
  - 외부 상세페이지 URL 입력

### 변경 (Changed)
- 인프라 마이그레이션 완료
  - Supabase Auth -> NextAuth.js v5 (Credentials provider)
  - Supabase Storage -> Cloudflare R2 (AWS S3 호환)
  - Supabase DB -> Railway PostgreSQL + Prisma ORM

- UI 전면 리디자인
  - 크리에이터 샵 (토스/배민급 미니멀 UI)
  - 브랜드 어드민 (스마트스토어급 UI)
  - 크리에이터 센터 모바일 UX
  - 체크아웃 플로우 재설계

- 상품 관리 페이지 디자인 개선 (설정 변경/삭제 버튼)
- 캠페인 캘린더 + 카드 UX 리디자인
- 캠페인 카드에 마감일 + 모집 현황 표시

### 수정 (Fixed)
- 체크아웃 가격 NaN 표시 수정 (localStorage 깨진 카트 복구)
- Decimal 필드 직렬화 오류 수정 (Prisma -> Client 컴포넌트)
- snake_case vs camelCase 불일치 수정 (크리에이터 샵)
- 커미션율 overflow 수정
- CSP 이미지 정책 수정 (R2 도메인 허용)
- D-day 계산 오류 수정
- 도메인 www.cnecshop.com 통일
- useCountUp 훅 React hooks rules 위반 수정
- 크리에이터 사용 단계(MissionWidget) 제거 + 불필요 네비 삭제

### 제거 (Removed)
- Supabase 전체 의존성 제거
- Netlify 배포 설정 제거 (Vercel로 통일)
- 다크 테마 + 로즈 강조색 제거 (라이트 퍼스트)
- .env.example에서 TOSS_SECRET_KEY 제거

### 보안 (Security)
- CRITICAL 4건 해결 완료 (웹훅 서명, 이중 검증, 금액 불일치 자동 취소, 소유권 검증)

---

## [1.0.0] - 2026-02-03

### 추가 (Added)
- 브랜드 수수료 설정 페이지 (`/brand/settings`)
- 크리에이터 설정 페이지 (`/creator/settings`)
- 상품 이미지 업로드 기능 (ImageUpload 컴포넌트, Cloudflare R2)
- 정산 내보내기 기능 (`/admin/settlements`)

### 변경 (Changed)
- 상품 등록 폼 개선 (탭 형식, 다국어)
- 관리자 정산 페이지 개선

### 수정 (Fixed)
- 크리에이터/브랜드 페이지 무한 로딩 버그 수정
- 모든 페이지 한국어 번역 누락 수정

### 제거 (Removed)
- 모든 페이지에서 가상(Mock) 데이터 제거

---

## [0.9.0] - 2026-02-03

### 추가 (Added)
- 초기 플랫폼 구축
- 관리자/브랜드/크리에이터 3-tier 시스템
- MoCRA 모니터링 페이지
- 다국어 지원 (ko, en, ja)

---

## 알려진 이슈

### 향후 제거 대상
- [ ] `api/payments/confirm/route.ts` -- 레거시 Toss Payments 코드 (미사용)
- [ ] `@tosspayments/tosspayments-sdk` -- package.json에 잔존

### 개선 예정
- [ ] 이미지 리사이징/최적화
- [ ] 정산 자동 계산 로직
- [ ] 실시간 알림 시스템
