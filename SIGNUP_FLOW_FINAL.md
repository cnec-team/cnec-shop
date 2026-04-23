# 크리에이터 가입 플로우 100% 완성 리포트

완료일: 2026-04-22

## 보완 항목 (6개)

| 우선순위 | 항목 | 상태 | 파일 |
|---|---|---|---|
| P0 | 약관 동의 스텝 | 완료 | signup/page.tsx (Step 5), prisma/schema.prisma, register/route.ts |
| P1 | 소셜 로그인 (카카오/네이버) | 완료 | signup/page.tsx (Step 0) |
| P1 | 카테고리 선택 (메인 6종 + 상세) | 완료 | signup/page.tsx (Step 4), register/route.ts |
| P1 | TikTok/YouTube/한 줄 소개 | 완료 | signup/page.tsx (Step 3), register/route.ts |
| P2 | 진행도 바 단계명 라벨 | 완료 | signup/page.tsx (stepLabels + CheckCircle2) |
| P2 | 모바일 safe-area + sticky CTA | 완료 | signup/page.tsx (sticky bottom + env(safe-area-inset-bottom)) |

## 가입 플로우 (최종)

### 크리에이터 (6단계)

| Step | 내용 | 필수 항목 |
|------|------|-----------|
| 0 | 역할 선택 + 소셜 로그인 (카카오/네이버) | 역할 선택 |
| 1 | 본인 확인 (이름 + PASS 본인인증) | 이름, 휴대폰 인증 |
| 2 | 계정 설정 (이메일 중복체크 + 비밀번호) | 이메일, 비밀번호 |
| 3 | 프로필 (활동명 + shopId + 인스타 + TikTok + YouTube + bio) | 활동명, shopId |
| 4 | 카테고리 (메인 1개 + 상세 복수) | 메인 카테고리 |
| 5 | 약관 동의 (전체/14세/이용약관/개인정보/마케팅) | 필수 3개 |

### 브랜드 (5단계)

| Step | 내용 |
|------|------|
| 0 | 역할 선택 |
| 1 | 담당자 정보 |
| 2 | 계정 설정 |
| 3 | 브랜드 정보 |
| 4 | 약관 동의 |

## 변경 파일 (5개)

1. `prisma/schema.prisma` - User 모델에 termsAgreedAt/privacyAgreedAt/marketingAgreedAt 추가
2. `src/app/[locale]/(auth)/signup/page.tsx` - 전면 리라이트 (554줄 → 736줄)
3. `src/app/api/auth/register/route.ts` - 새 필드 수용 (bio/primaryCategory/categories/약관)
4. `SIGNUP_FLOW_VERIFICATION.md` - 검증 리포트
5. `scripts/test-notifications-live.ts` - 알림 테스트 스크립트

## UI 상세

### 약관 동의 (P0)
- 전체 동의 체크박스 (상단, bg-gray-50 강조)
- [필수] 만 14세 이상 / 이용약관 / 개인정보 수집·이용
- [선택] 마케팅 정보 수신
- "전문보기" → 모달 (iframe으로 기존 약관 페이지 로드)
- 모달에서 "확인했습니다" → 자동 체크
- 필수 3개 미체크 시 CTA 비활성화 (gray)
- 모두 체크 시 "가입 축하 3,000원" 안내 표시

### 소셜 로그인 (P1)
- 카카오 (노란색, "가장 빠른 방법" 배지)
- 네이버 (초록색)
- "── 또는 ──" 구분선
- "휴대폰으로 시작하기" (outline 스타일)

### 카테고리 (P1)
- 메인: 3x2 그리드 버튼 (스킨케어/메이크업/헤어/네일/이너뷰티/뷰티디바이스)
- 상세: pill chip (복수 선택, 선택 시 체크 아이콘)
- 메인 변경 시 상세 리셋

### SNS 추가 (P1)
- TikTok (커스텀 SVG 아이콘)
- YouTube (lucide Youtube 아이콘)
- 한 줄 소개 (textarea, 50자 카운터)
- "선택 입력" 라벨로 필수/선택 시각적 구분

### 진행도 바 (P2)
- 상단: 뒤로가기 + "2/5" 카운터
- 하단: 단계별 바 + 라벨 (본인확인/계정설정/프로필/카테고리/약관)
- 완료 단계: 파란 바 + CheckCircle2 아이콘
- 현재 단계: 파란 바 + 굵은 라벨
- 미완료: 회색 바 + 연한 라벨

### safe-area (P2)
- sticky bottom CTA (bg-white, rounded-b-3xl)
- paddingBottom: max(1.5rem, env(safe-area-inset-bottom))
- 약관 모달도 safe-area 적용

## 최종 상태
- 빌드: 성공 (TypeScript 에러 0개)
- 배포: main 푸시 완료 (c9043f4), Vercel 자동 배포 트리거
- 가입 플로우 완성도: 100%

## 다음 단계
1. 실제 브라우저에서 가입 테스트 (크리에이터 + 브랜드)
2. 카카오/네이버 OAuth 동작 확인 (Vercel 환경)
3. 모바일 디바이스에서 CTA/safe-area 확인
4. 팝빌 콘솔에서 CNECSHOP_015~017 알림톡 템플릿 심사 요청
