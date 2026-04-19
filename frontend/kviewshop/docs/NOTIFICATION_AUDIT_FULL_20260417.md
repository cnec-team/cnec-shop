# 크넥샵 알림 시스템 100% 건강 점검 리포트

> **날짜**: 2026-04-17 (작성: 2026-04-19)
> **점검 범위**: 14개 섹션, 20개 이벤트, 57개 채널 조합
> **점검 방식**: 정적 분석 전용 (실발송 없음, 코드 수정 없음)
> **점검 파일 수**: 14개 소스파일 + schema.prisma + package.json + docs

---

## 한 줄 결론

**68 / 100 -- 인앱+이메일은 프로덕션 가능, 알림톡은 senderKey 등록 후 가능. 이벤트 커버리지 갭과 모니터링 부재가 주요 리스크.**

---

## SECTION A. 인프라 건강성

### A-1. sendNotification 통합 함수

**파일**: `src/lib/notifications/index.ts` (86줄)

#### A-1-1. 시그니처

```typescript
interface SendNotificationParams {
  userId: string          // required
  type: string            // required
  title: string           // required
  message: string         // required
  linkUrl?: string        // optional
  phone?: string          // optional (알림톡용)
  receiverName?: string   // optional (알림톡용)
  kakaoTemplate?: { templateCode: string; message: string }  // optional
  email?: string          // optional (이메일용)
  emailTemplate?: { subject: string; html: string }          // optional
}

async function sendNotification(params): Promise<void>
```

- [x] Input 타입 정의: ✅ `SendNotificationParams` interface (line 26-39)
- [x] userId required, 나머지 채널 파라미터 optional: ✅
- [x] Return 타입: ✅ `Promise<void>` (fire-and-forget)
- [x] tx 파라미터: ❌ **미지원** -- 글로벌 `prisma` 싱글톤만 사용. 트랜잭션 내부 호출 불가

#### A-1-2. 조건부 스킵 로직 검증

| 시나리오 | 예상 동작 | 실제 동작 | 판정 |
|---|---|---|---|
| userId만 있음 | 인앱만 발송 | ✅ DB INSERT만 실행 (line 44-53) | ✅ |
| userId + email + emailTemplate | 인앱 + 이메일 | ✅ line 74 조건 충족 | ✅ |
| userId + phone + kakaoTemplate | 인앱 + 알림톡 | ✅ line 59 조건 충족 | ✅ |
| email만 있음 (userId 없음) | ❌ 함수 자체 호출 불가 | userId가 required이므로 TS 에러 | ⚠️ 비회원 이메일 전용 불가 |
| phone만 있음 | ❌ 함수 자체 호출 불가 | 위와 동일 | ⚠️ |
| 아무것도 없음 | 호출 불가 | TS 컴파일 에러 | ✅ (정상) |

**핵심 발견**: `userId`가 required이므로 비회원(게스트) 주문자에게 이메일/알림톡만 보내려면 별도 로직 필요. 현재 `payments/complete`에서 `buyerUserId` 있을 때만 sendNotification 호출 (line 213).

#### A-1-3. 병렬 vs 직렬 발송

```
await prisma.notification.create(...)  // 1. 인앱 (직렬 #1)
await sendKakaoAlimtalk(...)           // 2. 알림톡 (직렬 #2)
await sendEmail(...)                   // 3. 이메일 (직렬 #3)
```

- [x] 발송 방식: ⚠️ **직렬 (sequential await)** -- 3채널 순차 실행
- [x] 각 채널 try/catch 개별 래핑: ✅ (line 54, 68, 81)
- [x] 한 채널 실패해도 나머지 진행: ✅ (각각 독립 try/catch)
- [x] 성능 영향: ⚠️ 알림톡 2초 + 이메일 2초 = 총 4초. `Promise.allSettled` 사용 시 2초로 단축 가능

---

### A-2. sendEmail (nodemailer)

**파일**: `src/lib/notifications/email.ts` (50줄)

#### A-2-1. 전체 구현 분석

| 체크 항목 | 상태 | 상세 |
|---|---|---|
| Transport 초기화 위치 | ✅ | `getTransporter()` -- 호출 시 생성 (lazy) |
| SMTP host | ✅ | `smtp.worksmobile.com` (Naver Works) |
| SMTP port | ✅ | 587 (STARTTLS) |
| secure 정합성 | ✅ | `secure: false` + port 587 = 올바른 조합 |
| 환경변수 누락 시 동작 | ✅ | `{ success: false, error: 'SMTP 환경변수 누락' }` 반환 (line 26-28) |
| `transporter.verify()` | ❌ | 연결 검증 미호출 |
| from 필드 | ✅ | `EMAIL_FROM` 환경변수 사용 |
| to 필드 검증 | ⚠️ | truthiness만 체크 (`!params.to`), 정규식 미사용 |
| HTML vs text | ⚠️ | HTML만 지원, plain text fallback 없음 |
| 첨부파일 | ❌ | 미지원 |
| Reply-To | ❌ | 미설정 |
| 바운스 처리 | ❌ | 없음 |
| 재시도 로직 | ❌ | 없음 (단, `withRetry` 래퍼가 proposals에서는 사용됨) |

---

### A-3. sendKakaoAlimtalk (팝빌)

**파일**: `src/lib/notifications/kakao.ts` (75줄)

#### A-3-1. SDK 초기화

| 체크 항목 | 상태 | 상세 |
|---|---|---|
| SDK | ✅ | `popbill` + `popbill/lib/KakaoService` (CommonJS require) |
| IsTest 플래그 | ✅ | `POPBILL_IS_TEST === 'true'` (line 8) |
| 환경변수 로딩 | ✅ | 모듈 최상위에서 로딩 (line 4-8) |
| 환경변수 누락 체크 | ✅ | `!POPBILL_LINK_ID || !POPBILL_SECRET_KEY || !POPBILL_CORP_NUM` (line 30) |
| IP 화이트리스트 | ⚠️ | 코드에서 처리 불가, 팝빌 콘솔에서 설정 필요 |

#### A-3-2. sendATS_one 파라미터

| 파라미터 | 설정 여부 | 소스 |
|---|---|---|
| CorpNum | ✅ | `POPBILL_CORP_NUM` (line 51) |
| templateCode | ✅ | `params.templateCode` |
| SenderKey | ✅ | `POPBILL_KAKAO_SENDER_KEY` (line 53) |
| message | ✅ | `params.message` (pre-rendered) |
| altContent | ✅ | `params.altText || params.message` (line 46) |
| altSendType | ✅ | `'C'` -- 알림톡 실패 시 대체문자 발송 |
| sndDT | ✅ | `''` -- 즉시 발송 |
| receiverNum | ✅ | `stripHyphens(params.receiverNum)` (line 35) |
| receiverName | ✅ | `params.receiverName` |

