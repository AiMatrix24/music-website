import { NextRequest, NextResponse } from 'next/server';

// Creates a NOWPayments payment for subscription purchase
// Called when user clicks Subscribe on /subscribe page
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tier, userId } = body; // tier: 'standard' | 'superfan_bundle' | 'creator_studio'

  const prices: Record<string, number> = {
    standard: 8.73,
    superfan_bundle: 12.73,
    creator_studio: 16.0,
  };

  const price = prices[tier];
  if (!price) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });

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
        order_id: `sub_${tier}_${userId ?? 'anon'}_${Date.now()}`,
        order_description: `OPYNX ${tier} subscription - $${price}/mo`,
        ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
        success_url: `https://opynx.com/subscribe?success=true&tier=${tier}`,
        cancel_url: 'https://opynx.com/subscribe?cancelled=true',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[NOWPayments] Error:', data);
      return NextResponse.json({ error: 'Payment creation failed', details: data }, { status: 500 });
    }

    // Return the payment URL for redirect
    return NextResponse.json({
      paymentId: data.payment_id,
      payAddress: data.pay_address,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
    });
  } catch (error) {
    console.error('[NOWPayments] Error:', error);
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 });
  }
}
