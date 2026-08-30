import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cancel, Download, Upload } from 'pixelarticons/react';
import { fetchBlockchainFees, importPartNft, mintPartNft } from '../api';
import type { BlockchainFees } from '../api';

/** A part as shown in the Profile inventory — in-game or exported on-chain. */
export interface PartNftRow {
  id: string;
  type: string;
  level: number;
  socketedInBike: string | null;
  tokenId: number | null;
  isListed: boolean;
}

const PART_TYPE_LABELS: Record<string, string> = {
  earning: 'Earning',
  luck: 'Luck',
  recovery: 'Recovery',
  durability: 'Durability',
};

export function PartNftModal({ part, onClose }: { part: PartNftRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState<'export' | 'import' | null>(null);

  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['blockchain-fees'],
    queryFn: fetchBlockchainFees,
  });
  // The endpoint returns partExportFeeSap; the shared BlockchainFees type does not declare it yet.
  const partFee = fees ? fees.partExportFeeSap : undefined;

  function invalidateAfterChainAction() {
    queryClient.invalidateQueries({ queryKey: ['userParts'] });
    queryClient.invalidateQueries({ queryKey: ['walletNfts'] });
    queryClient.invalidateQueries({ queryKey: ['spending'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
  }

  const exportMutation = useMutation({
    mutationFn: (partId: string) => mintPartNft(partId),
    onSuccess: () => {
      setActionError(null);
      setDone('export');
      invalidateAfterChainAction();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const importMutation = useMutation({
    mutationFn: (tokenId: number) => importPartNft(tokenId),
    onSuccess: () => {
      setActionError(null);
      setDone('import');
      invalidateAfterChainAction();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const pending = exportMutation.isPending || importMutation.isPending;
  const isOnChain = part.tokenId != null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, pending]);

  function safeClose() {
    if (pending) return;
    onClose();
  }

  const blockReason = part.isListed
    ? 'Cancel the marketplace listing first'
    : !isOnChain && part.socketedInBike
      ? 'Unsocket this part first'
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={safeClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-md pixel-card bg-m2e-card p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={safeClose}
          disabled={pending}
          className="absolute top-3 right-3 p-1 text-m2e-text-muted hover:text-m2e-text transition-colors disabled:opacity-40"
        >
          <Cancel className="w-6 h-6" />
        </button>

        <div className="flex gap-4">
          <div className="w-24 h-24 shrink-0 bg-m2e-bg-alt pixel-border flex items-center justify-center">
            <img
              src={`/parts/part-${part.type.toLowerCase()}-lv${part.level}.png`}
              alt={`${part.type} Lv.${part.level}`}
              className="w-20 h-20 object-contain pixel-render"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg uppercase tracking-wide text-m2e-text">
                {PART_TYPE_LABELS[part.type] ?? part.type}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide ${
                  isOnChain
                    ? 'bg-m2e-info/20 text-m2e-info border-m2e-info/50'
                    : 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border-light'
                }`}
              >
                {isOnChain ? 'On-chain' : 'In-game'}
              </span>
            </div>
            <div className="text-xs text-m2e-text-muted uppercase tracking-widest space-x-3">
              <span>Lv. {part.level}</span>
              {isOnChain && <span>#{part.tokenId}</span>}
              <span>{part.socketedInBike ? 'Socketed' : 'Unsocketed'}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t-2 border-m2e-border space-y-3">
          <p className="text-xs text-m2e-text-secondary leading-relaxed">
            An exported part can still be socketed into a bike, but it cannot be upgraded, used for HP repair,
            or sold in the in-game marketplace until you import it back.
          </p>

          {done ? (
            <>
              <h3 className="text-sm uppercase tracking-widest text-m2e-success">
                {done === 'export' ? 'Exported on-chain' : 'Imported to game'}
              </h3>
              <p className="text-xs text-m2e-text-secondary leading-relaxed">
                {done === 'export'
                  ? 'This part is now an NFT in your wallet, ready to sell or transfer.'
                  : 'The token was burned and the part is back in your in-game inventory.'}
              </p>
              <div className="flex justify-end">
                <button onClick={onClose} className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider">
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              {!isOnChain && (
                <ul className="text-xs text-m2e-text-secondary pixel-border bg-m2e-bg-alt p-3">
                  <li className="flex items-center justify-between">
                    <span className="uppercase tracking-wider text-m2e-text-muted">Export fee</span>
                    <span className="text-m2e-text">
                      {feesLoading ? '…' : partFee != null ? `${partFee.toLocaleString()} WATTS` : '—'}
                    </span>
                  </li>
                </ul>
              )}
              {isOnChain && (
                <p className="text-xs text-m2e-text-secondary leading-relaxed">
                  Importing burns token <span className="text-m2e-text">#{part.tokenId}</span> on-chain. You can
                  export it again later.
                </p>
              )}

              {actionError && (
                <div className="pixel-card p-3 border-m2e-danger bg-m2e-danger/10 text-m2e-danger text-xs">
                  {actionError}
                </div>
              )}
              {blockReason && (
                <div className="text-[11px] text-m2e-warning uppercase tracking-wider text-right">{blockReason}</div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={safeClose}
                  disabled={pending}
                  className="pixel-btn px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-40"
                >
                  Cancel
                </button>
                {isOnChain ? (
                  <button
                    onClick={() => importMutation.mutate(part.tokenId as number)}
                    disabled={pending || blockReason != null}
                    className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {importMutation.isPending ? 'Importing…' : 'Import to Game'}
                  </button>
                ) : (
                  <button
                    onClick={() => exportMutation.mutate(part.id)}
                    disabled={pending || feesLoading || blockReason != null}
                    className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    {exportMutation.isPending ? 'Exporting…' : 'Export as NFT'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
