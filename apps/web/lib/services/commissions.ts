/**
 * Commission Waterfall Engine
 *
 * Processes commission splits when a subscription payment is confirmed.
 * Builds on the core waterfall algorithm in @/lib/waterfall.ts but wraps
 * it with tier-aware pricing, logging, and a return shape suitable for
 * webhook handlers and future DB persistence.
 *
 * ALL monetary values are INTEGER CENTS. $1.00 = 100.
 * Floating-point arithmetic on currency is FORBIDDEN.
 */

// ─── Constants (integer cents) ───

const STANDARD_PRICE = 873; // $8.73
const BUNDLE_PRICE = 1273; // $12.73
const CREATOR_STUDIO_PRICE = 1600; // $16.00

const CREATOR_AMOUNT = 100; // $1.00 per creator — NEVER reduced
const MAX_STAKEHOLDER_CAP = 350; // $3.50 cap for standard tier

const BUNDLE_FACILITATOR_AMORTIZED = 50; // $0.50 amortized across bundle
const BUNDLE_PLATFORM_AMOUNT = 820; // $8.20

const FACILITATOR_TIER_RATES: Record<FacilitatorTier, number> = {
  silver: 25, // $0.25
  gold: 35, // $0.35
  platinum: 50, // $0.50
};

const DEFAULT_OUTLIER_MIN = 100; // $1.00
const DEFAULT_OUTLIER_MAX = 150; // $1.50

// ─── Types ───

export type SubscriptionTier = 'standard' | 'superfan_bundle';
export type FacilitatorTier = 'silver' | 'gold' | 'platinum';

export interface CommissionWaterfallParams {
  subscriptionId: string;
  tier: SubscriptionTier;
  /** Single creator ID for standard tier */
  creatorId?: string;
  /** Array of up to 4 creator IDs for bundle tier */
  creatorIds?: string[];
  facilitatorId?: string;
  outlierId?: string;
  geoVerified: boolean;
  facilitatorTier: FacilitatorTier;
  outlierRate?: number; // cents, negotiated per-deal (100-150)
}

export interface CommissionWaterfallResult {
  creatorAmount: number; // total creator payout in cents
  facilitatorAmount: number; // facilitator payout in cents
  outlierAmount: number; // outlier payout in cents
  platformAmount: number; // platform revenue in cents
  totalStakeholder: number; // creator + facilitator + outlier
  splits: CommissionSplitRecord[];
}

export interface CommissionSplitRecord {
  recipientId: string;
  role: 'creator' | 'facilitator' | 'outlier' | 'platform';
  amount: number; // integer cents
}

// ─── Engine ───

/**
 * Process commission waterfall for a confirmed subscription payment.
 *
 * Standard ($8.73):
 *   Creator: $1.00 (always, non-negotiable)
 *   Facilitator: $0.25-$0.50 (only if geo/TOTP verified)
 *   Outlier: $1.00-$1.50 (only if referral attribution exists)
 *   Platform: remainder
 *   Total stakeholder cap: $3.50
 *
 * Superfan Bundle ($12.73):
 *   4 Creators: $1.00 each = $4.00 total
 *   Facilitator: $0.50 (amortized)
 *   Platform: $8.20
 *
 * Creator Studio ($16.00):
 *   No commission split - 100% platform revenue (tooling subscription)
 */
export async function processCommissionWaterfall(
  params: CommissionWaterfallParams
): Promise<CommissionWaterfallResult> {
  const {
    subscriptionId,
    tier,
    creatorId,
    creatorIds,
    facilitatorId,
    outlierId,
    geoVerified,
    facilitatorTier,
    outlierRate,
  } = params;

  const splits: CommissionSplitRecord[] = [];

  if (tier === 'standard') {
    return processStandardWaterfall({
      subscriptionId,
      creatorId: creatorId!,
      facilitatorId,
      outlierId,
      geoVerified,
      facilitatorTier,
      outlierRate,
    });
  }

  if (tier === 'superfan_bundle') {
    const ids = creatorIds ?? (creatorId ? [creatorId] : []);
    return processBundleWaterfall({
      subscriptionId,
      creatorIds: ids.slice(0, 4),
      facilitatorId,
      geoVerified,
      facilitatorTier,
    });
  }

  // Should never reach here but satisfy TS
  throw new Error(`Unknown subscription tier: ${tier}`);
}

// ─── Standard Tier ($8.73) ───

