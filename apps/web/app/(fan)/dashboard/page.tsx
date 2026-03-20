export default function FanDashboard() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashCard title="Subscriptions" value="—" />
        <DashCard title="Tickets" value="—" />
        <DashCard title="Library" value="—" />
      </div>
      <div className="mt-8 rounded-2xl bg-[#15151f] p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <p className="text-gray-500">No activity yet. Subscribe to an artist to get started.</p>
      </div>
    </div>
  );
}

function DashCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
