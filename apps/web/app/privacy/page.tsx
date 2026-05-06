import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block no-underline">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-2">Last updated: March 22, 2026</p>

        <div className="rounded-2xl bg-yellow-950/20 border border-yellow-700/30 p-4 mb-8 not-prose">
          <p className="font-bold text-yellow-400 text-sm mb-1">⚠ Draft — pending legal review</p>
          <p className="text-xs text-yellow-200/80">
            This policy is a working draft and has not yet been reviewed by qualified counsel. The final policy will be posted before public launch. Email <a href="mailto:privacy@opynx.com" className="underline">privacy@opynx.com</a> with privacy questions in the meantime.
          </p>
        </div>

        <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly: name, email address, and profile data
              when you create an account via OAuth (Discord, Twitter/X, or Twitch). We also
              collect usage data including listening history, search queries, and device information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>
              We use your information to: provide and improve the Platform; process subscriptions
              and payments; personalize your experience; send service-related communications;
              calculate revenue attribution for creators and facilitators.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. On-Chain Data</h2>
            <p>
              Revenue distribution data is recorded on the Polygon blockchain for transparency.
              This includes payout amounts and wallet addresses but does not include personally
              identifiable information. On-chain transactions are public and immutable.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Location Data</h2>
            <p>
              When you scan a QR code at a venue, we collect approximate geolocation data to
              verify facilitator attribution. This data is used solely for payout verification
              and is not sold to third parties. You can disable location access in your device settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We share data with: payment processors
              (Helio, Samiteon) to process transactions; OAuth providers for authentication;
              and as required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Security</h2>
            <p>
              We use industry-standard encryption and security measures to protect your data.
              Passwords are never stored in plain text. All API communications use HTTPS.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data by
              contacting us. You may also export your data at any time from your account settings.
              California residents have additional rights under the CCPA.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use
              third-party tracking cookies. Analytics are privacy-respecting and anonymized.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">9. Contact</h2>
            <p>
              Privacy questions? Contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@opynx.dev" className="text-brand-400 hover:text-brand-300">
                privacy@opynx.dev
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
