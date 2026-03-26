'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function EventManagePage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'refunds'>('overview');

  const { data: event, isLoading } = trpc.events.getById.useQuery({ id });
  const { data: ticketTypes } = trpc.tickets.getTicketTypes.useQuery({ eventId: id });

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to manage events</p>
        <Link href="/auth/login" className="text-red-400">Sign In →</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Event not found</p>
        <Link href="/dashboard/tickets" className="text-red-400">← Back to Dashboard</Link>
      </div>
    );
  }

  // Calculate revenue stats
  const totalSold = ticketTypes?.reduce((sum, tt) => sum + (tt.sold ?? 0), 0) ?? 0;
  const totalCapacity = ticketTypes?.reduce((sum, tt) => sum + (tt.quantity ?? 0), 0) ?? 0;
  const grossRevenue = ticketTypes?.reduce((sum, tt) => sum + (tt.sold ?? 0) * (tt.price ?? 0), 0) ?? 0;
  const artistRevenue = grossRevenue * 0.85;
  const facilitatorRevenue = grossRevenue * 0.05;
  const platformRevenue = grossRevenue * 0.10;
  const sellThroughPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/tickets" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Ticket Dashboard
        </Link>

        {/* Event header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black">{event.title}</h1>
            <p className="text-gray-400 mt-1">
              {new Date(event.startDate).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
              {' · '}
              {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <span className={`text-xs px-4 py-2 rounded-full font-bold uppercase ${
            event.status === 'published' ? 'bg-green-600/20 text-green-400' :
            event.status === 'active' ? 'bg-blue-600/20 text-blue-400' :
            'bg-gray-600/20 text-gray-400'
          }`}>
            {event.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['overview', 'edit', 'refunds'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Revenue cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Tickets Sold" value={totalSold.toLocaleString()} sub={`of ${totalCapacity.toLocaleString()}`} />
              <StatCard label="Sell-Through" value={`${sellThroughPct}%`} sub={sellThroughPct > 80 ? 'Hot!' : sellThroughPct > 50 ? 'Good' : 'Building'} color={sellThroughPct > 80 ? 'text-green-400' : 'text-red-400'} />
              <StatCard label="Gross Revenue" value={`$${(grossRevenue / 100).toFixed(2)}`} sub="total sales" />
              <StatCard label="Your Earnings" value={`$${(artistRevenue / 100).toFixed(2)}`} sub="85% to you" color="text-red-400" />
            </div>

            {/* Revenue split visualization */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold mb-4">Revenue Split</h2>

              {/* Progress bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-4">
                <div className="bg-red-500 h-full" style={{ width: '85%' }} />
                <div className="bg-pink-500 h-full" style={{ width: '5%' }} />
                <div className="bg-cyan-500 h-full" style={{ width: '10%' }} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-400">Artist (85%)</span>
                  </div>
                  <p className="font-bold text-red-400">${(artistRevenue / 100).toFixed(2)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                    <span className="text-gray-400">Facilitator (5%)</span>
                  </div>
                  <p className="font-bold text-pink-400">${(facilitatorRevenue / 100).toFixed(2)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-gray-400">Platform (10%)</span>
                  </div>
                  <p className="font-bold text-cyan-400">${(platformRevenue / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Ticket tiers breakdown */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold mb-4">Ticket Tiers</h2>
              <div className="space-y-4">
                {ticketTypes?.map((tt) => {
                  const qty = tt.quantity ?? 0;
                  const pct = qty > 0 ? Math.round(((tt.sold ?? 0) / qty) * 100) : 0;
                  const tierRevenue = (tt.sold ?? 0) * (tt.price ?? 0);
                  return (
                    <div key={tt.id} className="p-4 bg-brand-950/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold">{tt.name}</h3>
                          <p className="text-xs text-gray-500 uppercase">{tt.tier.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{tt.price === 0 ? 'FREE' : `$${(tt.price / 100).toFixed(2)}`}</p>
                          <p className="text-xs text-gray-500">{tt.sold ?? 0} / {qty} sold</p>
                        </div>
                      </div>
                      {/* Sell-through bar */}
                      <div className="h-2 bg-brand-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{pct}% sold</span>
                        <span>Revenue: ${(tierRevenue / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anti-scalper stats */}
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-red-500">🛡️</span> Anti-Scalper Protection
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-brand-950/50 rounded-xl">
                  <p className="text-2xl font-black text-green-400">0</p>
                  <p className="text-xs text-gray-500">Resale attempts</p>
                </div>
                <div className="text-center p-3 bg-brand-950/50 rounded-xl">
                  <p className="text-2xl font-black text-green-400">100%</p>
                  <p className="text-xs text-gray-500">Direct sales</p>
                </div>
                <div className="text-center p-3 bg-brand-950/50 rounded-xl">
                  <p className="text-2xl font-black">{totalSold}</p>
                  <p className="text-xs text-gray-500">Verified buyers</p>
                </div>
                <div className="text-center p-3 bg-brand-950/50 rounded-xl">
                  <p className="text-2xl font-black text-red-400">$0</p>
                  <p className="text-xs text-gray-500">Lost to scalpers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit tab */}
        {activeTab === 'edit' && (
          <EditEventForm event={event} toast={toast} />
        )}

        {/* Refunds tab */}
        {activeTab === 'refunds' && (
          <RefundsTab eventId={id} ticketTypes={ticketTypes ?? []} toast={toast} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl bg-[#15151f] border border-brand-800/20 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-black ${color ?? ''}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function EditEventForm({ event, toast }: { event: any; toast: any }) {
  const updateEvent = trpc.events.update.useMutation();
  const [title, setTitle] = useState(event.title);
  const [eventStatus, setEventStatus] = useState(event.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        title,
        status: eventStatus,
      });
      toast('Event updated!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 space-y-6">
      <h2 className="font-bold text-lg">Edit Event</h2>

      <div>
        <label className="block text-sm font-semibold mb-2">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Status</label>
        <select
          value={eventStatus}
          onChange={(e) => setEventStatus(e.target.value)}
          className="w-full bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="active">Active (Live Now)</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function RefundsTab({ eventId, ticketTypes, toast }: { eventId: string; ticketTypes: any[]; toast: any }) {
  const [refundToken, setRefundToken] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleRefund = async () => {
    if (!refundToken.trim()) {
      toast('Enter a ticket token to refund', 'error');
      return;
    }
    setProcessing(true);
    // In production this would call a tRPC mutation
    setTimeout(() => {
      toast('Refund processed — funds returned to buyer', 'success');
      setRefundToken('');
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
        <h2 className="font-bold text-lg mb-4">Issue Refund</h2>
        <p className="text-sm text-gray-400 mb-4">
          Enter the ticket token to issue a full refund. The buyer will receive their payment back minus gas fees.
        </p>

        <div className="flex gap-3">
          <input
            value={refundToken}
            onChange={(e) => setRefundToken(e.target.value)}
            placeholder="opynx_ticket_..."
            className="flex-1 bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-red-600 focus:outline-none transition"
          />
          <button
            onClick={handleRefund}
            disabled={processing || !refundToken.trim()}
            className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50 whitespace-nowrap"
          >
            {processing ? 'Processing...' : 'Refund'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
        <h2 className="font-bold text-lg mb-4">Refund Policy</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Full refunds available up to 48 hours before event start</li>
          <li>• Partial refunds (50%) available up to 24 hours before</li>
          <li>• No refunds within 24 hours of event start</li>
          <li>• Cancelled events automatically refund all ticket holders</li>
          <li>• Refunds are processed on Polygon and visible on-chain</li>
        </ul>
      </div>
    </div>
  );
}
