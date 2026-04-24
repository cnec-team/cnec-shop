# 크넥샵 알림 시스템 V2

> 최종 업데이트: 2026-04-24
> 총 56종 (기존 29 + 신규 27)

## 트리거 타입 매트릭스

| 트리거 | 종 수 | 번호 |
|--------|-------|------|
| API (서버 액션) | 31 | 1-4,6-14,16-29,33,35,36,41,48,55,56,63,64 |
| Webhook (PortOne) | 4 | 1,6,31,34 |
| Cron | 10 | 5,32,44,45,46,49,50,52,53,54,57 |
| 어드민 수동 | 2 | 61,62 |
| Auth callback | 2 | 42,43 |

## 마케팅 vs 거래성

| 분류 | 종 수 | 수신동의 | 번호 |
|------|-------|---------|------|
| 거래성 | 50 | 무관 | 1-45,52-57,61-64 |
| 마케팅 | 6 | 필수 | 46,47,48,49,50,51 |

## Cron 스케줄 (신규 9개)

| 이름 | 경로 | 주기 | 대상 |
|------|------|------|------|
| shipping-delay | /api/cron/shipping-delay | 매시간 | PAID+3일+송장없음 |
| dormant-warning | /api/cron/dormant-warning | 매일 | 335일 미접속 |
| dormant-transition | /api/cron/dormant-transition | 매일 | 365일 미접속 |
| cart-reminder | /api/cron/cart-reminder | 매일 | 24-48h 방치 장바구니 |
| coupon-expiry | /api/cron/coupon-expiry | 매일 | 7일/1일 전 쿠폰 |
| repurchase-reminder | /api/cron/repurchase-reminder | 매일 | 45일 재구매 주기 |
| monthly-report | /api/cron/monthly-report | 매월 1일 | 활성 크리에이터/브랜드 |
| weekly-summary | /api/cron/weekly-summary | 매주 월 | 활성 크리에이터 |
| low-stock-check | /api/cron/low-stock-check | 매시간 | stock<=5 상품 |

## Prisma 신규 모델

- NotificationLog: 알림 발송 이력
- CronJobLog: Cron 실행 이력
- RestockSubscription: 재입고 알림 구독
- Follow: 크리에이터 팔로우

## 추후 작업

- [ ] 팝빌 카카오 27종 등록 + 심사
- [ ] 인앱 알림 27종 카피 상세
- [ ] src/lib/reports/monthly.ts 리포트 집계
- [ ] 쿠폰 모델 연동 (#48, #49)
- [ ] Follow 프론트 연결 (#51)
