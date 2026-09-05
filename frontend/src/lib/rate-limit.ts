/** Simple in-memory rate limiter for edge API routes */
const rateMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const record = rateMap.get(key);

  if (!record || now > record.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1, reset: windowSeconds };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, reset: retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, reset: Math.ceil((record.resetAt - now) / 1000) };
}
