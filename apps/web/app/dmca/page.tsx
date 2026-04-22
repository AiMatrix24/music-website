'use client';

import Link from 'next/link';

export default function DMCAPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block no-underline">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Copyright &amp; DMCA Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 27, 2026</p>

        <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
          {/* 1 */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Our Commitment to Copyright</h2>
            <p>
              OPYNX respects the intellectual property rights of creators, creators, and all rights
              holders. We are committed to complying with the Digital Millennium Copyright Act
              (DMCA) and other applicable copyright laws. We expect all users of our platform to
              respect these rights as well.
            </p>
            <p className="mt-2">
              As a platform built on the principle of empowering creators, we take copyright
              infringement seriously and will respond promptly to valid takedown notices.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. How to File a DMCA Takedown Notice</h2>
            <p className="mb-3">
              If you believe that content hosted on OPYNX infringes your copyright, you may submit
              a DMCA takedown notice to our designated agent. Your notice must include the following:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>
                <span className="text-white font-semibold">Identification of the copyrighted work</span> &mdash;
                A description of the copyrighted work you claim has been infringed, or a representative
                list if multiple works are involved.
              </li>
              <li>
                <span className="text-white font-semibold">Identification of the infringing material</span> &mdash;
                The URL(s) or other specific identification of the material you claim is infringing,
                with enough detail for us to locate it on the platform.
              </li>
              <li>
                <span className="text-white font-semibold">Your contact information</span> &mdash;
                Your full legal name, mailing address, telephone number, and email address.
              </li>
              <li>
                <span className="text-white font-semibold">Good faith statement</span> &mdash;
                A statement that you have a good faith belief that use of the material in the manner
                complained of is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                <span className="text-white font-semibold">Accuracy statement</span> &mdash;
                A statement, made under penalty of perjury, that the information in the notification
                is accurate and that you are the copyright owner or authorized to act on behalf of
                the copyright owner.
              </li>
              <li>
                <span className="text-white font-semibold">Signature</span> &mdash;
                A physical or electronic signature of the copyright owner or a person authorized to
                act on their behalf.
              </li>
            </ol>
          </div>

          {/* 3 */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. Counter-Notification Process</h2>
            <p className="mb-3">
              If you believe your content was removed in error or is not infringing, you may file a
              counter-notification. Your counter-notification must include:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Identification of the material that was removed and its location before removal.</li>
              <li>
                A statement under penalty of perjury that you have a good faith belief the material
                was removed or disabled as a result of mistake or misidentification.
              </li>
              <li>Your name, address, telephone number, and email address.</li>
              <li>
                A statement that you consent to the jurisdiction of the federal district court for
                the judicial district in which your address is located, and that you will accept
                service of process from the person who provided the original DMCA notification.
              </li>
              <li>Your physical or electronic signature.</li>
            </ol>
            <p className="mt-3">
              Upon receiving a valid counter-notification, OPYNX will forward it to the original
              complainant. If the complainant does not file a court action within 10&ndash;14
              business days, we will restore the removed content.
            </p>
          </div>

          {/* 4 */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Repeat Infringer Policy</h2>
            <p>
              OPYNX maintains a strict repeat infringer policy. Users who repeatedly upload
              infringing content will face escalating consequences:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-300">
              <li><span className="text-white font-semibold">First offense:</span> Content removal and written warning.</li>
              <li><span className="text-white font-semibold">Second offense:</span> Content removal, 30-day upload restriction, and final warning.</li>
              <li><span className="text-white font-semibold">Third offense:</span> Permanent account termination and forfeiture of pending revenue.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to terminate any account at any time for egregious or willful
              copyright infringement, even on a first offense.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. Content ID System</h2>
            <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-4">
              <span className="inline-block bg-red-600/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded mb-2">
                Coming Soon
              </span>
              <p>
                OPYNX is developing an automated Content ID system that will scan uploaded audio
                against a database of registered works. This system will help identify potential
                copyright issues before content goes live, protecting both rights holders and
                uploading creators.
              </p>
              <p className="mt-2">
                Rights holders will be able to register their catalogs with our Content ID system
                to receive automated notifications and choose how matches are handled (block,
                monetize, or allow).
              </p>
            </div>
          </div>

          {/* 6 */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Contact</h2>
            <p>
              To submit a DMCA takedown notice, counter-notification, or any copyright-related
              inquiry, please contact our designated DMCA agent:
            </p>
            <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-4 mt-3">
              <p className="text-white font-semibold">OPYNX DMCA Agent</p>
              <p className="mt-1">
                Email:{' '}
                <a href="mailto:dmca@opynx.com" className="text-red-400 hover:text-red-300 transition">
                  dmca@opynx.com
                </a>
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Please include &quot;DMCA&quot; in the subject line for fastest processing.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
