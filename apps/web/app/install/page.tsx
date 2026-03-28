'use client';

import Link from 'next/link';
import { useState } from 'react';

type Platform = 'ios' | 'android' | 'desktop';

const benefits = [
  { icon: '📶', title: 'Offline Access', desc: 'Listen to cached tracks without internet.' },
  { icon: '🚀', title: 'No App Store', desc: 'Install directly from your browser — no download needed.' },
  { icon: '🔔', title: 'Push Notifications', desc: 'Get notified about new drops, events, and messages.' },
  { icon: '📱', title: 'Home Screen Icon', desc: 'Launch OPYNX like a native app from your home screen.' },
];

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>('ios');

  return (
    <div className="min-h-screen bg-brand-950 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
          <span>&larr;</span> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-black mb-2">Install <span className="text-red-500">OPYNX</span></h1>
        <p className="text-gray-400 mb-10">Add OPYNX to your home screen for a native app experience.</p>

        {/* Hero phone mockup */}
        <div className="bg-gradient-to-br from-red-900/40 via-brand-950 to-brand-950 rounded-2xl p-8 sm:p-12 mb-12 flex flex-col sm:flex-row items-center gap-8">
          <div className="w-48 h-80 bg-[#15151f] rounded-3xl border-2 border-brand-800 flex flex-col items-center justify-center p-4 shrink-0">
            <div className="w-12 h-1.5 bg-brand-800 rounded-full mb-6" />
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-2xl font-black">O</span>
            </div>
            <span className="text-xs text-gray-400 font-bold">OPYNX</span>
            <div className="flex-1" />
            <div className="w-10 h-10 border-2 border-brand-800 rounded-full mb-2" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Add to Home Screen</h2>
            <p className="text-gray-400 leading-relaxed">
              OPYNX works as a Progressive Web App. Install it on any device for fast, app-like access without app store downloads.
            </p>
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2 mb-8">
          {([
            { key: 'ios' as Platform, label: 'iOS' },
            { key: 'android' as Platform, label: 'Android' },
            { key: 'desktop' as Platform, label: 'Desktop' },
          ]).map((p) => (
            <button
              key={p.key}
              onClick={() => setPlatform(p.key)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${
                platform === p.key
                  ? 'bg-red-600 text-white'
                  : 'bg-[#15151f] text-gray-400 hover:text-white hover:bg-brand-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-[#15151f] rounded-2xl p-6 sm:p-8 mb-12">
          {platform === 'ios' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Install on iOS</h3>
              {[
                { step: 1, icon: '🌐', title: 'Open in Safari', desc: 'Navigate to opynx.dev in Safari (required — other browsers do not support Add to Home Screen on iOS).' },
                { step: 2, icon: '⬆️', title: 'Tap the Share Icon', desc: 'Tap the share button (square with an arrow) at the bottom of the screen.' },
                { step: 3, icon: '➕', title: 'Tap "Add to Home Screen"', desc: 'Scroll down in the share sheet, tap "Add to Home Screen", then tap "Add".' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center font-black text-lg shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-bold">{s.icon} {s.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {platform === 'android' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Install on Android</h3>
              {[
                { step: 1, icon: '🌐', title: 'Open in Chrome', desc: 'Navigate to opynx.dev in Google Chrome.' },
                { step: 2, icon: '⋮', title: 'Tap the Menu', desc: 'Tap the three-dot menu icon in the top-right corner.' },
                { step: 3, icon: '➕', title: 'Tap "Add to Home Screen"', desc: 'Select "Add to Home screen" from the menu, then tap "Add".' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center font-black text-lg shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-bold">{s.icon} {s.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {platform === 'desktop' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Install on Desktop</h3>
              {[
                { step: 1, icon: '🔽', title: 'Click the Install Icon', desc: 'Look for the install icon in the right side of your browser address bar (Chrome, Edge, or Brave).' },
                { step: 2, icon: '✅', title: 'Click "Install"', desc: 'Confirm the installation in the popup dialog. OPYNX will open as a standalone window.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center font-black text-lg shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-bold">{s.icon} {s.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Benefits */}
        <h2 className="text-2xl font-black mb-6">Why Install?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {benefits.map((b) => (
            <div key={b.title} className="bg-[#15151f] rounded-xl p-5">
              <span className="text-2xl mb-2 block">{b.icon}</span>
              <h3 className="font-bold mb-1">{b.title}</h3>
              <p className="text-sm text-gray-400">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Why PWA */}
        <div className="bg-[#15151f] rounded-2xl p-6 sm:p-8 mb-12">
          <h2 className="text-xl font-black mb-3">Why a PWA?</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Progressive Web Apps combine the best of the web and native apps. OPYNX as a PWA means instant updates with no app store reviews, smaller storage footprint, cross-platform compatibility, and the same fast experience you get in the browser — but without the browser chrome.
          </p>
          <p className="text-gray-400 leading-relaxed">
            PWAs are the future of music platforms: always up-to-date, privacy-respecting, and accessible on any device with a modern browser.
          </p>
        </div>

        {/* Download badges placeholder */}
        <div className="bg-[#15151f] rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-black mb-3">Native Apps Coming Soon</h2>
          <p className="text-gray-400 mb-6">We are working on native iOS and Android apps. Stay tuned.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-brand-950 border border-brand-800 rounded-lg px-6 py-3 text-gray-500 text-sm font-medium">
              App Store — Coming Soon
            </div>
            <div className="bg-brand-950 border border-brand-800 rounded-lg px-6 py-3 text-gray-500 text-sm font-medium">
              Google Play — Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
