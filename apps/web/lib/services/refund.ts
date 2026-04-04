/**
 * Refund Flow Service (Task P.6)
 *
 * Processes subscription refunds within a 30-day window.
 * Reverses all commissions tied to the subscription and logs events.
 *
 * ALL monetary values are INTEGER CENTS. $1.00 = 100.
 */

// ─── Types ───

export interface RefundRequest {
  subscriptionId: string;
  userId: string;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  commissionsReversed: number;
  error?: string;
}

interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'cancelled' | 'refunded';
  createdAt: Date;
  amountCents: number;
}

interface Commission {
  id: string;
  subscriptionId: string;
  recipientId: string;
  amountCents: number;
  status: 'paid' | 'pending' | 'reversed';
}

interface SubscriptionEvent {
  subscriptionId: string;
  type: 'created' | 'payment' | 'cancelled' | 'refunded' | 'commission_reversed';
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ─── Constants ───

const REFUND_WINDOW_DAYS = 30;

// ─── Mock Data Layer ───

function getSubscription(subscriptionId: string): Subscription | null {
  // Simulated DB lookup
  console.log(`[refund] Fetching subscription: ${subscriptionId}`);
  return {
    id: subscriptionId,
    userId: 'user-mock',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    amountCents: 873,
  };
}

function getCommissionsForSubscription(subscriptionId: string): Commission[] {
  console.log(`[refund] Fetching commissions for subscription: ${subscriptionId}`);
  return [
    { id: 'comm-1', subscriptionId, recipientId: 'creator-1', amountCents: 100, status: 'paid' },
    { id: 'comm-2', subscriptionId, recipientId: 'facilitator-1', amountCents: 35, status: 'paid' },
    { id: 'comm-3', subscriptionId, recipientId: 'outlier-1', amountCents: 120, status: 'paid' },
  ];
}

function updateSubscriptionStatus(subscriptionId: string, status: Subscription['status']): void {
  console.log(`[refund] Subscription ${subscriptionId} status → ${status}`);
}

function reverseCommission(commissionId: string): void {
  console.log(`[refund] Commission ${commissionId} status → reversed`);
}

function logSubscriptionEvent(event: SubscriptionEvent): void {
  console.log(`[refund] Event logged: ${event.type} for subscription ${event.subscriptionId}`, event.metadata);
}

function generateRefundId(): string {
  return `ref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Core Logic ───

export async function processRefund(request: RefundRequest): Promise<RefundResult> {
  const { subscriptionId, userId, reason } = request;

  console.log(`[refund] Processing refund request for subscription: ${subscriptionId}, user: ${userId}`);

  // Step 1: Fetch and validate subscription
  const subscription = getSubscription(subscriptionId);

  if (!subscription) {
    console.log(`[refund] Subscription not found: ${subscriptionId}`);
    return { success: false, commissionsReversed: 0, error: 'Subscription not found' };
  }

  if (subscription.userId !== userId) {
    console.log(`[refund] User ${userId} does not own subscription ${subscriptionId}`);
    return { success: false, commissionsReversed: 0, error: 'Unauthorized: subscription does not belong to this user' };
  }

  if (subscription.status !== 'active') {
    console.log(`[refund] Subscription ${subscriptionId} is not active (status: ${subscription.status})`);
    return { success: false, commissionsReversed: 0, error: `Subscription is already ${subscription.status}` };
  }

  // Step 2: Validate 30-day refund window
  const daysSinceCreation = (Date.now() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation > REFUND_WINDOW_DAYS) {
    console.log(`[refund] Refund window expired: ${Math.floor(daysSinceCreation)} days since subscription created`);
    return {
      success: false,
      commissionsReversed: 0,
      error: `Refund window has expired. Subscriptions can only be refunded within ${REFUND_WINDOW_DAYS} days.`,
    };
  }

  console.log(`[refund] Within refund window: ${Math.floor(daysSinceCreation)} / ${REFUND_WINDOW_DAYS} days`);

  // Step 3: Cancel the subscription
  updateSubscriptionStatus(subscriptionId, 'cancelled');
  logSubscriptionEvent({
    subscriptionId,
    type: 'cancelled',
    metadata: { reason, initiatedBy: userId, trigger: 'refund' },
    createdAt: new Date(),
  });

  // Step 4: Reverse all commissions
  const commissions = getCommissionsForSubscription(subscriptionId);
  let reversedCount = 0;

  for (const commission of commissions) {
    if (commission.status === 'reversed') {
      console.log(`[refund] Commission ${commission.id} already reversed, skipping`);
      continue;
    }

    reverseCommission(commission.id);
    reversedCount++;

    logSubscriptionEvent({
      subscriptionId,
      type: 'commission_reversed',
      metadata: {
        commissionId: commission.id,
        recipientId: commission.recipientId,
        amountCents: commission.amountCents,
      },
      createdAt: new Date(),
    });
  }

  console.log(`[refund] Reversed ${reversedCount} commission(s)`);

  // Step 5: Log refund event
  const refundId = generateRefundId();

  logSubscriptionEvent({
    subscriptionId,
    type: 'refunded',
    metadata: {
      refundId,
      reason,
      userId,
      amountCents: subscription.amountCents,
      commissionsReversed: reversedCount,
    },
    createdAt: new Date(),
  });

  console.log(`[refund] Refund complete: ${refundId}`);

  return {
    success: true,
    refundId,
    commissionsReversed: reversedCount,
  };
}
