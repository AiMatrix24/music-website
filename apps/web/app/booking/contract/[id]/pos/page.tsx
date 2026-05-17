'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/Toast';
import { trpc } from '@/lib/trpc/client';

type Cart = Record<string, number>; // menuItemId → qty

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ContractPOSPage() {
  const { id } = useParams<{ id: string }>();
  const { status: sessionStatus, data: session } = useSession();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: contractData, isLoading } = trpc.bookings.getContract.useQuery({ id }, { enabled: !!id && sessionStatus === 'authenticated' });
  const c = contractData?.contract;
  const isOwner = !!c && c.venueOwnerUserId === session?.user?.id;

  const { data: menu, refetch: refetchMenu } = trpc.concessions.listMenu.useQuery(
    c ? { venueId: c.venueId, includeInactive: isOwner } : { venueId: '', includeInactive: false },
    { enabled: !!c }
  );

  const { data: orders, refetch: refetchOrders } = trpc.concessions.listOrdersByContract.useQuery({ contractId: id }, { enabled: !!c });
  const { data: settlement, refetch: refetchSettlement } = trpc.concessions.settlement.useQuery({ contractId: id }, { enabled: !!c });

  const [cart, setCart] = useState<Cart>({});
  const [buyerName, setBuyerName] = useState('');
  const [payment, setPayment] = useState<'cash' | 'card' | 'usdc' | 'tab'>('cash');

  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'drinks' });

  const createItem = trpc.concessions.createMenuItem.useMutation({
    onSuccess: () => {
      toast('Item added', 'success');
      setNewItem({ name: '', price: '', category: 'drinks' });
      setShowAdd(false);
      void refetchMenu();
    },
    onError: (err) => toast(err.message || 'Add failed', 'error'),
  });
  const updateItem = trpc.concessions.updateMenuItem.useMutation({
    onSuccess: () => void refetchMenu(),
    onError: (err) => toast(err.message || 'Update failed', 'error'),
  });
  const sell = trpc.concessions.sell.useMutation({
    onSuccess: () => {
      toast('Sale recorded', 'success');
      setCart({});
      setBuyerName('');
      void refetchOrders();
      void refetchSettlement();
    },
    onError: (err) => toast(err.message || 'Sale failed', 'error'),
  });
  const voidOrder = trpc.concessions.voidOrder.useMutation({
    onSuccess: () => {
      void refetchOrders();
      void refetchSettlement();
    },
    onError: (err) => toast(err.message || 'Void failed', 'error'),
  });

  const totalCents = useMemo(() => {
    if (!menu) return 0;
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = menu.find((m) => m.id === itemId);
      return sum + (item ? item.priceCents * qty : 0);
    }, 0);
  }, [cart, menu]);

  if (sessionStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-brand-950 text-white text-center">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">Sign In</Link>
      </div>
    );
  }
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  if (!c) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 p-8">Contract not found</div>
  );
  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-brand-950 text-white text-center">
        <h1 className="text-2xl font-bold">Venue owners only</h1>
        <p className="text-gray-400">The POS is for venue staff to ring up sales.</p>
        <Link href={`/booking/contract/${id}`} className="text-red-400 hover:underline">Back to contract</Link>
      </div>
    );
  }
  if (c.status !== 'signed' && c.status !== 'completed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-brand-950 text-white text-center">
        <h1 className="text-2xl font-bold">Contract not signed yet</h1>
        <p className="text-gray-400">Both parties need to sign before you can sell concessions against this booking.</p>
        <Link href={`/booking/contract/${id}`} className="text-red-400 hover:underline">Open contract</Link>
      </div>
    );
  }

  const handleSell = () => {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) {
      toast('Cart is empty', 'error');
      return;
    }
    sell.mutate({
      contractId: id,
      items,
      buyerName: buyerName || undefined,
      paymentMethod: payment,
    });
  };

  const addToCart = (itemId: string) => {
    setCart((p) => ({ ...p, [itemId]: (p[itemId] ?? 0) + 1 }));
  };
  const removeFromCart = (itemId: string) => {
    setCart((p) => {
      const next = { ...p };
      if ((next[itemId] ?? 0) > 1) next[itemId] -= 1;
      else delete next[itemId];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href={`/booking/contract/${id}`} className="text-xs text-gray-400 hover:text-white transition">← Contract</Link>
            <h1 className="text-2xl font-bold mt-1">Concessions POS</h1>
            <p className="text-xs text-gray-500">{contractData.venue?.name} · {new Date(c.eventStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
          {settlement && (
            <div className="rounded-xl border border-white/10 bg-[#15151f] px-4 py-3">
              <p className="text-xs text-gray-500">Owed to creator (concession share)</p>
              <p className="text-xl font-bold text-green-400">{fmt(settlement.creatorConcessionCents)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">of {fmt(settlement.concessionRevenueCents)} total · {settlement.concessionSplitBp / 100}% split</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Menu</h2>
              <button
                onClick={() => setShowAdd((v) => !v)}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
              >
                {showAdd ? 'Close' : '+ Add item'}
              </button>
            </div>

            {showAdd && (
              <div className="rounded-xl border border-white/10 bg-[#15151f] p-4 mb-4 grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                  className="rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="Price ($)"
                  className="rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="flex-1 rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                  >
                    <option value="drinks">Drinks</option>
                    <option value="food">Food</option>
                    <option value="merch">Merch</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    onClick={() => createItem.mutate({
                      venueId: c.venueId,
                      name: newItem.name,
                      priceCents: Math.round(Number(newItem.price) * 100),
                      category: newItem.category,
                    })}
                    disabled={!newItem.name || !newItem.price || createItem.isPending}
                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 transition disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {(!menu || menu.length === 0) ? (
              <div className="rounded-xl border border-white/10 bg-[#15151f] p-8 text-center text-gray-500">
                <p>No menu items yet.</p>
                <p className="text-xs mt-2">Add your first item above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {menu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item.id)}
                    className={`rounded-xl border bg-[#15151f] p-4 text-left transition hover:border-red-600/50 ${item.active ? 'border-white/10' : 'border-gray-700 opacity-50'}`}
                  >
                    <p className="font-semibold text-sm">{item.name}</p>
                    {item.category && <p className="text-[10px] uppercase text-gray-500 mt-0.5">{item.category}</p>}
                    <p className="mt-2 text-lg font-bold">{fmt(item.priceCents)}</p>
                    {item.active ? (
                      <p className="mt-1 text-[10px] text-gray-500">Tap to add ({cart[item.id] ?? 0})</p>
                    ) : (
                      <p className="mt-1 text-[10px] text-gray-500">Hidden</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart / sale */}
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-[#15151f] p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Current Sale</h2>
              {Object.keys(cart).length === 0 ? (
                <p className="text-xs text-gray-500">Tap menu items to start an order.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {Object.entries(cart).map(([itemId, qty]) => {
                    const item = menu?.find((m) => m.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(itemId)} className="w-6 h-6 rounded bg-white/10 text-xs">−</button>
                          <span className="w-6 text-center">{qty}</span>
                          <button onClick={() => addToCart(itemId)} className="w-6 h-6 rounded bg-white/10 text-xs">+</button>
                          <span className="text-gray-300">{item.name}</span>
                        </div>
                        <span className="text-gray-400">{fmt(item.priceCents * qty)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-2xl font-bold">{fmt(totalCents)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#15151f] p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Buyer / tab name (optional)</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Bar tab #4"
                  className="w-full rounded-lg border border-white/10 bg-brand-950 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Payment</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'card', 'usdc', 'tab'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPayment(p)}
                      className={`rounded-lg py-2 text-xs font-semibold transition ${payment === p ? 'bg-red-600 text-white' : 'bg-brand-950 border border-white/10 text-gray-300 hover:text-white'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSell}
                disabled={sell.isPending || Object.keys(cart).length === 0}
                className="w-full rounded-full bg-green-600 py-3 font-bold text-white hover:bg-green-500 transition disabled:opacity-50"
              >
                {sell.isPending ? 'Saving…' : `Record Sale — ${fmt(totalCents)}`}
              </button>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-3">Tonight&apos;s orders</h2>
          {(orders ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet.</p>
          ) : (
            <div className="space-y-2">
              {(orders ?? []).map((o) => (
                <div key={o.id} className="rounded-xl border border-white/10 bg-[#15151f] p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-semibold">{fmt(o.totalCents)}</span>
                      {o.buyerName && <span className="text-gray-400">· {o.buyerName}</span>}
                      {o.paymentMethod && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-gray-300">{o.paymentMethod}</span>}
                      {o.status === 'voided' && <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] text-red-400">voided</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {o.items.map((it) => `${it.quantity}× ${it.itemNameSnapshot}`).join(' · ')}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{new Date(o.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  {o.status === 'completed' && (
                    <button
                      onClick={() => {
                        if (confirm('Void this order?')) voidOrder.mutate({ id: o.id });
                      }}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-gray-400 hover:text-red-400 hover:border-red-600/40 transition"
                    >
                      Void
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
