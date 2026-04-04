'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// ─── Types ───

type Visibility = 'public' | 'private' | 'unlisted' | 'subscriber-only';
type Downloadable = 'yes' | 'no' | 'purchasers-only';
type License = 'all-rights-reserved' | 'cc-by' | 'cc-by-sa' | 'cc-by-nc' | 'cc0';
type Monetization = 'free' | 'pay-what-you-want' | 'fixed-price';
type Exclusivity = 'open' | 'subscriber-only' | 'time-gated-24h' | 'time-gated-48h';

interface TrackPublishSettings {
  id: string;
  title: string;
  artist: string;
  visibility: Visibility;
  downloadable: Downloadable;
  license: License;
  monetization: Monetization;
  fixedPrice: string;
  exclusivity: Exclusivity;
  preSave: boolean;
}

const LICENSE_LABELS: Record<License, string> = {
  'all-rights-reserved': 'All Rights Reserved',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  'cc-by-nc': 'CC BY-NC',
  'cc0': 'CC0 (Public Domain)',
};

const EXCLUSIVITY_LABELS: Record<Exclusivity, string> = {
  open: 'Open',
  'subscriber-only': 'Subscriber-Only',
  'time-gated-24h': 'Time-Gated (24h Early Access)',
  'time-gated-48h': 'Time-Gated (48h Early Access)',
};

// ─── Mock Data ───

function getMockTracks(): TrackPublishSettings[] {
  return [
    { id: 't1', title: 'Midnight Signal', artist: 'You', visibility: 'public', downloadable: 'yes', license: 'all-rights-reserved', monetization: 'free', fixedPrice: '', exclusivity: 'open', preSave: false },
    { id: 't2', title: 'Voltage Drop', artist: 'You', visibility: 'public', downloadable: 'purchasers-only', license: 'cc-by', monetization: 'fixed-price', fixedPrice: '2.99', exclusivity: 'subscriber-only', preSave: true },
    { id: 't3', title: 'Phantom Frequency', artist: 'You', visibility: 'unlisted', downloadable: 'no', license: 'cc-by-nc', monetization: 'pay-what-you-want', fixedPrice: '', exclusivity: 'open', preSave: false },
    { id: 't4', title: 'Neon Cascade', artist: 'You', visibility: 'subscriber-only', downloadable: 'yes', license: 'all-rights-reserved', monetization: 'fixed-price', fixedPrice: '4.99', exclusivity: 'time-gated-24h', preSave: true },
    { id: 't5', title: 'Solar Drift (Unreleased)', artist: 'You', visibility: 'private', downloadable: 'no', license: 'all-rights-reserved', monetization: 'free', fixedPrice: '', exclusivity: 'open', preSave: false },
  ];
}

// ─── Component ───

