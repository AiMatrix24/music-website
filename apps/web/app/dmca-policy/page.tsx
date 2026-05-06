import Link from 'next/link';

/**
 * DMCA / copyright policy stub. Plain-language overview of how takedowns
 * work + designated agent placeholder. Final text needs counsel review;
 * the registered designated agent info goes in once the US Copyright
 * Office registration is filed.
 */
export default function DmcaPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block no-underline">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Copyright + DMCA Policy</h1>
        <p className="text-sm text-gray-500 mb-2">Last updated: May 3, 2026</p>

        <div className="rounded-2xl bg-yellow-950/20 border border-yellow-700/30 p-4 mb-8 not-prose">
          <p className="font-bold text-yellow-400 text-sm mb-1">⚠ Draft — pending legal review</p>
          <p className="text-xs text-yellow-200/80">
            This policy is a working draft. Designated agent registration with the US Copyright Office is in progress; the final agent contact information will replace the placeholder below before public launch.
          </p>
        </div>

        <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Our position</h2>
            <p>
              OPYNX respects intellectual property rights. We host content uploaded by creators
              and rely on those creators to confirm at upload time that they own all rights to
              their submissions. When a rights holder believes their work has been infringed
              on the platform, we accept and act on takedown notices in line with the Digital
              Millennium Copyright Act, 17 U.S.C. § 512.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How to file a takedown notice</h2>
            <p>
              File a takedown notice via our <Link href="/dmca" className="text-red-400 hover:underline">online DMCA form</Link>.
              The form collects all the information required by 17 U.S.C. § 512(c)(3)(A), including
              your contact information, the work you allege has been infringed, the URL of the
              infringing material, and the sworn statements required by the statute.
            </p>
            <p>
              You may also send a written notice by email or mail to our designated agent (see below).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">What happens after you file</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We acknowledge receipt of every valid notice.</li>
              <li>Our team reviews the notice within 48 hours during business days.</li>
              <li>If the notice is facially valid and the content appears infringing, we hide
                the content from the platform and notify the uploader. The uploader may file a
                counter-notice (currently by email — a self-service flow is coming).</li>
              <li>Repeat infringers — defined as users with three or more upheld takedowns —
                have their accounts suspended in line with our repeat-infringer policy.</li>
              <li>Knowingly false statements made under penalty of perjury can subject the
                claimant to liability under § 512(f).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Counter-notices</h2>
            <p>
              If you believe content of yours was taken down by mistake or misidentification,
              you may file a counter-notice by emailing the address below with "DMCA counter-notice"
              in the subject line. A self-service counter-notice form is in development.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Designated agent</h2>
            <div className="rounded-xl bg-[#15151f] border border-brand-800/30 p-4 not-prose">
              <p className="text-sm text-gray-400 mb-2">
                <span className="text-yellow-400 font-bold">Placeholder</span> — registration with the US Copyright Office Designated Agent Directory is pending.
              </p>
              <p className="text-sm">DMCA Agent — OPYNX</p>
              <p className="text-sm">Email: <a href="mailto:dmca@opynx.com" className="text-red-400 hover:underline">dmca@opynx.com</a></p>
              <p className="text-xs text-gray-500 mt-2">Mailing address will be posted once designated agent registration is finalized.</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Repeat-infringer policy</h2>
            <p>
              Per § 512(i)(1)(A), we maintain a policy that provides for the termination of
              users who are repeat infringers. Three upheld DMCA takedowns within the lifetime
              of the account result in account suspension. Suspensions can be lifted by writing
              to <a href="mailto:appeals@opynx.com" className="text-red-400 hover:underline">appeals@opynx.com</a> with the relevant notice IDs.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
