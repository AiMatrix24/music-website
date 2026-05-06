import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Redis module BEFORE importing the unit under test, so checkRateLimit
// picks up the fake. ioredis is heavyweight + needs a server; mocking is the
// only sane approach for unit tests.
vi.mock('../redis', () => {
  const mockRedis = {
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  };
  return { redis: mockRedis };
});

import { checkRateLimit } from './rate-limit';
import { redis } from '../redis';

const mockRedis = redis as unknown as {
  incr: ReturnType<typeof vi.fn>;
  expire: ReturnType<typeof vi.fn>;
  ttl: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mockRedis.incr.mockReset();
  mockRedis.expire.mockReset();
  mockRedis.ttl.mockReset();
});

describe('checkRateLimit', () => {
  it('allows the first request and sets TTL on the new key', async () => {
    mockRedis.incr.mockResolvedValueOnce(1);
    mockRedis.expire.mockResolvedValueOnce(1);

    const result = await checkRateLimit({ key: 'rl:test:user1', limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
    expect(mockRedis.expire).toHaveBeenCalledWith('rl:test:user1', 60);
  });

  it('does NOT re-set TTL on subsequent requests within the same window', async () => {
    mockRedis.incr.mockResolvedValueOnce(5);

    const result = await checkRateLimit({ key: 'rl:test:user1', limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(5);
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('allows exactly the limit-th request', async () => {
    mockRedis.incr.mockResolvedValueOnce(10);

    const result = await checkRateLimit({ key: 'rl:test:user1', limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(10);
  });

  it('rejects the limit+1-th request and surfaces retryAfterSec from Redis TTL', async () => {
    mockRedis.incr.mockResolvedValueOnce(11);
    mockRedis.ttl.mockResolvedValueOnce(42);

    const result = await checkRateLimit({ key: 'rl:test:user1', limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBe(42);
  });

  it('falls back to windowSec when Redis returns -1/0 TTL on the rejection path', async () => {
    mockRedis.incr.mockResolvedValueOnce(11);
    mockRedis.ttl.mockResolvedValueOnce(-1); // key has no expiry — shouldn't happen but be safe

    const result = await checkRateLimit({ key: 'rl:test:user1', limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBe(60);
  });

  it('fails OPEN when Redis errors — never blocks legitimate users on infra hiccups', async () => {
    mockRedis.incr.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await checkRateLimit({ key: 'rl:test:user1', limit: 10, windowSec: 60 });

    expect(result.allowed).toBe(true);
    expect(result.count).toBeUndefined();
  });
});
