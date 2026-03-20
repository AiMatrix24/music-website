import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

/**
 * Convert a viem WalletClient into an ethers.js JsonRpcSigner.
 * Needed for Gelato SDK and other libraries that require ethers.js signers.
 */
function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;

  if (!chain) {
    throw new Error('WalletClient has no chain configured');
  }

  if (!account) {
    throw new Error('WalletClient has no account configured');
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);

  return signer;
}

/**
 * Hook that converts the current wagmi WalletClient into an ethers.js
 * JsonRpcSigner. Returns undefined if no wallet is connected.
 *
 * Usage:
 * ```tsx
 * const signer = useEthersSigner();
 * if (signer) {
 *   // Use with Gelato SDK or any ethers.js-based library
 * }
 * ```
 */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });

  return useMemo(() => {
    if (!walletClient) return undefined;
    return walletClientToSigner(walletClient);
  }, [walletClient]);
}
