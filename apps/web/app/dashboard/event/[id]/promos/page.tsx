'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function PromosPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { status } = useSession();
  const { toast } = useToast();

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });

  const [codes, setCodes] = useState([
    { id: '1', code: 'SUPERFAN25', discountType: 'percentage', discountValue: 25, maxUses: 100, usedCount: 34, subscriberOnly: true, active: true },
    { id: '2', code: 'EARLYBIRD', discountType: 'fixed', discountValue: 500, maxUses: 50, usedCount: 50, subscriberOnly: false, active: false },
    { id: '3', code: 'VIP2026', discountType: 'percentage', discountValue: 15, maxUses: null, usedCount: 12, subscriberOnly: false, active: true },
  ]);

  // New code form
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [subOnly, setSubOnly] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to manage promo codes</p>
        <Link href="/auth/login" className="text-red-400">Sign In →</Link>
      </div>
    );
  }

  const handleCreateCode = () => {
    if (!newCode || !discountValue) {
      toast('Fill in code and discount value', 'error');
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      code: newCode.toUpperCase(),
      discountType,
      discountValue: discountType === 'fixed' ? Math.round(parseFloat(discountValue) * 100) : parseInt(discountValue),
      maxUses: maxUses ? parseInt(maxUses) : null,
      usedCount: 0,
      subscriberOnly: subOnly,
      active: true,
    };
    setCodes([newEntry, ...codes]);
    setShowForm(false);
    setNewCode('');
    setDiscountValue('');
    setMaxUses('');
    toast(`Promo code ${newEntry.code} created!`, 'success');
  };

  const toggleCode = (id: string) => {
    setCodes(codes.map((c) => c.id === id ? { ...c, active: !c.active } : c));
    toast('Code status updated', 'info');
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/dashboard/event/${eventId}`} className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to {event?.title ?? 'Event'}
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Promo Codes</h1>
            <p className="text-gray-400 mt-1">Create discount codes for your fans</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            {showForm ? 'Cancel' : '+ New Code'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
            <h2 className="font-bold mb-4">Create Promo Code</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Code</label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUPERFAN25"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-4 py-3 text-white font-mono uppercase placeholder:text-gray-600 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    {discountType === 'percentage' ? 'Discount %' : 'Discount $'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '25' : '5.00'}
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Uses (blank = unlimited)</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="100"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subOnly}
                      onChange={(e) => setSubOnly(e.target.checked)}
                      className="w-5 h-5 rounded border-brand-800/30 bg-brand-950 accent-red-600"
                    />
                    <span className="text-sm">Subscribers only</span>
                  </label>
                </div>
              </div>
              <button
                onClick={handleCreateCode}
                className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition"
              >
                Create Code
              </button>
            </div>
          </div>
        )}

        {/* Existing codes */}
        <div className="space-y-4">
          {codes.map((code) => (
            <div key={code.id} className="rounded-xl bg-[#15151f] border border-brand-800/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg text-red-400">{code.code}</span>
                  {code.subscriberOnly && (
                    <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">Subs Only</span>
                  )}
                </div>
                <button
                  onClick={() => toggleCode(code.id)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition ${
                    code.active
                      ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400'
                      : 'bg-gray-600/20 text-gray-400 hover:bg-green-600/20 hover:text-green-400'
                  }`}
                >
                  {code.active ? 'Active' : 'Disabled'}
                </button>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span>
                  {code.discountType === 'percentage'
                    ? `${code.discountValue}% off`
                    : `$${(code.discountValue / 100).toFixed(2)} off`}
                </span>
                <span>
                  {code.usedCount}{code.maxUses ? ` / ${code.maxUses}` : ''} used
                </span>
                {code.maxUses && code.usedCount >= code.maxUses && (
                  <span className="text-red-400 text-xs font-semibold">Exhausted</span>
                )}
              </div>
              {/* Usage bar */}
              {code.maxUses && (
                <div className="h-1.5 bg-brand-900 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min((code.usedCount / code.maxUses) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
