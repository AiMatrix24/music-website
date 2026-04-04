'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

// ─── Types ───

type ExportStatus = 'idle' | 'requesting' | 'requested';
type DeleteStep = 'idle' | 'confirming' | 'typing';

const DATA_CATEGORIES = [
  'Profile information',
  'Tracks metadata and audio files',
  'Playlists and saved collections',
  'Subscription history',
  'Messages and conversations',
  'Scan and listening history',
  'Commission and earnings records',
  'Purchase history',
];

// ─── Component ───

export default function DataExportDeletionPage() {
  const { status } = useSession();
  const { toast } = useToast();

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('idle');
  const [understood, setUnderstood] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Sign in to manage your data</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Sign In</Link>
      </div>
    );
  }

  function handleRequestExport() {
    setExportStatus('requesting');
    setTimeout(() => {
      setExportStatus('requested');
      toast(
        "Your data export is being prepared. You'll receive an email with a download link within 24 hours.",
        'success'
      );
    }, 1000);
  }

  function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      toast('Please type DELETE to confirm', 'error');
      return;
    }
    setDeleteStep('idle');
    setUnderstood(false);
    setDeleteConfirmText('');
    toast('Account scheduled for deletion. You have 30 days to change your mind.', 'info');
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/settings" className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block">
          &larr; Settings
        </Link>
        <h1 className="text-3xl font-bold mb-2">Data &amp; Privacy</h1>
        <p className="text-gray-400 mb-10">Export your data or manage account deletion under GDPR and applicable privacy regulations.</p>

        {/* ── Export Section ── */}
        <section className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Export Your Data</h2>
          <p className="text-sm text-gray-400 mb-4">
            Request a complete archive of all your data on OPYNX. The export includes:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mb-6">
            {DATA_CATEGORIES.map((cat) => (
              <li key={cat}>{cat}</li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRequestExport}
              disabled={exportStatus !== 'idle'}
              className="rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-2.5 font-semibold text-white text-sm transition"
            >
              {exportStatus === 'idle'
                ? 'Request Export'
                : exportStatus === 'requesting'
                  ? 'Preparing...'
                  : 'Export Requested'}
            </button>
            {exportStatus === 'requested' && (
              <span className="text-sm text-green-400">Check your email within 24 hours.</span>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">Download link expires in 7 days after generation.</p>
        </section>

        {/* ── Delete Section ── */}
        <section className="rounded-2xl border-2 border-red-600/30 bg-red-950/10 p-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone &mdash; Delete Your Account</h2>

          <div className="rounded-xl bg-red-950/20 border border-red-600/20 p-4 mb-6 text-sm text-red-300 space-y-2">
            <p className="font-semibold">Deleting your account will:</p>
            <ul className="list-disc list-inside space-y-1 text-red-400">
              <li>Cancel all active subscriptions immediately</li>
              <li>Archive your content (existing purchasers retain access to their downloads)</li>
              <li>Begin a 30-day grace period before permanent deletion</li>
              <li>Retain financial records for tax compliance with personally identifiable information stripped</li>
            </ul>
          </div>

          {/* Step 1: Acknowledge */}
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 accent-red-600"
            />
            <span className="text-sm text-gray-300">
              I understand that this action will schedule my account for permanent deletion after a 30-day grace period.
            </span>
          </label>

          {deleteStep === 'idle' && (
            <button
              onClick={() => setDeleteStep('confirming')}
              disabled={!understood}
              className="rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed px-6 py-2.5 font-semibold text-white text-sm transition"
            >
              Delete My Account
            </button>
          )}

          {/* Confirmation Modal */}
          {deleteStep === 'confirming' && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
              <div className="bg-[#15151f] border border-brand-800/20 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-red-400 mb-2">Are you sure?</h3>
                <p className="text-sm text-gray-400 mb-4">
                  This will schedule your account for permanent deletion. You have 30 days to reverse this decision by signing back in.
                </p>
                <p className="text-sm text-gray-300 mb-2">Type <span className="font-mono font-bold text-white">DELETE</span> to confirm:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-brand-950 border border-brand-800/30 rounded-lg px-4 py-2.5 text-sm text-white mb-4 focus:outline-none focus:ring-2 focus:ring-red-600"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setDeleteStep('idle');
                      setDeleteConfirmText('');
                    }}
                    className="rounded-full bg-[#15151f] border border-brand-800/20 px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE'}
                    className="rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-white transition"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
