'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const MOCK_ARTISTS: Record<string, string> = {
  a1: 'ZVRA',
  a2: 'Mira Solis',
  a3: 'The Drift',
};

const DNA_AXES = ['Energy', 'Tempo', 'Mood', 'Complexity', 'Danceability', 'Acousticness'] as const;

const MOCK_DNA: Record<string, number[]> = {
  a1: [85, 72, 40, 68, 78, 15],
  a2: [55, 60, 80, 45, 65, 50],
  a3: [30, 45, 25, 90, 35, 70],
};

const MOCK_GENRES: Record<string, { name: string; pct: number }[]> = {
  a1: [
    { name: 'Synthwave', pct: 45 },
    { name: 'Electronic', pct: 30 },
    { name: 'Ambient', pct: 15 },
    { name: 'Experimental', pct: 10 },
  ],
  a2: [
    { name: 'Dream Pop', pct: 40 },
    { name: 'Electronic', pct: 25 },
    { name: 'Ambient', pct: 20 },
    { name: 'Shoegaze', pct: 15 },
  ],
  a3: [
    { name: 'Post-Rock', pct: 50 },
    { name: 'Ambient', pct: 25 },
    { name: 'Noise', pct: 15 },
    { name: 'Experimental', pct: 10 },
  ],
};

const MOCK_TAGS: Record<string, string[]> = {
  a1: ['High Energy', 'Dark Atmosphere', 'Complex Rhythms', 'Synth-Heavy'],
  a2: ['Dreamy Textures', 'Melancholic Mood', 'Lush Pads', 'Ethereal Vocals'],
  a3: ['Slow Build', 'Dense Layers', 'Experimental Structure', 'Raw Acoustic'],
};

const SIMILAR_ARTISTS = [
  { id: 'sim1', name: 'Noctis', matchPct: 87 },
  { id: 'sim2', name: 'Prysm', matchPct: 79 },
  { id: 'sim3', name: 'Velour', matchPct: 72 },
  { id: 'sim4', name: 'Kael', matchPct: 65 },
];

/* ------------------------------------------------------------------ */
/*  Radar Chart (pure CSS)                                            */
/* ------------------------------------------------------------------ */

