import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@opynx/auth';
import { db, subscriptions, subEvents } from '@opynx/db';
import { eq } from 'drizzle-orm';

/**
 * Creates a NOWPayments charge for a subscription purchase.
 *
 * Flow:
 * 1. Require authenticated user (no anonymous subs)
 * 2. INSERT subscription row with status='inactive' (= our "pending" state,
 *    since the DB enum lacks an explicit 'pending' value). Persist the
 *    attribution payload (where this came from) on the row.
 * 3. Call NOWPayments with order_id=`sub_{subscriptionId}_{tier}` and
 *    `order_description` containing the creator metadata as JSON so the
 *    webhook can run the commission waterfall on payment completion.
 * 4. On NOWPayments failure: delete the pending row + return error
 * 5. Return paymentUrl for client redirect
 *
 * The webhook flips status 'inactive' → 'active' on payment.finished,
 * and 'inactive' → 'cancelled' on failed/expired/refunded.
 *
 * Attribution shape (all fields optional except the one matching the tier):
 *   { source: 'qr' | 'subscribe-page' | 'artist-page',
 *     creatorId: string,           // REQUIRED for premium tier
 *     creatorIds: string[],        // REQUIRED for bundle tier (length 1-4)
 *     eventId: string,             // optional event attribution (?ev= URL param)
 *     scanLat: number, scanLng: number,  // optional GPS at signup
 *     scannedAt: ISO string }
 */

type TierId = 'premium' | 'bundle' | 'studio';

const TIER_PRICES: Record<TierId, number> = {
  premium: 8.73,
  bundle: 12.73,
  studio: 16.0,
};

interface SubscribeBody {
  tier?: TierId;
  paymentMethod?: 'usdc' | 'card';
  // Attribution
  source?: 'qr' | 'subscribe-page' | 'artist-page';
  creatorId?: string;
  creatorIds?: string[];
  eventId?: string;
  scanLat?: number;
  scanLng?: number;
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Sign in required to subscribe' },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const tier = body.tier;
  if (!tier || !(tier in TIER_PRICES)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Validate creator selection per tier. Premium = exactly one creator;
  // bundle = 1-4 creators; studio = no creator (it's a creator-tools tier).
  if (tier === 'premium') {
    if (!body.creatorId || !UUID_RE.test(body.creatorId)) {
      return NextResponse.json(
        { error: 'Premium subscription requires creatorId' },
        { status: 400 }
      );
    }
  } else if (tier === 'bundle') {
    const ids = (body.creatorIds ?? []).filter((id) => UUID_RE.test(id));
    if (ids.length < 1 || ids.length > 4) {
      return NextResponse.json(
        { error: 'Bundle subscription requires 1-4 creatorIds' },
        { status: 400 }
      );
    }
    body.creatorIds = ids;
  }

  const price = TIER_PRICES[tier];
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
  }

  // Build attribution payload — what we persist on the sub row + send to webhook.
  const attribution: Record<string, unknown> = {
    source: body.source ?? 'subscribe-page',
    scannedAt: new Date().toISOString(),
  };
  if (tier === 'premium' && body.creatorId) attribution.creatorId = body.creatorId;
  if (tier === 'bundle' && body.creatorIds) attribution.creatorIds = body.creatorIds;
  if (body.eventId && UUID_RE.test(body.eventId)) attribution.eventId = body.eventId;
  if (typeof body.scanLat === 'number' && typeof body.scanLng === 'number') {
    // Clamp to valid lat/lng ranges; reject obvious junk.
    if (Math.abs(body.scanLat) <= 90 && Math.abs(body.scanLng) <= 180) {
      attribution.scanLat = body.scanLat;
      attribution.scanLng = body.scanLng;
    }
  }

  // 1. Create pending subscription row. status='inactive' is our pending state.
  //    The webhook flips it to 'active' once payment lands.
  const [sub] = await db
    .insert(subscriptions)
    .values({
      userId,
      tier,
      status: 'inactive',
      billingCycle: 'monthly',
      attribution,
    })
    .returning();

  await db.insert(subEvents).values({
    subscriptionId: sub.id,
    event: 'created',
    metadata: JSON.stringify({ source: 'nowpayments', tier, price, attribution }),
  });

  // 2. Build the NOWPayments order_description as JSON metadata so the
  //    webhook's parseOrderMetadata (which tries JSON first) gets all the
  //    creator info needed for the commission waterfall.
  const orderMetadata: Record<string, unknown> = {};
  if (tier === 'premium' && body.creatorId) orderMetadata.creatorId = body.creatorId;
  if (tier === 'bundle' && body.creatorIds) orderMetadata.creatorIds = body.creatorIds;
  if (body.eventId && UUID_RE.test(body.eventId)) orderMetadata.eventId = body.eventId;

  // 3. Create NOWPayments charge. order_id encodes the subscription UUID so
  //    the webhook can find and activate the row (format must match
  //    handleSubscriptionPayment's parser: sub_{subscriptionId}_{tier}).
  try {
    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: price,
        price_currency: 'usd',
        pay_currency: 'usdcmatic', // USDC on Polygon
        order_id: `sub_${sub.id}_${tier}`,
        order_description: JSON.stringify(orderMetadata),
        ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
        success_url: `https://opynx.com/subscribe?success=true&tier=${tier}`,
        cancel_url: 'https://opynx.com/subscribe?cancelled=true',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.payment_id) {
      // Roll back: delete the pending subscription so we don't leave orphans
      await db.delete(subEvents).where(eq(subEvents.subscriptionId, sub.id));
      await db.delete(subscriptions).where(eq(subscriptions.id, sub.id));
      console.error('[NOWPayments] Error creating subscription payment:', data);
      return NextResponse.json(
        { error: 'Payment creation failed', details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: sub.id,
      paymentId: data.payment_id,
      paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
    });
  } catch (error) {
    // Network or other error — roll back
    await db.delete(subEvents).where(eq(subEvents.subscriptionId, sub.id));
    await db.delete(subscriptions).where(eq(subscriptions.id, sub.id));
    console.error('[NOWPayments] Subscribe error:', error);
    return NextResponse.json(
      { error: 'Payment service unavailable' },
      { status: 503 }
    );
  }
}
