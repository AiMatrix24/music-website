'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

type ReleaseType = 'New Track' | 'New Album' | 'Tour Announcement' | 'Event' | 'Milestone' | 'Collaboration';
type Tone = 'Professional' | 'Casual' | 'Exciting' | 'Formal';

const PAST_RELEASES = [
  { title: 'New Single "Midnight Hour" Drops April 15', date: '2026-03-20', type: 'New Track' },
  { title: 'Neon Nights Album Reaches 100K Streams', date: '2026-02-10', type: 'Milestone' },
  { title: 'Summer Tour 2026 Announced', date: '2026-01-28', type: 'Tour Announcement' },
];

function generatePressRelease(form: { releaseType: ReleaseType; title: string; details: string; tone: Tone; includeQuote: boolean }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const toneAdj = form.tone === 'Exciting' ? 'groundbreaking' : form.tone === 'Casual' ? 'fresh' : form.tone === 'Formal' ? 'distinguished' : 'significant';
  const headline = `${form.title} — A ${toneAdj.charAt(0).toUpperCase() + toneAdj.slice(1)} ${form.releaseType} from OPYNX Artist`;

  const p1 = form.tone === 'Exciting'
    ? `Get ready for something incredible. Today marks the announcement of "${form.title}", a ${toneAdj} ${form.releaseType.toLowerCase()} that is set to redefine the music landscape. This release represents months of creative exploration and artistic vision coming together in a powerful new way.`
    : form.tone === 'Casual'
    ? `Big news dropping today! "${form.title}" is officially on the way, and fans are in for something special. This ${form.releaseType.toLowerCase()} brings a ${toneAdj} perspective that listeners have been waiting for.`
    : `We are pleased to announce "${form.title}", a ${toneAdj} ${form.releaseType.toLowerCase()} that showcases artistic evolution and creative ambition. This release marks an important milestone in an already impressive career.`;

  const p2 = form.details
    ? `${form.details} This ${form.releaseType.toLowerCase()} has been crafted with meticulous attention to detail, drawing from a wide range of influences while maintaining a distinctive artistic identity that fans have come to love.`
    : `This ${form.releaseType.toLowerCase()} has been crafted with meticulous attention to detail, drawing from a wide range of influences while maintaining a distinctive artistic identity. Every element has been carefully considered to deliver an unforgettable experience.`;

  const p3 = `Available on all major platforms through OPYNX, "${form.title}" is expected to generate significant buzz across the music industry. Pre-save links are now live, and fans can stay updated through official social media channels for exclusive behind-the-scenes content.`;

  const quote = form.includeQuote
    ? `"This project means everything to me. I poured my heart and soul into every moment of it, and I cannot wait for everyone to experience it the way I intended." — Artist Name`
    : '';

  return { today, headline, p1, p2, p3, quote };
}

