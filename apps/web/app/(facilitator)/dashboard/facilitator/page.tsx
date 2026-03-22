'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function FacilitatorDashboard() {
  const { data: session, status } = useSession();
  const referrals = trpc.attribution.getMyReferrals.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to access Facilitator Dashboard</h1>
          <Link
            href="/auth/login"
            className="rounded-full bg-brand-600 px-8 py-3 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const scanCount = referrals.data?.length ?? 0;
  const attributedSubs = referrals.data?.filter((r) => r.subscriptionId).length ?? 0;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Facilitator <span className="text-brand-500">Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Scans" value={String(scanCount)} />
        <StatCard label="Attributed Subs" value={String(attributedSubs)} />
        <StatCard label="Earned (This Month)" value="$0.00" />
        <StatCard label="Current Tier" value="Silver" />
      </div>

      <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Tier Progression</h2>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-gray-400">Silver ($0.25)</span>
          <div className="flex-1 h-2 bg-brand-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${Math.min((attributedSubs / 50) * 100, 100)}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">Gold ($0.35)</span>
        </div>
        <p className="text-xs text-gray-500">
          {attributedSubs >= 50
            ? 'Gold tier reached!'
            : `Convert ${50 - attributedSubs} more subscribers to reach Gold tier`}
        </p>
      </div>

      <div className="rounded-2xl bg-[#15151f] p-6">
        <h2 className="text-xl font-bold mb-4">Live Event Mode</h2>
        <p className="text-gray-500">
          No active events. When you&apos;re assigned to an event, real-time scan counts will appear here.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
