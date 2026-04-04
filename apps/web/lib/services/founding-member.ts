/**
 * Founding Member Status
 *
 * During the first year of the platform, creators who sign up get:
 * - isFoundingMember = true
 * - foundingMemberExpiresAt = createdAt + 1 year
 * - Higher commission: $1.25 instead of $1.00 per subscriber
 * - Special badge on profile
 *
 * ALL monetary values are INTEGER CENTS. $1.00 = 100.
 */

const PLATFORM_LAUNCH_DATE = new Date('2026-04-01'); // Platform launch
const FOUNDING_PERIOD_END = new Date('2027-04-01'); // 1 year window

export function isWithinFoundingPeriod(): boolean {
  return new Date() < FOUNDING_PERIOD_END;
}

export function getFoundingMemberExpiry(): Date {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

export function getCreatorCommission(
  isFoundingMember: boolean,
  foundingMemberExpiresAt: Date | null
): number {
  if (isFoundingMember && foundingMemberExpiresAt && new Date() < foundingMemberExpiresAt) {
    return 125; // $1.25 in cents
  }
  return 100; // $1.00 in cents
}

export interface FoundingMemberBadge {
  label: string;
  icon: string;
  expiresAt: Date | null;
  active: boolean;
}

export function getFoundingMemberBadge(
  isFoundingMember: boolean,
  expiresAt: Date | null
): FoundingMemberBadge {
  return {
    label: 'Founding Creator',
    icon: '\u2B50',
    expiresAt,
    active: isFoundingMember && expiresAt !== null && new Date() < expiresAt,
  };
}
