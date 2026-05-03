'use client';

export function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="rounded-2xl bg-[#15151f] border border-brand-800/20 p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-2">Welcome to OPYNX</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Direct-to-fan music. Your audience subscribes to you, you keep 85%, on-chain on Polygon.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <Highlight icon="🎵" title="Upload your catalog" body="Drop in up to 10 tracks at once on the next step." />
        <Highlight icon="📱" title="One QR code, anywhere" body="Print it on your merch, posters, business cards. Fans scan → subscribe in two taps." />
        <Highlight icon="💵" title="$8.73/mo per fan, 85% to you" body="USDC on Polygon. No middlemen, no monthly minimums, no payout delays." />
        <Highlight icon="🎤" title="Events + tickets too" body="QR-scan ticket entry, geofenced check-in, no third-party ticketing fees." />
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-full bg-red-600 hover:bg-red-500 px-5 py-3 text-base font-bold text-white transition"
      >
        Let's set you up →
      </button>
    </div>
  );
}

function Highlight({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-950/40">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{body}</p>
      </div>
    </div>
  );
}
