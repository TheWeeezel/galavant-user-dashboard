import { useCallback } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { signPreparedTransactionWeb, type SignedTransactionData } from '../services/web-signer';

export interface PrepareResult {
  offlineBuffer: string;
  refundAddress: string;
  maxSatToSpend: string;
  feeRate: number;
  extraOutputs?: Array<{ address: string; value: string }>;
}

export function useWebSigner() {
  const { signer, walletAddress, network } = useWalletConnect();

  const signTransaction = useCallback(
    async (prepare: PrepareResult): Promise<SignedTransactionData> => {
      if (!signer) throw new Error('Wallet not connected -- connect your OPNet wallet to sign transactions');
      if (!network) throw new Error('Network not available');

      return signPreparedTransactionWeb(
        signer,
        prepare.offlineBuffer,
        prepare.refundAddress,
        prepare.maxSatToSpend,
        prepare.feeRate,
        network,
        prepare.extraOutputs,
      );
    },
    [signer, network],
  );

  return {
    signTransaction,
    isReady: !!signer && !!walletAddress && !!network,
    walletAddress,
  };
}
