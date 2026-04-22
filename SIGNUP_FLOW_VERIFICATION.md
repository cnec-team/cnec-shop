# 크리에이터 가입 플로우 + 승인 시스템 검증 리포트

검증일: 2026-04-22
검증자: Claude Code
코드 수정: 0건

---

## 검증 결과 요약

| 구분 | 항목 수 | 통과 | 미구현 | 비고 |
|------|---------|------|--------|------|
| 가입 플로우 | 7 | 4 | 3 | 소셜 로그인/SNS 카테고리 스텝/약관 스텝 미구현 |
| UI 품질 | 3 | 2 | 1 | safe-area 미적용 |
| 승인 시스템 | 3 | 3 | 0 | 완전 구현 |
| API | 3 | 2 | 1 | 별도 submit-application API 없음 |
| 인프라 | 2 | 2 | 0 | 빌드 성공, main 푸시 완료 |

---

## 1. 가입 플로우 (Step 0~5) 상세 검증

### 현재 구현된 가입 플로우 (4단계)

| Step | 요구사항 | 현재 구현 | 상태 |
|------|----------|-----------|------|
| Step 0 | 소셜 로그인 선택 (카카오/네이버/Google) | 역할 선택 (브랜드/크리에이터) | &#x274C; 소셜 로그인 버튼 없음 |
| Step 1 | 본인 정보 (이름 + 휴대폰 인증) | &#x2705; 이름 + 본인인증 (PASS 연동) | &#x2705; 완전 구현 |
| Step 2 | 샵 정보 (shop_id 중복체크) | 로그인 정보 (이메일 + 비밀번호) | &#x26A0;&#xFE0F; 샵 정보는 Step 3에 포함 |
| Step 3 | SNS + 카테고리 | 크리에이터 정보 (활동명 + shopId + 인스타) | &#x26A0;&#xFE0F; 카테고리 선택 없음 |
| Step 4 | 약관 동의 + 제출 | 없음 (약관 동의 스텝 없음) | &#x274C; 미구현 |
| Step 5 | 완료 + 심사 안내 | 페르소나 → 완료 → 대시보드 → pending 리다이렉트 | &#x26A0;&#xFE0F; 간접 구현 |
| 진행도 바 | 단계명 표시 (본인확인/샵설정/프로필/완료) | 애니메이션 점(dots) 3개 | &#x26A0;&#xFE0F; 이름 없이 점만 표시 |

### 상세 분석

**Step 0 - 소셜 로그인:**
- 파일: `src/app/[locale]/(auth)/signup/page.tsx:234-280`
- 현재: 브랜드/크리에이터 역할 선택 카드 2개
- 누락: 카카오/네이버/Google 소셜 로그인 버튼
- 참고: auth.ts에 Kakao/Naver OAuth 프로바이더는 설정되어 있으나 구매자 로그인 전용. 크리에이터 가입에는 연결되지 않음

**Step 1 - 본인 정보: &#x2705;**
- 파일: `src/app/[locale]/(auth)/signup/page.tsx:311-361`
- 이름 입력 (h-14, 56px 높이)
- 휴대폰 + PASS 본인인증 (IdentityVerificationButton)
- 인증 완료 시 녹색 체크 표시

**Step 2 - 로그인 정보: &#x2705;**
- 파일: `src/app/[locale]/(auth)/signup/page.tsx:365-421`
- 이메일 (실시간 중복체크, 500ms 디바운스)
- 비밀번호 (8자 이상, 영문+숫자 조합)
- 비밀번호 확인

**Step 3 - 크리에이터 프로필: &#x26A0;&#xFE0F; 부분 구현**
- 파일: `src/app/[locale]/(auth)/signup/page.tsx:459-517`
- 활동명 (displayName)
- 샵 ID (실시간 중복체크, 400ms 디바운스) &#x2705;
- 인스타그램 ID (선택) &#x2705;
- 누락: TikTok/YouTube 입력 필드
- 누락: 메인 카테고리 선택 (스킨케어/메이크업 등)
- 누락: 상세 카테고리 복수 선택
- 누락: 한 줄 소개 (bio)

**Step 4 - 약관 동의: &#x274C; 미구현**
- 이용약관 동의 체크박스 없음
- 개인정보 수집/이용 동의 없음
- 마케팅 수신 동의(선택) 없음

