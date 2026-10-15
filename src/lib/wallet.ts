import { useSyncExternalStore } from 'react';
import { getWallets } from '@wallet-standard/app';
import type { Wallet, WalletAccount } from '@wallet-standard/base';
import { base58Encode } from './base58';

/**
 * The Solana wallet, through the Wallet Standard and nothing else.
 *
 * The graveyard needs exactly two things from a wallet: a signed message (proof the wallet is the
 * player's) and a signed-and-sent transaction (the burn, built by the server). Both are Wallet
 * Standard features, and Phantom offers them — as a browser extension and inside its mobile
 * in-app browser alike. So there is no Solana SDK here, no RPC endpoint and no new CSP host: the
 * wallet talks to the chain, the page only hands it bytes and takes signatures back.
 */

/** Which Solana the wallet should send on. Mainnet unless a dev build points elsewhere. */
export const SOLANA_CHAIN: string = (import.meta.env.VITE_SOLANA_CHAIN as string | undefined) || 'solana:mainnet';

// The three features the flow uses, typed by hand so @solana/wallet-standard-features stays out
// of the bundle. Shapes follow that package's definitions (1.x).
interface ConnectFeature {
  connect(input?: { silent?: boolean }): Promise<{ accounts: readonly WalletAccount[] }>;
}
interface SignMessageFeature {
  signMessage(...inputs: { account: WalletAccount; message: Uint8Array }[]): Promise<readonly { signedMessage: Uint8Array; signature: Uint8Array }[]>;
}
interface SignAndSendTransactionFeature {
  signAndSendTransaction(...inputs: {
    account: WalletAccount;
    chain: string;
    transaction: Uint8Array;
    options?: { preflightCommitment?: 'processed' | 'confirmed' | 'finalized'; skipPreflight?: boolean; maxRetries?: number };
  }[]): Promise<readonly { signature: Uint8Array }[]>;
}

const REQUIRED_FEATURES = ['standard:connect', 'solana:signMessage', 'solana:signAndSendTransaction'] as const;

export function isCompatible(wallet: Wallet): boolean {
  return REQUIRED_FEATURES.every((f) => f in wallet.features);
}

/** Phantom by name when it is there, otherwise the first wallet that can do all three things. */
export function pickWallet(wallets: readonly Wallet[]): Wallet | null {
  const able = wallets.filter(isCompatible);
  return able.find((w) => /phantom/i.test(w.name)) ?? able[0] ?? null;
}

// One registry for the page. getWallets() announces the app to every installed wallet on first
// call, and wallets injected later (the Phantom extension can land after our script) arrive
// through the register event. The snapshot is a single Wallet reference so useSyncExternalStore
// sees a stable value — get() hands out a fresh array copy each time, which would never settle.
let registry: ReturnType<typeof getWallets> | null = null;
let snapshot: Wallet | null = null;
function ensureRegistry() {
  if (!registry) {
    registry = getWallets();
    snapshot = pickWallet(registry.get());
  }
  return registry;
}

function subscribe(onChange: () => void) {
  const reg = ensureRegistry();
  const refresh = () => {
    snapshot = pickWallet(reg.get());
    onChange();
  };
  const offRegister = reg.on('register', refresh);
  const offUnregister = reg.on('unregister', refresh);
  return () => {
    offRegister();
    offUnregister();
  };
}

/** The wallet the page will use, or null while none that can connect, sign and send is installed. */
export function useSolanaWallet(): Wallet | null {
  return useSyncExternalStore(subscribe, () => { ensureRegistry(); return snapshot; }, () => null);
}

/**
 * Open the wallet's connect prompt. `prefer` picks the account when the wallet exposes several —
 * the burn is signed by the wallet that holds the sneaker, which is one of the proven addresses.
 */
export async function connectWallet(wallet: Wallet, prefer: readonly string[] = []): Promise<WalletAccount> {
  const { accounts } = await (wallet.features['standard:connect'] as ConnectFeature).connect();
  const list = accounts.length ? accounts : wallet.accounts;
  const account = list.find((a) => prefer.includes(a.address)) ?? list[0];
  if (!account) throw new Error('The wallet did not share an account. Unlock it and try again.');
  return account;
}

/** Sign the exact message text (UTF-8 bytes) and return the signature as base58. */
export async function signMessage(wallet: Wallet, account: WalletAccount, message: string): Promise<string> {
  const [out] = await (wallet.features['solana:signMessage'] as SignMessageFeature)
    .signMessage({ account, message: new TextEncoder().encode(message) });
  if (!out?.signature) throw new Error('The wallet returned no signature.');
  return base58Encode(out.signature);
}

/**
 * Sign and send a transaction the server built (base64, unsigned, fee payer = this wallet) and
 * return the transaction signature as base58.
 *
 * `preflightCommitment: 'confirmed'` is REQUIRED: the server fetches a confirmed blockhash, and
 * a wallet that preflights against finalized state rejects it with BlockhashNotFound (seen in
 * testing against a local validator).
 */
export async function signAndSendTransaction(wallet: Wallet, account: WalletAccount, transactionBase64: string): Promise<string> {
  const [out] = await (wallet.features['solana:signAndSendTransaction'] as SignAndSendTransactionFeature)
    .signAndSendTransaction({
      account,
      chain: SOLANA_CHAIN,
      transaction: base64ToBytes(transactionBase64),
      options: { preflightCommitment: 'confirmed' },
    });
  if (!out?.signature) throw new Error('The wallet returned no transaction signature.');
  return base58Encode(out.signature);
}

export function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * The link that opens this page inside Phantom's mobile in-app browser, where the wallet is
 * present. For visitors on a phone without an extension — which is most of them.
 */
export function phantomBrowseUrl(pageUrl: string, origin: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(pageUrl)}?ref=${encodeURIComponent(origin)}`;
}

/** "7Gk3 … 9pQe" — the address as a person recognises it. */
export function shortAddress(address: string): string {
  return address.length <= 12 ? address : `${address.slice(0, 4)} … ${address.slice(-4)}`;
}
