'use client';

import Link from 'next/link';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition mb-8 inline-block no-underline">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black mb-2">Accessibility Statement</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 27, 2026</p>

        <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
          {/* Commitment */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Our Commitment</h2>
            <p>
              OPYNX is committed to ensuring digital accessibility for people of all abilities.
              We are continually improving the user experience for everyone and applying the
              relevant accessibility standards to guarantee we provide equal access to all users.
            </p>
            <p className="mt-2">
              Our goal is to conform to the{' '}
              <span className="text-white font-semibold">Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</span>{' '}
              standards. These guidelines explain how to make web content more accessible to people
              with a wide range of disabilities.
            </p>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Accessibility Features</h2>
            <p className="mb-3">
              We have implemented the following accessibility features across the OPYNX platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                <span className="text-white font-semibold">Keyboard Navigation</span> &mdash;
                All interactive elements are accessible via keyboard. Users can navigate the
                entire platform without a mouse using Tab, Enter, Space, and arrow keys.
              </li>
              <li>
                <span className="text-white font-semibold">Screen Reader Support</span> &mdash;
                Semantic HTML, ARIA labels, and landmark regions are used throughout to ensure
                compatibility with assistive technologies including NVDA, JAWS, and VoiceOver.
              </li>
              <li>
                <span className="text-white font-semibold">Focus Indicators</span> &mdash;
                Visible focus outlines are provided on all interactive elements to help keyboard
                users track their position on the page.
              </li>
              <li>
                <span className="text-white font-semibold">Color Contrast</span> &mdash;
                Text and interactive elements meet WCAG AA minimum contrast ratios (4.5:1 for
                normal text, 3:1 for large text) against background colors.
              </li>
              <li>
                <span className="text-white font-semibold">Skip Navigation</span> &mdash;
                Skip-to-content links are available to allow users to bypass repetitive navigation
                and jump directly to main content.
              </li>
              <li>
                <span className="text-white font-semibold">Responsive Design</span> &mdash;
                The platform is fully responsive and functions correctly across all screen sizes,
                supporting zoom up to 200% without loss of content or functionality.
              </li>
              <li>
                <span className="text-white font-semibold">Reduced Motion Support</span> &mdash;
                Animations and transitions respect the{' '}
                <code className="text-red-400 bg-brand-900/50 px-1 rounded text-xs">prefers-reduced-motion</code>{' '}
                media query, allowing users who are sensitive to motion to have a comfortable experience.
              </li>
            </ul>
          </div>

          {/* Known Limitations */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Known Limitations</h2>
            <p className="mb-3">
              Despite our best efforts, some areas of the platform are still being improved for
              accessibility:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>The audio waveform visualizer in the music player does not yet have a full text alternative.</li>
              <li>Some older embedded content from third-party sources may not meet all accessibility standards.</li>
              <li>Live streaming chat may have limited screen reader support during high-volume periods.</li>
              <li>Certain data visualizations in the creator analytics dashboard are being updated with better alt text and data tables.</li>
              <li>PDF documents (receipts, contracts) are being converted to accessible formats.</li>
            </ul>
            <p className="mt-2">
              We are actively working to resolve these issues and expect improvements in upcoming releases.
            </p>
          </div>

          {/* Feedback */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of OPYNX. If you encounter any
              accessibility barriers or have suggestions for improvement, please let us know:
            </p>
            <div className="bg-[#15151f] border border-brand-800/30 rounded-lg p-4 mt-3 space-y-2">
              <p>
                <span className="text-white font-semibold">Email:</span>{' '}
                <a href="mailto:accessibility@opynx.com" className="text-red-400 hover:text-red-300 transition">
                  accessibility@opynx.com
                </a>
              </p>
              <p>
                <span className="text-white font-semibold">Feedback Form:</span>{' '}
                <Link href="/contact" className="text-red-400 hover:text-red-300 transition">
                  Contact Us
                </Link>
              </p>
            </div>
            <p className="mt-3">
              We aim to respond to accessibility feedback within 2 business days and to resolve
              reported issues within 10 business days where possible.
            </p>
          </div>

          {/* Third-Party Content */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party Content</h2>
            <p>
              OPYNX hosts user-uploaded content including audio, images, and text. While we provide
              tools and guidelines for creators to make their content accessible (such as alt text
              fields for images and transcript uploads for audio), we cannot guarantee that all
              user-generated content meets accessibility standards.
            </p>
            <p className="mt-2">
              We encourage all creators on the platform to make their content as accessible as
              possible and provide resources in our{' '}
              <Link href="/help" className="text-red-400 hover:text-red-300 transition">
                Help Center
              </Link>{' '}
              to assist with this.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
