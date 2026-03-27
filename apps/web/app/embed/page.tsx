'use client';

import Link from 'next/link';
import { useState } from 'react';

const EXAMPLE_TRACKS = [
  { id: 'trk_001', title: 'Midnight Drive', artist: 'NeonWave' },
  { id: 'trk_002', title: 'Digital Rain', artist: 'SynthPulse' },
  { id: 'trk_003', title: 'Ghost Signal', artist: 'VoidEcho' },
  { id: 'trk_004', title: 'Solar Flare', artist: 'AstroBeats' },
  { id: 'trk_005', title: 'Crystal Cavern', artist: 'LoopMachine' },
];

const SIZES = {
  small: { width: 300, height: 80, label: 'Small (300x80)' },
  medium: { width: 400, height: 152, label: 'Medium (400x152)' },
  large: { width: 480, height: 300, label: 'Large (480x300)' },
};

export default function EmbedPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [autoplay, setAutoplay] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(EXAMPLE_TRACKS[0]);
  const [copied, setCopied] = useState(false);

  const { width, height } = SIZES[size];
  const embedCode = `<iframe src="https://opynx.dev/embed/player/${selectedTrack.id}?theme=${theme}&autoplay=${autoplay}" width="${width}" height="${height}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:12px;"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Embed Widget</h1>
        <p className="text-gray-400 mb-10">
          Add the OPYNX player to your website. Customize the look and grab the embed code.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] p-6 space-y-6">
              <h2 className="text-lg font-bold">Customize</h2>

              {/* Track Selector */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Track</label>
                <select
                  value={selectedTrack.id}
                  onChange={(e) => setSelectedTrack(EXAMPLE_TRACKS.find((t) => t.id === e.target.value)!)}
                  className="w-full rounded-xl bg-brand-950 border border-brand-800/20 px-4 py-3 text-white outline-none focus:border-red-600 transition"
                >
                  {EXAMPLE_TRACKS.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.title} &mdash; {track.artist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Theme</label>
                <div className="flex gap-3">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                        theme === t
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/20'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Size</label>
                <div className="flex gap-3">
                  {(Object.keys(SIZES) as Array<keyof typeof SIZES>).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                        size === s
                          ? 'bg-red-600 text-white'
                          : 'bg-brand-950 text-gray-400 hover:text-white border border-brand-800/20'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autoplay */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Autoplay</span>
                <button
                  onClick={() => setAutoplay(!autoplay)}
                  className={`relative w-12 h-6 rounded-full transition ${autoplay ? 'bg-red-600' : 'bg-brand-800/40'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      autoplay ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Embed Code */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Embed Code</h2>
                <button
                  onClick={handleCopy}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                >
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="bg-brand-950 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap break-all font-mono border border-brand-800/20">
                {embedCode}
              </pre>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">Preview</h2>
              <div className="flex items-center justify-center min-h-[320px]">
                <div
                  style={{ width, height }}
                  className={`rounded-xl overflow-hidden border border-brand-800/30 ${
                    theme === 'dark' ? 'bg-brand-950' : 'bg-white'
                  }`}
                >
                  <div className="h-full flex flex-col justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 ${theme === 'dark' ? 'bg-red-600/20' : 'bg-red-100'} flex items-center justify-center`}>
                        <span className="text-red-500 text-lg">&#9654;</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {selectedTrack.title}
                        </p>
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedTrack.artist}
                        </p>
                      </div>
                    </div>
                    {size !== 'small' && (
                      <div className="mt-3">
                        <div className={`h-1 rounded-full ${theme === 'dark' ? 'bg-brand-800/40' : 'bg-gray-200'}`}>
                          <div className="h-1 rounded-full bg-red-600 w-1/3" />
                        </div>
                        <div className={`flex justify-between text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          <span>1:12</span>
                          <span>3:45</span>
                        </div>
                      </div>
                    )}
                    {size === 'large' && (
                      <div className="mt-4 flex items-center justify-center gap-6">
                        <button className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>&#9664;&#9664;</button>
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                          <span className="text-white text-sm">&#9654;</span>
                        </div>
                        <button className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>&#9654;&#9654;</button>
                      </div>
                    )}
                    <div className={`flex items-center justify-between mt-auto pt-2 ${size === 'small' ? 'hidden' : ''}`}>
                      <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>
                        Powered by OPYNX
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl bg-[#15151f] p-6">
              <h2 className="text-lg font-bold mb-4">How to Embed</h2>
              <div className="space-y-4 text-sm text-gray-400">
                <div>
                  <h3 className="text-white font-semibold mb-1">HTML / Any Website</h3>
                  <p>Copy the embed code above and paste it into your HTML where you want the player to appear.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">WordPress</h3>
                  <p>Add a &quot;Custom HTML&quot; block in the Gutenberg editor and paste the iframe code. For the Classic editor, switch to the &quot;Text&quot; tab and paste.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Squarespace</h3>
                  <p>Add an &quot;Embed&quot; block (Code snippet), click &quot;Set Source,&quot; paste the iframe code, and save. The player will render in your live site.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Wix / Webflow</h3>
                  <p>Use the &quot;Embed a widget&quot; or &quot;Custom Code&quot; element, paste the iframe, and publish.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
