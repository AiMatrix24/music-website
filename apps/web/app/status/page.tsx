'use client';

import Link from 'next/link';
import { useState } from 'react';

const services = [
  { name: 'Web App', status: 'operational', uptime: '99.98%', responseTime: '45ms' },
  { name: 'API', status: 'operational', uptime: '99.95%', responseTime: '62ms' },
  { name: 'Database', status: 'operational', uptime: '99.99%', responseTime: '12ms' },
  { name: 'CDN / Streaming', status: 'operational', uptime: '99.97%', responseTime: '28ms' },
  { name: 'Payment Processing', status: 'operational', uptime: '99.93%', responseTime: '180ms' },
  { name: 'Blockchain (Polygon)', status: 'operational', uptime: '99.91%', responseTime: '230ms' },
];

// Mock 30-day uptime data: 0 = operational, 1 = degraded, 2 = outage
const uptimeHistory: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 2, 0, 0, 0, 0, 0,
];

const incidents = [
  {
    date: 'March 24, 2026',
    title: 'Elevated API Latency',
    status: 'Resolved',
    description:
      'Our API experienced elevated response times between 2:15 PM and 3:42 PM UTC due to a database connection pool exhaustion. A configuration update resolved the issue. No data loss occurred.',
  },
  {
    date: 'March 18, 2026',
    title: 'CDN Streaming Degradation',
    status: 'Resolved',
    description:
      'Users in the EU region experienced buffering issues on audio streams from 10:00 AM to 11:20 AM UTC. The issue was traced to a misconfigured edge node that was taken out of rotation and replaced.',
  },
  {
    date: 'March 5, 2026',
    title: 'Blockchain Sync Delay',
    status: 'Resolved',
    description:
      'Polygon RPC provider experienced intermittent connectivity, causing a 45-minute delay in on-chain payout confirmations. Failover to backup provider restored normal operation.',
  },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    operational: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Operational' },
    degraded: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Degraded' },
    outage: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Outage' },
  };
  const c = config[status] ?? config.operational;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'operational' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
      {c.label}
    </span>
  );
}

export default function StatusPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <h1 className="text-3xl font-black">System Status</h1>
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold px-4 py-2 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            All Systems Operational
          </span>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {services.map((svc) => (
            <div key={svc.name} className="bg-[#15151f] border border-brand-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">{svc.name}</h3>
                <StatusBadge status={svc.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Uptime: <span className="text-gray-200 font-semibold">{svc.uptime}</span></span>
                <span>Response: <span className="text-gray-200 font-semibold">{svc.responseTime}</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Uptime History */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Uptime &mdash; Last 30 Days</h2>
          <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-4">
            <div className="flex items-center gap-1">
              {uptimeHistory.map((day, i) => (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-sm ${
                    day === 0
                      ? 'bg-green-500'
                      : day === 1
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  title={`Day ${i + 1}: ${day === 0 ? 'Operational' : day === 1 ? 'Degraded' : 'Outage'}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>30 days ago</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-green-500" /> Operational
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-yellow-500" /> Degraded
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-red-500" /> Outage
                </span>
              </div>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Recent Incidents</h2>
          <div className="space-y-4">
            {incidents.map((inc) => (
              <div key={inc.title} className="bg-[#15151f] border border-brand-800/30 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{inc.date}</span>
                    <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                      {inc.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{inc.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe */}
        <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-2">Get Notified</h2>
          <p className="text-sm text-gray-400 mb-4">
            Subscribe to receive email notifications when there are status changes or scheduled
            maintenance windows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-brand-950 border border-brand-800/50 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition"
            />
            <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6 py-2 rounded-lg transition">
              Subscribe
            </button>
          </div>
        </div>

        {/* Last checked */}
        <p className="text-xs text-gray-600 mt-6 text-center">
          Last checked: March 27, 2026 at 4:00 PM UTC
        </p>
      </div>
    </div>
  );
}
