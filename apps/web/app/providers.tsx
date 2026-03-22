'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode } from 'react';
import { TRPCProvider } from '@/lib/trpc/provider';

let WagmiWrapper: React.FC<{ children: ReactNode }> | null = null;

// Only load wagmi/rainbowkit when WalletConnect projectId is configured
if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  try {
    const { WagmiProvider } = require('wagmi');
    const { wagmiConfig } = require('@/lib/wagmi');
    WagmiWrapper = ({ children }: { children: ReactNode }) => (
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    );
  } catch {
    // wagmi not available or misconfigured — skip
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const inner = (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TRPCProvider>{children}</TRPCProvider>
      </SessionProvider>
    </QueryClientProvider>
  );

  if (WagmiWrapper) {
    return <WagmiWrapper>{inner}</WagmiWrapper>;
  }

  return inner;
}
