import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon } from 'wagmi/chains';
import { http } from 'wagmi';

/**
 * wagmi configuration for OPYNX.
 * Configured for Polygon mainnet (chainId 137) with RainbowKit defaults.
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'OPYNX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: [polygon],
  transports: {
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL ??
        'https://polygon-rpc.com'
    ),
  },
  ssr: true,
});

export { polygon };