export default function PressReleasePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [form, setForm] = useState({
    releaseType: 'New Track' as ReleaseType,
    title: '',
    details: '',
    tone: 'Professional' as Tone,
    includeQuote: true,
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ReturnType<typeof generatePressRelease> | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to generate press releases</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const handleGenerate = () => {
    if (!form.title.trim()) {
      toast('Please enter a title for your release', 'error');
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setGenerated(generatePressRelease(form));
      setGenerating(false);
      toast('Press release generated!', 'success');
    }, 2000);
  };

  const handleCopy = () => {
    if (!generated) return;
    const text = [
      'FOR IMMEDIATE RELEASE',
      generated.today,
      '',
      generated.headline,
      '',
      generated.p1,
      '',
      generated.p2,
      '',
      generated.p3,
      '',
      generated.quote ? generated.quote : '',
      '',
      'About Artist Name',
      'Artist Name is an independent musician creating genre-defying music that connects with audiences worldwide. With a growing catalog of releases on OPYNX, they continue to push creative boundaries and build a dedicated fanbase.',
      '',
      'Contact',
      'Press inquiries: press@opynx.com',
      'Management: management@opynx.com',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard!', 'success');
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Generate Press Release <span className="text-2xl">✨</span>
          </h1>
          <p className="text-gray-400 mt-1">Create professional press releases in seconds</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Release Type</label>
              <select
                value={form.releaseType}
                onChange={(e) => setForm({ ...form, releaseType: e.target.value as ReleaseType })}
                className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
              >
                {(['New Track', 'New Album', 'Tour Announcement', 'Event', 'Milestone', 'Collaboration'] as ReleaseType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Tone</label>
              <select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value as Tone })}
                className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50"
              >
                {(['Professional', 'Casual', 'Exciting', 'Formal'] as Tone[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Title of Release</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Midnight Hour, Summer Tour 2026..."
              className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Key Details</label>
            <textarea
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="What makes this release special? Include key details, collaborators, inspiration..."
              rows={4}
              className="w-full rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeQuote}
                onChange={(e) => setForm({ ...form, includeQuote: e.target.checked })}
                className="w-4 h-4 rounded border-brand-800/30 bg-brand-950 text-red-600 focus:ring-red-600"
              />
              <span className="text-sm text-gray-400">Include artist quote</span>
            </label>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>

        {/* Generated Output */}
        {generated && (
          <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8 mb-6">
            <div className="max-w-2xl mx-auto">
              {/* Document Header */}
              <div className="border-b border-brand-800/20 pb-4 mb-6">
                <p className="text-xs font-bold tracking-widest text-red-500 mb-1">FOR IMMEDIATE RELEASE</p>
                <p className="text-xs text-gray-500">{generated.today}</p>
              </div>

              {/* Headline */}
              <h2 className="text-2xl font-bold mb-6 leading-tight">{generated.headline}</h2>

              {/* Body */}
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>{generated.p1}</p>
                <p>{generated.p2}</p>
                <p>{generated.p3}</p>
              </div>

              {/* Quote */}
              {generated.quote && (
                <blockquote className="my-6 pl-4 border-l-2 border-red-600 text-gray-300 italic text-sm">
                  {generated.quote}
                </blockquote>
              )}

              {/* About Section */}
              <div className="border-t border-brand-800/20 pt-6 mt-6">
                <h3 className="text-sm font-bold mb-2">About {session?.user?.name || 'Artist Name'}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {session?.user?.name || 'Artist Name'} is an independent musician creating genre-defying music that connects with audiences worldwide. With a growing catalog of releases on OPYNX, they continue to push creative boundaries and build a dedicated fanbase.
                </p>
              </div>

              {/* Contact */}
              <div className="border-t border-brand-800/20 pt-6 mt-6">
                <h3 className="text-sm font-bold mb-2">Contact</h3>
                <p className="text-xs text-gray-500">Press inquiries: press@opynx.com</p>
                <p className="text-xs text-gray-500">Management: management@opynx.com</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-brand-800/20">
              <button
                onClick={handleCopy}
                className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => toast('PDF download coming soon!', 'info')}
                className="rounded-full bg-[#15151f] border border-brand-800/30 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:border-red-600/50 transition"
              >
                Download as PDF
              </button>
              <button
                onClick={() => toast('Email to press list coming soon!', 'info')}
                className="rounded-full bg-[#15151f] border border-brand-800/30 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:border-red-600/50 transition"
              >
                Email to Press List
              </button>
            </div>
          </div>
        )}

        {/* Previous Releases */}
        <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
          <h2 className="text-lg font-bold mb-4">Previous Releases</h2>
          <div className="space-y-3">
            {PAST_RELEASES.map((pr) => (
              <div key={pr.title} className="flex items-center justify-between rounded-xl bg-brand-950/50 p-4">
                <div>
                  <p className="font-semibold text-sm">{pr.title}</p>
                  <p className="text-xs text-gray-500">{pr.type} — {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button
                  onClick={() => toast('Loading previous release...', 'info')}
                  className="text-xs text-red-500 hover:text-red-400 transition font-medium"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
