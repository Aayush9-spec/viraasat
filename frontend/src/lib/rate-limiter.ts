export interface RateLimitConfig {
  windowMs: number; // Duration of window in ms
  max: number;      // Maximum allowed requests in window
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory token store for route rate-limiting
const store = new Map<string, RateLimitRecord>();

// Periodically clean up stale rate limit entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, 60000);
}

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Evaluates rate limit for a key (e.g. `ip:endpoint` or `user:endpoint`).
 * Returns whether the request is allowed, remaining requests, and reset timestamp.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt,
    };
  }

  if (record.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.max - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Pre-configured rate limits for common security boundaries
 */
export const SecurityRateLimits = {
  // Sensitive auth / PIN: 5 attempts per 15 minutes per IP
  ADMIN_PIN: { windowMs: 15 * 60 * 1000, max: 5 },
  // Orders & payments: 10 per minute per IP / user
  ORDER_CREATION: { windowMs: 60 * 1000, max: 10 },
  // Product uploads: 20 per minute per artisan
  PRODUCT_MUTATION: { windowMs: 60 * 1000, max: 20 },
  // Reviews: 6 per minute per user/IP
  REVIEW_SUBMISSION: { windowMs: 60 * 1000, max: 6 },
  // Auction bids: 15 per minute per user/IP to prevent bot manipulation
  AUCTION_BID: { windowMs: 60 * 1000, max: 15 },
  // File uploads: 10 per minute per user/IP
  FILE_UPLOAD: { windowMs: 60 * 1000, max: 10 },
  // General forms / newsletter: 10 per minute
  GENERAL_FORM: { windowMs: 60 * 1000, max: 10 },
} as const;
