# 승인 시스템 최종 검증 리포트

검증일: 2026-04-21

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 1 | DB 스키마 | ⚠️ 부분 | `CreatorApplicationStatus` enum 존재 (pending/approved/rejected). `CreatorApplication` 모델에 status/reviewedAt/rejectionReason 필드 있음. 단, `Creator` 모델 자체에는 status/submittedAt 필드 없음 (별도 모델로 분리) |
| 2 | 마이그레이션 | ✅ 통과 | "Database schema is up to date!" - 17개 마이그레이션 정상 적용 |
| 3 | 가입 API | ✅ 통과 | `submitCreatorApplication()` (buyer.ts:93) - status='pending' 자동 설정 (스키마 default). 중복 신청/기존 크리에이터 체크 로직 포함 |
| 4 | 승인 대기 페이지 | ❌ 미구현 | `/creator/pending` 페이지 없음. `/brand/creators/pending`은 존재하나 이는 브랜드 캠페인 참여 승인용이며, 크리에이터 가입 승인 대기 페이지가 아님 |
| 5 | 미들웨어 승인 체크 | ❌ 미구현 | `middleware.ts`에 CreatorApplicationStatus/PENDING/APPROVED 체크 로직 없음. 미승인 크리에이터 접근 차단 불가 |
| 6 | 어드민 승인 UI | ❌ 미구현 | `/admin/approvals` 페이지 없음. `/admin/creators` 존재하나 CreatorApplication 승인/거절 UI 없음. 일괄 승인 버튼 없음 |
| 7 | 승인/거절 API | ❌ 미구현 | 크리에이터 가입 승인/거절 API 없음. `admin.ts`의 `approveBrand()`는 브랜드 승인용. `refund-approve`는 환불 승인용. CreatorApplication 상태 변경 엔드포인트 0개 |
| 8 | 알림 통합 | ❌ 미구현 | CNECSHOP_015/016/017 템플릿 없음. 알림 템플릿은 CNECSHOP_010~014까지만 존재 (체험/정산/제안용) |
| 9 | 소셜 로그인 | ⚠️ 부분 | Kakao ✅, Naver ✅ (커스텀), Apple ✅ (조건부) - 3종 존재. 단, Google Provider 미설정. 크리에이터 role 분기는 auth.ts:147에서 처리 |
| 10 | 빌드/Git | ⚠️ 부분 | 빌드 성공 ✅, git clean ✅. 단, 최근 10개 커밋에 승인 시스템 관련 커밋 없음 (PPM Phase 1~6만 존재) |

## 최종 판정

- **통과 항목: 2/10** (마이그레이션, 가입 API)
- **부분 통과: 3/10** (DB 스키마, 소셜 로그인, 빌드)
- **미구현: 5/10** (승인 대기 페이지, 미들웨어, 어드민 UI, 승인/거절 API, 알림)
- **PPM 시작 가능 여부: No**

## 보완 필요 항목

1. **[Critical] 어드민 크리에이터 승인/거절 API** - CreatorApplication status를 pending->approved/rejected로 변경하는 API 엔드포인트 필요
2. **[Critical] 어드민 승인 UI** - `/admin/approvals` 또는 `/admin/creators` 내에 CreatorApplication 목록 + 승인/거절/일괄승인 UI 필요
3. **[Critical] 미들웨어 승인 체크** - 미승인 크리에이터가 크리에이터 전용 페이지 접근 시 `/creator/pending`으로 리다이렉트하는 로직 필요
4. **[Critical] 승인 대기 페이지** - `/creator/pending` 페이지 생성 (승인 대기 상태 안내 + 신청 정보 확인)
5. **[High] 알림 템플릿** - CNECSHOP_015 (승인 완료), CNECSHOP_016 (거절), CNECSHOP_017 (신규 신청 어드민 알림) 추가
6. **[Medium] Creator 모델 연동** - 승인 시 CreatorApplication -> Creator 계정 자동 생성 플로우 구현 필요

## 현재 구현 상태 요약

- **있는 것**: CreatorApplication 모델/스키마, 신청 제출 로직 (buyer.ts), 소셜 로그인 3종
- **없는 것**: 승인 처리 전체 파이프라인 (API, UI, 미들웨어 가드, 알림)
- **결론**: 신청 접수만 가능하고 승인/거절 처리가 불가능한 상태. 승인 시스템의 핵심 기능이 미구현됨