- [x] CorpNum 하이픈 제거: ⚠️ **미적용** -- 환경변수에 하이픈 없이 저장해야 함
- [x] Receiver 하이픈 제거: ✅ `stripHyphens()` 함수 적용 (line 19-21)
- [x] 변수 치환: ✅ 템플릿에서 `${data.xxx}` 로 pre-render 후 전달 (팝빌 `#{변수}` 미사용)

#### A-3-3. 에러 핸들링

- [x] 에러 코드별 분기: ❌ 없음. 모든 에러를 동일하게 `resolve({ success: false })` 처리
- [x] 에러 로깅: ✅ `console.error('[kakao] 알림톡 발송 실패:', err)` (line 64)
- [x] 잔액 부족 관리자 알림: ❌ 없음
- [x] 재시도: ❌ 없음

---

### A-4. 템플릿 완전 매핑 (CNECSHOP_001 ~ 014)

#### A-4-1. 3각 검증: docs vs 코드 vs 빌더

| 코드 | docs 용도 | docs 상태 | templates.ts 함수 | 코드 참조 | 3각 일치 |
|---|---|---|---|---|---|
| CNECSHOP_001 | 주문 완료 → 구매자 | 팝빌 승인 | `orderCompleteMessage()` | ✅ complete/route.ts | ✅ |
| CNECSHOP_002 | 배송 시작 → 구매자 | 팝빌 승인 | `shippingStartMessage()` | ✅ brand.ts | ✅ |
| CNECSHOP_003 | 배송 완료 → 구매자 | 팝빌 승인 | `deliveryCompleteMessage()` | ✅ brand.ts | ✅ |
| CNECSHOP_004 | 신규 주문 → 브랜드 | 팝빌 승인 | `newOrderBrandMessage()` | ✅ complete/route.ts | ✅ |
| CNECSHOP_005 | 송장 리마인더 → 브랜드 | 팝빌 승인 | `invoiceReminderMessage()` | ❌ **미사용** | ⚠️ |
| CNECSHOP_006 | 판매 발생 → 크리에이터 | 팝빌 승인 | `saleOccurredMessage()` | ✅ complete/route.ts | ✅ |
| CNECSHOP_007 | 캠페인 승인 → 크리에이터 | 팝빌 승인 | `campaignApprovedMessage()` | ✅ brand.ts | ✅ |
| CNECSHOP_008 | 캠페인 시작 → 크리에이터 | 팝빌 승인 | `campaignStartedMessage()` | ✅ brand.ts | ✅ |
| CNECSHOP_009 | 체험 승인 → 크리에이터 | 팝빌 승인 | `trialApprovedMessage()` | ❌ **미사용** | ⚠️ |
| CNECSHOP_010 | 체험 배송 → 크리에이터 | 팝빌 승인 | `trialShippedMessage()` | ❌ **미사용** | ⚠️ |
| CNECSHOP_011 | 체험 신청 → 브랜드 | 팝빌 승인 | `trialRequestedMessage()` | ❌ **미사용** | ⚠️ |
| CNECSHOP_012 | 정산 확정 → 크리에이터 | 팝빌 승인 | `settlementConfirmedMessage()` | ❌ **미사용** | ⚠️ |
| CNECSHOP_013 | 공구 초대 → 크리에이터 | 신규 등록 필요 | `proposalGongguInviteMessage()` | ✅ proposals/route.ts | ✅ |
| CNECSHOP_014 | 상품 추천 → 크리에이터 | 신규 등록 필요 | `proposalProductPickMessage()` | ✅ proposals/route.ts | ✅ |

**핵심 발견**: 14개 템플릿 중 **5개(005, 009~012)가 빌더 함수는 존재하지만 실제 호출되지 않음**.
해당 이벤트에서 인앱 알림만 발송하고 이메일/알림톡 채널을 사용하지 않는 상태.

#### A-4-2. 변수 일치 검증

templates.ts는 팝빌 `#{변수}` 방식이 아닌 JS 템플릿 리터럴(`${data.xxx}`)로 pre-render하므로, 변수 이름 불일치 문제는 구조적으로 발생하지 않음.

다만 docs에 정의된 CNECSHOP_013/014의 `#{변수}` 와 코드의 실제 메시지 내용 일치 여부:

| 템플릿 | docs 변수 | 코드 변수 | 일치 |
|---|---|---|---|
| CNECSHOP_013 | #{크리에이터명}, #{브랜드명}, #{캠페인명}, #{커미션율}, #{수락URL} | creatorName, brandName, campaignName, commissionRate, acceptUrl | ✅ |
| CNECSHOP_014 | #{크리에이터명}, #{브랜드명}, #{상품명}, #{커미션율}, #{수락URL} | creatorName, brandName, productName, commissionRate, acceptUrl | ✅ |

**주의**: 코드는 pre-render 방식이므로 팝빌에 등록된 실제 템플릿의 `#{변수}` 구문과는 무관. 팝빌 templateCode만 일치하면 됨. 단, 팝빌 심사 시 제출한 본문과 실제 발송 본문이 다르면 **심사 반려** 가능.

---

### A-5. 이메일 템플릿

#### A-5-1. 빌더 함수 전수 (15개)

| # | 함수명 | 대상 | 채널 | 사용 여부 |
|---|---|---|---|---|
| 1 | `orderCompleteMessage` | 구매자 | 3채널 | ✅ |
| 2 | `shippingStartMessage` | 구매자 | 3채널 | ✅ |
| 3 | `deliveryCompleteMessage` | 구매자 | 3채널 | ✅ |
| 4 | `newOrderBrandMessage` | 브랜드 | 3채널 | ✅ |
| 5 | `invoiceReminderMessage` | 브랜드 | 3채널 | ❌ 미사용 |
| 6 | `saleOccurredMessage` | 크리에이터 | 3채널 | ✅ |
| 7 | `campaignApprovedMessage` | 크리에이터 | 3채널 | ✅ |
| 8 | `campaignStartedMessage` | 크리에이터 | 3채널 | ✅ |
| 9 | `trialApprovedMessage` | 크리에이터 | 3채널 | ❌ 미사용 |
| 10 | `trialShippedMessage` | 크리에이터 | 3채널 | ❌ 미사용 |
| 11 | `trialRequestedMessage` | 브랜드 | 3채널 | ❌ 미사용 |
| 12 | `settlementConfirmedMessage` | 크리에이터 | 3채널 | ❌ 미사용 |
| 13 | `proposalGongguInviteMessage` | 크리에이터 | 3채널 | ✅ |
| 14 | `proposalProductPickMessage` | 크리에이터 | 3채널 | ✅ |
| 15 | `bulkSendReportMessage` | 브랜드 | 이메일만 | ✅ |

#### A-5-2. HTML 이메일 품질

