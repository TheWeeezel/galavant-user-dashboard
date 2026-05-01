import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cancel, Lock, Coins, Leaf, Heart, Shield, ExternalLink, Download, Upload } from 'pixelarticons/react';
import { config } from '../config';
import { fetchBlockchainFees, fetchNftDetail, importBikeNft, mintBikeNft } from '../api';
import type { MintedNftDetail, PartSocket, UserBike } from '../api';
import { txExplorerUrl } from '../utils/format';

function truncateId(id: string): string {
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

const qualityColors: Record<string, string> = {
  common: 'pixel-badge-common',
  uncommon: 'pixel-badge-uncommon',
  rare: 'pixel-badge-rare',
  epic: 'pixel-badge-epic',
  legendary: 'pixel-badge-legendary',
};

const QUALITY_MAX: Record<string, number> = {
  common: 10,
  uncommon: 18,
  rare: 35,
  epic: 63,
  legendary: 112,
};

function resolveImageUrl(nft: { imageUrl: string | null; type: string; tokenId: number | null }): string {
  if (nft.imageUrl) {
    return nft.imageUrl.startsWith('/') ? `${config.apiUrl}${nft.imageUrl}` : nft.imageUrl;
  }
  return `${config.apiUrl}/art/bases/bike-${nft.type.toLowerCase()}.png`;
}

interface SegmentedStatBarProps {
  label: string;
  base: number;
  added: number;
  max: number;
  color: string;
  colorLight: string;
  showBase: boolean;
}

function SegmentedStatBar({ label, base, added, max, color, colorLight, showBase }: SegmentedStatBarProps) {
  const total = base + added;
  const displayValue = showBase ? base : total;
  const basePct = Math.min((base / max) * 100, 100);
  const addedPct = showBase ? 0 : Math.min((added / max) * 100, 100 - basePct);

  return (
 <div className="flex items-center gap-2 text-xs">
 <span className="w-10 text-m2e-text-secondary uppercase">{label}</span>
      <div
 className="flex-1 h-5 bg-m2e-bg-alt overflow-hidden pixel-border"
        style={{
          borderBottomWidth: '3px',
          boxShadow: '2px 2px 0px 0px var(--color-m2e-shadow)',
        }}
      >
 <div className="h-full flex">
          <div
 className={`h-full ${color}`}
            style={{ width: `${basePct}%`, borderTop: '2px solid rgba(255,255,255,0.4)' }}
          />
          {!showBase && added > 0 && (
            <div
 className={`h-full ${colorLight}`}
              style={{ width: `${addedPct}%`, borderTop: '2px solid rgba(255,255,255,0.2)' }}
            />
          )}
        </div>
      </div>
 <span className="w-20 text-right text-m2e-text">
        {showBase ? (
          <>{base}/{max}</>
        ) : (
 <>{total}<span className="text-m2e-text-muted text-[10px]">/{max}</span> <span className="text-m2e-text-muted text-[10px]">({base}+{added})</span></>
        )}
      </span>
    </div>
  );
}

const socketTypeIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  earning: Coins,
  luck: Leaf,
  recovery: Heart,
  durability: Shield,
};

const socketTypeColors: Record<string, string> = {
  earning: 'text-m2e-earning',
  luck: 'text-m2e-luck',
  recovery: 'text-m2e-recovery',
  durability: 'text-m2e-durability',
};

const socketTypeBorders: Record<string, string> = {
  earning: 'border-m2e-earning',
  luck: 'border-m2e-luck',
  recovery: 'border-m2e-recovery',
  durability: 'border-m2e-durability',
};

function SocketSlot({ socket }: { socket: PartSocket }) {
  const Icon = socketTypeIcons[socket.type] ?? Lock;
  const colorClass = socketTypeColors[socket.type] ?? 'text-m2e-text-muted';
  const borderClass = socket.unlocked ? (socketTypeBorders[socket.type] ?? '') : 'border-m2e-border-light';

  return (
 <div className={`pixel-border p-3 flex flex-col items-center gap-1 ${borderClass} ${socket.unlocked ? 'bg-m2e-card' : 'bg-m2e-bg-alt opacity-70'}`}>
      {socket.unlocked ? (
 <Icon className={`w-5 h-5 ${colorClass}`} />
      ) : (
 <Lock className="w-5 h-5 text-m2e-text-muted" />
      )}
 <span className={`text-[10px] uppercase tracking-wider ${socket.unlocked ? colorClass : 'text-m2e-text-muted'}`}>
        {socket.type}
      </span>
 <span className="text-[9px] text-m2e-text-muted uppercase">
        Slot {socket.slot + 1}
      </span>
    </div>
  );
}