function RadarChart({ values, labels }: { values: number[]; labels: readonly string[] }) {
  // Convert 6 axis values (0-100) to points on a hexagonal grid
  const cx = 150;
  const cy = 150;
  const r = 120;
  const n = values.length;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // start from top

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  // Grid rings
  const rings = [25, 50, 75, 100];

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-sm">
        {/* Grid rings */}
        {rings.map((ring) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, ring);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={values.map((v, i) => {
            const p = getPoint(i, v);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="rgba(220,38,38,0.2)"
          stroke="rgb(220,38,38)"
          strokeWidth="2"
        />

        {/* Data dots */}
        {values.map((v, i) => {
          const p = getPoint(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(220,38,38)" />;
        })}

        {/* Labels */}
        {labels.map((label, i) => {
          const p = getPoint(i, 115);
          return (
            <text
              key={label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-400 text-[10px] font-medium"
            >
              {label}
            </text>
          );
        })}

        {/* Value labels */}
        {values.map((v, i) => {
          const p = getPoint(i, v + 12);
          return (
            <text
              key={`val-${i}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-red-400 text-[9px] font-bold"
            >
              {v}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ArtistDnaPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const artistName = MOCK_ARTISTS[id] ?? 'Unknown Artist';
  const dna = MOCK_DNA[id] ?? [50, 50, 50, 50, 50, 50];
  const genres = MOCK_GENRES[id] ?? [{ name: 'Unknown', pct: 100 }];
  const tags = MOCK_TAGS[id] ?? ['N/A'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Analyzing artist DNA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back nav */}
        <Link href={`/artist/${id}`} className="text-gray-400 hover:text-white text-sm transition mb-6 inline-block">
          &larr; Back to Artist
        </Link>

        {/* Header */}
        <section className="text-center mb-10">
          <p className="text-sm text-red-400 font-semibold uppercase tracking-wider mb-2">Artist DNA</p>
          <h1 className="text-4xl font-black mb-2">{artistName}</h1>
          <p className="text-gray-400">A breakdown of their unique sound signature</p>
        </section>

        {/* Radar Chart */}
        <section className="rounded-2xl bg-[#15151f] p-6 sm:p-8 border border-white/5 mb-8">
          <h2 className="text-lg font-bold mb-6 text-center">Sound DNA</h2>
          <RadarChart values={dna} labels={DNA_AXES} />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
            {DNA_AXES.map((axis, i) => (
              <div key={axis} className="text-center">
                <p className="text-xs text-gray-500">{axis}</p>
                <p className="text-sm font-bold text-red-400">{dna[i]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Genre Fingerprint */}
        <section className="rounded-2xl bg-[#15151f] p-6 border border-white/5 mb-8">
          <h2 className="text-lg font-bold mb-5">Genre Fingerprint</h2>
          <div className="space-y-4">
            {genres.map((g) => (
              <div key={g.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{g.name}</span>
                  <span className="text-gray-500">{g.pct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sound Profile */}
        <section className="rounded-2xl bg-[#15151f] p-6 border border-white/5 mb-8">
          <h2 className="text-lg font-bold mb-4">Sound Profile</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full bg-red-600/15 text-red-400 text-sm font-medium border border-red-600/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Similar Artists */}
        <section className="rounded-2xl bg-[#15151f] p-6 border border-white/5 mb-8">
          <h2 className="text-lg font-bold mb-5">Similar Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SIMILAR_ARTISTS.map((a) => (
              <Link
                key={a.id}
                href={`/artist/${a.id}`}
                className="rounded-xl bg-brand-950/50 p-4 text-center hover:bg-white/5 transition border border-white/5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-lg font-black mx-auto mb-3">
                  {a.name.charAt(0)}
                </div>
                <p className="font-semibold text-sm">{a.name}</p>
                <p className="text-xs text-red-400 font-bold mt-1">{a.matchPct}% match</p>
              </Link>
            ))}
          </div>
        </section>

        {/* How is this calculated */}
        <section className="rounded-2xl bg-[#15151f] border border-white/5 mb-8 overflow-hidden">
          <button
            onClick={() => setShowExplanation((prev) => !prev)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition"
          >
            <h2 className="text-lg font-bold">How is this calculated?</h2>
            <span className={`text-gray-400 transition-transform ${showExplanation ? 'rotate-180' : ''}`}>
              &#9660;
            </span>
          </button>
          {showExplanation && (
            <div className="px-6 pb-6 text-sm text-gray-400 leading-relaxed space-y-3">
              <p>
                Artist DNA is generated by analyzing every track in the artist&rsquo;s catalog using audio feature extraction. Each axis represents a different musical dimension.
              </p>
              <p>
                <strong className="text-gray-300">Energy</strong> measures intensity and power. <strong className="text-gray-300">Tempo</strong> reflects average BPM across tracks. <strong className="text-gray-300">Mood</strong> ranges from dark (low) to uplifting (high).
              </p>
              <p>
                <strong className="text-gray-300">Complexity</strong> considers harmonic and rhythmic intricacy. <strong className="text-gray-300">Danceability</strong> evaluates groove and rhythm regularity. <strong className="text-gray-300">Acousticness</strong> measures the presence of organic instruments.
              </p>
              <p>
                Genre fingerprints are computed by comparing spectral features against a trained classifier, while similar artists are matched by Euclidean distance in DNA space.
              </p>
            </div>
          )}
        </section>

        {/* Compare button */}
        <div className="text-center">
          <Link
            href="/compare"
            className="inline-block px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold transition"
          >
            Compare with Another Artist
          </Link>
        </div>
      </div>
    </div>
  );
}