| 체크 항목 | 상태 | 상세 |
|---|---|---|
| DOCTYPE html | ✅ | `<!DOCTYPE html>` (line 25) |
| 모바일 반응형 | ✅ | `<meta name="viewport" content="width=device-width,initial-scale=1.0">` |
| 인라인 CSS | ✅ | 모든 스타일 inline, `<style>` 태그 미사용 |
| UTF-8 | ✅ | `<meta charset="UTF-8">` + `lang="ko"` |
| CTA 버튼 | ✅ | `ctaButton()` 헬퍼 -- 모든 템플릿에 포함 |
| 대체 텍스트 (plain text) | ❌ | HTML만 제공, text/plain 미제공 |
| 수신거부 링크 | ❌ | **모든 템플릿에 미포함** |
| 테이블 기반 레이아웃 | ✅ | max-width 600px, cellpadding/cellspacing=0 |

---

## SECTION B. 이벤트별 3채널 발송 매트릭스

### B-1. 20개 이벤트 전수 매트릭스

| # | 이벤트 | 트리거 파일 | 인앱 | 이메일 | 알림톡 | 템플릿 | 비고 |
|---|---|---|---|---|---|---|---|
| 1 | 회원가입 (브랜드) | ❌ 없음 | ❌ | ❌ | ❌ | - | 미구현 |
| 2 | 회원가입 (크리에이터) | ❌ 없음 | ❌ | ❌ | ❌ | - | 미구현 |
| 3 | 회원가입 (구매자) | ❌ 없음 | ❌ | ❌ | ❌ | - | 미구현 |
| 4 | 브랜드 승인 → 브랜드 | admin.ts:129,152 | ✅ | ❌ | ❌ | - | 인앱만 |
| 5 | 크리에이터 승인 → 크리에이터 | admin.ts:327 | ✅ | ❌ | ❌ | - | 인앱만 (status 변경 알림) |
| 6 | 결제 완료 → 구매자 | complete/route.ts:221 | ✅ | ✅ | ✅ | CNECSHOP_001 | 3채널 완전 |
| 7 | 결제 완료 → 브랜드 | complete/route.ts:250 | ✅ | ✅ | ✅ | CNECSHOP_004 | 3채널, Map으로 중복 제거 |
| 8 | 결제 완료 → 크리에이터 | complete/route.ts:273 | ✅ | ✅ | ✅ | CNECSHOP_006 | 3채널, creatorId 있을 때만 |
| 9 | 배송 시작 → 구매자 | brand.ts:713,855 | ✅ | ✅ | ✅ | CNECSHOP_002 | 3채널, 2곳에서 호출 |
| 10 | 배송 완료 → 구매자 | brand.ts:732 | ✅ | ✅ | ✅ | CNECSHOP_003 | 3채널 |
| 11 | 주문 취소 → 구매자/크리에이터 | brand.ts:785,802 | ✅ | ❌ | ❌ | - | 인앱만, 브랜드엔 알림 없음 |
| 12 | 환불 완료 → 구매자 | ❌ 없음 | ❌ | ❌ | ❌ | - | **미구현** |
| 13 | 캠페인 참여 신청 → 브랜드 | creator.ts:286 | ✅ | ❌ | ❌ | - | 인앱만 |
| 14 | 캠페인 참여 승인 → 크리에이터 | brand.ts:505 | ✅ | ✅ | ✅ | CNECSHOP_007 | 3채널 완전 |
| 15 | 캠페인 참여 거절 → 크리에이터 | brand.ts:518 | ✅ | ❌ | ❌ | - | 인앱만 |
| 16 | 체험 신청 → 브랜드 | trial.ts:118 | ✅ | ❌ | ❌ | - | 인앱만 (템플릿 있으나 미사용) |
| 17 | 체험 승인 → 크리에이터 | trial.ts:460 | ✅ | ❌ | ❌ | - | 인앱만 (CNECSHOP_009 미사용) |
| 18 | 체험 배송 → 크리에이터 | trial.ts:544 | ✅ | ❌ | ❌ | - | 인앱만 (CNECSHOP_010 미사용) |
| 19 | 정산 확정 → 크리에이터 | ❌ 없음 | ❌ | ❌ | ❌ | - | **미구현** (CNECSHOP_012 미사용) |
| 20 | 공구 제안 → 크리에이터 | proposals/route.ts | ✅ | ✅ | ✅ | CNECSHOP_013/014 | 3채널 (bulk도 동일) |

**집계**:
- ✅ 3채널 완전 구현: **8개** (이벤트 6~10, 14, 20 + 캠페인 시작)
- ⚠️ 인앱만: **9개** (이벤트 4, 5, 11, 13, 15~18 + 기타)
- ❌ 미구현: **4개** (이벤트 1~3, 12, 19)

### B-2. sendNotification 호출 전수 (추가 이벤트 포함)

위 20개 외에 발견된 추가 sendNotification 호출:

| 파일 | 이벤트 | 인앱 | 이메일 | 알림톡 |
|---|---|---|---|---|
| admin.ts:165 | 브랜드 정지 | ✅ | ❌ | ❌ |
| admin.ts:177 | 브랜드 거절 | ✅ | ❌ | ❌ |
| admin.ts:355 | 등급 변경 | ✅ | ❌ | ❌ |
| admin.ts:865 | 주문 상태 변경 (어드민) | ✅ | ❌ | ❌ |
| brand.ts:749 | 기타 주문 상태 (CONFIRMED) | ✅ | ❌ | ❌ |
| brand.ts:1414 | 문의 답변 | ✅ | ❌ | ❌ |
| brand.ts:1521 | 캠페인 RECRUITING | ✅ | ❌ | ❌ |
| brand.ts:1551 | 캠페인 ACTIVE (3채널) | ✅ | ✅ | ✅ |
| brand.ts:1566 | 캠페인 ENDED | ✅ | ❌ | ❌ |
| buyer.ts:151 | 크리에이터 지원 | ✅ | ❌ | ❌ |
| buyer.ts:361 | 구매 확정 | ✅ | ❌ | ❌ |
| buyer.ts:529 | 리뷰 작성 | ✅ | ❌ | ❌ |
| creator.ts:711 | 크리에이터픽 추가 | ✅ | ❌ | ❌ |
| creator.ts:821 | 포인트 출금 요청 | ✅ | ❌ | ❌ |
| exchange-refund.ts:53 | 교환 요청 | ✅ | ❌ | ❌ |
| exchange-refund.ts:122 | 교환 승인 | ✅ | ❌ | ❌ |
| inquiry.ts:79 | 상품 문의 | ✅ | ❌ | ❌ |
| inquiry.ts:93 | 문의 답변 | ✅ | ❌ | ❌ |
| shop.ts:176 | 크리에이터 구독 | ✅ | ❌ | ❌ |
| shop.ts:204 | 크리에이터 구독 해제 | ✅ | ❌ | ❌ |
| trial.ts:178 | 샘플 수령 확인 | ✅ | ❌ | ❌ |
| trial.ts:265 | 체험 후 결정 | ✅ | ❌ | ❌ |
| trial.ts:744 | 일정 변경 요청 | ✅ | ❌ | ❌ |
| trial.ts:798 | 일정 변경 응답 | ✅ | ❌ | ❌ |

