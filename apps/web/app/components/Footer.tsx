import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-brand-800/30 py-12 px-6 mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image src="/logo.jpeg" alt="OPYNX" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-black tracking-tight">
                <span className="text-red-500">O</span>pyn<span className="text-red-500">X</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              The FanEngage Protocol. Direct-to-fan music, events, and transparent revenue sharing.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="text-gray-500 hover:text-brand-400 transition">Explore</Link></li>
              <li><Link href="/subscribe" className="text-gray-500 hover:text-brand-400 transition">Subscribe</Link></li>
              <li><Link href="/scan" className="text-gray-500 hover:text-brand-400 transition">Scan QR</Link></li>
              <li><Link href="/search" className="text-gray-500 hover:text-brand-400 transition">Search</Link></li>
              <li><Link href="/community" className="text-gray-500 hover:text-brand-400 transition">Community</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-gray-500 hover:text-brand-400 transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-brand-400 transition">Privacy Policy</Link></li>
              <li><Link href="/contact" className="text-gray-500 hover:text-brand-400 transition">Contact</Link></li>
              <li><Link href="/help" className="text-gray-500 hover:text-brand-400 transition">Help / FAQ</Link></li>
              <li><Link href="/developers" className="text-gray-500 hover:text-brand-400 transition">Developers</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">Discord Community</span></li>
              <li><span className="text-gray-500">Twitter/X @opynx</span></li>
              <li><a href="mailto:hello@opynx.dev" className="text-gray-500 hover:text-brand-400 transition">hello@opynx.dev</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-800/20 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} OPYNX. FanEngage Protocol. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built on Polygon. Verified on-chain.
          </p>
        </div>
      </div>
    </footer>
  );
}
