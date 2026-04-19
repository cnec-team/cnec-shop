import pRetry from 'p-retry'
import { logger } from '@/lib/notifications/logger'

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  minTimeout = 1000,
): Promise<T> {
  return pRetry(fn, {
    retries,
    minTimeout,
    factor: 2,
    onFailedAttempt: (err) =>
      logger.warn(`재시도 ${err.attemptNumber}회 실패`, { attempt: err.attemptNumber, retriesLeft: err.retriesLeft }),
  })
}
