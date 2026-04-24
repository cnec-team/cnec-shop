export type UpsellReason =
  | 'CAMPAIGN_LIMIT_REACHED'
  | 'MESSAGE_LIMIT_REACHED'
  | 'DETAIL_VIEW_LIMIT_REACHED'
  | 'TRIAL_ENDED_NEED_SUBSCRIPTION'
  | 'RESTRICTED_MODE'

export interface UpsellContext extends Record<string, unknown> {
  reason: UpsellReason
  currentPlan: 'TRIAL' | 'STANDARD' | 'PRO'
  suggestedPlan: 'STANDARD' | 'PRO'
  limit?: number
  used?: number
  resetAt?: string
  restrictedUntil?: string
}

export class UpsellRequiredError extends Error {
  public code = 'UPSELL_REQUIRED' as const

  constructor(public context: UpsellContext) {
    super(`Upsell required: ${context.reason}`)
    this.name = 'UpsellRequiredError'
  }

  toJSON(): UpsellContext {
    return { ...this.context }
  }
}

export function pricingLimitToUpsellContext(
  code: string,
  message: string,
): UpsellContext | null {
  const codeToReason: Record<string, UpsellReason> = {
    CAMPAIGN_LIMIT: 'CAMPAIGN_LIMIT_REACHED',
    MESSAGE_LIMIT: 'MESSAGE_LIMIT_REACHED',
    DETAIL_VIEW_LIMIT: 'DETAIL_VIEW_LIMIT_REACHED',
    TRIAL_ENDED: 'TRIAL_ENDED_NEED_SUBSCRIPTION',
    RESTRICTED: 'RESTRICTED_MODE',
  }
  const reason = codeToReason[code]
  if (!reason) return null
  return {
    reason,
    currentPlan: 'TRIAL',
    suggestedPlan: 'STANDARD',
  }
}

export function isUpsellError(err: unknown): err is UpsellRequiredError {
  return (
    err instanceof UpsellRequiredError ||
    (typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as Record<string, unknown>).code === 'UPSELL_REQUIRED')
  )
}
