'use client';

import Link from 'next/link';
import { useState } from 'react';

const creators = [
  { id: 'nova', name: 'Nova Synthwave', plays: 2_840_000, followers: 187_400, tracks: 34, events: 12, revenue: 48_200, genre: 'Synthwave' },
  { id: 'luna', name: 'Luna Beats', plays: 3_210_000, followers: 224_100, tracks: 28, events: 8, revenue: 62_500, genre: 'Lo-Fi / Beats' },
  { id: 'cipher', name: 'Cipher', plays: 1_960_000, followers: 143_800, tracks: 41, events: 22, revenue: 37_900, genre: 'Hip-Hop' },
  { id: 'atlas', name: 'Atlas & The Wanderers', plays: 4_120_000, followers: 312_600, tracks: 19, events: 31, revenue: 89_700, genre: 'Indie Rock' },
  { id: 'echo', name: 'Echo Chamber', plays: 1_450_000, followers: 98_200, tracks: 52, events: 5, revenue: 21_400, genre: 'Electronic' },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatMoney(n: number): string {
  return '$' + n.toLocaleString();
}

export default function ComparePage() {
  const [artistAId, setArtistAId] = useState('');
  const [artistBId, setArtistBId] = useState('');

  const artistA = creators.find((a) => a.id === artistAId);
  const artistB = creators.find((a) => a.id === artistBId);
  const bothSelected = artistA && artistB;

  const metrics = bothSelected
    ? [
        { label: 'Total Plays', a: artistA.plays, b: artistB.plays, format: formatNum },
        { label: 'Followers', a: artistA.followers, b: artistB.followers, format: formatNum },
        { label: 'Tracks', a: artistA.tracks, b: artistB.tracks, format: (n: number) => n.toString() },
        { label: 'Events Hosted', a: artistA.events, b: artistB.events, format: (n: number) => n.toString() },
        { label: 'Revenue (est.)', a: artistA.revenue, b: artistB.revenue, format: formatMoney },
      ]
    : [];

  const maxPlays = bothSelected ? Math.max(artistA.plays, artistB.plays) : 1;

  // Quick insight
  let insight = '';
  if (bothSelected) {
    const playRatio = (Math.max(artistA.plays, artistB.plays) / Math.min(artistA.plays, artistB.plays)).toFixed(1);
    const morePlaysArtist = artistA.plays >= artistB.plays ? artistA.name : artistB.name;
    const moreEventsArtist = artistA.events >= artistB.events ? artistA.name : artistB.name;
    const lessPlayArtist = artistA.plays >= artistB.plays ? artistB.name : artistA.name;
    if (morePlaysArtist !== moreEventsArtist) {
      insight = `${morePlaysArtist} has ${playRatio}x more plays, but ${moreEventsArtist} has hosted more events.`;
    } else {
      insight = `${morePlaysArtist} leads in plays with ${playRatio}x more than ${lessPlayArtist}.`;
    }
  }

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <span>&larr;</span> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-black mb-2">Compare Creators</h1>
        <p className="text-gray-400 mb-8">See how your favorite creators stack up side by side.</p>

        {/* Creator selectors */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
          <select
            value={artistAId}
            onChange={(e) => setArtistAId(e.target.value)}
            className="flex-1 w-full sm:w-auto bg-[#15151f] border border-brand-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">Select Creator A</option>
            {creators
              .filter((a) => a.id !== artistBId)
              .map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
          </select>

          <span className="bg-red-600 text-white font-black text-sm px-4 py-2 rounded-full shrink-0">VS</span>

          <select
            value={artistBId}
            onChange={(e) => setArtistBId(e.target.value)}
            className="flex-1 w-full sm:w-auto bg-[#15151f] border border-brand-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">Select Creator B</option>
            {creators
              .filter((a) => a.id !== artistAId)
              .map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
          </select>
        </div>

        {bothSelected ? (
          <>
            {/* Side-by-side comparison */}
            <div className="bg-[#15151f] rounded-2xl p-6 sm:p-8 mb-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-2xl font-black mb-2">
                    {artistA.name[0]}
                  </div>
                  <h3 className="font-bold text-sm">{artistA.name}</h3>
                  <p className="text-xs text-gray-500">{artistA.genre}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="bg-red-600/20 text-red-400 font-black text-lg px-4 py-1 rounded-full">VS</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl font-black mb-2">
                    {artistB.name[0]}
                  </div>
                  <h3 className="font-bold text-sm">{artistB.name}</h3>
                  <p className="text-xs text-gray-500">{artistB.genre}</p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="space-y-4">
                {metrics.map((m) => (
                  <div key={m.label} className="grid grid-cols-3 items-center gap-4 py-3 border-b border-brand-800/30 last:border-0">
                    <div className={`text-right font-bold text-sm ${m.a >= m.b ? 'text-red-400' : 'text-gray-400'}`}>
                      {m.format(m.a)}
                    </div>
                    <div className="text-center text-xs text-gray-500 uppercase tracking-wider">{m.label}</div>
                    <div className={`text-left font-bold text-sm ${m.b >= m.a ? 'text-blue-400' : 'text-gray-400'}`}>
                      {m.format(m.b)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart comparison - Plays */}
            <div className="bg-[#15151f] rounded-2xl p-6 sm:p-8 mb-8">
              <h3 className="font-bold text-lg mb-6">Plays Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-red-400 font-medium">{artistA.name}</span>
                    <span className="text-gray-400">{formatNum(artistA.plays)}</span>
                  </div>
                  <div className="h-8 bg-brand-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-700"
                      style={{ width: `${(artistA.plays / maxPlays) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-blue-400 font-medium">{artistB.name}</span>
                    <span className="text-gray-400">{formatNum(artistB.plays)}</span>
                  </div>
                  <div className="h-8 bg-brand-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(artistB.plays / maxPlays) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Radar-style horizontal bars */}
            <div className="bg-[#15151f] rounded-2xl p-6 sm:p-8 mb-8">
              <h3 className="font-bold text-lg mb-6">Stats Breakdown</h3>
              <div className="space-y-5">
                {[
                  { label: 'Plays', a: artistA.plays, b: artistB.plays },
                  { label: 'Followers', a: artistA.followers, b: artistB.followers },
                  { label: 'Tracks', a: artistA.tracks, b: artistB.tracks },
                  { label: 'Events', a: artistA.events, b: artistB.events },
                  { label: 'Revenue', a: artistA.revenue, b: artistB.revenue },
                ].map((stat) => {
                  const max = Math.max(stat.a, stat.b);
                  return (
                    <div key={stat.label}>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 flex justify-end">
                          <div className="h-3 bg-brand-950 rounded-full w-full overflow-hidden flex justify-end">
                            <div
                              className="h-full bg-red-500 rounded-full transition-all duration-700"
                              style={{ width: `${(stat.a / max) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-2" />
                        <div className="flex-1">
                          <div className="h-3 bg-brand-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-700"
                              style={{ width: `${(stat.b / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between text-xs text-gray-500 pt-2">
                  <span className="text-red-400">{artistA.name}</span>
                  <span className="text-blue-400">{artistB.name}</span>
                </div>
              </div>
            </div>

            {/* Quick insight */}
            <div className="bg-[#15151f] rounded-2xl p-6 mb-8">
              <h3 className="font-bold mb-2">Quick Insight</h3>
              <p className="text-gray-400 text-sm">{insight}</p>
            </div>

            {/* Share button */}
            <div className="text-center">
              <button className="bg-red-600 hover:bg-red-700 transition text-white font-bold px-6 py-2.5 rounded-lg inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share Comparison
              </button>
            </div>
          </>
        ) : (
          <div className="bg-[#15151f] rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-lg">Select two creators above to see a side-by-side comparison.</p>
          </div>
        )}
      </div>
    </div>
  );
}
