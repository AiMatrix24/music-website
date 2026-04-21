'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

interface ChannelRow {
  id: string;
  name: string;
  host: string;
  genre: string;
  listeners: number;
  cpm: number;
  demo: string;
}

const CHANNELS: ChannelRow[] = [
  { id: 'nova-synthwave', name: 'Nova Synthwave Radio', host: 'Nova Synth', genre: 'Synthwave', listeners: 3482, cpm: 8, demo: '18-34, US/UK, music producers' },
  { id: 'boom-bap-basement', name: 'Boom Bap Basement', host: 'DJ Kora', genre: 'Hip Hop', listeners: 2194, cpm: 9, demo: '18-30, urban, streetwear' },
  { id: 'garage-glory', name: 'Garage Glory', host: 'Ivy Blake', genre: 'Rock', listeners: 612, cpm: 7, demo: '20-40, indie fans, concert-goers' },
  { id: 'blue-room', name: 'The Blue Room', host: 'Miles Avery', genre: 'Jazz', listeners: 403, cpm: 11, demo: '30-55, premium, cultural' },
  { id: 'vault-selectors', name: 'Vault Selectors', host: 'Vinyl Vic', genre: 'Electronic', listeners: 289, cpm: 12, demo: '25-45, collectors, audiophiles' },
  { id: 'underground-overground', name: 'Underground / Overground', host: 'Nocturne', genre: 'Electronic', listeners: 1108, cpm: 9, demo: '20-35, club culture, urban' },
  { id: 'lofi-attic', name: 'The Lo-fi Attic', host: 'Mellow Mars', genre: 'Lo-fi', listeners: 841, cpm: 6, demo: '16-28, students, work-from-home' },
  { id: 'signal-search', name: 'Signal Search', host: 'Scout', genre: 'Indie', listeners: 527, cpm: 7, demo: '18-32, music discovery' },
  { id: 'morning-drive', name: 'Morning Drive', host: 'DJ Kora', genre: 'Network', listeners: 5900, cpm: 10, demo: '22-45, commuters, national' },
  { id: 'late-night', name: 'Late Night Underground', host: 'Nocturne', genre: 'Network', listeners: 2780, cpm: 8, demo: '21-35, night owls, urban' },
];

const PRODUCTS = [
  {
    id: 'pre-roll',
    name: 'Network Pre-Roll',
    price: '$5 CPM',
    tag: 'Wide Reach',
    desc: 'Plays before network programs across every channel. Ideal for broad awareness campaigns.',
    features: ['All 200+ channels', '15s or 30s spots', 'Genre/time targeting', 'Verified listens'],
  },
  {
    id: 'sponsor',
    name: 'Channel Sponsor',
    price: '$500-$5K/week',
    tag: 'Targeted',
    desc: 'Own a specific channel with audio spots, overlay branding, and host read integration.',
    features: ['Choose your channel', 'Host-read option +30%', 'Custom overlay branding', 'Dashboard analytics'],
  },
  {
    id: 'takeover',
    name: 'Show Takeover',
    price: '$1K-$10K',
    tag: 'Premium',
    desc: 'Sponsor a whole show for a week. Your brand integrated across every segment, promos, and replays.',
    features: ['Full week of branding', 'Promo reads each show', 'Featured on schedule', 'Replay attribution'],
  },
];

const CASE_STUDIES = [
  {
    brand: 'Indie Clothing Brand',
    result: '340% ROI in 2 weeks',
    detail: 'Ran pre-roll across indie and synthwave channels. Attributed revenue crossed $68K on a $20K spend.',
    gradient: 'from-red-600 to-rose-500',
  },
  {
    brand: 'Music Gear Company',
    result: '8K new subscribers',
    detail: 'Host-read sponsorship across 4 creator channels drove email signups with a 14% conversion rate.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    brand: 'Concert Promoter',
    result: 'Sold out venue',
    detail: 'Targeted 2 regional channels plus network pre-roll. 1,800 tickets sold in 6 days.',
    gradient: 'from-purple-600 to-indigo-600',
  },
];

