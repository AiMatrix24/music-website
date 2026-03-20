import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/30 via-brand-950 to-brand-950" />
        <div className="relative z-10 text-center px-6">
          <p className="text-sm font-semibold uppercase tracking-[4px] text-brand-500 mb-4">
            The FanEngage Protocol
          </p>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Music. <span className="text-brand-500">Direct.</span>
            <br />
            No Middlemen.
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto mb-10">
            Subscribe directly to artists for $8.73/month. Every dollar is
            transparent, on-chain, and verifiable. Zero app store tax.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/subscribe"
              className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-8 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-600/30"
            >
              Start Listening — $8.73/mo
            </Link>
            <Link
              href="/scan"
              className="rounded-full border-2 border-white/20 px-8 py-4 font-semibold text-white transition hover:border-brand-500 hover:text-brand-400"
            >
              Scan QR Code
            </Link>
          </div>
        </div>
      </section>

      {/* Revenue Transparency Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Where Your <span className="text-brand-500">$8.73</span> Goes
          </h2>
          <p className="text-gray-400 mb-16 max-w-xl mx-auto">
            Full transparency. Every cent accounted for. Verified on Polygon.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WaterfallCard
              amount="$1.00"
              label="Creator"
              description="Direct to the artist. Always. Never reduced."
              color="from-purple-500 to-indigo-500"
            />
            <WaterfallCard
              amount="$0.25–$0.50"
              label="Facilitator"
              description="Venue staff who connected you. Geo-verified."
              color="from-pink-500 to-rose-500"
            />
            <WaterfallCard
              amount="$7.20"
              label="Platform"
              description="Infrastructure, CDN, support, and growth."
              color="from-blue-500 to-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-brand-950/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Built for <span className="text-brand-500">Superfans</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="320kbps Streaming"
              description="Premium quality audio. No ads. Unlimited skips."
            />
            <FeatureCard
              title="Exclusive Content"
              description="Voice memos, demos, and behind-the-scenes access."
            />
            <FeatureCard
              title="Pre-Sale Tickets"
              description="Priority access to Ticketmaster and AXS events."
            />
            <FeatureCard
              title="Merch Discounts"
              description="10-15% off on artist merchandise."
            />
            <FeatureCard
              title="On-Chain Payouts"
              description="Every payout verifiable on Polygon. No black box."
            />
            <FeatureCard
              title="No App Store"
              description="PWA. Install directly. Zero percent app store tax."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-800/30 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            &copy; 2026 OPYNX. FanEngage Protocol. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-brand-400 transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-brand-400 transition">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-brand-400 transition">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function WaterfallCard({
  amount,
  label,
  description,
  color,
}: {
  amount: string;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-8 text-center transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`inline-block bg-gradient-to-r ${color} bg-clip-text text-transparent text-4xl font-black mb-2`}
      >
        {amount}
      </div>
      <h3 className="text-xl font-bold mb-2">{label}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/20">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
