'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/components/Toast';

const CONTRACT_ADDRESS = '0x7a3B...f2e1';
const FULL_CONTRACT = '0x7a3B8c9D4e5F6a7B8c9D4e5F6a7B8c9D4ef2e1';

const PAYOUTS = [
  { date: '2026-03-27', creator: 'Cipher', amount: '1,245.00', txHash: '0x1a2b3c...9f8e7d', fullHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f9f8e7d', status: 'confirmed' },
  { date: '2026-03-26', creator: 'NeonWave', amount: '892.50', txHash: '0x2b3c4d...8e7d6c', fullHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f8e7d6c', status: 'confirmed' },
  { date: '2026-03-25', creator: 'BeatDropper', amount: '2,150.75', txHash: '0x3c4d5e...7d6c5b', fullHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f7d6c5b', status: 'confirmed' },
  { date: '2026-03-24', creator: 'VoxQueen', amount: '567.25', txHash: '0x4d5e6f...6c5b4a', fullHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f6c5b4a', status: 'confirmed' },
  { date: '2026-03-23', creator: 'SynthLord', amount: '1,890.00', txHash: '0x5e6f7a...5b4a39', fullHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f5b4a39', status: 'confirmed' },
  { date: '2026-03-22', creator: 'IndieStar', amount: '445.50', txHash: '0x6f7a8b...4a3928', fullHash: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f4a3928', status: 'confirmed' },
  { date: '2026-03-21', creator: 'ChillProducer', amount: '3,200.00', txHash: '0x7a8b9c...392817', fullHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f392817', status: 'confirmed' },
  { date: '2026-03-20', creator: 'LoopMaster', amount: '780.00', txHash: '0x8b9c0d...281706', fullHash: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f281706', status: 'confirmed' },
];

const STEPS = [
  { icon: '1', title: 'Fan Subscribes', desc: 'A fan subscribes to an creator or purchases content on OPYNX' },
  { icon: '2', title: 'Smart Contract Splits', desc: 'Payment is automatically split according to the on-chain agreement' },
  { icon: '3', title: 'Creator Receives USDC', desc: 'Creator receives their share directly in USDC on Polygon' },
  { icon: '4', title: 'Verified on Polygon', desc: 'Every transaction is publicly verifiable on the Polygon blockchain' },
];

export default function BlockchainPage() {
  const { toast } = useToast();
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<null | {
    from: string; to: string; amount: string; block: string; timestamp: string;
  }>(null);
  const [verifying, setVerifying] = useState(false);
  const [counter, setCounter] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const TARGET = 127450;

  useEffect(() => {
    setLoaded(true);
    const duration = 2000;
    const steps = 60;
    const increment = TARGET / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= TARGET) {
        setCounter(TARGET);
        clearInterval(interval);
      } else {
        setCounter(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard', 'success');
  };

  const handleVerify = () => {
    if (!verifyHash.trim()) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifyResult({
        from: '0x7a3B...f2e1',
        to: '0x9c4D...a1b2',
        amount: '1,245.00 USDC',
        block: '54,892,103',
        timestamp: '2026-03-27 14:32:05 UTC',
      });
      setVerifying(false);
    }, 1500);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-brand-800/30 rounded-xl w-2/3" />
            <div className="h-64 bg-brand-800/30 rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-brand-800/30 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-purple-600/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            On-Chain <span className="text-red-500">Transparency</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every payout on OPYNX is processed through smart contracts on the Polygon network. Verify any transaction, anytime.
          </p>
        </div>

        {/* Animated Counter */}
        <div className="text-center mb-12">
          <div className="inline-block bg-[#15151f] border border-brand-800/30 rounded-2xl px-10 py-6">
            <p className="text-sm text-gray-400 mb-2">Total USDC Distributed</p>
            <p className="text-4xl md:text-5xl font-black text-green-400 tabular-nums">
              ${counter.toLocaleString()}.00
            </p>
          </div>
        </div>

        {/* Contract Address */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 mb-8">
          <p className="text-sm text-gray-400 mb-2">Smart Contract Address</p>
          <div className="flex items-center gap-3">
            <code className="text-lg md:text-xl font-mono text-purple-400 break-all">{FULL_CONTRACT}</code>
            <button
              onClick={() => copyToClipboard(FULL_CONTRACT)}
              className="shrink-0 p-2 rounded-lg bg-brand-800/30 hover:bg-brand-800/50 text-gray-400 hover:text-white transition"
              aria-label="Copy contract address"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Payouts', value: '2,847', color: 'text-green-400' },
            { label: 'Creators Paid', value: '412', color: 'text-purple-400' },
            { label: 'Average Payout', value: '$44.78', color: 'text-blue-400' },
            { label: 'Contract Version', value: 'v2.4.1', color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#15151f] border border-brand-800/30 rounded-xl p-5">
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Payouts Table */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-brand-800/20">
            <h2 className="text-xl font-bold">Recent On-Chain Payouts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-brand-800/20">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Creator</th>
                  <th className="px-6 py-3 font-medium">Amount (USDC)</th>
                  <th className="px-6 py-3 font-medium">Tx Hash</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {PAYOUTS.map((p, i) => (
                  <tr key={i} className="border-b border-brand-800/10 hover:bg-brand-800/10 transition">
                    <td className="px-6 py-4 text-sm text-gray-300">{p.date}</td>
                    <td className="px-6 py-4 text-sm font-medium">{p.creator}</td>
                    <td className="px-6 py-4 text-sm text-green-400 font-mono">${p.amount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-purple-400 font-mono">{p.txHash}</code>
                        <button
                          onClick={() => copyToClipboard(p.fullHash)}
                          className="p-1 rounded hover:bg-brand-800/30 text-gray-500 hover:text-white transition"
                          aria-label="Copy transaction hash"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verify Transaction */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">Verify Any Transaction</h2>
          <p className="text-gray-400 text-sm mb-4">Paste a transaction hash to verify it on the Polygon network.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-brand-950 border border-brand-800/30 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-red-500/50 font-mono text-sm"
            />
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {verifyResult && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'From', value: verifyResult.from },
                { label: 'To', value: verifyResult.to },
                { label: 'Amount', value: verifyResult.amount },
                { label: 'Block', value: verifyResult.block },
                { label: 'Timestamp', value: verifyResult.timestamp },
              ].map((item) => (
                <div key={item.label} className="bg-brand-950 rounded-xl p-4 border border-brand-800/20">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-mono text-gray-200">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-[#15151f] border border-brand-800/30 rounded-2xl p-6 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PolygonScan Link */}
        <div className="text-center">
          <a
            href="https://polygonscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition"
          >
            View on PolygonScan
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