**Step 5 - 완료 페이지:**
- 가입 후 페르소나 퀴즈(`signup/persona`) → 완료(`signup/complete`) → 대시보드
- 대시보드 접근 시 레이아웃에서 status=PENDING 체크 → `/creator/pending` 리다이렉트
- pending 페이지에 타임라인, 자동 새로고침, 거절 시 재신청 버튼 구현 &#x2705;

---

## 2. UI 품질 검증

| 항목 | 상태 | 상세 |
|------|------|------|
| 버튼 56px (h-14) | &#x2705; | 모든 입력 필드/CTA 버튼 h-14 적용 (line 271, 325, 379 등) |
| 모바일 safe-area | &#x274C; | safe-area-inset 미적용, 하단 고정 CTA 없음 |
| loading.tsx | &#x2705; | signup/, signup/persona/, signup/complete/ 모두 있음 |
| error.tsx | &#x2705; | signup/, signup/persona/, signup/complete/ 모두 있음 |
| 진행도 바 | &#x26A0;&#xFE0F; | 애니메이션 점(dots) 구현됨, 단계 이름 미표시 |
| 라운드 디자인 | &#x2705; | rounded-2xl (16px) 일관 적용 |
| 에러 메시지 | &#x2705; | 인라인 빨간색 텍스트 (이메일 중복, 비밀번호 불일치 등) |
| 성공 아이콘 | &#x2705; | 녹색 체크 아이콘 (Check) 사용 |
| 뒤로가기 | &#x2705; | ChevronLeft 버튼, step 감소 |

---

## 3. 승인 시스템 검증

| 항목 | 상태 | 파일 경로 |
|------|------|-----------|
| 어드민 대시보드 | &#x2705; | `src/app/[locale]/(admin)/admin/approvals/page.tsx` |
| 크리에이터 승인 목록 | &#x2705; | `src/app/[locale]/(admin)/admin/approvals/creators/page.tsx` (780줄) |
| 필터 (상태/카테고리/팔로워) | &#x2705; | 3개 Select + 검색 Input |
| 검색 (이름/인스타/이메일) | &#x2705; | OR 조건 검색 |
| 페이지네이션 | &#x2705; | 20개씩, 이전/다음 버튼 |
| 심사 상세 (Sheet 패널) | &#x2705; | 프로필/SNS/카테고리/체크리스트/액션 |
| 심사 체크리스트 4항목 | &#x2705; | SNS 확인/팔로워 진성/콘텐츠 품질/뷰티 관련성 |
| 일괄 승인 | &#x2705; | 체크박스 + "N명 일괄 승인" 버튼 |
| 거절 사유 템플릿 4종 | &#x2705; | 팔로워 부족/관련성 부족/품질 미달/비공개 |
| 승인 시 포인트 지급 | &#x2705; | 3,000P (SIGNUP_BONUS) |
| 승인 시 알림 발송 | &#x2705; | 카카오 + 이메일 + 인앱 |
| 거절 시 알림 발송 | &#x2705; | 카카오 + 이메일 + 인앱 (사유 포함) |
| 사이드바 메뉴 | &#x2705; | "승인 관리" (UserCheck 아이콘) |

---

## 4. API 검증

| API | 상태 | 경로/방식 |
|-----|------|-----------|
| 가입 API | &#x2705; | `POST /api/auth/register` (status=PENDING 설정) |
| 이메일 중복체크 | &#x2705; | `GET /api/auth/check-email` |
| 샵ID 중복체크 | &#x2705; | `GET /api/auth/check-shop-id` |
| 별도 submit-application API | &#x274C; | 미구현 (register에서 한 번에 처리) |
| 승인 API | &#x2705; | Server Action `approveCreator()` |
| 거절 API | &#x2705; | Server Action `rejectCreator()` |
| 일괄 승인 API | &#x2705; | Server Action `bulkApproveCreators()` |
| 승인 통계 API | &#x2705; | Server Action `getCreatorApprovalStats()` |
| 승인 목록 API | &#x2705; | Server Action `getAdminCreatorApprovals()` |
| 승인 상세 API | &#x2705; | Server Action `getCreatorApprovalDetail()` |

---

## 5. 알림 시스템 검증

