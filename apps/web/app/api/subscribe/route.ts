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
 *    since the DB enum lacks an explicit 'pending' value)
 * 3. Call NOWPayments with order_id=`sub_{subscriptionId}_{tier}` (matches
 *    the format that apps/web/app/api/webhooks/nowpayments parses)
 * 4. On NOWPayments failure: delete the pending row + return error
 * 5. Return paymentUrl for client redirect
 *
 * The webhook flips status 'inactive' → 'active' on payment.finished,
 * and 'inactive' → 'cancelled' on failed/expired/refunded.
 */

type TierId = 'premium' | 'bundle' | 'studio';

const TIER_PRICES: Record<TierId, number> = {
  premium: 8.73,
  bundle: 12.73,
  studio: 16.0,
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Sign in required to subscribe' },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  const body = await request.json();
  const tier = body.tier as TierId | undefined;

  if (!tier || !(tier in TIER_PRICES)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const price = TIER_PRICES[tier];
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
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
    })
    .returning();

  await db.insert(subEvents).values({
    subscriptionId: sub.id,
    event: 'created',
    metadata: JSON.stringify({ source: 'nowpayments', tier, price }),
  });

  // 2. Create NOWPayments charge. order_id encodes the subscription UUID so
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
        order_description: `OPYNX ${tier} subscription — $${price}/mo`,
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
