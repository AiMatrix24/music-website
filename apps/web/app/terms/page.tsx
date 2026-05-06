import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block no-underline">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-2">Last updated: March 22, 2026</p>

        <div className="rounded-2xl bg-yellow-950/20 border border-yellow-700/30 p-4 mb-8 not-prose">
          <p className="font-bold text-yellow-400 text-sm mb-1">⚠ Draft — pending legal review</p>
          <p className="text-xs text-yellow-200/80">
            This document is a working draft and has not yet been reviewed by qualified counsel. It does not constitute a binding agreement until finalized. Final terms will be posted before public launch.
          </p>
        </div>

        <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using OPYNX (&quot;the Platform&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              OPYNX is a direct-to-fan music platform that enables creators to distribute music,
              sell tickets, and connect with fans through transparent, on-chain revenue sharing.
              The Platform operates on the FanEngage Protocol.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible
              for maintaining the security of your account credentials. You must be at least 13
              years of age to use the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Subscriptions & Payments</h2>
            <p>
              Subscription fees are billed monthly or annually as selected. Payments are processed
              through Helio (USDC on Polygon) or Samiteon (fiat). Refunds follow a 5-day grace
              period policy on each renewal. Revenue distribution is transparent and verifiable
              on-chain.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. Content & Intellectual Property</h2>
            <p>
              Creators retain full ownership of their content. By uploading content to the Platform,
              creators grant OPYNX a non-exclusive license to distribute, display, and stream the
              content to subscribers. Users may not reproduce, distribute, or create derivative works
              from content without creator authorization.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Marketplace</h2>
            <p>
              The OPYNX Marketplace allows creators and users to list physical goods, digital items,
              services, and used gear. Sellers are responsible for fulfilling orders accurately and
              in a timely manner. OPYNX is not responsible for the quality of third-party goods.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">7. Prohibited Conduct</h2>
            <p>
              Users may not: upload infringing or illegal content; manipulate play counts or
              engagement metrics; impersonate other users; use automated tools to scrape content;
              or engage in any activity that disrupts the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              OPYNX is provided &quot;as is&quot; without warranties of any kind. We are not liable
              for any indirect, incidental, or consequential damages arising from your use of the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">9. Contact</h2>
            <p>
              Questions about these terms? Contact us at{' '}
              <a href="mailto:legal@opynx.dev" className="text-brand-400 hover:text-brand-300">
                legal@opynx.dev
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
