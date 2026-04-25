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
const InstallAppBanner = dynamic(() =>
  import('./components/InstallAppBanner').then((m) => m.InstallAppBanner),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'OPYNX — Direct-to-Fan Music & Events',
    template: '%s | OPYNX',
  },
  description:
    'The FanEngage Protocol. Subscribe directly to creators for $8.73/mo. Transparent on-chain revenue sharing. No middlemen.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OPYNX',
    // iOS splash screens. Each entry's media query matches one specific
    // device family — if nothing matches, iOS falls back to the manifest
    // background_color (#0a0a0f). Covers iPhone X (2017) through iPhone
    // 16 Pro Max. Each PNG is the OPYNX logo centered on the dark theme.
    startupImage: [
      { url: '/splash/iphone-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // 14/15/16 Pro Max
      { url: '/splash/iphone-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // 14 Pro, 15/16, 15/16 Pro
      { url: '/splash/iphone-1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // 12/13 Pro Max, 14 Plus
      { url: '/splash/iphone-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // 12/13/14, 12/13 Pro
      { url: '/splash/iphone-1080x2340.png', media: '(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // 12/13 mini
      { url: '/splash/iphone-1242x2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // XS Max, 11 Pro Max
      { url: '/splash/iphone-828x1792.png',  media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' }, // XR, 11
      { url: '/splash/iphone-1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }, // X, XS, 11 Pro
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'OPYNX',
    title: 'OPYNX — Direct-to-Fan Music & Events',
    description:
      'Subscribe directly to creators. Transparent on-chain revenue sharing on Polygon. No middlemen.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OPYNX — Direct-to-Fan Music & Events',
    description:
      'Subscribe directly to creators. Transparent revenue sharing. No middlemen.',
  },
  keywords: [
    'music streaming',
    'direct to fan',
    'web3 music',
    'polygon',
    'creator platform',
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
              <InstallAppBanner />
              <CookieConsent />
              <KeyboardShortcuts />
            </PlayerProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
