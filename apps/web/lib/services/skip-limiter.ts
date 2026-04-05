/**
 * Skip Limiter Service
 *
 * Tracks skip count per user per hour for free-tier users.
 * Premium, Bundle, and Studio users have unlimited skips.
 *
 * Free tier limit: 6 skips per rolling hour window.
 * When the limit is reached, the user must wait until the
 * window resets or upgrade to a paid tier.
 */

// ─── In-Memory Skip Tracking ───

const skipCounts = new Map<string, { count: number; resetAt: number }>();

// ─── Types ───

export interface SkipResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

// ─── Core Skip Check ───

/**
 * Check whether a user can skip and record the skip attempt.
 *
 * @param userId - Unique identifier for the user
 * @param tier - The user's subscription tier
 * @returns Object with allowed status, remaining skips, and reset timer
 */
export function canSkip(userId: string, tier: string): SkipResult {
  // Paid tiers have unlimited skips
  if (['premium', 'bundle', 'studio'].includes(tier)) {
    return { allowed: true, remaining: Infinity, resetIn: 0 };
  }

  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const key = `skip:${userId}`;
  const entry = skipCounts.get(key);

  if (!entry || now > entry.resetAt) {
    skipCounts.set(key, { count: 1, resetAt: now + hourMs });
    return { allowed: true, remaining: 5, resetIn: hourMs };
  }

  entry.count++;
  const remaining = Math.max(0, 6 - entry.count);
  const resetIn = entry.resetAt - now;

  return {
    allowed: entry.count <= 6,
    remaining,
    resetIn,
  };
}

// ─── User-Facing Message ───

/**
 * Generate a human-readable message when skip limit is reached.
 *
 * @param resetIn - Milliseconds until the skip window resets
 * @returns Formatted message string
 */
export function getSkipMessage(resetIn: number): string {
  const mins = Math.ceil(resetIn / 60000);
  return `You've used all 6 skips this hour. Upgrade to Premium for unlimited skips. Resets in ${mins} minutes.`;
}
