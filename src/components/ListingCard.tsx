import { config } from '../config';
import type { MarketplaceListing } from '../api';

const qualityColors: Record<string, string> = {
  common: 'pixel-badge-common',
  uncommon: 'pixel-badge-uncommon',
  rare: 'pixel-badge-rare',
  epic: 'pixel-badge-epic',
  legendary: 'pixel-badge-legendary',
};

const itemTypeLabels: Record<string, string> = {
  bike: 'Balance Bike',
  part: 'Part',
  tool: 'Minting Tool',
};

function resolveImageUrl(listing: MarketplaceListing): string | null {
  if (listing.item?.imageUrl) {
    const url = listing.item.imageUrl;
    return url.startsWith('/') ? `${config.apiUrl}${url}` : url;
  }
  if (listing.itemType === 'bike' && listing.item?.type) {
    return `${config.apiUrl}/art/bases/bike-${listing.item.type.toLowerCase()}.png`;
  }
  if (listing.itemType === 'part' && listing.item?.type && listing.item?.level) {
    return `${config.apiUrl}/art/bases/part-${listing.item.type.toLowerCase()}-lv${listing.item.level}.png`;
  }
  return null;
}

function formatPrice(satoshis: number): string {
  if (satoshis >= 1_000_000) return `${(satoshis / 1_000_000).toFixed(1)}M`;
  if (satoshis >= 1_000) return `${(satoshis / 1_000).toFixed(1)}K`;
  return satoshis.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ListingCard({ listing, onClick }: { listing: MarketplaceListing; onClick?: () => void }) {
  const imageUrl = resolveImageUrl(listing);
  const quality = listing.item?.quality;
  const itemLabel = itemTypeLabels[listing.itemType] ?? listing.itemType;

  return (
    <div className={`pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {/* Image or placeholder */}
      <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${listing.itemType} listing`}
            className="w-full h-full object-cover pixel-render"
            loading="lazy"
          />
        ) : (
          <span className="text-3xl font-black text-m2e-text-muted uppercase tracking-widest">
            {itemLabel}
          </span>
        )}
        {/* Price tag */}
        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-black bg-m2e-accent text-m2e-text-on-accent pixel-border shadow-sm tracking-wide border-m2e-accent-dark">
          {formatPrice(listing.priceSatoshis)} SAT
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm uppercase tracking-wide text-m2e-text">
            {listing.item?.type ? `${listing.item.type}` : itemLabel}
          </span>
          {quality && (
            <span className={`px-2 py-0.5 text-[10px] font-black uppercase pixel-border shadow-sm tracking-wide border-opacity-50 ${qualityColors[quality] ?? qualityColors.common}`}>
              {quality}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-m2e-text-muted font-bold tracking-wide uppercase">
          <span>{itemLabel}</span>
          {listing.item?.level && <span>Lv. {listing.item.level}</span>}
        </div>

        <div className="flex items-center justify-between text-xs text-m2e-text-muted">
          {listing.sellerName && <span className="truncate max-w-[100px]">by {listing.sellerName}</span>}
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
