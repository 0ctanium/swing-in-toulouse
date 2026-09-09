export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
};

export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const buckets = new Map<string, number[]>();

  return {
    consume(key: string, now = Date.now()) {
      const recent = (buckets.get(key) ?? []).filter(
        (timestamp) => now - timestamp < windowMs,
      );

      if (recent.length >= limit) {
        buckets.set(key, recent);
        return false;
      }

      recent.push(now);
      buckets.set(key, recent);
      return true;
    },
    reset() {
      buckets.clear();
    },
  };
}

/** 3 messages / 10 minutes / IP — in-memory, per serverless instance. */
export const contactRateLimiter = createRateLimiter({
  limit: 3,
  windowMs: 10 * 60 * 1000,
});

/** Phone reveal — a bit looser, still slows naive scrapers. */
export const phoneRevealRateLimiter = createRateLimiter({
  limit: 12,
  windowMs: 10 * 60 * 1000,
});
