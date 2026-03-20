export default function ArtistDashboard() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Artist <span className="text-brand-500">Dashboard</span>
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard label="Total Earned" value="$0.00" sub="All time" />
        <SummaryCard label="Active Subscribers" value="0" sub="Current" />
        <SummaryCard label="This Month" value="$0.00" sub="Pending + Paid" />
        <SummaryCard label="Churn Rate" value="0%" sub="30-day" />
      </div>

      {/* Upload Section */}
      <div className="rounded-2xl bg-[#15151f] p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Upload Music</h2>
        <div className="border-2 border-dashed border-brand-700/30 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">Drag and drop audio files here, or click to browse</p>
          <button className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white">
            Select Files
          </button>
          <p className="text-xs text-gray-500 mt-3">MP3, WAV, FLAC — Max 100MB per file</p>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-2xl bg-[#15151f] p-6">
        <h2 className="text-xl font-bold mb-4">Subscribers</h2>
        <p className="text-gray-500">No subscribers yet. Share your artist page to get started.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
