'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

// Subscriber discount logic: Premium (10%), Bundle (15%), Free (0%)
function getSubscriberDiscount(role?: string): { percent: number; label: string } {
  if (role === 'subscriber') return { percent: 10, label: 'Premium' };
  if (role === 'bundle') return { percent: 15, label: 'Bundle' };
  return { percent: 0, label: '' };
}

function CheckoutContent() {
  const params = useSearchParams();
  const listingId = params.get('item') ?? '';
  const { data: listing } = trpc.marketplace.getItem.useQuery(
    { id: listingId },
    { enabled: !!listingId }
  );
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Mock tier check using session role for subscriber discount
  const userRole = (session?.user as { role?: string })?.role;
  const discount = status === 'authenticated' ? getSubscriberDiscount(userRole) : { percent: 0, label: '' };

  const [quantity, setQuantity] = useState(1);
  const [payMethod, setPayMethod] = useState<'usdc' | 'card'>('usdc');
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to checkout</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  if (!listing && listingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading item...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl mb-2">🛒</p>
        <p className="text-gray-400">No item selected</p>
        <Link href="/explore" className="text-red-400">Browse Marketplace →</Link>
      </div>
    );
  }

  const unitPrice = listing.price / 100;
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotal * (discount.percent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const shipping = listing.category === 'services' ? 0 : 4.99;
  const platformFee = 0;
  const total = discountedSubtotal + shipping + platformFee;
  const artistEarns = discountedSubtotal * 0.85;
  const needsShipping = listing.category !== 'services';

  const handleCheckout = () => {
    if (needsShipping && (!shippingName || !shippingAddress || !shippingCity || !shippingZip)) {
      toast('Please fill in shipping details', 'error');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setOrderComplete(true);
      toast('Order placed!', 'success');
    }, 2000);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-green-600/20 flex items-center justify-center text-5xl mx-auto mb-6">✅</div>
          <h1 className="text-3xl font-black mb-2">Order Confirmed!</h1>
          <p className="text-gray-400 mb-8">Your order has been placed and the artist has been notified.</p>

          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 text-left mb-8">
            <h2 className="font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Item</span><span>{listing.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Quantity</span><span>{quantity}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Payment</span><span>{payMethod === 'usdc' ? 'USDC (Polygon)' : 'Card'}</span></div>
              <div className="flex justify-between font-bold border-t border-brand-800/20 pt-3"><span>Total</span><span className="text-red-400">${total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 p-3 bg-brand-950/50 rounded-lg text-xs text-gray-400">
              Artist receives: <span className="text-red-400 font-bold">${artistEarns.toFixed(2)}</span> (85%) — verified on Polygon
            </div>
          </div>

          {needsShipping && (
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 text-left mb-8">
              <h2 className="font-bold mb-2">Shipping To</h2>
              <p className="text-sm text-gray-400">{shippingName}</p>
              <p className="text-sm text-gray-400">{shippingAddress}</p>
              <p className="text-sm text-gray-400">{shippingCity}, {shippingState} {shippingZip}</p>
              <p className="text-xs text-gray-500 mt-2">Estimated delivery: 5-10 business days</p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/explore" className="block w-full rounded-full bg-red-600 py-3 font-semibold text-white text-center hover:bg-red-500 transition">Continue Shopping</Link>
            <Link href="/dashboard" className="block w-full rounded-full border border-brand-800/30 py-3 font-semibold text-center hover:border-red-600 transition">View Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href={`/marketplace/${listingId}`} className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">← Back to Item</Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center text-3xl shrink-0">
                  {categoryEmoji(listing.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg truncate">{listing.title}</h2>
                  <p className="text-sm text-gray-400">by {listing.sellerName ?? 'Unknown'}</p>
                  <p className="text-lg font-bold text-red-400 mt-1">${unitPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-brand-950 border border-brand-800/30 flex items-center justify-center text-sm hover:border-red-600 transition">−</button>
                  <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-8 h-8 rounded-full bg-brand-950 border border-brand-800/30 flex items-center justify-center text-sm hover:border-red-600 transition">+</button>
                </div>
              </div>
            </div>

            {/* Shipping */}
            {needsShipping && (
              <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
                <h2 className="font-bold mb-4">📦 Shipping Address</h2>
                <div className="space-y-4">
                  <input value={shippingName} onChange={(e) => setShippingName(e.target.value)} placeholder="Full Name *"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                  <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Street Address *"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                  <div className="grid grid-cols-3 gap-3">
                    <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="City *"
                      className="bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                    <input value={shippingState} onChange={(e) => setShippingState(e.target.value)} placeholder="State"
                      className="bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                    <input value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} placeholder="ZIP *"
                      className="bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-red-600 outline-none transition" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment method */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold mb-4">💳 Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPayMethod('usdc')}
                  className={`rounded-xl p-4 text-center transition border-2 ${payMethod === 'usdc' ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-brand-950'}`}>
                  <p className="text-2xl mb-1">💎</p>
                  <p className="font-bold text-sm">USDC (Polygon)</p>
                  <p className="text-xs text-gray-500">Instant · No fees</p>
                </button>
                <button onClick={() => setPayMethod('card')}
                  className={`rounded-xl p-4 text-center transition border-2 ${payMethod === 'card' ? 'border-red-600 bg-red-900/10' : 'border-brand-800/20 bg-brand-950'}`}>
                  <p className="text-2xl mb-1">💳</p>
                  <p className="font-bold text-sm">Card</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div>
            <div className="sticky top-24 rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{listing.title} x {quantity}</span>
                  {discount.percent > 0 ? (
                    <span>
                      <span className="line-through text-gray-500 mr-2">${subtotal.toFixed(2)}</span>
                      <span className="text-red-400">${discountedSubtotal.toFixed(2)}</span>
                    </span>
                  ) : (
                    <span>${subtotal.toFixed(2)}</span>
                  )}
                </div>
                {discount.percent > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Subscriber Discount ({discount.percent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {needsShipping && <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span>${shipping.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-400">Platform fee</span><span className="text-green-400">$0.00</span></div>
                <div className="border-t border-brand-800/20 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span><span className="text-red-400">${total.toFixed(2)}</span>
                </div>
              </div>

              {status === 'authenticated' && (
                <p className="text-xs text-green-400/80 mt-3">
                  Premium subscribers save 10% on all merch
                </p>
              )}

              <div className="mt-4 p-3 bg-brand-950/50 rounded-lg text-xs text-gray-400">
                <p>Artist receives: <span className="text-red-400 font-bold">${artistEarns.toFixed(2)}</span> (85%)</p>
                <p className="mt-1">Verified on Polygon. No middlemen.</p>
              </div>

              <button onClick={handleCheckout} disabled={processing}
                className="w-full mt-6 rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50">
                {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                🛡️ Secure checkout · 🔗 On-chain receipt
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function categoryEmoji(category: string): string {
  switch (category) {
    case 'physical_music': return '💿';
    case 'used_gear': return '🎛️';
    case 'services': return '🎵';
    case 'merch': return '👕';
    default: return '📦';
  }
}
