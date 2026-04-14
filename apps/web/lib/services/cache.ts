/**
 * Redis Caching Layer for Hot Queries
 *
 * Wraps Redis GET/SET with JSON serialization and TTL management.
 * All cache operations fail silently if Redis is unavailable,
 * ensuring the app degrades gracefully without caching.
 */

import { redis } from '../redis';

const DEFAULT_TTL = 300; // 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null; // Redis down — skip cache
  }
}

export async function setCache(key: string, data: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
  try {
    await redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(data));
  } catch {
    // Redis down — skip silently
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Redis down — skip
  }
}

// Pre-built cache keys
export const CacheKeys = {
  creatorProfile: (id: string) => `creator:${id}`,
  trackDetail: (id: string) => `track:${id}`,
  eventDetail: (id: string) => `event:${id}`,
  homepageStats: () => 'homepage:stats',
  trendingTracks: () => 'trending:tracks',
  chartData: (period: string) => `charts:${period}`,
};
