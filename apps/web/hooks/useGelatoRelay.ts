import { useState, useCallback } from 'react';
import { GelatoRelay, type SponsoredCallERC2771Request } from '@gelatonetwork/relay-sdk';
import { useEthersSigner } from './useEthersSigner';
import { polygon } from '@/lib/wagmi';

const GELATO_API_KEY = process.env.NEXT_PUBLIC_GELATO_API_KEY ?? '';

interface RelayState {
  isLoading: boolean;
  taskId: string | null;
  error: string | null;
}

interface RelayResult {
  taskId: string;
}

/**
 * Hook for gasless transactions via Gelato Relay using sponsoredCallERC2771.
 *
 * This flow allows users to interact with smart contracts without paying gas fees.
 * The relay sponsor (OPYNX) covers gas costs on Polygon.
 *
 * Usage:
 * ```tsx
 * const { relay, state } = useGelatoRelay();
 *
 * const handleAction = async () => {
 *   const result = await relay({
 *     target: contractAddress,
 *     data: encodedCalldata,
 *   });
 *   console.log('Task ID:', result?.taskId);
 * };
 * ```
 */
export function useGelatoRelay() {
  const signer = useEthersSigner({ chainId: polygon.id });

  const [state, setState] = useState<RelayState>({
    isLoading: false,
    taskId: null,
    error: null,
  });

  const relay = useCallback(
    async ({
      target,
      data,
    }: {
      target: string;
      data: string;
    }): Promise<RelayResult | null> => {
      if (!signer) {
        setState((prev) => ({
          ...prev,
          error: 'Wallet not connected. Please connect your wallet first.',
        }));
        return null;
      }

      if (!GELATO_API_KEY) {
        setState((prev) => ({
          ...prev,
          error: 'Gelato API key not configured.',
        }));
        return null;
      }

      setState({ isLoading: true, taskId: null, error: null });

      try {
        const gelatoRelay = new GelatoRelay();

        const userAddress = await signer.getAddress();

        const request: SponsoredCallERC2771Request = {
          chainId: BigInt(polygon.id),
          target,
          data,
          user: userAddress,
        };

        // sponsoredCallERC2771: the sponsor (OPYNX) pays gas via Gelato
        const response = await gelatoRelay.sponsoredCallERC2771(
          request,
          signer,
          GELATO_API_KEY
        );

        setState({
          isLoading: false,
          taskId: response.taskId,
          error: null,
        });

        return { taskId: response.taskId };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Relay transaction failed';

        setState({
          isLoading: false,
          taskId: null,
          error: message,
        });

        return null;
      }
    },
    [signer]
  );

  /**
   * Poll Gelato for task status. Useful for tracking relay execution.
   */
  const getTaskStatus = useCallback(async (taskId: string) => {
    const gelatoRelay = new GelatoRelay();
    const status = await gelatoRelay.getTaskStatus(taskId);
    return status;
  }, []);

  return {
    relay,
    getTaskStatus,
    state,
    isReady: !!signer && !!GELATO_API_KEY,
  };
}
