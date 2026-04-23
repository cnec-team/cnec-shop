import { toZonedTime } from 'date-fns-tz'
import { startOfDay, endOfDay, startOfMonth, subDays, subMonths } from 'date-fns'

export const KST_TZ = 'Asia/Seoul'

/** UTC Date → KST 시각으로 변환 */
function toKst(date: Date = new Date()): Date {
  return toZonedTime(date, KST_TZ)
}

/** KST 기준 현재 시각 */
export function nowKst(): Date {
  return toKst()
}

/** KST 기준 자정 (해당 일자 00:00:00) — UTC로 반환 */
export function startOfDayKst(date: Date = new Date()): Date {
  const kst = toKst(date)
  const dayStart = startOfDay(kst)
  // KST 자정 → UTC: -9시간
  return new Date(dayStart.getTime() - 9 * 60 * 60 * 1000)
}

/** KST 기준 하루 끝 (해당 일자 23:59:59.999) — UTC로 반환 */
export function endOfDayKst(date: Date = new Date()): Date {
  const kst = toKst(date)
  const dayEnd = endOfDay(kst)
  return new Date(dayEnd.getTime() - 9 * 60 * 60 * 1000)
}

/** KST 기준 이번 달 1일 0시 — UTC로 반환 */
export function startOfMonthKst(date: Date = new Date()): Date {
  const kst = toKst(date)
  const monthStart = startOfMonth(kst)
  return new Date(monthStart.getTime() - 9 * 60 * 60 * 1000)
}

/** KST 기준 어제 자정 — UTC로 반환 */
export function startOfYesterdayKst(): Date {
  const kst = toKst()
  const yesterday = subDays(kst, 1)
  const dayStart = startOfDay(yesterday)
  return new Date(dayStart.getTime() - 9 * 60 * 60 * 1000)
}

/** KST 기준 어제 같은 시각 — UTC로 반환 */
export function yesterdaySameTimeKst(): Date {
  return subDays(new Date(), 1)
}

/** KST 기준 지난 달 1일 0시 — UTC로 반환 */
export function startOfLastMonthKst(): Date {
  const kst = toKst()
  const lastMonth = subMonths(kst, 1)
  const monthStart = startOfMonth(lastMonth)
  return new Date(monthStart.getTime() - 9 * 60 * 60 * 1000)
}

/** KST 기준 지난 달 같은 시각 — UTC로 반환 */
export function lastMonthSameTimeKst(): Date {
  return subMonths(new Date(), 1)
}

/** KST 기준 N일 전 자정 — UTC로 반환 */
export function daysAgoStartKst(days: number): Date {
  const kst = toKst()
  const daysAgo = subDays(kst, days)
  const dayStart = startOfDay(daysAgo)
  return new Date(dayStart.getTime() - 9 * 60 * 60 * 1000)
}
