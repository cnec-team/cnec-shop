// Status 상수 — Prisma enum 값과 1:1 매칭
// DB source of truth. 코드에서 status 비교 시 이 상수 사용 권장.

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  RECRUITING: 'RECRUITING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
} as const;

export const CAMPAIGN_PARTICIPATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const CONVERSION_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

export const SETTLEMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CARRIED_OVER: 'CARRIED_OVER',
} as const;

export const SAMPLE_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SHIPPED: 'shipped',
  RECEIVED: 'received',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  DECIDED: 'decided',
} as const;

export const MALL_SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

export const CREATOR_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const LIVE_SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
} as const;

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
} as const;
