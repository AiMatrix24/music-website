'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RoyaltyCalculatorPage() {
  const [subscribers, setSubscribers] = useState(500);
  const [streams, setStreams] = useState(50000);
  const [eventsPerYear, setEventsPerYear] = useState(12);
  const [avgTicketPrice, setAvgTicketPrice] = useState(35);
  const [avgTicketsSold, setAvgTicketsSold] = useState(200);
  const [merchItemsSold, setMerchItemsSold] = useState(50);
  const [avgMerchPrice, setAvgMerchPrice] = useState(25);

  const subscriptionRevenue = subscribers * 1.0;
  const streamingRevenue = streams * 0.004;
  const ticketRevenue = eventsPerYear * avgTicketsSold * avgTicketPrice * 0.85;
  const merchRevenue = merchItemsSold * avgMerchPrice * 0.85;
  const monthlyTotal = subscriptionRevenue + streamingRevenue + (ticketRevenue / 12) + merchRevenue;
  const annualTotal = subscriptionRevenue * 12 + streamingRevenue * 12 + ticketRevenue + merchRevenue * 12;

  const spotifyRevenue = streams * 0.004 * 12;
  const opynxSubRevenue = subscribers * 1.0 * 12;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtExact = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-brand-950 p-6 md:p-8 max-w-6xl mx-auto">
      <Link href="/" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Home
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-2">Royalty Calculator</h1>
      <p className="text-gray-400 mb-8">See What You&apos;d Earn on OPYNX</p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="bg-[#15151f] rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Your Numbers</h2>

            <SliderInput label="Monthly Subscribers" value={subscribers} onChange={setSubscribers} min={0} max={100000} step={100} format={(v) => v.toLocaleString()} />
            <SliderInput label="Monthly Streams" value={streams} onChange={setStreams} min={0} max={10000000} step={1000} format={(v) => v.toLocaleString()} />
            <SliderInput label="Events Per Year" value={eventsPerYear} onChange={setEventsPerYear} min={0} max={100} step={1} />
            <SliderInput label="Avg Ticket Price" value={avgTicketPrice} onChange={setAvgTicketPrice} min={0} max={500} step={5} prefix="$" />
            <SliderInput label="Avg Tickets Sold Per Event" value={avgTicketsSold} onChange={setAvgTicketsSold} min={0} max={10000} step={50} format={(v) => v.toLocaleString()} />
            <SliderInput label="Merch Items Sold / Month" value={merchItemsSold} onChange={setMerchItemsSold} min={0} max={1000} step={10} />
            <SliderInput label="Avg Merch Price" value={avgMerchPrice} onChange={setAvgMerchPrice} min={0} max={200} step={5} prefix="$" />
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="space-y-6">
          <div className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              <RevenueRow label="Subscription Revenue" sublabel={`${subscribers.toLocaleString()} subscribers x $1.00/mo`} value={fmtExact(subscriptionRevenue)} period="/mo" />
              <RevenueRow label="Streaming Revenue" sublabel={`${streams.toLocaleString()} streams x $0.004`} value={fmtExact(streamingRevenue)} period="/mo" />
              <RevenueRow label="Ticket Revenue" sublabel={`${eventsPerYear} events x ${avgTicketsSold.toLocaleString()} tickets x $${avgTicketPrice} x 85%`} value={fmtExact(ticketRevenue)} period="/yr" />
              <RevenueRow label="Merch Revenue" sublabel={`${merchItemsSold} items x $${avgMerchPrice} x 85%`} value={fmtExact(merchRevenue)} period="/mo" />

              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-sm">Monthly Estimate</span>
                  <span className="text-white text-lg font-semibold">{fmtExact(monthlyTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg">TOTAL Annual Revenue</span>
                  <span className="text-red-600 text-3xl font-bold">{fmt(annualTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-[#15151f] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">On OPYNX vs Spotify</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-brand-950 rounded-lg p-4 border border-red-600/30">
                <p className="text-red-500 text-sm font-semibold mb-1">OPYNX</p>
                <p className="text-white text-2xl font-bold">{fmt(opynxSubRevenue)}</p>
                <p className="text-gray-400 text-xs mt-1">$1.00 per subscriber/mo</p>
              </div>
              <div className="bg-brand-950 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm font-semibold mb-1">Spotify</p>
                <p className="text-white text-2xl font-bold">{fmt(spotifyRevenue)}</p>
                <p className="text-gray-400 text-xs mt-1">$0.003-0.005 per stream</p>
              </div>
            </div>

            {opynxSubRevenue > spotifyRevenue && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                <p className="text-red-500 font-semibold text-sm">
                  You&apos;d earn {fmt(opynxSubRevenue - spotifyRevenue)} more per year on OPYNX from subscriptions alone!
                </p>
              </div>
            )}

            {/* Visual bar comparison */}
            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>OPYNX Subscriptions</span>
                  <span>{fmt(opynxSubRevenue)}/yr</span>
                </div>
                <div className="h-3 bg-brand-950 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (opynxSubRevenue / Math.max(opynxSubRevenue, spotifyRevenue, 1)) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Spotify Streams</span>
                  <span>{fmt(spotifyRevenue)}/yr</span>
                </div>
                <div className="h-3 bg-brand-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (spotifyRevenue / Math.max(opynxSubRevenue, spotifyRevenue, 1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <Link href="/apply" className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition text-lg">
            Start Earning on OPYNX
          </Link>
        </div>
      </div>
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step, prefix, format }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-gray-300">{label}</label>
        <span className="text-white font-semibold text-sm">{prefix}{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-brand-950 rounded-full appearance-none cursor-pointer accent-red-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{prefix}{format ? format(min) : min}</span>
        <span>{prefix}{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function RevenueRow({ label, sublabel, value, period }: { label: string; sublabel: string; value: string; period: string }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs">{sublabel}</p>
      </div>
      <div className="text-right">
        <span className="text-white font-semibold">{value}</span>
        <span className="text-gray-500 text-xs ml-1">{period}</span>
      </div>
    </div>
  );
}
