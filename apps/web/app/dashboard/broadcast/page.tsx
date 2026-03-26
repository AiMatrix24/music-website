'use client';

import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function BroadcastPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [tab, setTab] = useState<'compose' | 'sent'>('compose');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all_followers' | 'subscribers' | 'premium'>('all_followers');
  const [sending, setSending] = useState(false);

  // Mock sent messages
  const [sentMessages] = useState([
    {
      id: '1',
      title: 'New Album Out Now! 🎶',
      body: 'Hey superfans! My new album "Neon Nights" just dropped. Check it out on OPYNX first!',
      audience: 'all_followers',
      sentAt: new Date('2026-03-20T14:00:00'),
      readCount: 234,
      totalSent: 456,
    },
    {
      id: '2',
      title: 'Exclusive Demo — Subscribers Only',
      body: 'I just uploaded a raw demo of my next single. Only you get to hear it first. Let me know what you think!',
      audience: 'subscribers',
      sentAt: new Date('2026-03-15T10:30:00'),
      readCount: 89,
      totalSent: 102,
    },
    {
      id: '3',
      title: 'VIP Pre-Sale: Neon Nights Tour',
      body: 'Get your tickets 48 hours before they go public. Use code SUPERFAN25 for 25% off.',
      audience: 'premium',
      sentAt: new Date('2026-03-10T18:00:00'),
      readCount: 45,
      totalSent: 52,
    },
  ]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to broadcast messages</p>
        <Link href="/auth/login" className="text-red-400">Sign In →</Link>
      </div>
    );
  }

  const handleSend = async () => {
    if (!title || !body) {
      toast('Fill in both title and message', 'error');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setTitle('');
      setBody('');
      toast('Broadcast sent to your fans!', 'success');
      setTab('sent');
    }, 1500);
  };

  const audienceLabel = {
    all_followers: 'All Followers',
    subscribers: 'Subscribers',
    premium: 'Premium Fans',
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Broadcast</h1>
            <p className="text-gray-400 mt-1">Message your fans directly</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab('compose')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
              tab === 'compose' ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400'
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
              tab === 'sent' ? 'bg-red-600 text-white' : 'bg-[#15151f] text-gray-400'
            }`}
          >
            Sent ({sentMessages.length})
          </button>
        </div>

        {tab === 'compose' && (
          <div className="space-y-6">
            {/* Audience selector */}
            <div>
              <label className="block text-sm font-semibold mb-2">Audience</label>
              <div className="flex gap-3">
                {(['all_followers', 'subscribers', 'premium'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      audience === a
                        ? 'bg-red-600 text-white'
                        : 'bg-[#15151f] text-gray-400 hover:text-white'
                    }`}
                  >
                    {audienceLabel[a]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {audience === 'all_followers' && 'Send to everyone who follows you'}
                {audience === 'subscribers' && 'Send to fans with an active subscription'}
                {audience === 'premium' && 'Send only to Premium and Studio tier fans'}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Subject Line *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Track Out Now! 🎶"
                maxLength={100}
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{title.length}/100</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold mb-2">Message *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message to fans..."
                rows={6}
                maxLength={2000}
                className="w-full bg-[#15151f] border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-red-600 focus:outline-none transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{body.length}/2000</p>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <div className="border-l-4 border-red-600 pl-4">
                  <h3 className="font-bold mb-1">{title || 'Subject line...'}</h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{body || 'Message content...'}</p>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Sending to: <span className="text-red-400">{audienceLabel[audience]}</span>
                </p>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !title || !body}
              className="w-full rounded-full bg-red-600 py-4 font-semibold text-white text-lg transition hover:bg-red-500 disabled:opacity-50"
            >
              {sending ? 'Sending...' : `Send to ${audienceLabel[audience]}`}
            </button>
          </div>
        )}

        {tab === 'sent' && (
          <div className="space-y-4">
            {sentMessages.map((msg) => (
              <div key={msg.id} className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{msg.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.sentAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' · '}
                      <span className="text-red-400 capitalize">{msg.audience.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{Math.round((msg.readCount / msg.totalSent) * 100)}%</p>
                    <p className="text-xs text-gray-500">open rate</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{msg.body}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>📤 {msg.totalSent} sent</span>
                  <span>👁 {msg.readCount} read</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