function processStandardWaterfall(params: {
  subscriptionId: string;
  creatorId: string;
  facilitatorId?: string;
  outlierId?: string;
  geoVerified: boolean;
  facilitatorTier: FacilitatorTier;
  outlierRate?: number;
}): CommissionWaterfallResult {
  const splits: CommissionSplitRecord[] = [];

  // Step 1: Creator — ALWAYS $1.00, non-negotiable
  let creatorAmount = CREATOR_AMOUNT;
  splits.push({
    recipientId: params.creatorId,
    role: 'creator',
    amount: creatorAmount,
  });

  // Step 2: Facilitator — only if geo/TOTP verified
  let facilitatorAmount = 0;
  if (params.facilitatorId && params.geoVerified) {
    facilitatorAmount = FACILITATOR_TIER_RATES[params.facilitatorTier];
  }

  // Step 3: Outlier — only if referral attribution exists
  let outlierAmount = 0;
  if (params.outlierId) {
    outlierAmount = params.outlierRate ?? DEFAULT_OUTLIER_MIN;
    // Clamp to valid range
    outlierAmount = Math.max(
      DEFAULT_OUTLIER_MIN,
      Math.min(DEFAULT_OUTLIER_MAX, outlierAmount)
    );
  }

  // Step 4: Pro-rate if total stakeholder exceeds $3.50 cap
  const totalBeforeCap = creatorAmount + facilitatorAmount + outlierAmount;
  if (totalBeforeCap > MAX_STAKEHOLDER_CAP) {
    // Creator NEVER reduced. Pro-rate facilitator + outlier proportionally.
    const remaining = MAX_STAKEHOLDER_CAP - CREATOR_AMOUNT;
    const combined = facilitatorAmount + outlierAmount;
    if (combined > 0) {
      facilitatorAmount = Math.floor(
        (facilitatorAmount * remaining) / combined
      );
      outlierAmount = Math.floor((outlierAmount * remaining) / combined);
    }
  }

  // Add facilitator split
  if (params.facilitatorId && params.geoVerified && facilitatorAmount > 0) {
    splits.push({
      recipientId: params.facilitatorId,
      role: 'facilitator',
      amount: facilitatorAmount,
    });
  }

  // Add outlier split
  if (params.outlierId && outlierAmount > 0) {
    splits.push({
      recipientId: params.outlierId,
      role: 'outlier',
      amount: outlierAmount,
    });
  }

  // Platform receives remainder
  const totalStakeholder = creatorAmount + facilitatorAmount + outlierAmount;
  const platformAmount = STANDARD_PRICE - totalStakeholder;

  splits.push({
    recipientId: 'platform',
    role: 'platform',
    amount: platformAmount,
  });

  const result: CommissionWaterfallResult = {
    creatorAmount,
    facilitatorAmount,
    outlierAmount,
    platformAmount,
    totalStakeholder,
    splits,
  };

  console.log(
    `[Commission Waterfall] Standard | sub=${params.subscriptionId} ` +
      `creator=$${(creatorAmount / 100).toFixed(2)} ` +
      `facilitator=$${(facilitatorAmount / 100).toFixed(2)} ` +
      `outlier=$${(outlierAmount / 100).toFixed(2)} ` +
      `platform=$${(platformAmount / 100).toFixed(2)} ` +
      `totalStakeholder=$${(totalStakeholder / 100).toFixed(2)}`
  );

  return result;
}

// ─── Superfan Bundle ($12.73) ───

function processBundleWaterfall(params: {
  subscriptionId: string;
  creatorIds: string[];
  facilitatorId?: string;
  geoVerified: boolean;
  facilitatorTier: FacilitatorTier;
}): CommissionWaterfallResult {
  const splits: CommissionSplitRecord[] = [];

  // Each creator gets $1.00 — ALWAYS
  let creatorAmount = 0;
  for (const id of params.creatorIds) {
    splits.push({
      recipientId: id,
      role: 'creator',
      amount: CREATOR_AMOUNT,
    });
    creatorAmount += CREATOR_AMOUNT;
  }

  // Facilitator: $0.50 amortized across the bundle (only if verified)
  let facilitatorAmount = 0;
  if (params.facilitatorId && params.geoVerified) {
    facilitatorAmount = BUNDLE_FACILITATOR_AMORTIZED;
    splits.push({
      recipientId: params.facilitatorId,
      role: 'facilitator',
      amount: facilitatorAmount,
    });
  }

  // No outlier for bundle tier
  const outlierAmount = 0;

  // Platform: remainder
  const totalStakeholder = creatorAmount + facilitatorAmount + outlierAmount;
  const platformAmount = BUNDLE_PRICE - totalStakeholder;

  splits.push({
    recipientId: 'platform',
    role: 'platform',
    amount: platformAmount,
  });

  const result: CommissionWaterfallResult = {
    creatorAmount,
    facilitatorAmount,
    outlierAmount,
    platformAmount,
    totalStakeholder,
    splits,
  };

  console.log(
    `[Commission Waterfall] Bundle | sub=${params.subscriptionId} ` +
      `creators=${params.creatorIds.length}x$1.00=$${(creatorAmount / 100).toFixed(2)} ` +
      `facilitator=$${(facilitatorAmount / 100).toFixed(2)} ` +
      `platform=$${(platformAmount / 100).toFixed(2)} ` +
      `totalStakeholder=$${(totalStakeholder / 100).toFixed(2)}`
  );

  return result;
}
