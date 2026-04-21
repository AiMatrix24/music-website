'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function EWYKPage() {
  // Revenue calculator state
  const [fans, setFans] = useState(1000);
  const [streamsPerFan, setStreamsPerFan] = useState(50);

  // OPYNX math: $1.00 per subscriber × 12 months
  const opynxAnnual = fans * 12.00;

  // Spotify math: ~$0.003 per stream (2026 estimated rate)
  const spotifyAnnual = fans * streamsPerFan * 12 * 0.003;

  const opynxMonthly = opynxAnnual / 12;
  const spotifyMonthly = spotifyAnnual / 12;
  const multiplier = spotifyAnnual > 0 ? (opynxAnnual / spotifyAnnual).toFixed(1) : '∞';

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
                Spotify and TikTok decide who sees your content. Even your own followers
                don&apos;t see your posts unless you pay to boost them.
              </p>
            </div>
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-xl font-bold mb-3">Pro-Rata Dilution</h3>
              <p className="text-gray-400">
                Your streams go into a global pool. Taylor Swift&apos;s 100M streams
                literally reduce the payout rate for independent artists.
              </p>
            </div>
            <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Pay to Play</h3>
              <p className="text-gray-400">
                Want your followers to actually see your new release? Pay Instagram.
                Want ticket sales? Pay Facebook. Want discovery? Pay Spotify.
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
                    <br /><span className="text-xs font-normal normal-case text-gray-500">Spotify / Ticketmaster / TikTok</span>
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
              Compare OPYNX direct-to-fan earnings vs. Spotify&apos;s pool-based payouts.
            </p>
          </div>

          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 mb-6">
            <div className="space-y-6">
              <div>
                <label className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">Your Fans / Subscribers</span>
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
                  <span className="text-sm font-semibold">Streams per fan per month (Spotify)</span>
                  <span className="text-2xl font-black text-gray-400">{streamsPerFan}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={streamsPerFan}
                  onChange={(e) => setStreamsPerFan(parseInt(e.target.value))}
                  className="w-full accent-gray-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 (casual)</span>
                  <span>500 (superfan)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-gray-800 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Spotify (Pro-Rata Pool)</p>
              <p className="text-xs text-gray-600 mb-3">$0.003/stream average</p>
              <p className="text-4xl font-black text-gray-400 mb-1">${spotifyMonthly.toFixed(0)}</p>
              <p className="text-sm text-gray-500">/month</p>
              <p className="text-xs text-gray-600 mt-4">
                = ${spotifyAnnual.toFixed(0)} per year
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
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-red-600/10 to-red-400/10 border border-red-600/30 p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">OPYNX pays you</p>
            <p className="text-5xl font-black text-red-400 mb-2">{multiplier}x</p>
            <p className="text-sm text-gray-400">
              more than Spotify for the <span className="font-bold text-white">exact same audience</span>
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Note: Spotify rate based on 2026 pro-rata estimate. OPYNX rate is the guaranteed
            $1.00-per-subscriber-per-month creator payout, verifiable on Polygon.
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
