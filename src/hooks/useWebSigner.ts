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
  const { walletAddress, network } = useWalletConnect();

  // Per OPNet rules, the frontend never holds a signer object — OP_WALLET handles
  // all signing via window.opnet.web3 (auto-detected by @btc-vision/transaction).
  // Readiness is gated on walletAddress + network, NOT on a signer object.
  const isReady = !!walletAddress && !!network;

  const signTransaction = useCallback(
    async (prepare: PrepareResult): Promise<SignedTransactionData> => {
      if (!walletAddress) {
        throw new Error('Wallet not connected — connect your OPNet wallet to sign transactions');
      }
      if (!network) throw new Error('Network not available');

      return signPreparedTransactionWeb(
        prepare.offlineBuffer,
        prepare.refundAddress,
        prepare.maxSatToSpend,
        prepare.feeRate,
        network,
        prepare.extraOutputs,
      );
    },
    [walletAddress, network],
  );

  return {
    signTransaction,
    isReady,
    walletAddress,
  };
}
