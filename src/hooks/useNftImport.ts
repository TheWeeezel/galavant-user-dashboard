import { fetchImportStatus, importBikeNft, importPartNft, type ImportStart } from '../api';

export type ImportKind = 'bike' | 'part';

/** How the import ended from the screen's point of view. */
export type ImportOutcome =
  /** The row is credited — the item is back in the game. */
  | { status: 'done' }
  /**
   * The player has not approved the burn yet and this screen stopped waiting. The import is
   * not lost: the server credits the row whenever the burn lands (the tx worker watches it).
   */
  | { status: 'still-pending' };

const POLL_MS = 4_000;
/** A human approves on a phone; give them a few minutes before the screen stops waiting. */
const WAIT_MS = 5 * 60_000;

/**
 * Import an NFT and wait for the player's approval.
 *
 * The burn is signed by the player in their own Enjin Wallet (2026-09-02): the server answers
 * 202 + a journal id and the row is credited only once the chain has finalized the burn. This
 * asks for the burn, then polls the journal until the item is home, the chain refused the burn
 * (an error the caller shows), or a few minutes have passed with no approval. `onPending` fires
 * once the request is out, so the screen can say "approve it in your wallet" instead of
 * "importing…".
 */
export async function importNft(kind: ImportKind, tokenId: number, onPending?: () => void): Promise<ImportOutcome> {
  const started: ImportStart = kind === 'bike' ? await importBikeNft(tokenId) : await importPartNft(tokenId);
  if (started.status === 'done' || !started.journalId) return { status: 'done' };
  onPending?.();

  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const status = await fetchImportStatus(started.journalId);
    if (status.imported) return { status: 'done' };
    // FINALIZED with a failed extrinsic, or a request the wallet refused: the token is still the
    // player's, nothing changed — say so with the chain's reason.
    if (status.state === 'FAILED' || status.state === 'ABANDONED' || (status.state === 'FINALIZED' && status.result === 'FAILED')) {
      throw new Error(status.error ? `The burn did not go through: ${status.error}` : 'The burn did not go through — your NFT is untouched. Try again.');
    }
  }
  return { status: 'still-pending' };
}
