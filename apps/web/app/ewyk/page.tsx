'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function EWYKPage() {
  // Revenue calculator state
  const [fans, setFans] = useState(1000);
  const [streamsPerMonth, setStreamsPerMonth] = useState(100000); // total monthly streams (industry standard)
  const [competitorName, setCompetitorName] = useState('Streaming Service');
  const [competitorRatePerMillion, setCompetitorRatePerMillion] = useState(4000); // $ per 1M streams

  // OPYNX math: $1.00 per subscriber × 12 months
  const opynxAnnual = fans * 12.00;

  // Competitor math: rate per million streams (industry standard format)
  // streamsPerMonth × 12 months = annual streams
  // (annual streams / 1,000,000) × rate per million = annual revenue
  const annualStreams = streamsPerMonth * 12;
  const competitorAnnual = (annualStreams / 1_000_000) * competitorRatePerMillion;

  const opynxMonthly = opynxAnnual / 12;
  const competitorMonthly = competitorAnnual / 12;
  const multiplier = competitorAnnual > 0 ? (opynxAnnual / competitorAnnual).toFixed(1) : '∞';

  // Streams needed per month to match OPYNX revenue (the "break-even" reality check)
  const streamsToMatchOpynx = competitorRatePerMillion > 0
    ? Math.round((opynxAnnual / 12) / (competitorRatePerMillion / 1_000_000))
    : 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-brand-950 to-brand-950" />
        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[6px] text-red-500 mb-6">
            The OPYNX Philosophy
          </p>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Eat What <span className="text-red-500">You Kill</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            We replace manipulative &ldquo;black box&rdquo; algorithms with a direct, meritocratic utility.
            <br /><span className="text-red-400 font-semibold">You bring your fans. You keep them. You earn from them. Period.</span>
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/creators/join" className="rounded-full bg-red-600 px-8 py-4 font-semibold text-white hover:bg-red-500 transition">
              Start Earning on OPYNX
            </Link>
            <Link href="#calculator" className="rounded-full border-2 border-white/20 px-8 py-4 font-semibold text-white hover:border-red-500 transition">
              Calculate Your Earnings →
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 px-6 bg-brand-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">The Problem</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Big Tech&apos;s <span className="text-red-500">Black Box</span> is Broken
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
              <div className="text-4xl mb-4">🎛️</div>
              <h3 className="text-xl font-bold mb-3">Algorithmic Gating</h3>
              <p className="text-gray-400">
                Streaming platforms and social networks decide who sees your content.
                Even your own followers don&apos;t see your posts unless you pay to boost them.
              </p>
            </div>
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-xl font-bold mb-3">Pro-Rata Dilution</h3>
              <p className="text-gray-400">
                Your streams go into a global pool. A top artist&apos;s 100M streams
                literally reduce the payout rate for independent artists sharing the same pool.
              </p>
            </div>
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Pay to Play</h3>
              <p className="text-gray-400">
                Want your followers to actually see your new release? Pay the social network.
                Want ticket sales? Pay the ad platform. Want discovery? Pay the streaming service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The EWYK Model */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">The Solution</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Linear Direct-to-Fan <span className="text-red-500">Utility</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              OPYNX is the infrastructure provider (the &ldquo;armorer&rdquo;), not the curator (the &ldquo;kingmaker&rdquo;).
            </p>
          </div>

          <div className="space-y-4">
            <Principle
              num="01"
              title="Zero Algorithmic Interference"
              description="100% of your posts reach 100% of your opted-in fans. No throttling. No suppression. No 'shadow banning.' If a fan subscribes to you, every single update you send reaches their inbox or feed."
            />
            <Principle
              num="02"
              title="Isolated Revenue Streams"
              description="Your revenue is 100% yours. If you sell 100 tickets, you keep the profit from 100 tickets — regardless of what's happening globally on the platform. No pool. No dilution. No race to the bottom."
            />
            <Principle
              num="03"
              title="Meritocratic Effort-to-Income"
              description="Work harder = earn more. Your income is directly proportional to the audience you personally cultivate. We provide the tools; you provide the hustle."
            />
            <Principle
              num="04"
              title="Platform as Infrastructure"
              description="OPYNX is a utility, not a gatekeeper. Think of us like a credit card processor — we handle payments, reporting, and compliance. We don't pick who succeeds. The market does."
            />
            <Principle
              num="05"
              title="You Compete With Yourself"
              description="Instead of competing for a slice of a shrinking pool, you only compete with your own previous performance. Grew from 1,000 to 5,000 subscribers? That's 5x income — guaranteed."
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-6 bg-brand-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">Side by Side</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Algorithmic Gating <span className="text-gray-500">vs.</span> <span className="text-red-500">Meritocratic Utility</span>
            </h2>
          </div>

          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-800/20">
                  <th className="text-left p-6 font-bold text-gray-400 text-sm uppercase tracking-wider">Feature</th>
                  <th className="text-left p-6 font-bold text-gray-400 text-sm uppercase tracking-wider">
                    Legacy Apps
                    <br /><span className="text-xs font-normal normal-case text-gray-500">Streaming Services / Social Networks / Ticket Platforms</span>
                  </th>
                  <th className="text-left p-6 font-bold text-red-400 text-sm uppercase tracking-wider">
                    OPYNX
                    <br /><span className="text-xs font-normal normal-case text-gray-500">EWYK Model</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-800/20">
                <ComparisonRow
                  feature="Discovery"
                  legacy="Black box algorithms & paid placements"
                  opynx="Artist-driven — you bring your fans, you keep them"
                />
                <ComparisonRow
                  feature="Visibility"
                  legacy="Throttled unless you pay to play"
                  opynx="100% reach — no gating for your own audience"
                />
                <ComparisonRow
                  feature="Revenue Source"
                  legacy="Pro-rata share of a global pool"
                  opynx="Direct transaction — you keep what you sell"
                />
                <ComparisonRow
                  feature="Competition"
                  legacy="You compete for slice of shrinking pool"
                  opynx="You compete only with your own past performance"
                />
                <ComparisonRow
                  feature="Control"
                  legacy="Platform owns your audience data"
                  opynx="You own your fan list, exportable anytime"
                />
                <ComparisonRow
                  feature="Payout Speed"
                  legacy="90-day delays, minimum thresholds"
                  opynx="Monthly on-chain payouts, verifiable on Polygon"
                />
                <ComparisonRow
                  feature="Fee Structure"
                  legacy="30% app store + unclear revenue splits"
                  opynx="0% app store + transparent $1.00-per-sub to creator"
                />
                <ComparisonRow
                  feature="Censorship Risk"
                  legacy="Can be delisted anytime without recourse"
                  opynx="PWA sovereignty — cannot be delisted (not listed)"
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">Run The Numbers</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              What Would <span className="text-red-500">You</span> Earn?
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Compare OPYNX direct-to-fan earnings vs. any pool-based streaming platform&apos;s payout per million streams.
            </p>
          </div>

          {/* Industry Reference Table */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Industry Reference: Average Payout per 1 Million Streams (2026)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <button
                onClick={() => setCompetitorRatePerMillion(2500)}
                className="rounded-xl bg-brand-950 border border-brand-800/30 p-3 text-left hover:border-red-600 transition"
              >
                <p className="font-bold">Video-Audio Hybrid</p>
                <p className="text-xs text-gray-500">$2,000 – $3,000 per 1M</p>
              </button>
              <button
                onClick={() => setCompetitorRatePerMillion(4000)}
                className="rounded-xl bg-brand-950 border border-brand-800/30 p-3 text-left hover:border-red-600 transition"
              >
                <p className="font-bold">Mass-Market Stream</p>
                <p className="text-xs text-gray-500">$3,000 – $5,000 per 1M</p>
              </button>
              <button
                onClick={() => setCompetitorRatePerMillion(4000)}
                className="rounded-xl bg-brand-950 border border-brand-800/30 p-3 text-left hover:border-red-600 transition"
              >
                <p className="font-bold">Bundled-Service Stream</p>
                <p className="text-xs text-gray-500">$4,000 per 1M</p>
              </button>
              <button
                onClick={() => setCompetitorRatePerMillion(10000)}
                className="rounded-xl bg-brand-950 border border-brand-800/30 p-3 text-left hover:border-red-600 transition"
              >
                <p className="font-bold">Premium Editorial</p>
                <p className="text-xs text-gray-500">$10,000 per 1M</p>
              </button>
              <button
                onClick={() => setCompetitorRatePerMillion(10500)}
                className="rounded-xl bg-brand-950 border border-brand-800/30 p-3 text-left hover:border-red-600 transition"
              >
                <p className="font-bold">High-Fidelity</p>
                <p className="text-xs text-gray-500">$8,000 – $13,000 per 1M</p>
              </button>
              <div className="rounded-xl bg-red-900/20 border border-red-600/30 p-3">
                <p className="font-bold text-red-400">OPYNX (EWYK)</p>
                <p className="text-xs text-red-400/70">$1.00 per subscriber/mo</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Tap a category to use that rate in the calculator below.
            </p>
          </div>

          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 mb-6">
            <div className="space-y-6">
              <div>
                <label className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">Your Subscribers / Fans</span>
                  <span className="text-2xl font-black text-red-400">{fans.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min={100}
                  max={100000}
                  step={100}
                  value={fans}
                  onChange={(e) => setFans(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100</span>
                  <span>100,000</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">Total Monthly Streams (across platforms)</span>
                  <span className="text-2xl font-black text-gray-400">{streamsPerMonth.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min={1000}
                  max={5000000}
                  step={1000}
                  value={streamsPerMonth}
                  onChange={(e) => setStreamsPerMonth(parseInt(e.target.value))}
                  className="w-full accent-gray-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1K</span>
                  <span>5M</span>
                </div>
                {/* Quick preset buttons for stream tiers */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => setStreamsPerMonth(10000)}
                    className="text-xs px-3 py-1.5 rounded-full bg-brand-950 border border-brand-800/30 hover:border-red-600 transition text-gray-400"
                  >
                    10K/mo (Emerging)
                  </button>
                  <button
                    onClick={() => setStreamsPerMonth(100000)}
                    className="text-xs px-3 py-1.5 rounded-full bg-brand-950 border border-brand-800/30 hover:border-red-600 transition text-gray-400"
                  >
                    100K/mo (Mid-tier)
                  </button>
                  <button
                    onClick={() => setStreamsPerMonth(1000000)}
                    className="text-xs px-3 py-1.5 rounded-full bg-brand-950 border border-brand-800/30 hover:border-red-600 transition text-gray-400"
                  >
                    1M/mo (Established)
                  </button>
                  <button
                    onClick={() => setStreamsPerMonth(5000000)}
                    className="text-xs px-3 py-1.5 rounded-full bg-brand-950 border border-brand-800/30 hover:border-red-600 transition text-gray-400"
                  >
                    5M/mo (Top Tier)
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Per the 2024 platform data, an artist ranked #100,000 averages ~10K-30K streams/month.
                  An artist at #10,000 averages ~1M streams/month.
                </p>
              </div>

              {/* Competitor inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-800/20">
                <div>
                  <label className="block text-sm font-semibold mb-2">Competing Platform Name</label>
                  <input
                    type="text"
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    placeholder="Your current platform name"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Payout per 1 Million Streams ($)</label>
                  <input
                    type="number"
                    value={competitorRatePerMillion}
                    onChange={(e) => setCompetitorRatePerMillion(parseFloat(e.target.value) || 0)}
                    step="100"
                    min="0"
                    max="50000"
                    className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 outline-none font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Equals ${(competitorRatePerMillion / 1_000_000).toFixed(4)} per stream
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-gray-800 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 truncate">{competitorName} (Pro-Rata Pool)</p>
              <p className="text-xs text-gray-600 mb-3">${competitorRatePerMillion.toLocaleString()} per 1M streams</p>
              <p className="text-4xl font-black text-gray-400 mb-1">${competitorMonthly.toFixed(0)}</p>
              <p className="text-sm text-gray-500">/month</p>
              <p className="text-xs text-gray-600 mt-4">
                = ${competitorAnnual.toFixed(0)} per year
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {annualStreams.toLocaleString()} annual streams
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-red-900/40 to-red-950/40 border-2 border-red-600 p-6 shadow-xl shadow-red-900/30">
              <p className="text-xs text-red-400 uppercase tracking-wider mb-2 font-bold">OPYNX (EWYK Model)</p>
              <p className="text-xs text-red-400/70 mb-3">$1.00/subscriber/month</p>
              <p className="text-4xl font-black text-red-400 mb-1">${opynxMonthly.toFixed(0)}</p>
              <p className="text-sm text-red-400/70">/month</p>
              <p className="text-xs text-red-400/70 mt-4">
                = ${opynxAnnual.toFixed(0)} per year
              </p>
              <p className="text-xs text-red-400/70 mt-1">
                {fans.toLocaleString()} paying subscribers
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-red-600/10 to-red-400/10 border border-red-600/30 p-6 text-center mb-6">
            <p className="text-sm text-gray-400 mb-2">OPYNX pays you</p>
            <p className="text-5xl font-black text-red-400 mb-2">{multiplier}x</p>
            <p className="text-sm text-gray-400">
              more than {competitorName} at the values entered above
            </p>
          </div>

          {/* Reality Check */}
          <div className="rounded-2xl bg-[#15151f] border border-orange-900/40 p-6 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Reality Check</p>
            <p className="text-base mb-3">
              To match your OPYNX revenue of <span className="text-red-400 font-bold">${opynxMonthly.toFixed(0)}/month</span> on {competitorName},
              you would need <span className="font-bold text-white">{streamsToMatchOpynx.toLocaleString()} streams per month</span>.
            </p>
            <p className="text-sm text-gray-400">
              That&apos;s {(streamsToMatchOpynx / fans).toFixed(0)} streams per fan per month — every single month, year after year.
              On OPYNX, you just need them to subscribe.
            </p>
          </div>

          {/* Artist Ranking Reality */}
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              The Hard Truth: Artist Income by Platform Ranking (2024 Data)
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-brand-950/50 rounded-lg">
                <span>Top 10,000 artists (top 0.1%)</span>
                <span className="font-bold text-green-400">~$131,000/year</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-950/50 rounded-lg">
                <span>Top 100,000 artists (top 1%)</span>
                <span className="font-bold text-yellow-400">~$6,000/year</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-950/50 rounded-lg">
                <span>Top 1,000,000 artists</span>
                <span className="font-bold text-red-400">~$24/year</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                <span className="font-bold">OPYNX with 500 subscribers</span>
                <span className="font-bold text-red-400">$6,000/year guaranteed</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              At #100,000 on a streaming platform, an artist makes $6K/year — below the survival
              threshold in most developed economies. On OPYNX, just 500 subscribers gets you to
              the same income level — predictably, every year.
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Use the &ldquo;Industry Reference&rdquo; cards above to load realistic per-million-stream rates.
            OPYNX rate is the guaranteed $1.00-per-subscriber-per-month creator payout, verifiable on Polygon.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-b from-brand-950 to-red-950/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Own <span className="text-red-500">Your Audience</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Stop begging algorithms. Start building a direct relationship with your fans.
            You did the work to build your audience. You deserve 100% of the value.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/creators/join" className="rounded-full bg-red-600 px-8 py-4 font-semibold text-white hover:bg-red-500 transition text-lg">
              Start Creating on OPYNX
            </Link>
            <Link href="/subscribe" className="rounded-full border-2 border-white/20 px-8 py-4 font-semibold text-white hover:border-red-500 transition text-lg">
              Subscribe as a Fan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Principle({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 flex gap-6 hover:border-red-600/30 transition">
      <div className="text-5xl font-black text-red-500/30 shrink-0">{num}</div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ComparisonRow({ feature, legacy, opynx }: { feature: string; legacy: string; opynx: string }) {
  return (
    <tr>
      <td className="p-6 font-bold">{feature}</td>
      <td className="p-6 text-sm text-gray-500">{legacy}</td>
      <td className="p-6 text-sm text-red-400 font-semibold">{opynx}</td>
    </tr>
  );
}
