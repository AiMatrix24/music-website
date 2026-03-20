export default function FacilitatorDashboard() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Facilitator <span className="text-brand-500">Dashboard</span>
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Scans" value="0" />
        <StatCard label="Attributed Subs" value="0" />
        <StatCard label="Earned (This Month)" value="$0.00" />
        <StatCard label="Current Tier" value="Silver" />
      </div>

      {/* Tier Progression */}
      <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Tier Progression</h2>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-gray-400">Silver ($0.25)</span>
          <div className="flex-1 h-2 bg-brand-950 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full w-0" />
          </div>
          <span className="text-sm text-gray-400">Gold ($0.35)</span>
        </div>
        <p className="text-xs text-gray-500">Convert 50 subscribers to reach Gold tier</p>
      </div>

      {/* Live Event Mode Placeholder */}
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
