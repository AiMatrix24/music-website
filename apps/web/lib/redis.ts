import Redis from 'ioredis';

const getRedisUrl = (): string => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL environment variable is not set');
  }
  return url;
};

/**
 * Singleton Redis client for the application.
 * Used for idempotency checks, caching, and session storage.
 */
export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('error', (error: Error) => {
  console.error('[Redis] Connection error:', error.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

export type RedisClient = typeof redis;
