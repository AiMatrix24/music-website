import { redis } from '../redis';

// ─── Redis-based Distributed Rate Limiter (sliding window) ───
// Used in production with Redis available. Falls back to in-memory when Redis is down.

export async function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.pexpire(redisKey, windowMs);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: windowMs,
    };
  } catch {
    // Redis down — fail open using in-memory fallback
    console.warn('[RateLimit] Redis unavailable, failing open with in-memory fallback');
    return checkRateLimitInMemory(key, limit, windowMs);
  }
}

// ─── In-Memory Fallback Rate Limiter ───
// Used when Redis is unavailable. Only effective per-instance (not distributed).

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const resetIn = entry.resetAt - now;

  return { allowed: entry.count <= limit, remaining, resetIn };
}

// Cleanup old in-memory entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetAt) requestCounts.delete(key);
  }
}, 300000);