function ModalContent({ nft }: { nft: MintedNftDetail }) {
  const [showBase, setShowBase] = useState(false);
  const tierMax = QUALITY_MAX[nft.quality] ?? 112;
  const isOnChain = nft.tokenId != null && nft.tokenId > 0;

  return (
 <div className="space-y-5">
      {/* Header: image + basic info */}
 <div className="flex gap-4">
 <div className="w-32 h-32 shrink-0 bg-m2e-bg-alt pixel-border overflow-hidden">
          <img
            src={resolveImageUrl(nft)}
            alt={isOnChain ? `${nft.type} #${nft.tokenId}` : nft.type}
 className="w-full h-full object-cover pixel-render"
          />
        </div>
 <div className="flex-1 space-y-2">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-lg uppercase tracking-wide text-m2e-text">
              {isOnChain ? `#${nft.tokenId}` : truncateId(nft.id)}
            </span>
 <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide ${qualityColors[nft.quality] ?? qualityColors.common}`}>
              {nft.quality}
            </span>
 <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide ${isOnChain ? 'bg-m2e-info/20 text-m2e-info border-m2e-info/50' : 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border-light'}`}>
              {isOnChain ? 'On-chain' : 'In-game'}
            </span>
          </div>
 <div className="text-sm uppercase tracking-wide text-m2e-text-secondary">
            {nft.type}
          </div>
 <div className="text-xs text-m2e-text-muted space-x-3">
            <span>Lv. {nft.level}</span>
            {isOnChain && <span title={nft.id}>ID: {truncateId(nft.id)}</span>}
          </div>
        </div>
      </div>

      {/* Segmented stat bars */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <h3 className="text-xs uppercase tracking-widest text-m2e-text-muted">Attributes</h3>
          <button
            onClick={() => setShowBase((v) => !v)}
 className={`px-3 py-1 text-[10px] uppercase tracking-wider pixel-border transition-colors ${
              showBase
                ? 'bg-m2e-accent/20 text-m2e-accent border-m2e-accent/50'
                : 'bg-m2e-info/20 text-m2e-info border-m2e-info/50'
            }`}
          >
            {showBase ? 'BASE' : 'TOTAL'}
          </button>
        </div>
 <div className="space-y-1">
          <SegmentedStatBar label="EAR" base={nft.baseEarning} added={nft.addedEarning} max={tierMax} color="bg-m2e-earning" colorLight="bg-m2e-earning/50" showBase={showBase} />
          <SegmentedStatBar label="LCK" base={nft.baseLuck} added={nft.addedLuck} max={tierMax} color="bg-m2e-luck" colorLight="bg-m2e-luck/50" showBase={showBase} />
          <SegmentedStatBar label="REC" base={nft.baseRecovery} added={nft.addedRecovery} max={tierMax} color="bg-m2e-recovery" colorLight="bg-m2e-recovery/50" showBase={showBase} />
          <SegmentedStatBar label="DUR" base={nft.baseDurability} added={nft.addedDurability} max={tierMax} color="bg-m2e-durability" colorLight="bg-m2e-durability/50" showBase={showBase} />
        </div>
      </div>

      {/* Socket grid */}
 <div className="space-y-2">
 <h3 className="text-xs uppercase tracking-widest text-m2e-text-muted">Sockets</h3>
 <div className="grid grid-cols-2 gap-2">
          {(nft.partSockets ?? []).map((socket) => (
            <SocketSlot key={socket.slot} socket={socket} />
          ))}
        </div>
      </div>

      {/* Extra info */}
 <div className="grid grid-cols-3 gap-3 text-center">
 <div className="pixel-border p-2 bg-m2e-bg-alt">
 <div className="text-[10px] text-m2e-text-muted uppercase">Mint</div>
 <div className="text-sm text-m2e-text">{nft.mintCount}/{nft.maxMints}</div>
        </div>
 <div className="pixel-border p-2 bg-m2e-bg-alt">
 <div className="text-[10px] text-m2e-text-muted uppercase">HP</div>
 <div className="text-sm text-m2e-text">{Math.round(nft.hp)}%</div>
        </div>
 <div className="pixel-border p-2 bg-m2e-bg-alt">
 <div className="text-[10px] text-m2e-text-muted uppercase">Durability</div>
 <div className="text-sm text-m2e-text">{Math.round(nft.durability)}%</div>
        </div>
      </div>
    </div>
  );
}

