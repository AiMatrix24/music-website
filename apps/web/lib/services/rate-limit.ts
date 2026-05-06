/**
 * Redis-backed fixed-window rate limiter for tRPC mutations.
 *
 * Why fixed-window not sliding: simpler (single INCR + EXPIRE vs. ZSET ops),
 * cheap (one round-trip), and adequate for "don't get DoS'd / spammed" on
 * pre-launch. The boundary case (up to 2× limit across a window flip) is
 * fine when the limit is calibrated to "humans typing impatiently" rather
 * than "exact rate enforcement."
 *
 * Failure mode: if Redis is down or the call errors, this fails OPEN
 * (returns ok=true). Better to risk an extra request than to block all
 * users on a Redis hiccup. The error is logged for visibility.
 *
 * Usage from a tRPC middleware:
 *   const result = await checkRateLimit({ key, limit, windowSec });
 *   if (!result.allowed) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', ... });
 */
import { redis } from '../redis';

interface RateLimitArgs {
  /** Redis key — caller's responsibility to make it unique enough (e.g. `rl:tips.send:USER_ID`). */
  key: string;
  /** Max requests permitted per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Current count in this window (1-indexed; 1 means this was the first). Undefined on Redis error. */
  count?: number;
  /** Seconds until the window resets. Undefined on Redis error. */
  retryAfterSec?: number;
}

export async function checkRateLimit(args: RateLimitArgs): Promise<RateLimitResult> {
  try {
    const count = await redis.incr(args.key);
    if (count === 1) {
      // First hit in this window — set the TTL so it expires automatically.
      await redis.expire(args.key, args.windowSec);
    }
    if (count > args.limit) {
      const ttl = await redis.ttl(args.key);
      return {
        allowed: false,
        count,
        retryAfterSec: ttl > 0 ? ttl : args.windowSec,
      };
    }
    return { allowed: true, count };
  } catch (err) {
    console.error('[rate-limit] Redis error, failing open:', (err as Error).message);
    return { allowed: true };
  }
}