**총 sendNotification 호출**: 14개 파일에서 **62회** (중복 import 포함)
- 3채널 완전 호출: **~11회**
- 인앱 전용 호출: **~35회**

---

## SECTION C. 결제 완료 알림 집중 검증

**파일**: `src/app/api/payments/complete/route.ts` (301줄)

### C-1-1. 알림 호출 위치

```
Line 119: order.status → PAID (DB UPDATE)
Line 130-188: Conversion records 생성
Line 191-286: ── 결제 완료 3채널 알림 ── (PAID 이후)
Line 288: return NextResponse.json({ success: true })
```

- [x] 트랜잭션 내부?: ❌ **트랜잭션 밖** -- 알림은 별도 try/catch 블록
- [x] PAID 전환 이후?: ✅ line 119에서 PAID 확정 후 line 191부터 알림
- [x] 포트원 API 검증 이후?: ✅ line 79-115에서 검증 완료 후
- [x] 금액 불일치 시 알림?: ✅ 안 나감 -- line 99-106에서 400 반환으로 알림 블록 미도달

### C-1-2. 구매자 알림

```typescript
// line 207-230
const buyerUserId = orderWithDetails.buyer?.userId
const buyerEmail = orderWithDetails.buyerEmail ?? orderWithDetails.buyer?.user.email
const buyerPhone = orderWithDetails.buyerPhone ?? orderWithDetails.buyer?.user.phone

if (buyerUserId) {  // 회원만 발송
  await sendNotification({ userId: buyerUserId, ...tmpl.inApp,
    phone: buyerPhone ?? undefined,
    kakaoTemplate: buyerPhone ? tmpl.kakao : undefined,
    email: buyerEmail ?? undefined,
    emailTemplate: buyerEmail ? tmpl.email : undefined,
  })
}
```

- [x] 회원: ✅ userId + email + phone 조건부 전달
- [x] 비회원: ⚠️ `buyerUserId` 없으면 **sendNotification 자체 미호출** -- 게스트에게 이메일/알림톡 발송 불가
- [x] 전화번호 정규화: ✅ `kakao.ts`의 `stripHyphens()`에서 처리
- [x] 이메일 null 체크: ✅ `?? undefined`로 안전하게 처리

### C-1-3. 브랜드 알림

```typescript
// line 232-259
const brandMap = new Map<string, typeof firstProduct.product.brand>()
for (const item of orderWithDetails.items) {
  if (item.product.brand && !brandMap.has(item.product.brandId)) {
    brandMap.set(item.product.brandId, item.product.brand)
  }
}
```

- [x] 중복 제거: ✅ `Map` + `!brandMap.has()` 패턴
- [x] 이메일 출처: `brand.user.email` (User 테이블) -- Brand 전용 contactEmail 필드 없음
- [x] 수신 거부: ❌ BuyerNotificationSetting은 존재하나 Brand/Creator용 미존재

### C-1-4. 크리에이터 알림

```typescript
// line 262-282
if (orderWithDetails.creator) {
  const creator = orderWithDetails.creator
  const commissionRate = 0.10  // 하드코딩!
```

- [x] creatorId 존재 여부: ✅ `order.creatorId`는 optional (schema: `String?`)
- [x] 조건부 호출: ✅ `if (orderWithDetails.creator)` 가드
- [x] 커미션율: ⚠️ **0.10 하드코딩** -- 실제 캠페인 커미션율과 다를 수 있음

### C-1-5. 에러 처리

```typescript
try {                                        // 외부 try (line 191)
  // ...
  try { await sendNotification({...}) }      // 구매자 (line 220-229)
  catch (e) { console.error(...) }
  try { await sendNotification({...}) }      // 브랜드 (line 249-258)
  catch (e) { console.error(...) }
  try { await sendNotification({...}) }      // 크리에이터 (line 272-281)
  catch (e) { console.error(...) }
} catch (notifErr) {                         // 외부 catch (line 284)
  console.error('[payment] notification error (non-fatal):', notifErr)
}
return NextResponse.json({ success: true })  // 알림 실패해도 성공 응답!
```

- [x] 알림 실패가 결제 응답에 영향: ✅ **영향 없음** -- 3중 try/catch
- [x] try/catch 누락: ✅ 없음 -- 모든 호출이 래핑됨
- [x] 한 채널 실패가 다른 채널 차단: ✅ 차단 안 됨

### C-2. 중복 발송 방지

```
webhook/route.ts: sendNotification 호출 = 0건 (grep 확인)
```

- [x] webhook에서 알림 호출: ✅ **없음** -- 중복 위험 없음
- [x] 멱등성: ✅ webhook은 `order.status === newStatus` 체크 (line 118)로 중복 처리 방지
- [x] 시간 윈도우 방지: N/A (webhook은 알림 미발송)

---

## SECTION D. 데이터 유효성

### D-1. 전화번호 정규화

```typescript
// kakao.ts line 19-21
function stripHyphens(phone: string): string {
  return phone.replace(/-/g, '')
}
```

- [x] `010-1234-5678` → `01012345678`: ✅
- [x] 국제번호 (`+82`): ❌ 미처리 -- `+82-10-1234-5678` → `+821012345678` (잘못됨)
- [x] 빈 문자열/공백: ✅ line 36 `if (!receiverNum)` 체크
- [x] 길이/패턴 검증: ❌ 없음

### D-2. 이메일 형식 검증

```typescript
// email.ts line 31-33
if (!params.to) {
  return { success: false, error: '수신자 이메일 없음' }
}
```

- [x] 정규식 검증: ❌ 없음 -- truthiness만 체크
- [x] 검증 실패 시: `{ success: false }` 반환 (throw 아님)

### D-3. 변수 치환 안전성

templates.ts는 JS 템플릿 리터럴 사용. 변수 치환이 아닌 직접 문자열 삽입.

- [x] undefined → `"undefined"` 문자열 출력 가능: ⚠️ 호출 측에서 `?? ''` fallback 사용 (대부분)
- [x] null 처리: ✅ coalescing 연산자 사용 (`data.buyerName ?? '고객'` 등)
- [x] 숫자 변환: ✅ `formatPrice()` 함수가 `toLocaleString('ko-KR')` 사용

### D-4. XSS/Injection 방지

```bash
grep "sanitize|escape|dompurify" src/lib/notifications/ → 0건
```

- [x] HTML 이스케이프: ❌ **없음** -- 사용자 입력(상품명, 브랜드명)이 이메일 HTML에 직접 삽입
- [x] 위험도: ⚠️ **MEDIUM** -- 이메일 클라이언트는 대부분 JS 실행 차단하지만, HTML 삽입 가능
- [x] 알림톡: ✅ 평문이므로 XSS 위험 없음

---

## SECTION E. 성능 & 확장성

### E-1. N+1 패턴

**complete/route.ts line 147-161:**
```typescript
for (const item of orderItems) {
  if (item.campaignId) {
    const campaign = await prisma.campaign.findUnique({...})  // N+1!
```