export default function PublishingPreferencesPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<TrackPublishSettings[]>(getMockTracks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to manage publishing preferences</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  function updateTrack(id: string, patch: Partial<TrackPublishSettings>) {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function handleSave(id: string) {
    setSaving(id);
    setTimeout(() => {
      setSaving(null);
      toast('Publishing preferences saved', 'success');
    }, 800);
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">Publishing Preferences</h1>
        <p className="text-gray-400 mb-8">Configure visibility, licensing, monetization, and distribution settings for each track.</p>

        {/* Info Section */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Option Guide</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h3 className="text-white font-semibold mb-1">Visibility</h3>
              <p><span className="text-gray-300">Public</span> &mdash; discoverable by everyone. <span className="text-gray-300">Private</span> &mdash; only you. <span className="text-gray-300">Unlisted</span> &mdash; accessible via direct link. <span className="text-gray-300">Subscriber-Only</span> &mdash; your subscribers only.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Downloadable</h3>
              <p><span className="text-gray-300">Yes</span> &mdash; anyone can download. <span className="text-gray-300">No</span> &mdash; streaming only. <span className="text-gray-300">Purchasers Only</span> &mdash; paid download access.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Monetization</h3>
              <p><span className="text-gray-300">Free</span> &mdash; no charge. <span className="text-gray-300">Pay What You Want</span> &mdash; fans choose price. <span className="text-gray-300">Fixed Price</span> &mdash; set your price.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Exclusivity</h3>
              <p><span className="text-gray-300">Open</span> &mdash; available to all. <span className="text-gray-300">Subscriber-Only</span> &mdash; gated. <span className="text-gray-300">Time-Gated</span> &mdash; early access for subscribers before public release.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">License</h3>
              <p>Controls how others may use your work. Creative Commons licenses allow specific reuse rights. All Rights Reserved is the most restrictive.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Pre-Save</h3>
              <p>When enabled, fans can save your track before it is publicly released, boosting launch-day engagement.</p>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-3">
          {tracks.map((track) => {
            const isExpanded = expandedId === track.id;
            return (
              <div key={track.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 overflow-hidden">
                {/* Track Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : track.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-brand-800/10 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-brand-800/30 flex items-center justify-center text-gray-500 text-lg">
                      &#9835;
                    </div>
                    <div>
                      <p className="font-semibold">{track.title}</p>
                      <p className="text-xs text-gray-500">
                        {track.visibility === 'public' ? 'Public' : track.visibility === 'private' ? 'Private' : track.visibility === 'unlisted' ? 'Unlisted' : 'Subscriber-Only'}
                        {' / '}
                        {track.monetization === 'free' ? 'Free' : track.monetization === 'pay-what-you-want' ? 'PWYW' : `$${track.fixedPrice}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-xl">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                </button>

                {/* Expanded Settings */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-6 border-t border-brand-800/20 pt-4">

                    {/* Visibility */}
                    <FieldGroup label="Visibility">
                      {(['public', 'private', 'unlisted', 'subscriber-only'] as Visibility[]).map((v) => (
                        <RadioOption key={v} name={`vis-${track.id}`} value={v} checked={track.visibility === v} onChange={() => updateTrack(track.id, { visibility: v })} label={v.replace('-', ' ')} />
                      ))}
                    </FieldGroup>

                    {/* Downloadable */}
                    <FieldGroup label="Downloadable">
                      {(['yes', 'no', 'purchasers-only'] as Downloadable[]).map((d) => (
                        <RadioOption key={d} name={`dl-${track.id}`} value={d} checked={track.downloadable === d} onChange={() => updateTrack(track.id, { downloadable: d })} label={d.replace('-', ' ')} />
                      ))}
                    </FieldGroup>

                    {/* License */}
                    <FieldGroup label="License">
                      <select
                        value={track.license}
                        onChange={(e) => updateTrack(track.id, { license: e.target.value as License })}
                        className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        {Object.entries(LICENSE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </FieldGroup>

                    {/* Monetization */}
                    <FieldGroup label="Monetization">
                      {(['free', 'pay-what-you-want', 'fixed-price'] as Monetization[]).map((m) => (
                        <RadioOption key={m} name={`mon-${track.id}`} value={m} checked={track.monetization === m} onChange={() => updateTrack(track.id, { monetization: m })} label={m.replace(/-/g, ' ')} />
                      ))}
                      {track.monetization === 'fixed-price' && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-gray-400">$</span>
                          <input
                            type="number"
                            min="0.50"
                            step="0.01"
                            value={track.fixedPrice}
                            onChange={(e) => updateTrack(track.id, { fixedPrice: e.target.value })}
                            className="w-28 bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </FieldGroup>

                    {/* Exclusivity */}
                    <FieldGroup label="Exclusivity">
                      <select
                        value={track.exclusivity}
                        onChange={(e) => updateTrack(track.id, { exclusivity: e.target.value as Exclusivity })}
                        className="bg-brand-950 border border-brand-800/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        {Object.entries(EXCLUSIVITY_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </FieldGroup>

                    {/* Pre-Save Toggle */}
                    <FieldGroup label="Pre-Save">
                      <button
                        onClick={() => updateTrack(track.id, { preSave: !track.preSave })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${track.preSave ? 'bg-red-600' : 'bg-brand-800/40'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${track.preSave ? 'translate-x-6' : ''}`} />
                      </button>
                      <span className="text-sm text-gray-400 ml-2">{track.preSave ? 'Enabled' : 'Disabled'}</span>
                    </FieldGroup>

                    {/* Save Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleSave(track.id)}
                        disabled={saving === track.id}
                        className="rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-2.5 font-semibold text-white text-sm transition"
                      >
                        {saving === track.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-red-600"
      />
      <span className={checked ? 'text-white' : 'text-gray-400'}>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
    </label>
  );
}
