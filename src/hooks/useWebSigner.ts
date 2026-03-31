import { useCallback, useEffect, useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import type { UnisatSigner } from '@btc-vision/transaction';
import { OPWalletSigner } from '../services/op-wallet-signer';
import { signPreparedTransactionWeb, type SignedTransactionData } from '../services/web-signer';

export interface PrepareResult {
  offlineBuffer: string;
  refundAddress: string;
  maxSatToSpend: string;
  feeRate: number;
  extraOutputs?: Array<{ address: string; value: string }>;
}

export function useWebSigner() {
  const { signer: libSigner, walletAddress, network, publicKey } = useWalletConnect();

  // OP_WALLET's getSigner() returns null by design (it doesn't provide a UnisatSigner).
  // Since OPWallet extends Unisat (same signPsbt API), we create our own signer
  // that wraps window.opnet instead of window.unisat.
  const [opSigner, setOpSigner] = useState<UnisatSigner | null>(null);

  useEffect(() => {
    // Only create OPWalletSigner if the library signer is null AND wallet is connected
    if (!libSigner && walletAddress && publicKey && (window as any).opnet) {
      console.log('[useWebSigner] Library signer null, creating OPWalletSigner for window.opnet');
      const s = new OPWalletSigner();
      s.init()
        .then(() => {
          console.log('[useWebSigner] OPWalletSigner initialized successfully');
          setOpSigner(s);
        })
        .catch((err) => console.error('[useWebSigner] OPWalletSigner init failed:', err));
    } else if (libSigner) {
      // Library provided a signer (e.g. Unisat wallet) — don't need our fallback
      setOpSigner(null);
    }
  }, [libSigner, walletAddress, publicKey]);

  const signer = libSigner ?? opSigner;

  const signTransaction = useCallback(
    async (prepare: PrepareResult): Promise<SignedTransactionData> => {
      if (!signer) throw new Error('Wallet not connected — connect your OPNet wallet to sign transactions');
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
