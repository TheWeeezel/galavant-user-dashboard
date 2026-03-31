/**
 * Signer adapter for the OP_WALLET browser extension.
 *
 * The walletconnect library's OP_WALLET controller returns null for getSigner()
 * because it was never implemented. But OPWallet extends Unisat — it has the
 * same signPsbt/getPublicKey/getNetwork methods — so we subclass UnisatSigner
 * and override the `unisat` getter to use window.opnet instead of window.unisat.
 */
import { UnisatSigner } from '@btc-vision/transaction';
import type { Unisat } from '@btc-vision/transaction';

export class OPWalletSigner extends UnisatSigner {
  /** Override to use window.opnet (OPWallet API) instead of window.unisat */
  get unisat(): Unisat {
    const w = window as unknown as { opnet?: Unisat };
    if (!w.opnet) throw new Error('OP_WALLET extension not found');
    return w.opnet;
  }
}
