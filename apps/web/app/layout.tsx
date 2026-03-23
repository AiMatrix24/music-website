import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { PlayerProvider, MusicPlayerBar } from './components/MusicPlayer';
import { ToastProvider } from './components/Toast';
import dynamic from 'next/dynamic';

const CookieConsent = dynamic(() =>
  import('./components/CookieConsent').then((m) => m.CookieConsent),
  { ssr: false }
);
const KeyboardShortcuts = dynamic(() =>
  import('./components/KeyboardShortcuts').then((m) => m.KeyboardShortcuts),
  { ssr: false }
);
const TopLoadingBar = dynamic(() =>
  import('./components/TopLoadingBar').then((m) => m.TopLoadingBar),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'OPYNX — Direct-to-Fan Music & Events',
    template: '%s | OPYNX',
  },
  description:
    'The FanEngage Protocol. Subscribe directly to artists for $8.73/mo. Transparent on-chain revenue sharing. No middlemen.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OPYNX',
  },
  openGraph: {
    type: 'website',
    siteName: 'OPYNX',
    title: 'OPYNX — Direct-to-Fan Music & Events',
    description:
      'Subscribe directly to artists. Transparent on-chain revenue sharing on Polygon. No middlemen.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OPYNX — Direct-to-Fan Music & Events',
    description:
      'Subscribe directly to artists. Transparent revenue sharing. No middlemen.',
  },
  keywords: [
    'music streaming',
    'direct to fan',
    'web3 music',
    'polygon',
    'artist platform',
    'transparent revenue',
    'OPYNX',
  ],
};

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex flex-col min-h-screen">
        <TopLoadingBar />
        <a href="#main-content" className="skip-nav">Skip to content</a>
        <Providers>
          <ToastProvider>
            <PlayerProvider>
              <Navbar />
              <main id="main-content" className="pt-16 flex-1" role="main">{children}</main>
              <Footer />
              <BackToTop />
              <MusicPlayerBar />
              <CookieConsent />
              <KeyboardShortcuts />
            </PlayerProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
