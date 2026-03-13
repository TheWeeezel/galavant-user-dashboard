import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cancel, Lock, Coins, Leaf, Heart, Shield } from 'pixelarticons/react';
import { config } from '../config';
import { fetchNftDetail } from '../api';
import type { MintedNftDetail, PartSocket } from '../api';

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

function resolveImageUrl(nft: { imageUrl: string | null; type: string; tokenId: number }): string {
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

  return (
 <div className="space-y-5">
      {/* Header: image + basic info */}
 <div className="flex gap-4">
 <div className="w-32 h-32 shrink-0 bg-m2e-bg-alt pixel-border overflow-hidden">
          <img
            src={resolveImageUrl(nft)}
            alt={`${nft.type} #${nft.tokenId}`}
 className="w-full h-full object-cover pixel-render"
          />
        </div>
 <div className="flex-1 space-y-2">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-lg uppercase tracking-wide text-m2e-text">
              #{nft.tokenId}
            </span>
 <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide ${qualityColors[nft.quality] ?? qualityColors.common}`}>
              {nft.quality}
            </span>
          </div>
 <div className="text-sm uppercase tracking-wide text-m2e-text-secondary">
            {nft.type}
          </div>
 <div className="text-xs text-m2e-text-muted space-x-3">
            <span>Lv. {nft.level}</span>
            <span title={nft.id}>ID: {truncateId(nft.id)}</span>
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
}

export function NftDetailModal({ nftId, onClose }: NftDetailModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['nft-detail', nftId],
    queryFn: () => fetchNftDetail(nftId),
  });

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
 <div className="absolute inset-0 bg-black/70" />
      <div
 className="relative w-full max-w-lg pixel-card bg-m2e-card p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
 className="absolute top-3 right-3 p-1 text-m2e-text-muted hover:text-m2e-text transition-colors"
        >
 <Cancel className="w-6 h-6" />
        </button>

        {isLoading ? (
 <div className="py-12 text-center text-m2e-text-muted text-sm">Loading bike details...</div>
        ) : error ? (
 <div className="py-12 text-center text-red-400 text-sm">Failed to load details</div>
        ) : data ? (
          <ModalContent nft={data} />
        ) : null}
      </div>
    </div>
  );
}
