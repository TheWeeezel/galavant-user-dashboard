/**
 * Web-based transaction signing using the OPNet wallet extension.
 * The wallet extension holds keys -- only signed TX hex is sent to the server.
 * This mirrors packages/app/services/signer.ts but uses UnisatSigner instead of a stored mnemonic.
 */
import { CallResult } from 'opnet';
import { fromHex, type Network, type Satoshi } from '@btc-vision/bitcoin';
import type { UnisatSigner } from '@btc-vision/transaction';

export interface SignedTransactionData {
  fundingTx: string | null;
  interactionTx: string;
}

/**
 * Sign a prepared transaction using the wallet browser extension.
 *
 * @param signer - UnisatSigner (or OPWalletSigner for OP_WALLET)
 * @param offlineBufferHex - Hex-encoded offline buffer from server's prepare endpoint
 * @param refundAddress - User's p2tr address (for change outputs)
 * @param maxSatToSpend - Maximum satoshis the TX can spend (as string)
 * @param feeRate - Fee rate in sat/vB
 * @param network - Bitcoin network
 * @param extraOutputs - Additional outputs (LP payments, tax, etc.)
 */
export async function signPreparedTransactionWeb(
  signer: UnisatSigner,
  offlineBufferHex: string,
  refundAddress: string,
  maxSatToSpend: string,
  feeRate: number,
  network: Network,
  extraOutputs?: Array<{ address: string; value: string }>,
): Promise<SignedTransactionData> {
  // Reconstruct the CallResult from the offline buffer
  const buffer = fromHex(offlineBufferHex);
  const callResult = CallResult.fromOfflineBuffer(buffer);

  // Sign with the wallet extension (signer=wallet, mldsaSigner=null -- wallet handles MLDSA)
  const signedTx = await callResult.signTransaction({
    signer,
    mldsaSigner: null,
    refundTo: refundAddress,
    maximumAllowedSatToSpend: BigInt(maxSatToSpend),
    feeRate,
    network,
    extraOutputs: extraOutputs?.map((o) => ({
      address: o.address,
      value: BigInt(o.value) as Satoshi,
    })),
  });

  return {
    fundingTx: signedTx.fundingTransactionRaw ?? null,
    interactionTx: signedTx.interactionTransactionRaw,
  };
}