- [x] 캠페인 조회 N+1: ⚠️ 주문 아이템별 개별 쿼리 (보통 1~5개로 영향 적음)
- [x] 브랜드 알림 직렬: ⚠️ `for...of + await sendNotification` (line 239-259)

### E-2. 팝빌 Rate Limit

```bash
grep "rateLimit|throttle" src/lib/notifications/ → 0건
```

- [x] Rate limit 처리: ❌ 없음
- [x] 벌크 발송 시 위험: ⚠️ `proposals/bulk/route.ts`에서 100명 순차 발송 시 제한 가능

### E-3. DB 조회

complete/route.ts에서 알림 발송을 위한 추가 조회:
```typescript
// line 192-199: 4레벨 include
const orderWithDetails = await prisma.order.findUnique({
  include: {
    items: { include: { product: { include: { brand: { include: { user: true } } } } } },
    buyer: { include: { user: true } },
    creator: { include: { user: true } },
  },
})
```

- [x] 조회 횟수: 1회 (JOIN으로 처리)
- [x] include 깊이: 4레벨 -- 과도하나 통상 규모에서 허용 가능
- [x] 최적화 여지: select로 필요 필드만 조회 가능

### E-4. 이메일 템플릿 렌더링

- [x] 방식: 문자열 연결 (template literal) -- 최적
- [x] 비용: ~1-5ms per template -- 무시할 수준

---

## SECTION F. 에러 핸들링 & 로깅

### F-1. try/catch 커버리지

| 호출 위치 | try/catch | catch 후 동작 | 판정 |
|---|---|---|---|
| complete/route.ts (구매자) | ✅ 3중 | `console.error`, 계속 진행 | ✅ |
| complete/route.ts (브랜드) | ✅ 3중 | `console.error`, 계속 진행 | ✅ |
| complete/route.ts (크리에이터) | ✅ 3중 | `console.error`, 계속 진행 | ✅ |
| brand.ts (배송) | ✅ | 빈 catch, 계속 진행 | ✅ |
| brand.ts (캠페인 승인) | ✅ | 빈 catch, 계속 진행 | ✅ |
| admin.ts (승인) | ✅ | `/* ignore */`, 계속 진행 | ✅ |
| trial.ts (전체) | ✅ | `// 알림 실패가 주요 로직에 영향 주지 않음` | ✅ |
| proposals/route.ts | ✅ | withRetry 사용 | ✅ |

**판정**: ✅ 모든 sendNotification 호출이 try/catch로 래핑됨. 알림 실패가 비즈니스 로직에 영향 없음.

### F-2. 로깅 품질

| 파일 | 로그 메시지 | 판정 |
|---|---|---|
| index.ts:55 | `[notification] 앱 내 알림 저장 실패:` + err | ⚠️ orderId 없음 |
| index.ts:69 | `[notification] 알림톡 발송 실패:` + err | ⚠️ 수신자 없음 |
| index.ts:82 | `[notification] 이메일 발송 실패:` + err | ⚠️ 수신자 없음 |
| email.ts:27 | `[email] SMTP 환경변수가 설정되지 않았습니다.` | ✅ |
| email.ts:46 | `[email] 이메일 발송 실패:` + message | ✅ |
| kakao.ts:31 | `[kakao] 팝빌 환경변수가 설정되지 않았습니다.` | ✅ |
| kakao.ts:64 | `[kakao] 알림톡 발송 실패:` + err | ✅ |

- [x] 로그 레벨 구분: ⚠️ 전부 `console.error` -- warn/info 구분 없음
- [x] 민감정보 마스킹: ✅ 이메일/전화번호 로그에 포함 안 됨
- [x] 에러 스택: ✅ err 객체 전체 출력
- [x] 외부 모니터링 (Sentry): ❌ 없음

### F-3. 재시도 로직

```bash
# src/lib/messaging/retry.ts 존재 (withRetry 래퍼)
# 사용처: proposals/bulk/route.ts에서만 사용
```

- [x] sendNotification 내부 재시도: ❌ 없음
- [x] proposals 외 재시도: ❌ 없음
- [x] 지수 백오프: ✅ retry.ts에 구현 (`factor: 2`)
- [x] 최대 재시도: ✅ 3회 (retry.ts)
- **결론**: 재시도 인프라는 있으나 결제 알림 등 핵심 경로에서 미사용

---

## SECTION G. 보안

### G-1. 권한 검증

| 엔드포인트 | 인증 | 소유권 검증 | 판정 |
|---|---|---|---|
| GET /api/notifications | ✅ `getAuthUser()` | ✅ `userId !== authUser.id` → 403 | ✅ |
| PATCH /api/notifications (읽음) | ✅ `auth()` | ✅ `where: { id, userId: authUser.id }` | ✅ |
| PATCH /api/notifications (전체 읽음) | ✅ | ✅ `body.userId !== authUser.id` → 403 | ✅ |
| DELETE | N/A | - | ⚠️ 엔드포인트 없음 (soft delete) |

### G-2. 민감정보 로그 노출

```bash
grep "console.log.*email|console.log.*phone|console.log.*password" src/lib/notifications/ → 0건
```

- [x] 이메일 평문 로깅: ✅ 없음
- [x] 전화번호 평문 로깅: ✅ 없음
- [x] API 키 로깅: ✅ 없음
- [x] 금액 로깅: ⚠️ complete/route.ts:101에서 금액 mismatch 로깅 (수용 가능)

### G-3. 환경변수 클라이언트 노출

```bash
grep "NEXT_PUBLIC_POPBILL|NEXT_PUBLIC_SMTP|NEXT_PUBLIC_RESEND" src/ → 0건
```

- [x] 서버 변수 노출: ✅ 없음 -- 모든 POPBILL/SMTP 변수가 서버 전용

---

## SECTION H. 다국어 & 사용자 경험

### H-1. 알림 다국어

- [x] 템플릿 다국어: ❌ **한국어 하드코딩** -- 모든 알림 한국어 전용
- [x] 이메일 subject: ❌ 한국어 고정
- [x] 알림톡: ✅ 한국어 고정 (카카오 정책상 정상)
- [x] i18n 지원 여부: ❌ locale 파라미터 없음

### H-2. 수신거부 설정

**BuyerNotificationSetting 모델** (schema.prisma:2371-2386):

```
kakaoOrder, kakaoShipping, kakaoDeliver, kakaoGonggu
emailOrder, emailShipping, emailDeliver, emailGonggu
```

- [x] 구매자 채널별 수신거부: ✅ 모델 + API + UI 존재
- [x] sendNotification에서 설정 체크: ❌ **미구현** -- 설정 무시하고 발송
- [x] 이메일 수신거부 링크: ❌ 템플릿 푸터에 없음
- [x] 브랜드/크리에이터 수신거부: ❌ 모델 없음

### H-3. 휴면/탈퇴 계정

