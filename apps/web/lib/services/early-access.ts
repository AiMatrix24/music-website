/**
 * Early Access Gate Service
 *
 * Checks if a track is in its early access window and whether
 * a user's subscription tier grants access.
 *
 * - Premium/Bundle subscribers get 24h early access to new releases
 * - Creator Studio gets 48h early access to their own content for QC
 * - Free users cannot access tracks during the early access window
 */

// ─── Early Access Window Check ───

/**
 * Checks if a track is currently in its early access window.
 * Returns true if the track has an earlyAccessUntil date that
 * is in the future.
 */
export function isInEarlyAccess(track: {
  createdAt: Date | string;
  earlyAccessUntil?: Date | string | null;
}): boolean {
  if (!track.earlyAccessUntil) return false;
  return new Date() < new Date(track.earlyAccessUntil);
}

// ─── Tier-Based Access Check ───

/**
 * Determines whether a user can access a track that is currently
 * in its early access window.
 *
 * @param tier - The user's subscription tier ('free' | 'premium' | 'bundle' | 'studio')
 * @param isOwnTrack - Whether the user is the creator of the track
 * @returns true if the user has access during the early access period
 */
export function canAccessEarlyRelease(
  tier: string,
  isOwnTrack: boolean = false
): boolean {
  // Creator viewing own track -> always access
  if (isOwnTrack) return true;
  // Premium and Bundle subscribers get early access
  if (['premium', 'bundle', 'studio'].includes(tier)) return true;
  // Free users cannot access early releases
  return false;
}

// ─── Early Access Window Duration ───

/**
 * Returns the number of hours of early access a tier receives.
 *
 * - studio:  48 hours (for QC of own content)
 * - premium: 24 hours
 * - bundle:  24 hours
 * - free:    0 hours (no early access)
 */
export function getEarlyAccessWindow(tier: string): number {
  switch (tier) {
    case 'studio':
      return 48;
    case 'premium':
    case 'bundle':
      return 24;
    default:
      return 0;
  }
}
