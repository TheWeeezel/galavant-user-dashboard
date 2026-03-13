import { config } from '../config';
import type { MintedNft } from '../api';

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

function resolveImageUrl(nft: MintedNft): string {
  if (nft.imageUrl) {
    return nft.imageUrl.startsWith('/') ? `${config.apiUrl}${nft.imageUrl}` : nft.imageUrl;
  }
  return `${config.apiUrl}/art/bases/bike-${nft.type.toLowerCase()}.png`;
}

interface StatBarProps {
  label: string;
  base: number;
  added: number;
  max: number;
  color: string;
  colorLight: string;
}

function StatBar({ label, base, added, max, color, colorLight }: StatBarProps) {
  const total = base + added;
  const basePct = Math.min((base / max) * 100, 100);
  const addedPct = Math.min((added / max) * 100, 100 - basePct);

  return (
 <div className="flex items-center gap-2 text-xs">
 <span className="w-8 text-m2e-text-secondary uppercase">{label}</span>
      <div
 className="flex-1 h-4 bg-m2e-bg-alt overflow-hidden pixel-border"
        style={{
          borderBottomWidth: '3px',
          boxShadow: '2px 2px 0px 0px var(--color-m2e-shadow)',
        }}
      >
 <div className="h-full flex">
          <div
 className={`h-full ${color}`}
            style={{
              width: `${basePct}%`,
              borderTop: '2px solid rgba(255,255,255,0.4)'
            }}
          />
          {added > 0 && (
            <div
 className={`h-full ${colorLight}`}
              style={{
                width: `${addedPct}%`,
                borderTop: '2px solid rgba(255,255,255,0.2)',
              }}
            />
          )}
        </div>
      </div>
 <span className="w-12 text-right text-m2e-text">{total}/{max}</span>
    </div>
  );
}

export function NftCard({ nft, onClick }: { nft: MintedNft; onClick?: () => void }) {
  const tierMax = QUALITY_MAX[nft.quality] ?? 112;

  return (
 <div className="pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors cursor-pointer" onClick={onClick}>
      {/* Image */}
 <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border">
        <img
          src={resolveImageUrl(nft)}
          alt={`${nft.type} #${nft.tokenId}`}
 className="w-full h-full object-cover pixel-render"
          loading="lazy"
        />
 <span className="absolute top-2 left-2 px-2 py-0.5 text-xs bg-m2e-card text-m2e-accent pixel-border shadow-sm tracking-wide uppercase">
          #{nft.tokenId}
        </span>
      </div>

      {/* Info */}
 <div className="p-3 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-sm uppercase tracking-wide text-m2e-text">{nft.type}</span>
 <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide border-opacity-50 ${qualityColors[nft.quality] ?? qualityColors.common}`}>
            {nft.quality}
          </span>
        </div>

 <div className="flex items-center justify-between text-xs text-m2e-text-muted tracking-wide uppercase">
          <span>Lv. {nft.level}</span>
 <span className="truncate max-w-[100px]" title={nft.id}>{nft.id.slice(0, 8)}</span>
        </div>

        {/* Stat Bars */}
 <div className="space-y-1 pt-1">
          <StatBar label="EAR" base={nft.baseEarning} added={nft.addedEarning} max={tierMax} color="bg-m2e-earning" colorLight="bg-m2e-earning/50" />
          <StatBar label="LCK" base={nft.baseLuck} added={nft.addedLuck} max={tierMax} color="bg-m2e-luck" colorLight="bg-m2e-luck/50" />
          <StatBar label="REC" base={nft.baseRecovery} added={nft.addedRecovery} max={tierMax} color="bg-m2e-recovery" colorLight="bg-m2e-recovery/50" />
          <StatBar label="DUR" base={nft.baseDurability} added={nft.addedDurability} max={tierMax} color="bg-m2e-durability" colorLight="bg-m2e-durability/50" />
        </div>
      </div>
    </div>
  );
}
