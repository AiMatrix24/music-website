import { NextRequest, NextResponse } from 'next/server';

// Creates a NOWPayments payment for ticket purchase
// Called when user clicks Buy Ticket on an event page
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { eventId, ticketTypeId, quantity, priceUsd, userId } = body;

  if (!eventId || !ticketTypeId || !quantity || !priceUsd) {
    return NextResponse.json(
      { error: 'eventId, ticketTypeId, quantity, and priceUsd are required' },
      { status: 400 }
    );
  }

  if (quantity < 1 || quantity > 10) {
    return NextResponse.json({ error: 'Quantity must be between 1 and 10' }, { status: 400 });
  }

  const totalPrice = priceUsd * quantity;

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
        price_amount: totalPrice,
        price_currency: 'usd',
        pay_currency: 'usdcmatic', // USDC on Polygon
        order_id: `ticket_${eventId}_${ticketTypeId}_${userId ?? 'anon'}_${Date.now()}`,
        order_description: `OPYNX ticket x${quantity} - event ${eventId}`,
        ipn_callback_url: 'https://opynx.com/api/webhooks/nowpayments',
        success_url: `https://opynx.com/events/${eventId}?ticketSuccess=true`,
        cancel_url: `https://opynx.com/events/${eventId}?ticketCancelled=true`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[NOWPayments] Ticket payment error:', data);
      return NextResponse.json({ error: 'Payment creation failed', details: data }, { status: 500 });
    }

    return NextResponse.json({
      paymentId: data.payment_id,
      payAddress: data.pay_address,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      paymentUrl: `https://nowpayments.io/payment/?iid=${data.payment_id}`,
    });
  } catch (error) {
    console.error('[NOWPayments] Ticket payment error:', error);
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 });
  }
}