- [x] 탈퇴 유저 알림 방지: ❌ 체크 없음 -- User 삭제 시 Cascade로 Notification도 삭제되므로 INSERT는 에러
- [x] 휴면 계정 처리: ❌ 없음

---

## SECTION I. Prisma 스키마 건강성

### I-1. Notification 모델 인덱스

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String   @db.VarChar(15)
  title     String   @db.VarChar(200)
  message   String
  linkUrl   String?  @map("link_url")
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([userId, isRead])    // 유일한 인덱스
  @@map("notifications")
}
```

- [x] `@@index([userId, isRead])`: ✅ unread count 조회용
- [x] `@@index([userId, createdAt])`: ❌ **누락** -- 목록 조회 (최신순) 성능 저하 가능
- [x] `@@index([createdAt])`: ❌ **누락** -- 오래된 알림 정리용
- [x] type 필드 인덱스: ❌ 없음 (필터 쿼리에서 필요할 수 있음)

### I-2. 채널 추적 필드

- [x] CreatorProposal: ✅ `inAppStatus`, `emailStatus`, `kakaoStatus`, `dmStatus` (line 2042-2045)
- [x] MessageCredit: ✅ `attemptedChannels[]`, `succeededChannels[]` (line 2156-2157)
- [x] 일반 Notification: ❌ 채널별 발송 상태 필드 없음

### I-3. 로그 모델

- [x] EmailLog: ❌ **미존재**
- [x] KakaoLog: ❌ **미존재**
- [x] NotificationLog: ❌ **미존재**
- [x] DmSendLog: ✅ 존재 (DM 전용)
- [x] MessageCredit: ✅ 존재 (Proposal 전용)

---

## SECTION J. UI 건강성

### J-1. NotificationBell

**파일**: `src/components/layout/notification-bell.tsx` (306줄)

| 체크 항목 | 상태 | 상세 |
|---|---|---|
| 폴링 주기 | ✅ | 30초 (`setInterval(fetchNotifications, 30000)` line 143) |
| 백그라운드 탭 폴링 | ⚠️ | 계속 돌아감 (visibilitychange 미감지) |
| 읽음 optimistic update | ✅ | `setNotifications(prev => ...)` (line 197-199) |
| 에러 상태 | ✅ | mock data fallback (line 134-136) |
| 로딩 스켈레톤 | ❌ | 없음 -- 바로 mock 또는 데이터 표시 |
| 빈 상태 | ✅ | "알림이 없습니다" (line 248-250) |
| 키보드 접근성 | ✅ | `<button>` 요소 사용 (Tab/Enter 자동 지원) |
| 모바일 반응형 | ✅ | `w-80` 고정폭, `overflow-y-auto` |
| unread badge | ✅ | 빨간 원형 (9+ 표시) (line 227-230) |
| 외부 클릭 닫기 | ✅ | `handleClickOutside` (line 148-157) |

### J-2. 알림 전체 페이지

| 페이지 | 경로 | 기능 |
|---|---|---|
| 크리에이터 알림 | `[locale]/(creator)/creator/notifications/page.tsx` | 타입별 필터, 모두 읽음, 빈 상태 |
| 구매자 알림 설정 | `[locale]/(shop)/[username]/me/notifications/page.tsx` | 카카오/이메일 채널 토글 |

- [x] 무한스크롤/페이지네이션: ❌ 없음 -- 전체 로딩
- [x] 필터: ✅ 전체/ORDER/SHIPPING/SETTLEMENT/CAMPAIGN/SYSTEM
- [x] 모두 읽음: ✅ 버튼 존재
- [x] 삭제: ❌ 미지원

### J-3. 헤더 통합

```typescript
// header.tsx line 70-72
{!isLoading && user && (user.role === 'brand_admin' || user.role === 'creator') && (
  <NotificationBell />
)}
```

- [x] 브랜드 헤더: ✅ `brand_admin`
- [x] 크리에이터 헤더: ✅ `creator`
- [x] 구매자 헤더: ❌ **미포함** -- 알림 설정 페이지는 있으나 벨 없음
- [x] 어드민 헤더: ❌ **미포함**
- [x] 비로그인: ✅ 제외됨

### J-4. 알림 링크 라우팅

```typescript
// notification-bell.tsx line 207-219
if (!/^https?:\/\//i.test(target)) {
  if (!target.startsWith('/')) target = `/${target}`;
  const hasLocalePrefix = /^\/(ko|en|ja|zh|es|it|ru|ar|fr|pt|de)(\/|$)/.test(target);
  if (!hasLocalePrefix) target = `/${locale}${target}`;
}
router.push(target);
```

- [x] locale prefix 자동 추가: ✅
- [x] 절대 URL 처리: ✅ http:// 시작이면 그대로
- [x] 404 처리: ❌ 존재하지 않는 경로 시 Next.js 기본 404

---

## SECTION K. 의존성 건강성

### K-1. 패키지 버전

| 패키지 | 버전 | 상태 |
|---|---|---|
| nodemailer | ^8.0.5 | ✅ 최신 |
| @types/nodemailer | ^8.0.0 | ✅ |
| popbill | ^1.64.0 | ✅ |

### K-2. 미사용 의존성

```bash
grep "resend|solapi|svix|mailgun|sendgrid" package.json → 0건
```

- [x] 불필요 알림 라이브러리: ✅ 없음 -- 깨끗한 상태

---

## SECTION L. 발송 시뮬레이션 (정적 분석)

### L-1. 결제 1건 시나리오

**가정**: 회원 구매자 test@cnec.kr (010-1111-2222), 누씨오 토너패드 x1, 18,000원, 크리에이터 beautyjin 샵

| # | 대상 | 채널 | 템플릿 | 발송 조건 | 판정 |
|---|---|---|---|---|---|
| 1 | 구매자 | 인앱 | (DB INSERT) | buyerUserId 존재 | ✅ |
| 2 | 구매자 | 이메일 | orderCompleteMessage | buyerEmail 존재 | ✅ |
| 3 | 구매자 | 알림톡 | CNECSHOP_001 | buyerPhone 존재 + senderKey | ❌ senderKey 빈값 |
| 4 | 브랜드(누씨오) | 인앱 | (DB INSERT) | brand.userId 존재 | ✅ |
| 5 | 브랜드(누씨오) | 이메일 | newOrderBrandMessage | brand.user.email 존재 | ✅ |
| 6 | 브랜드(누씨오) | 알림톡 | CNECSHOP_004 | brand.user.phone + senderKey | ❌ senderKey 빈값 |
| 7 | 크리에이터(beautyjin) | 인앱 | (DB INSERT) | creator 존재 | ✅ |
| 8 | 크리에이터(beautyjin) | 이메일 | saleOccurredMessage | creator.user.email 존재 | ✅ |
| 9 | 크리에이터(beautyjin) | 알림톡 | CNECSHOP_006 | creator.user.phone + senderKey | ❌ senderKey 빈값 |

**현재 상태 발송 결과**: 9건 중 **6건 성공** (인앱 3 + 이메일 3), **3건 실패** (알림톡 -- senderKey 빈값)

알림톡 실패 시 동작:
- `kakao.ts` line 30: `!POPBILL_CORP_NUM` 체크는 통과 (설정됨)
- `sendATS_one` 호출 시 senderKey 빈값 → 팝빌 에러 콜백 → `resolve({ success: false })`
- try/catch로 래핑되어 이메일 발송에 영향 없음: ✅

### L-2. 비회원 주문 시나리오

| 대상 | 채널 | 판정 | 사유 |
|---|---|---|---|
| 구매자 인앱 | ❌ | buyerUserId 없음 → sendNotification 미호출 |
| 구매자 이메일 | ❌ | sendNotification 자체 미호출 |
| 구매자 알림톡 | ❌ | sendNotification 자체 미호출 |
| 브랜드 인앱 | ✅ | brand.userId 존재 |
| 브랜드 이메일 | ✅ | brand.user.email 존재 |
| 크리에이터 인앱 | ✅ | creator 존재 시 |

**핵심 발견**: 비회원 구매자에게 **어떤 알림도 발송되지 않음**. userId가 required인 sendNotification 설계 때문.

### L-3. 벌크 제안 100명 시나리오

`proposals/bulk/route.ts` 분석:
- 100명 크리에이터에게 순차 발송 (`for...of` + `await`)
- 각 크리에이터당 3채널 발송 (sendNotification 내부 직렬)
- `withRetry` 래핑 (3회 재시도)
- 예상 소요: 100 x (인앱 ~100ms + 알림톡 ~1s + 이메일 ~1s) = **~210초**
- 부분 실패: 개별 try/catch로 처리, 성공/실패 카운트 추적
- 응답: 전부 끝난 후 리포트 반환 + bulkSendReportMessage 이메일

### L-4. 현재 상태 발송 가능성

| 채널 | 환경변수 | 발송 가능 |
|---|---|---|
| 인앱 (DB) | prisma 연결 | ✅ |
| 이메일 (SMTP) | SMTP_HOST, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM | ✅ (Naver Works 세팅 완료 가정) |
| 알림톡 (팝빌) | POPBILL_LINK_ID, POPBILL_SECRET_KEY, POPBILL_CORP_NUM | ✅ |
| 알림톡 발신키 | POPBILL_KAKAO_SENDER_KEY | ❌ **빈값** |

---

## SECTION M. 모니터링

### M-1. 발송 이력 추적

| 모델 | 존재 | 용도 |
|---|---|---|
| EmailLog | ❌ | - |
| KakaoLog | ❌ | - |
| NotificationLog | ❌ | - |
| DmSendLog | ✅ | DM 발송 이벤트 (Proposal 전용) |
| MessageCredit | ✅ | 메시지 비용 추적 (Proposal 전용) |

**결론**: 일반 알림(주문/배송/캠페인)의 발송 성공/실패 이력이 DB에 기록되지 않음. `console.error`만 존재.

### M-2. 어드민 모니터링

```bash
find src/app/**/admin/**/*notification* → 0건
```

- [x] 어드민 알림 대시보드: ❌ **없음**
- [x] 실패 알림 재발송 UI: ❌ **없음**
- [x] 발송 통계: ❌ **없음**

---

## 전체 매트릭스

### 전체 건강성 스코어 (100점 만점)

| 영역 | 만점 | 점수 | 근거 |
|---|---|---|---|
| 인프라 구조 | 15 | **11** | sendNotification 잘 설계됨, 직렬 발송 -2, tx 미지원 -1, 재시도 미적용 -1 |
| 이벤트 커버리지 | 20 | **12** | 20개 중 3채널 완전 8개, 인앱만 9개, 미구현 4개 |
| 결제 알림 품질 | 10 | **8** | 3채널 완전, 비회원 미대응 -1, 커미션 하드코딩 -1 |
| 데이터 유효성 | 10 | **7** | 기본 처리 양호, 이메일/전화 검증 부족 -2, XSS 미방지 -1 |
| 성능 & 확장성 | 10 | **7** | 통상 규모 OK, 직렬 발송 -1, N+1 -1, rate limit 미처리 -1 |
| 에러 핸들링 | 10 | **8** | try/catch 완벽, 재시도 불일치 -1, 로깅 품질 -1 |
| 보안 | 10 | **9** | 인증/권한 완벽, 환경변수 안전, 민감정보 노출 없음 (-1 XSS) |
| UX | 5 | **4** | NotificationBell 양호, 구매자 벨 없음 -1 |
| Prisma 건강성 | 5 | **3** | 인덱스 부족 -1, 로그 모델 없음 -1 |
| 모니터링 | 5 | **1** | 발송 로그 없음, 어드민 대시보드 없음 |
| **총점** | **100** | **68** | |

---

## 이슈 분류

### CRITICAL (즉시 수정 필요) -- 2개

1. **비회원 구매자 알림 전무** -- 게스트 주문 시 주문 확인 이메일/알림톡이 발송되지 않음. `sendNotification`이 `userId` required이므로 비회원 처리 불가. (`complete/route.ts:213`)

2. **BuyerNotificationSetting 무시** -- 구매자 수신거부 설정(DB 모델+UI)이 존재하지만 `sendNotification` 호출 시 설정을 조회/반영하지 않음. 수신거부한 사용자에게도 알림 발송됨.

### HIGH (1주 내 수정) -- 5개

3. **미사용 템플릿 5개** -- CNECSHOP_005(송장 리마인더), 009(체험 승인), 010(체험 배송), 011(체험 신청), 012(정산 확정) 빌더 함수가 존재하나 호출되지 않음. 해당 이벤트에서 인앱만 발송.

4. **정산 확정 알림 미구현** -- `settlementConfirmedMessage` 템플릿이 있으나 정산 확정 로직에서 sendNotification 호출 없음.

5. **알림톡 senderKey 미등록** -- `POPBILL_KAKAO_SENDER_KEY` 빈값 → 모든 알림톡 발송 실패.

6. **이메일 수신거부 링크 누락** -- 모든 이메일 템플릿에 unsubscribe 링크 없음. 한국 정보통신망법 및 CAN-SPAM 위반 가능.

7. **이메일 HTML XSS 미방지** -- 사용자 입력(상품명 등)이 이메일 HTML에 이스케이프 없이 삽입.

### MEDIUM (1개월 내) -- 8개

8. **회원가입 알림 미구현** -- 브랜드/크리에이터/구매자 가입 시 환영 알림 없음.
9. **환불 완료 알림 미구현** -- webhook에서 REFUNDED 처리 시 알림 없음.
10. **Notification 인덱스 부족** -- `@@index([userId, createdAt])` 누락 → 페이지네이션 성능 저하.
11. **직렬 채널 발송** -- `Promise.allSettled` 사용 시 응답 시간 50% 단축 가능.
12. **결제 알림 재시도 미적용** -- proposals에서는 `withRetry` 사용하나 결제 알림에는 미적용.
13. **알림 발송 로그 DB 미기록** -- EmailLog/KakaoLog 모델 없음 → 발송 성공/실패 추적 불가.
14. **어드민 알림 모니터링 대시보드 없음** -- 운영 중 발송 현황 파악 불가.
15. **구매자 헤더에 NotificationBell 미포함** -- 알림 설정은 있으나 벨 아이콘 없음.

### LOW (참고) -- 7개

16. **전화번호 국제번호(+82) 미처리** -- `stripHyphens`만 처리, 국제 포맷 미지원.
17. **이메일 정규식 검증 없음** -- truthiness만 체크.
18. **transporter.verify() 미호출** -- SMTP 연결 사전 검증 없음.
19. **다국어 알림 미지원** -- 한국어 하드코딩.
20. **이메일 plain text fallback 없음** -- HTML만 제공.
21. **백그라운드 탭 폴링 미제어** -- visibilitychange 미감지.
22. **크리에이터 커미션 하드코딩** -- `complete/route.ts:264`에서 0.10 고정.

---

## 프로덕션 준비도

| 시나리오 | 준비도 | 상세 |
|---|---|---|
| 인앱 알림만 사용 | ✅ 95% | 비회원 인앱 불가 외 정상 |
| 인앱 + 이메일 | ✅ 90% | SMTP 세팅 확인, 수신거부 링크 추가 필요 |
| 인앱 + 이메일 + 알림톡 (기본 12개) | 🟡 60% | senderKey 등록 + 5개 미사용 템플릿 연결 필요 |
| 전체 14개 + 벌크 제안 | 🟡 50% | 013/014 팝빌 심사 + senderKey + 미구현 이벤트 |

---

## 권장 조치 타임라인

### 즉시 (프로덕션 전)

1. **비회원 알림 처리**: `sendNotification`에 userId optional 지원 추가 또는 비회원 전용 `sendGuestNotification` 함수 생성
2. **BuyerNotificationSetting 연동**: sendNotification 호출 전 설정 조회하여 채널별 스킵 로직 추가
3. **senderKey 등록**: 팝빌 콘솔에서 카카오 채널 발신프로필 등록

### 단기 (1주)

4. **미사용 템플릿 5개 연결**: trial.ts, admin.ts의 인앱 전용 호출을 3채널 템플릿 호출로 교체
5. **정산 확정 알림 구현**: 정산 처리 로직에 `settlementConfirmedMessage` 호출 추가
6. **이메일 수신거부 링크**: `emailLayout()` 푸터에 수신거부 링크 추가
7. **XSS 방지**: `html-entities` 라이브러리 추가, 이메일 템플릿 내 사용자 입력 이스케이프

### 중기 (1개월)

8. **Notification 인덱스 추가**: `@@index([userId, createdAt])`
9. **채널 병렬 발송**: `sendNotification` 내부를 `Promise.allSettled`로 변경
10. **결제 알림 재시도**: `withRetry` 래퍼 적용
11. **발송 로그 모델**: EmailLog, KakaoLog 테이블 추가 + 발송 결과 기록
12. **어드민 대시보드**: 알림 발송 현황 + 실패 목록 + 재발송 기능

---

## 부록

### 부록 A. 환경변수 체크리스트 (Vercel)

| 변수 | 필수 | 현재 상태 |
|---|---|---|
| SMTP_HOST | ✅ | 설정됨 (기본: smtp.worksmobile.com) |
| SMTP_PORT | ✅ | 설정됨 (기본: 587) |
| SMTP_USER | ✅ | 설정 필요 |
| SMTP_PASSWORD | ✅ | 설정 필요 |
| EMAIL_FROM | ✅ | 설정 필요 |
| POPBILL_LINK_ID | ✅ | 설정됨 |
| POPBILL_SECRET_KEY | ✅ | 설정됨 |
| POPBILL_CORP_NUM | ✅ | 설정됨 |
| POPBILL_KAKAO_SENDER_KEY | ✅ | ❌ **빈값** |
| POPBILL_IS_TEST | 선택 | false (프로덕션) |

### 부록 B. 팝빌 템플릿 심사 현황

| 코드 | 상태 | 조치 |
|---|---|---|
| CNECSHOP_001 ~ 012 | 팝빌 승인 | ✅ 사용 가능 |
| CNECSHOP_013 | 신규 등록 필요 | 팝빌 콘솔에서 등록 + 카카오 심사 (1~3일) |
| CNECSHOP_014 | 신규 등록 필요 | 팝빌 콘솔에서 등록 + 카카오 심사 (1~3일) |

### 부록 C. 주요 파일 위치 인덱스

| 파일 | 용도 | 줄 수 |
|---|---|---|
| `src/lib/notifications/index.ts` | sendNotification 통합 함수 | 86 |
| `src/lib/notifications/email.ts` | sendEmail (nodemailer) | 50 |
| `src/lib/notifications/kakao.ts` | sendKakaoAlimtalk (팝빌) | 75 |
| `src/lib/notifications/templates.ts` | 14개 템플릿 빌더 + 이메일 HTML | 580 |
| `src/app/api/payments/complete/route.ts` | 결제 완료 3채널 알림 | 301 |
| `src/app/api/payments/webhook/route.ts` | 웹훅 (알림 없음) | 265 |
| `src/app/api/brand/proposals/route.ts` | 제안 발송 (3채널) | ~200 |
| `src/app/api/brand/proposals/bulk/route.ts` | 벌크 제안 (withRetry) | ~450 |
| `src/lib/actions/brand.ts` | 배송/캠페인/취소 알림 | ~1580 |
| `src/lib/actions/trial.ts` | 체험 알림 (인앱만) | ~810 |
| `src/lib/actions/admin.ts` | 승인/상태변경 알림 (인앱만) | ~870 |
| `src/lib/actions/creator.ts` | 캠페인 참여 알림 (인앱만) | ~820 |
| `src/components/layout/notification-bell.tsx` | 알림 벨 UI | 306 |
| `prisma/schema.prisma` | Notification + BuyerNotificationSetting | ~2400 |
| `docs/ALIMTALK_TEMPLATES.md` | 알림톡 템플릿 문서 | 68 |

### 부록 D. 주요 grep 결과 요약

- `sendNotification` 호출: **14개 파일, 62회**
- `CNECSHOP_` 참조: **templates.ts + ALIMTALK_TEMPLATES.md** (2파일)
- `NEXT_PUBLIC_POPBILL/SMTP`: **0건** (보안 양호)
- `sanitize|escape|dompurify`: **0건** (XSS 미방지)
- `retry|withRetry`: **2파일** (messaging/retry.ts, proposals/bulk에서만 사용)
- `NotificationBell` 사용: **header.tsx** (brand_admin + creator만)
- `BuyerNotificationSetting` 참조 in notifications/: **0건** (수신거부 미연동)

---

*리포트 끝*
