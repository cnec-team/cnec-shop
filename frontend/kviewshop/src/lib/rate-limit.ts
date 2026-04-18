interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * In-memory rate limiter.
 * Returns true if rate limit exceeded.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return false;
  }

  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

// Periodic cleanup (every hour)
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (v.resetAt < now) store.delete(k);
    }
  }, 60 * 60 * 1000);
}
