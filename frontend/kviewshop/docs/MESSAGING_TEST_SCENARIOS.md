# 메시징 통합 테스트 시나리오

## 시나리오 1: 크넥 인증회원 (3채널)

**조건:** cnecJoinStatus=VERIFIED, hasBrandEmail=true, hasPhone=true
**기대:**
- [x] 인앱 알림 생성 (notification INSERT)
- [x] 이메일 발송 (Naver Works SMTP, emailStatus=SENT)
- [x] 알림톡 발송 (팝빌 API, kakaoStatus=SENT)
- [ ] DM 발송 안함 (useInstagramDm=false)
**DB:** CreatorProposal.inAppStatus=SENT, emailStatus=SENT, kakaoStatus=SENT, dmStatus=SKIPPED

## 시나리오 2: 크넥 가입 + 전화없음 (2채널)

**조건:** cnecJoinStatus=JOINED, hasBrandEmail=true, hasPhone=false
**기대:**
- [x] 인앱 알림
- [x] 이메일 발송
- [ ] 알림톡 불가 (kakaoStatus=SKIPPED)
- [ ] DM 안함
**DB:** inAppStatus=SENT, emailStatus=SENT, kakaoStatus=SKIPPED

## 시나리오 3: Apify 미가입 + bio 이메일 (1채널)

**조건:** cnecJoinStatus=NOT_JOINED, hasBrandEmail=true (bio에서 추출), hasPhone=false
**기대:**
- [ ] 인앱 불가 (NOT_JOINED)
- [x] 이메일만 발송
- [ ] 알림톡 불가
**DB:** inAppStatus=SKIPPED, emailStatus=SENT

## 시나리오 4: 연락 수단 없음 + DM 체크 + IG 연동 (DM만)

**조건:** cnecJoinStatus=NOT_JOINED, hasBrandEmail=false, hasPhone=false, igUsername 있음, useInstagramDm=true, brand IG VERIFIED
**기대:**
- [ ] 인앱/이메일/알림톡 불가
- [x] DmSendQueue INSERT (dmStatus=QUEUED)
**DB:** dmStatus=SENT, DmSendQueue 레코드 존재

## 시나리오 5: 연락 수단 없음 + DM 체크 + IG 미연동 (400 에러)

**조건:** 위와 동일하되 brand IG NOT_VERIFIED
**기대:**
- 400 응답: `{ reason: 'BRAND_IG_NOT_LINKED', requiredAction: 'LINK_INSTAGRAM' }`
- CreatorProposal 생성 안됨

## 시나리오 6: 50명 일괄 발송

**조건:** 50명 선택, confirm=false -> 미리보기 -> confirm=true
**기대:**
1. confirm=false: `{ totalCount, freeCount, paidCount, paidAmount, channelBreakdown }`
2. confirm=true:
   - 50명 순회 -> 각 크리에이터별 가용 채널로 발송
   - Promise.allSettled로 병렬 처리
   - 실패해도 다른 크리에이터 계속 진행
3. 완료 후:
   - 브랜드 담당자 이메일로 리포트 발송 (fire-and-forget)
   - 리포트 내용: 총 발송, 성공/실패, 채널별 breakdown, 유료 비용

**리포트 메일 체크리스트:**
- [ ] 제목: "[크넥샵] 일괄 발송 완료 -- XX건 전송"
- [ ] 총 발송 건수
- [ ] 채널별 발송 건수
- [ ] 유료 발송 비용
- [ ] 발송 내역 링크

## 채널별 재시도 정책

| 채널 | 재시도 | 횟수 | 간격 |
|------|--------|------|------|
| 인앱 | 없음 | - | - |
| 이메일 | p-retry | 3회 | 1s -> 2s -> 4s |
| 알림톡 | p-retry | 3회 | 1s -> 2s -> 4s |
| DM | 수동 (DM 큐) | - | - |
