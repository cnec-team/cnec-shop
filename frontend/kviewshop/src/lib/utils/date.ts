/**
 * Centralized date utilities for campaign D-day calculations.
 * All D-day displays across the app should use these functions
 * to ensure consistency.
 */

/** Calculate remaining days until endAt. Returns -1 if no date, 0 if expired. Uses Math.ceil for partial days. */
export function calculateDDay(endAt: string | Date | undefined | null): number {
  if (!endAt) return -1
  const diff = new Date(endAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Calculate days until startAt for not-yet-started campaigns. Returns -1 if no date, 0 if already started. */
export function calculateDDayUntilStart(startAt: string | Date | undefined | null): number {
  if (!startAt) return -1
  const diff = new Date(startAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Get display label for D-day countdown to end. */
export function getDDayLabel(days: number): string {
  if (days < 0) return ''
  if (days === 0) return 'D-Day'
  return `D-${days}`
}

/** Get display label for D-day countdown to start. */
export function getDDayStartLabel(days: number): string {
  if (days <= 0) return ''
  return `D-${days} 오픈 예정`
}

/** Format campaign period as "M/D ~ M/D" */
export function formatCampaignPeriod(
  startAt: string | Date | undefined | null,
  endAt: string | Date | undefined | null
): string {
  if (!startAt && !endAt) return ''
  const fmt = (d: string | Date) => {
    const date = new Date(d)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  if (startAt && endAt) return `${fmt(startAt)} ~ ${fmt(endAt)}`
  if (startAt) return `${fmt(startAt)} ~`
  return `~ ${fmt(endAt!)}`
}

/** Check if a campaign has started based on its startAt date. */
export function hasCampaignStarted(startAt: string | Date | undefined | null): boolean {
  if (!startAt) return true // No startAt means it's already started
  return new Date(startAt).getTime() <= Date.now()
}

/** Real-time countdown breakdown for detail pages. */
export function getTimeRemaining(endAt: string | Date) {
  const diff = new Date(endAt).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  }
}

/** Calculate discount rate as integer percentage. */
export function calculateDiscountRate(originalPrice: number, campaignPrice: number): number {
  if (!originalPrice || originalPrice <= 0) return 0
  return Math.round((1 - campaignPrice / originalPrice) * 100)
}
