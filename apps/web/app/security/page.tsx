'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const BACKUP_CODES = [
  'A7K2-M9P4', 'B3X8-N1Q6', 'C5L0-R2W7', 'D9F3-S4Y1',
  'E6H8-T7Z5', 'F1J4-U0V2', 'G8M6-W3A9', 'H2P5-X6B3',
];

const MOCK_SESSIONS = [
  { id: '1', browser: 'Chrome', os: 'macOS', location: 'Los Angeles, CA', lastActive: '2 minutes ago', current: true },
  { id: '2', browser: 'Safari', os: 'iPhone', location: 'Los Angeles, CA', lastActive: '1 hour ago', current: false },
  { id: '3', browser: 'Firefox', os: 'Windows', location: 'New York, NY', lastActive: '3 days ago', current: false },
];

const MOCK_LOGIN_HISTORY = [
  { date: '2025-12-15 14:32', device: 'Chrome / macOS', location: 'Los Angeles, CA', status: 'success' as const },
  { date: '2025-12-14 09:15', device: 'Safari / iPhone', location: 'Los Angeles, CA', status: 'success' as const },
  { date: '2025-12-13 22:41', device: 'Firefox / Windows', location: 'New York, NY', status: 'failed' as const },
  { date: '2025-12-12 11:08', device: 'Chrome / macOS', location: 'Los Angeles, CA', status: 'success' as const },
  { date: '2025-12-10 16:55', device: 'Chrome / Android', location: 'San Francisco, CA', status: 'success' as const },
];

export default function SecurityPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to manage security settings</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast('Session revoked', 'success');
  };

  const handleToggle2FA = () => {
    setTwoFAEnabled(!twoFAEnabled);
    toast(twoFAEnabled ? '2FA has been disabled' : '2FA has been enabled', 'success');
  };

  const handleDownloadCodes = () => {
    const text = BACKUP_CODES.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opynx-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup codes downloaded', 'success');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </Link>

        <h1 className="text-3xl font-black mb-8">Security</h1>

        {/* Security status */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Security Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Password last changed</p>
              <p className="text-sm text-gray-200 font-medium">32 days ago</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active sessions</p>
              <p className="text-sm text-gray-200 font-medium">{sessions.length} devices</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">2FA status</p>
              <p className={`text-sm font-medium ${twoFAEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* 2FA Setup */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Two-Factor Authentication</h2>
            <button
              onClick={handleToggle2FA}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                twoFAEnabled ? 'bg-red-600' : 'bg-brand-800'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  twoFAEnabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {twoFAEnabled && (
            <div className="space-y-6">
              {/* QR code placeholder */}
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  Scan this QR code with your authenticator app
                </p>
                <div className="w-48 h-48 bg-white rounded-xl p-3 inline-block">
                  <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${
                          (i % 3 === 0 || i % 7 === 0) ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Backup codes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-400">Backup Codes</p>
                  <button
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    {showBackupCodes ? 'Hide' : 'Show'} codes
                  </button>
                </div>
                {showBackupCodes && (
                  <div className="bg-brand-950 rounded-xl p-4 mb-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BACKUP_CODES.map((code) => (
                        <span key={code} className="font-mono text-sm text-gray-300 bg-brand-800/30 px-3 py-1.5 rounded-lg text-center">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleDownloadCodes}
                  className="px-4 py-2 bg-brand-950 border border-brand-800/30 hover:border-brand-700 text-gray-300 rounded-xl text-sm font-medium transition"
                >
                  Download Backup Codes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active sessions */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Active Sessions</h2>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-brand-950 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-800/40 flex items-center justify-center text-lg">
                    {s.browser === 'Chrome' ? '&#x1F310;' : s.browser === 'Safari' ? '&#x1F4F1;' : '&#x1F5A5;'}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {s.browser} / {s.os}
                      {s.current && (
                        <span className="ml-2 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.location} &middot; {s.lastActive}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-600/30 rounded-lg hover:bg-red-600/10 transition"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent login activity */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Recent Login Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-brand-800/30">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Device</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LOGIN_HISTORY.map((entry, i) => (
                  <tr key={i} className="border-b border-brand-800/20 last:border-0">
                    <td className="py-3 text-gray-300">{entry.date}</td>
                    <td className="py-3 text-gray-300">{entry.device}</td>
                    <td className="py-3 text-gray-300">{entry.location}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          entry.status === 'success'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6">
            <h3 className="font-bold mb-2">Change Password</h3>
            <p className="text-sm text-gray-500 mb-4">Update your password regularly to keep your account secure.</p>
            <button
              onClick={() => toast('Password change dialog would open here', 'info')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full text-sm font-semibold transition"
            >
              Change Password
            </button>
          </div>

          <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6">
            <h3 className="font-bold mb-2">Emergency Access</h3>
            <p className="text-sm text-gray-500 mb-4">Add trusted contacts who can help recover your account.</p>
            <button
              onClick={() => toast('Trusted contacts management would open here', 'info')}
              className="px-5 py-2.5 bg-brand-950 border border-brand-800/30 hover:border-brand-700 text-gray-300 rounded-full text-sm font-semibold transition"
            >
              Manage Trusted Contacts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
