/**
 * Subscription Gating Service
 *
 * Checks subscription status and determines feature access levels.
 * Used by middleware, API routes, and client components to enforce
 * tier-based restrictions.
 *
 * Tier hierarchy:
 *   free → standard ($8.73) → superfan_bundle ($12.73) → studio ($16.00)
 *
 * DB tier enum values: 'free' | 'premium' | 'bundle' | 'studio'
 * (premium = standard, bundle = superfan_bundle in product naming)
 */

import { db, subscriptions } from '@opynx/db';
import { eq, and } from 'drizzle-orm';

// ─── Types ───

export type SubscriptionTier = 'free' | 'premium' | 'bundle' | 'studio';
export type SubscriptionStatus = 'active' | 'past_due' | 'inactive' | 'cancelled';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
}

// Paid tiers that unlock premium content
const PREMIUM_TIERS: Set<string> = new Set(['premium', 'bundle', 'studio']);

// ─── Primary Query ───

/**
 * Fetch the current subscription for a user.
 * Returns the active (or past_due within grace period) subscription,
 * or defaults to free tier if none found.
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
    ),
    orderBy: (subs, { desc }) => [desc(subs.createdAt)],
  });

  if (!sub) {
    return { tier: 'free', status: 'inactive', isActive: false };
  }

  const now = new Date();
  const isActive =
    sub.status === 'active' ||
    (sub.status === 'past_due' &&
      sub.gracePeriodEndsAt !== null &&
      new Date(sub.gracePeriodEndsAt) > now);

  return {
    tier: (sub.tier as SubscriptionTier) ?? 'free',
    status: (sub.status as SubscriptionStatus) ?? 'inactive',
    isActive,
  };
}

// ─── Feature Gates ───

/**
 * Can the user access premium content (ad-free, full tracks, etc.)?
 * Standard, Superfan Bundle, and Studio all unlock premium content.
 */
export function canAccessPremiumContent(tier: string): boolean {
  return PREMIUM_TIERS.has(tier);
}

/**
 * Can the user access creator tools (upload, events, analytics)?
 * Only users with the 'creator' role can access Creator Studio.
 */
export function canAccessCreatorTools(role: string): boolean {
  return role === 'creator';
}

/**
 * Determine audio streaming quality based on subscription tier.
 *   free     → 128kbps AAC
 *   standard → 320kbps
 *   bundle   → 320kbps
 *   studio   → FLAC lossless
 */
export function getAudioQuality(tier: string): '128' | '320' | 'flac' {
  if (tier === 'studio') return 'flac';
  if (PREMIUM_TIERS.has(tier)) return '320';
  return '128';
}

/**
 * How many skips per hour the user gets.
 *   free → 6 skips/hour
 *   paid → unlimited
 */
export function getSkipLimit(tier: string): number {
  if (PREMIUM_TIERS.has(tier)) return Infinity;
  return 6;
}

/**
 * Merch discount percentage.
 *   standard (premium) → 10%
 *   bundle             → 15%
 *   else               → 0%
 */
export function getMerchDiscount(tier: string): number {
  if (tier === 'premium') return 10;
  if (tier === 'bundle') return 15;
  return 0;
}

/**
 * Can the user send direct messages to artists?
 * Only available for standard (premium) and bundle subscribers.
 */
export function canMessageArtist(tier: string): boolean {
  return tier === 'premium' || tier === 'bundle';
}

/**
 * Maximum number of artists the user can follow.
 *   free → 5
 *   paid → unlimited (Infinity)
 */
export function getMaxFollows(tier: string): number {
  if (PREMIUM_TIERS.has(tier)) return Infinity;
  return 5;
}
