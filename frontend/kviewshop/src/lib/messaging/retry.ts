import pRetry from 'p-retry'

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
      console.warn(`[retry] attempt ${err.attemptNumber} failed:`, err),
  })
}