| 템플릿 | 상태 | 코드 | 채널 |
|--------|------|------|------|
| CNECSHOP_015 (신청 완료) | &#x2705; | `creatorApplicationSubmittedMessage()` | 카카오+이메일+인앱 |
| CNECSHOP_016 (승인 완료) | &#x2705; | `creatorApprovedMessage()` | 카카오+이메일+인앱 |
| CNECSHOP_017 (거절) | &#x2705; | `creatorRejectedMessage()` | 카카오+이메일+인앱 |
| 가입 시 알림 발송 | &#x2705; | register/route.ts:203-215 | 자동 |

---

## 6. 보안 (미들웨어 + 레이아웃) 검증

| 항목 | 상태 | 상세 |
|------|------|------|
| x-pathname 헤더 | &#x2705; | middleware.ts 3곳에서 설정 (line 128, 145, 277) |
| Creator PENDING 리다이렉트 | &#x2705; | (creator)/layout.tsx:34 → /creator/pending |
| Creator REJECTED 리다이렉트 | &#x2705; | (creator)/layout.tsx:34 → /creator/pending |
| Creator SUSPENDED 리다이렉트 | &#x2705; | (creator)/layout.tsx:37 → /creator/suspended |
| Brand 미승인 리다이렉트 | &#x2705; | (brand)/layout.tsx → /brand/pending |
| 예외 경로 (pending/suspended/onboarding) | &#x2705; | isExemptPath 정규식 체크 |
| Admin role 체크 | &#x2705; | requireAdmin() 모든 서버 액션에 적용 |

---

## 7. 크리에이터 대기/정지 페이지 검증

| 항목 | 상태 | 상세 |
|------|------|------|
| 대기 페이지 (PENDING) | &#x2705; | 타임라인, 제출 정보 요약, 30초 자동 새로고침 |
| 거절 페이지 (REJECTED) | &#x2705; | 거절 사유 표시, 재신청 버튼 |
| 정지 페이지 (SUSPENDED) | &#x2705; | 정지 안내, 카카오톡 문의 링크 |
| 브랜드 대기 페이지 | &#x2705; | 심사 중 안내, 문의 링크 |

---

## 8. 인프라 검증

| 항목 | 상태 | 상세 |
|------|------|------|
| pnpm build | &#x2705; | 성공 (TypeScript 에러 없음) |
| main 브랜치 | &#x2705; | a83035f (최신, clean) |
| Vercel 배포 | &#x2705; | main 푸시로 자동 트리거 |

---

## 누락 사항 (우선순위별)

### P0 - 법적 필수
1. **약관 동의 스텝 미구현** - 이용약관 + 개인정보 수집/이용 동의 필수 (법적 요구)

### P1 - 기능 누락
2. **소셜 로그인 미연결** - 카카오/네이버 OAuth는 설정되어 있으나 크리에이터 가입 플로우에 연결되지 않음
3. **카테고리 선택 미구현** - 메인 카테고리 + 상세 카테고리 선택 UI 없음
4. **TikTok/YouTube 입력 필드 없음** - 인스타그램만 있음
5. **한 줄 소개 (bio) 입력 없음**

### P2 - UX 개선
6. **진행도 바에 단계 이름 미표시** - 현재 점(dot)만 표시, "본인확인/샵설정/프로필" 라벨 없음
7. **모바일 safe-area 미적용** - 하단 고정 CTA 없음
8. **가입 완료 직후 pending 페이지로 직접 이동하지 않음** - persona → complete → dashboard → redirect 경유

### P3 - 최적화
9. **별도 submit-application API 없음** - register API에서 한 번에 처리 (기능상 문제 없음)
10. **입력값 새로고침 시 유지 안 됨** - localStorage persist 없음

---

## 보완 필요 시 예상 작업량

| 작업 | 우선순위 | 예상 파일 수 |
|------|----------|-------------|
| 약관 동의 스텝 추가 | P0 | 1~2개 |
| 소셜 로그인 크리에이터 가입 연결 | P1 | 3~4개 |
| 카테고리 선택 UI + primaryCategory 저장 | P1 | 2개 |
| TikTok/YouTube/bio 입력 필드 추가 | P1 | 1개 |
| 진행도 바 이름 표시 | P2 | 1개 |
| 모바일 safe-area + 하단 고정 CTA | P2 | 1개 |
| 가입 후 바로 pending 리다이렉트 | P2 | 1개 |

---

*검증 완료 시각: 2026-04-22*