interface NftDetailModalProps {
  nftId: string;
  onClose: () => void;
  ownerBike?: UserBike | null;
}

export function NftDetailModal({ nftId, onClose, ownerBike }: NftDetailModalProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['nft-detail', nftId],
    queryFn: () => fetchNftDetail(nftId),
  });

  const [confirmAction, setConfirmAction] = useState<'export' | 'import' | null>(null);
  const [result, setResult] = useState<{ kind: 'export' | 'import'; txHash: string | null; tokenId: number | null } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function invalidateAfterChainAction() {
    queryClient.invalidateQueries({ queryKey: ['userBikes'] });
    queryClient.invalidateQueries({ queryKey: ['walletNfts'] });
    queryClient.invalidateQueries({ queryKey: ['spending'] });
    queryClient.invalidateQueries({ queryKey: ['spending-wallet'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['energy'] });
    queryClient.invalidateQueries({ queryKey: ['nft-detail', nftId] });
  }

  const exportMutation = useMutation({
    mutationFn: (bikeId: string) => mintBikeNft(bikeId),
    onSuccess: (data) => {
      setResult({ kind: 'export', txHash: data.txHash ?? null, tokenId: Number(data.tokenId) });
      setActionError(null);
      setConfirmAction(null);
      invalidateAfterChainAction();
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const importMutation = useMutation({
    mutationFn: (tokenId: number) => importBikeNft(tokenId),
    onSuccess: (data) => {
      setResult({ kind: 'import', txHash: data.txHash ?? null, tokenId: null });
      setActionError(null);
      setConfirmAction(null);
      invalidateAfterChainAction();
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const pending = exportMutation.isPending || importMutation.isPending;

  // Close on Escape (blocked while a mutation is in flight)
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

  return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={safeClose}>
 <div className="absolute inset-0 bg-black/70" />
      <div
 className="relative w-full max-w-lg pixel-card bg-m2e-card p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={safeClose}
          disabled={pending}
 className="absolute top-3 right-3 p-1 text-m2e-text-muted hover:text-m2e-text transition-colors disabled:opacity-40"
        >
 <Cancel className="w-6 h-6" />
        </button>

        {isLoading ? (
 <div className="py-12 text-center text-m2e-text-muted text-sm">Loading bike details...</div>
        ) : error ? (
 <div className="py-12 text-center text-red-400 text-sm">Failed to load details</div>
        ) : data ? (
          <>
            <ModalContent nft={data} />
            {ownerBike && !result && !confirmAction && (
              <OwnerActionBar
                bike={ownerBike}
                onExport={() => { setActionError(null); setConfirmAction('export'); }}
                onImport={() => { setActionError(null); setConfirmAction('import'); }}
              />
            )}
            {confirmAction === 'export' && ownerBike && (
              <ExportConfirmPanel
                bike={ownerBike}
                pending={exportMutation.isPending}
                errorMessage={actionError}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() => exportMutation.mutate(ownerBike.id)}
              />
            )}
            {confirmAction === 'import' && ownerBike && ownerBike.tokenId != null && (
              <ImportConfirmPanel
                tokenId={ownerBike.tokenId}
                pending={importMutation.isPending}
                errorMessage={actionError}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() => importMutation.mutate(ownerBike.tokenId as number)}
              />
            )}
            {result && (
              <ResultPanel result={result} onClose={onClose} />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function OwnerActionBar({ bike, onExport, onImport }: { bike: UserBike; onExport: () => void; onImport: () => void }) {
  const isOnChain = bike.tokenId != null;
  if (isOnChain) {
    return (
      <div className="mt-5 pt-4 border-t-2 border-m2e-border flex items-center justify-between gap-3">
        <div className="text-[11px] text-m2e-text-muted uppercase tracking-wider">
          On-chain NFT — bring it back in to earn again
        </div>
        <button
          onClick={onImport}
          className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Import to Game
        </button>
      </div>
    );
  }

  const hpBelow100 = Math.round(bike.hp) < 100;
  const isEquipped = bike.isEquipped;
  const disabled = hpBelow100 || isEquipped;
  const reason = hpBelow100
    ? 'Bike must be at full HP to export.'
    : isEquipped
      ? 'Equip a different bike before exporting this one.'
      : null;

  return (
    <div className="mt-5 pt-4 border-t-2 border-m2e-border space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-m2e-text-muted uppercase tracking-wider">
          Export as an NFT to sell or transfer externally
        </div>
        <button
          onClick={onExport}
          disabled={disabled}
          className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          Export to Wallet
        </button>
      </div>
      {reason && (
        <div className="text-[11px] text-m2e-warning uppercase tracking-wider text-right">{reason}</div>
      )}
    </div>
  );
}

function ExportConfirmPanel({
  bike,
  pending,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  bike: UserBike;
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['blockchain-fees'],
    queryFn: fetchBlockchainFees,
  });
  const socketedPartCount = (bike.partSockets ?? []).filter((s) => s.partId != null).length;

  return (
    <div className="mt-5 pt-4 border-t-2 border-m2e-border space-y-3">
      <h3 className="text-sm uppercase tracking-widest text-m2e-text">Confirm Export</h3>
      <p className="text-xs text-m2e-text-secondary leading-relaxed">
        This mints your bike as an on-chain NFT in your wallet. You'll be able to sell or transfer it on any OPNet-compatible marketplace. It will no longer earn SAP in-game until you import it back.
      </p>
      <ul className="text-xs text-m2e-text-secondary space-y-1 pixel-border bg-m2e-bg-alt p-3">
        <li className="flex items-center justify-between">
          <span className="uppercase tracking-wider text-m2e-text-muted">Fee</span>
          <span className="text-m2e-text">{feesLoading ? '…' : fees ? `${fees.nftExportFeeSap.toLocaleString()} SAP` : '—'}</span>
        </li>
        {socketedPartCount > 0 && (
          <li className="flex items-center justify-between">
            <span className="uppercase tracking-wider text-m2e-text-muted">Parts unsocketed</span>
            <span className="text-m2e-text">{socketedPartCount} returned to inventory</span>
          </li>
        )}
      </ul>
      {errorMessage && (
        <div className="pixel-card p-3 border-m2e-danger bg-m2e-danger/10 text-m2e-danger text-xs">{errorMessage}</div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={pending}
          className="pixel-btn px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={pending || feesLoading}
          className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-40"
        >
          <Upload className="w-4 h-4" />
          {pending ? 'Exporting…' : 'Confirm Export'}
        </button>
      </div>
    </div>
  );
}

function ImportConfirmPanel({
  tokenId,
  pending,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  tokenId: number;
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-5 pt-4 border-t-2 border-m2e-border space-y-3">
      <h3 className="text-sm uppercase tracking-widest text-m2e-text">Confirm Import</h3>
      <p className="text-xs text-m2e-text-secondary leading-relaxed">
        This burns the NFT <span className="text-m2e-text">#{tokenId}</span> on-chain and returns the bike to your in-game inventory with full HP and durability. The burn is permanent — you can always export again later.
      </p>
      {errorMessage && (
        <div className="pixel-card p-3 border-m2e-danger bg-m2e-danger/10 text-m2e-danger text-xs">{errorMessage}</div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={pending}
          className="pixel-btn px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          {pending ? 'Importing…' : 'Confirm Import'}
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  onClose,
}: {
  result: { kind: 'export' | 'import'; txHash: string | null; tokenId: number | null };
  onClose: () => void;
}) {
  const title = result.kind === 'export' ? 'Exported on-chain' : 'Imported to game';
  const body = result.kind === 'export'
    ? `Your bike is now an on-chain NFT${result.tokenId != null ? ` (#${result.tokenId})` : ''}. It's in your wallet and ready to sell or transfer.`
    : 'Your bike is back in your inventory at full HP. You can equip it and start earning again.';

  return (
    <div className="mt-5 pt-4 border-t-2 border-m2e-border space-y-3">
      <h3 className="text-sm uppercase tracking-widest text-m2e-success">{title}</h3>
      <p className="text-xs text-m2e-text-secondary leading-relaxed">{body}</p>
      {result.txHash && (
        <a
          href={txExplorerUrl(result.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-m2e-accent hover:underline uppercase tracking-wider"
        >
          <ExternalLink className="w-4 h-4" />
          View transaction
        </a>
      )}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="pixel-btn pixel-btn-primary px-4 py-2 text-xs uppercase tracking-wider"
        >
          Done
        </button>
      </div>
    </div>
  );
}
