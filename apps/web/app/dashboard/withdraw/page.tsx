'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

const MOCK_WITHDRAWALS = [
  { id: '1', date: '2025-12-01', amount: 75.0, method: 'USDC', status: 'completed' as const, txHash: '0x8a3f...e21b' },
  { id: '2', date: '2025-11-15', amount: 50.0, method: 'ACH', status: 'completed' as const, txHash: null },
  { id: '3', date: '2025-11-01', amount: 100.0, method: 'USDC', status: 'completed' as const, txHash: '0x4c7d...f93a' },
  { id: '4', date: '2025-10-20', amount: 35.0, method: 'USDC', status: 'processing' as const, txHash: null },
];

export default function WithdrawPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'usdc' | 'ach'>('usdc');
  const [walletAddress, setWalletAddress] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Sign in to access withdrawals</p>
        <Link href="/auth/login" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const available = 142.5;
  const pending = 28.75;
  const lifetime = 1247.3;
  const fee = method === 'usdc' ? 0 : 2.5;
  const minWithdrawal = 25.0;

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount >= minWithdrawal && parsedAmount <= available;

  const handleWithdraw = () => {
    if (!isValid) return;
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    toast(`Withdrawal of $${parsedAmount.toFixed(2)} initiated via ${method === 'usdc' ? 'USDC' : 'ACH'}`, 'success');
    setShowConfirm(false);
    setAmount('');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-black mb-8">Withdraw Earnings</h1>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <BalanceCard label="Available Balance" value={`$${available.toFixed(2)}`} accent />
          <BalanceCard label="Pending" value={`$${pending.toFixed(2)}`} />
          <BalanceCard label="Lifetime Earned" value={`$${lifetime.toFixed(2)}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Withdrawal form */}
          <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6">
            <h2 className="text-lg font-bold mb-6">New Withdrawal</h2>

            {/* Amount */}
            <label className="block text-sm text-gray-400 mb-2">Amount (USD)</label>
            <div className="relative mb-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setShowConfirm(false); }}
                placeholder="0.00"
                min={minWithdrawal}
                max={available}
                step="0.01"
                className="w-full pl-8 pr-4 py-3 bg-brand-950 border border-brand-800/40 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition"
              />
            </div>
            <p className="text-xs text-gray-500 mb-6">Minimum withdrawal: ${minWithdrawal.toFixed(2)}</p>

            {/* Method selection */}
            <label className="block text-sm text-gray-400 mb-2">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => { setMethod('usdc'); setShowConfirm(false); }}
                className={`p-4 rounded-xl border text-left transition ${
                  method === 'usdc'
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-brand-800/30 bg-brand-950 hover:border-brand-700'
                }`}
              >
                <p className="font-semibold text-sm text-white">USDC</p>
                <p className="text-xs text-gray-500 mt-1">Polygon wallet</p>
                <p className="text-xs text-green-400 mt-1">Fee: $0.00</p>
              </button>
              <button
                onClick={() => { setMethod('ach'); setShowConfirm(false); }}
                className={`p-4 rounded-xl border text-left transition ${
                  method === 'ach'
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-brand-800/30 bg-brand-950 hover:border-brand-700'
                }`}
              >
                <p className="font-semibold text-sm text-white">Bank Transfer</p>
                <p className="text-xs text-gray-500 mt-1">ACH (US only)</p>
                <p className="text-xs text-yellow-400 mt-1">Fee: $2.50</p>
              </button>
            </div>

            {/* Conditional fields */}
            {method === 'usdc' ? (
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Polygon Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-brand-950 border border-brand-800/40 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition font-mono text-sm"
                />
              </div>
            ) : (
              <div className="mb-6 space-y-3">
                <label className="block text-sm text-gray-400 mb-2">Bank Details</label>
                <input
                  type="text"
                  placeholder="Account holder name"
                  className="w-full px-4 py-3 bg-brand-950 border border-brand-800/40 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition text-sm"
                />
                <input
                  type="text"
                  placeholder="Routing number"
                  className="w-full px-4 py-3 bg-brand-950 border border-brand-800/40 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition text-sm"
                />
                <input
                  type="text"
                  placeholder="Account number"
                  className="w-full px-4 py-3 bg-brand-950 border border-brand-800/40 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition text-sm"
                />
              </div>
            )}

            {/* Fee summary */}
            {parsedAmount > 0 && (
              <div className="bg-brand-950 rounded-xl p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Amount</span>
                  <span>${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Fee</span>
                  <span>${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold border-t border-brand-800/30 pt-2">
                  <span>You receive</span>
                  <span>${(parsedAmount - fee).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Confirm / Withdraw */}
            {showConfirm && (
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 mb-4 text-sm text-red-300">
                Confirm withdrawal of <strong>${parsedAmount.toFixed(2)}</strong> via{' '}
                {method === 'usdc' ? 'USDC to Polygon' : 'ACH bank transfer'}? Click again to confirm.
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={!isValid}
              className={`w-full py-3 rounded-full font-semibold transition ${
                isValid
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-brand-800/40 text-gray-600 cursor-not-allowed'
              }`}
            >
              {showConfirm ? 'Confirm Withdrawal' : 'Withdraw'}
            </button>
          </div>

          {/* Info panel */}
          <div className="space-y-6">
            <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 text-lg">&#x2713;</span>
                <span className="text-sm font-semibold text-green-400">All payouts verified on Polygon</span>
              </div>
              <p className="text-xs text-gray-500">
                Every USDC withdrawal is settled on the Polygon network. You can verify
                transactions using the tx hash provided below.
              </p>
            </div>

            <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Withdrawal Info
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>USDC withdrawals are processed within 24 hours</li>
                <li>ACH transfers take 3-5 business days</li>
                <li>Minimum withdrawal amount is $25.00</li>
                <li>USDC withdrawals have zero fees</li>
                <li>ACH transfers carry a $2.50 processing fee</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent withdrawals table */}
        <div className="bg-[#15151f] rounded-2xl border border-brand-800/30 p-6">
          <h2 className="text-lg font-bold mb-6">Recent Withdrawals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-brand-800/30">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_WITHDRAWALS.map((w) => (
                  <tr key={w.id} className="border-b border-brand-800/20 last:border-0">
                    <td className="py-3 text-gray-300">{w.date}</td>
                    <td className="py-3 text-white font-medium">${w.amount.toFixed(2)}</td>
                    <td className="py-3 text-gray-300">{w.method}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          w.status === 'completed'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 font-mono text-xs">
                      {w.txHash ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${
      accent
        ? 'bg-red-600/10 border-red-600/30'
        : 'bg-[#15151f] border-brand-800/30'
    }`}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
