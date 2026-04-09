/**
 * Web-based transaction signing using the OPNet wallet extension.
 * The wallet extension holds keys -- only signed TX hex is sent to the server.
 * Mirrors packages/app/services/signer.ts but routes through window.opnet.web3.
 */
import { CallResult } from 'opnet';
import { fromHex, type Network, type Satoshi } from '@btc-vision/bitcoin';

export interface SignedTransactionData {
  fundingTx: string | null;
  interactionTx: string;
}

/**
 * Sign a prepared transaction using the OP_WALLET browser extension.
 *
 * Per OPNet rules, the frontend MUST pass `signer: null` and `mldsaSigner: null`.
 * The library auto-detects `window.opnet.web3` and forwards the request to the
 * wallet, which holds the keys and handles all signing. Passing a signer object
 * causes the wallet's pageProvider to reject the request with
 * "signer is not allowed in interaction parameters".
 *
 * @param offlineBufferHex - Hex-encoded offline buffer from server's prepare endpoint
 * @param refundAddress - User's p2tr address (for change outputs)
 * @param maxSatToSpend - Maximum satoshis the TX can spend (as string)
 * @param feeRate - Fee rate in sat/vB
 * @param network - Bitcoin network
 * @param extraOutputs - Additional outputs (LP payments, tax, etc.)
 */
export async function signPreparedTransactionWeb(
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

  // signer: null is REQUIRED on frontend. CallResult.signTransaction strips the
  // signer field entirely when null, and the lib then routes through OP_WALLET's
  // window.opnet.web3.signInteraction(). The wallet rejects any non-null signer.
  const signedTx = await callResult.signTransaction({
    signer: null,
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