export default function RadioAdvertisePage() {
  const { toast } = useToast();
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('daily');
  const [budget, setBudget] = useState('500');
  const [targetGenres, setTargetGenres] = useState<string[]>(['Synthwave']);
  const [targetTime, setTargetTime] = useState('any');
  const [adLength, setAdLength] = useState<'15s' | '30s'>('30s');
  const [fileName, setFileName] = useState<string | null>(null);

  const toggleGenre = (g: string) => {
    setTargetGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const launch = (e: React.FormEvent) => {
    e.preventDefault();
    toast(
      `Campaign submitted: ${adLength} ad, $${budget} ${budgetType}, targeting ${targetGenres.join(', ') || 'all'}`,
      'success',
    );
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-brand-950 to-brand-950" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-14">
          <Link href="/radio" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Radio Network
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-5xl">&#128226;</span>
            <span className="text-xs font-bold tracking-[0.3em] text-red-400 uppercase">For Advertisers</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3">
            Advertise on <span className="text-red-500">OPYNX Radio</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Reach targeted music audiences across 200+ creator channels.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-14">
        {/* Why Advertise Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { v: '2.4M', l: 'Monthly listeners' },
            { v: '47m', l: 'Avg session length' },
            { v: '85%', l: 'Highly engaged subscribers' },
            { v: '200+', l: 'Creator channels' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-[#15151f] border border-white/5 p-5">
              <p className="text-3xl sm:text-4xl font-black text-red-500 mb-1">{s.v}</p>
              <p className="text-sm text-gray-400">{s.l}</p>
            </div>
          ))}
        </section>

        {/* Ad Products */}
        <section>
          <h2 className="text-2xl font-bold mb-1">Ad Products</h2>
          <p className="text-sm text-gray-400 mb-6">Three ways to reach the OPYNX audience.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="rounded-2xl bg-[#15151f] border border-white/5 p-6 flex flex-col hover:border-white/20 transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 border border-red-500/30">{p.tag}</span>
                </div>
                <p className="text-3xl font-black text-red-500 mb-3">{p.price}</p>
                <p className="text-sm text-gray-400 mb-5">{p.desc}</p>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-red-500">&check;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => toast(`Contact sales requested for ${p.name}`, 'success')}
                  className="mt-auto px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 font-semibold text-sm transition"
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Browse Channels Table */}
        <section>
          <h2 className="text-2xl font-bold mb-1">Browse Channels</h2>
          <p className="text-sm text-gray-400 mb-5">Buy ads directly against specific channels.</p>
          <div className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-black/30 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-4">Channel</th>
                    <th className="text-left p-4">Host</th>
                    <th className="text-left p-4">Genre</th>
                    <th className="text-right p-4">Avg Listeners</th>
                    <th className="text-right p-4">CPM</th>
                    <th className="text-left p-4">Audience</th>
                    <th className="text-right p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {CHANNELS.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-semibold">{c.name}</td>
                      <td className="p-4 text-gray-300">{c.host}</td>
                      <td className="p-4 text-gray-300">{c.genre}</td>
                      <td className="p-4 text-right tabular-nums">{c.listeners.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold text-red-400">${c.cpm}</td>
                      <td className="p-4 text-gray-400 text-xs">{c.demo}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toast(`Buying ads for ${c.name}`, 'info')}
                          className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-semibold transition"
                        >
                          Buy Ads
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Ad Creation */}
        <section className="rounded-3xl bg-[#15151f] border border-white/10 p-6 sm:p-10">
          <h2 className="text-2xl font-bold mb-1">Build Your Campaign</h2>
          <p className="text-sm text-gray-400 mb-6">Launch a targeted audio campaign in minutes.</p>
          <form onSubmit={launch} className="grid md:grid-cols-2 gap-6">
            {/* Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2">Upload your ad</label>
              <label className="block rounded-xl border-2 border-dashed border-white/10 hover:border-red-500/50 transition p-6 text-center cursor-pointer bg-black/20">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.9-1A5.5 5.5 0 0117 16H7zM12 11v6m0 0l-2-2m2 2l2-2" /></svg>
                <p className="text-sm text-gray-400">{fileName ?? 'Drop 15s or 30s audio file here, or click to browse'}</p>
              </label>
              <div className="mt-3 flex gap-2">
                {(['15s', '30s'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setAdLength(l)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      adLength === l ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold mb-2">Budget</label>
              <div className="flex gap-2 mb-3">
                {(['daily', 'total'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBudgetType(t)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      budgetType === t ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {t === 'daily' ? 'Daily' : 'Total'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-red-500 outline-none"
                  placeholder="500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Estimated reach: {budgetType === 'daily' ? '~' + (Number(budget) * 120).toLocaleString() + ' listeners/day' : '~' + (Number(budget) * 140).toLocaleString() + ' total impressions'}</p>
            </div>

            {/* Targeting */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Target genres</label>
              <div className="flex flex-wrap gap-2">
                {['Synthwave', 'Hip Hop', 'Lo-fi', 'Rock', 'Jazz', 'Electronic', 'Indie', 'R&B'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      targetGenres.includes(g) ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Demographics</label>
              <select className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-red-500 outline-none">
                <option>All demographics</option>
                <option>18-24</option>
                <option>25-34</option>
                <option>35-44</option>
                <option>45+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Time of day</label>
              <select
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-red-500 outline-none"
              >
                <option value="any">Any time</option>
                <option value="morning">Morning (6-10am)</option>
                <option value="daytime">Daytime (10am-5pm)</option>
                <option value="drive">Drive time (5-7pm)</option>
                <option value="evening">Evening (7-11pm)</option>
                <option value="latenight">Late night (11pm-2am)</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-2">
              <button className="w-full px-6 py-4 rounded-full bg-red-600 hover:bg-red-500 font-bold text-lg shadow-lg shadow-red-900/40 transition">
                Launch Campaign
              </button>
            </div>
          </form>
        </section>

        {/* Case Studies */}
        <section>
          <h2 className="text-2xl font-bold mb-1">Case Studies</h2>
          <p className="text-sm text-gray-400 mb-6">Brands that advertised on OPYNX.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {CASE_STUDIES.map((c) => (
              <div key={c.brand} className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden">
                <div className={`h-20 bg-gradient-to-br ${c.gradient}`} />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{c.brand}</p>
                  <p className="text-xl font-black text-red-500 mb-3">{c.result}</p>
                  <p className="text-sm text-gray-300">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compare to Spotify/Apple */}
        <section className="rounded-2xl bg-[#15151f] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">How we compare</h2>
            <p className="text-sm text-gray-400">Lower CPMs, deeper targeting, engaged music fans.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-black/30 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4">Platform</th>
                  <th className="text-right p-4">Avg CPM</th>
                  <th className="text-left p-4">Targeting</th>
                  <th className="text-left p-4">Audience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="bg-red-950/20">
                  <td className="p-4 font-bold text-red-400">OPYNX Radio</td>
                  <td className="p-4 text-right font-semibold">$5-12</td>
                  <td className="p-4">Channel + genre + time of day</td>
                  <td className="p-4">Paying music fans, creators</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Spotify Ad Studio</td>
                  <td className="p-4 text-right">$15-25</td>
                  <td className="p-4">Demographic + playlist</td>
                  <td className="p-4">Free-tier users only</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Apple Music</td>
                  <td className="p-4 text-right">n/a</td>
                  <td className="p-4">None (no ads)</td>
                  <td className="p-4">Not available to advertisers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
