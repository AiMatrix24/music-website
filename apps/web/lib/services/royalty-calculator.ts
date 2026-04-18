// Calculates and reserves industry royalty obligations from earnings
// Reserves money for PRO, MLC, publisher, and union before paying artist

export interface RoyaltyObligations {
  proReserve: number;       // % held for PROs (ASCAP/BMI/SESAC)
  mlcReserve: number;       // % held for mechanical royalties (MLC)
  publisherShare: number;   // % to publisher (default 50%)
  unionContribution: number;// AFM pension/health (~12% for unions)
  artistNet: number;        // What artist actually receives
  totalReserved: number;
}

export interface RoyaltyParams {
  grossEarnings: number;    // in cents
  proAffiliation: 'ASCAP' | 'BMI' | 'SESAC' | 'GMR' | 'NONE';
  isUnionMember: boolean;
  publisherSplit: number;   // 0-100 percentage
  songwriterSplits?: { writerId: string; percentage: number }[]; // must total 100
  isMechanicalRequired?: boolean; // true for digital streams
}

// Industry standard reserve rates
const PRO_RESERVE_RATE = 0.10;          // 10% held for PRO obligations
const MLC_STATUTORY_RATE = 0.091;       // 9.1% statutory mechanical royalty rate
const UNION_CONTRIBUTION_RATE = 0.12;   // 12% AFM pension/health
const DEFAULT_PUBLISHER_SPLIT = 50;     // 50/50 standard publisher/writer split

/**
 * Returns whether earnings should be reserved for a PRO based on affiliation.
 */
export function shouldReserveForPRO(proAffiliation: string): boolean {
  const normalized = proAffiliation.toUpperCase();
  return normalized === 'ASCAP' || normalized === 'BMI' || normalized === 'SESAC' || normalized === 'GMR';
}

/**
 * Returns the reserve percentage (as a decimal, e.g. 0.10 for 10%) for the PRO.
 * Returns 0 if no PRO affiliation.
 */
export function getProReservePercentage(proAffiliation: string): number {
  if (!shouldReserveForPRO(proAffiliation)) return 0;
  // ASCAP/BMI/SESAC/GMR all use the same standard reserve rate in our model.
  return PRO_RESERVE_RATE;
}

/**
 * Splits a gross amount across songwriters according to their percentage shares.
 * Splits must total 100. Amounts are returned in the same unit (cents) as the input.
 */
export function calculateSongwriterShares(
  grossEarnings: number,
  splits: { writerId: string; percentage: number }[]
): { writerId: string; amount: number }[] {
  if (!splits || splits.length === 0) return [];
  const totalPct = splits.reduce((s, x) => s + x.percentage, 0);
  if (Math.round(totalPct) !== 100) {
    throw new Error(`Songwriter splits must total 100%; got ${totalPct}`);
  }

  // Allocate proportionally; reconcile rounding into the largest share so the
  // sum of allocations equals grossEarnings exactly.
  const raw = splits.map((s) => ({
    writerId: s.writerId,
    amount: Math.floor((grossEarnings * s.percentage) / 100),
  }));

  const allocated = raw.reduce((s, x) => s + x.amount, 0);
  const remainder = grossEarnings - allocated;
  if (remainder !== 0 && raw.length > 0) {
    let largestIdx = 0;
    for (let i = 1; i < splits.length; i++) {
      if (splits[i].percentage > splits[largestIdx].percentage) largestIdx = i;
    }
    raw[largestIdx].amount += remainder;
  }

  return raw;
}

/**
 * Calculates royalty obligations and the artist's net payout from gross earnings.
 * All monetary values are in cents.
 *
 * Reserves are deducted in this order from the gross:
 *   1. PRO reserve (if affiliated)
 *   2. MLC reserve (if mechanical-eligible)
 *   3. Publisher share (taken from the writing-royalty portion remaining)
 *   4. Union pension/health (if AFM member)
 * Whatever remains is the artist's net.
 */
export function calculateRoyalties(params: RoyaltyParams): RoyaltyObligations {
  const {
    grossEarnings,
    proAffiliation,
    isUnionMember,
    publisherSplit,
    isMechanicalRequired = false,
  } = params;

  if (grossEarnings < 0) {
    throw new Error('grossEarnings must be non-negative');
  }
  if (publisherSplit < 0 || publisherSplit > 100) {
    throw new Error('publisherSplit must be between 0 and 100');
  }

  if (params.songwriterSplits) {
    const totalPct = params.songwriterSplits.reduce((s, x) => s + x.percentage, 0);
    if (Math.round(totalPct) !== 100) {
      throw new Error(`Songwriter splits must total 100%; got ${totalPct}`);
    }
  }

  // 1. PRO reserve
  const proReservePct = getProReservePercentage(proAffiliation);
  const proReserve = Math.round(grossEarnings * proReservePct);

  // 2. MLC reserve (mechanicals)
  const mlcReserve = isMechanicalRequired
    ? Math.round(grossEarnings * MLC_STATUTORY_RATE)
    : 0;

  // After PRO + MLC come out, what remains is the writing/master royalty pool
  // out of which the publisher takes their cut.
  const afterStatutoryReserves = grossEarnings - proReserve - mlcReserve;

  // 3. Publisher split — defaults to 50% if caller passes 50, else honors the value
  const effectivePublisherSplit = Number.isFinite(publisherSplit)
    ? publisherSplit
    : DEFAULT_PUBLISHER_SPLIT;
  const publisherShare = Math.round(
    afterStatutoryReserves * (effectivePublisherSplit / 100)
  );

  // 4. Union pension/health
  const unionContribution = isUnionMember
    ? Math.round(grossEarnings * UNION_CONTRIBUTION_RATE)
    : 0;

  const totalReserved = proReserve + mlcReserve + publisherShare + unionContribution;
  const artistNet = Math.max(0, grossEarnings - totalReserved);

  return {
    proReserve,
    mlcReserve,
    publisherShare,
    unionContribution,
    artistNet,
    totalReserved,
  };
}
