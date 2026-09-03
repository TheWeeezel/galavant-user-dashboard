import type { ReactNode } from 'react';
import { config } from '../config';
import type { MarketListing, MarketplaceListing } from '../api';

// Rarity as materials — the app's gem tag, not the tier word in a box.
const RARITY_MATERIALS: Record<string, { label: string; color: string }> = {
  common: { label: 'Steel', color: 'var(--color-m2e-common)' },
  uncommon: { label: 'Moss', color: 'var(--color-m2e-uncommon)' },
  rare: { label: 'Blue Hour', color: 'var(--color-m2e-rare)' },
  epic: { label: 'Orchid', color: 'var(--color-m2e-epic)' },
  legendary: { label: 'Brass', color: 'var(--color-m2e-legendary)' },
};

const itemTypeLabels: Record<string, string> = {
  bike: 'Balance Bike',
  part: 'Part',
  tool: 'Minting Tool',
};

function resolveImageUrl(listing: MarketplaceListing | MarketListing): string | null {
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
  if (listing.itemType === 'tool') {
    return `${config.apiUrl}/art/bases/tool-minting.png`;
  }
  return null;
}

function formatPrice(watts: number): string {
  if (watts >= 1_000_000) return `${(watts / 1_000_000).toFixed(1)}M`;
  if (watts >= 1_000) return `${(watts / 1_000).toFixed(1)}K`;
  return watts.toLocaleString();
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

interface CardShellProps {
  imageUrl: string | null;
  fallbackLabel: string;
  title: string;
  subtitleLeft?: ReactNode;
  subtitleRight?: ReactNode;
  quality?: string | null;
  priceTag: string;
  priceUnit: string;
  description?: string | null;
  metaLeft?: ReactNode;
  metaRight?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
}

function CardShell({
  imageUrl,
  fallbackLabel,
  title,
  subtitleLeft,
  subtitleRight,
  quality,
  priceTag,
  priceUnit,
  description,
  metaLeft,
  metaRight,
  footer,
  onClick,
}: CardShellProps) {
  return (
    <div
      className={`pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors flex flex-col ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Image or placeholder */}
      <div className="relative aspect-[16/9] bg-white border-b-2 border-m2e-border flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={fallbackLabel}
            className="w-full h-full object-contain pixel-render"
            loading="lazy"
          />
        ) : (
          <span className="text-3xl text-m2e-text-muted uppercase tracking-widest">
            {fallbackLabel}
          </span>
        )}
        {/* Price tag */}
        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-m2e-accent text-m2e-text-on-accent pixel-border shadow-sm tracking-wide border-m2e-accent-dark">
          {priceTag} {priceUnit}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wide text-m2e-text">{title}</span>
                    {quality && (
            <span
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider"
              style={{ color: (RARITY_MATERIALS[quality] ?? RARITY_MATERIALS.common).color }}
            >
              <span
                className="w-2 h-2 rotate-45 rounded-[1px] inline-block"
                style={{ backgroundColor: (RARITY_MATERIALS[quality] ?? RARITY_MATERIALS.common).color }}
              />
              {(RARITY_MATERIALS[quality] ?? RARITY_MATERIALS.common).label}
            </span>
          )}
        </div>

        {(subtitleLeft || subtitleRight) && (
          <div className="flex items-center justify-between text-xs text-m2e-text-muted tracking-wide uppercase">
            <span>{subtitleLeft}</span>
            {subtitleRight && <span>{subtitleRight}</span>}
          </div>
        )}

        {description && (
          <p className="text-xs text-m2e-text-muted flex-1">{description}</p>
        )}

        {(metaLeft || metaRight) && (
          <div className="flex items-center justify-between text-xs text-m2e-text-muted">
            {metaLeft ? <span className="truncate max-w-[100px]">{metaLeft}</span> : <span />}
            {metaRight && <span>{metaRight}</span>}
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}

type ListingCardProps = {
  /**
   * Either shop's row. A merged row (`/market`) carries `currency` and says what the buyer
   * walks away with; the legacy explorer feed on the home page carries only a WATTS price.
   */
  listing: MarketplaceListing | MarketListing;
  onClick?: () => void;
  /** Rendered under the card — the buy action for a merged row. */
  footer?: ReactNode;
};

function isMerged(l: MarketplaceListing | MarketListing): l is MarketListing {
  return 'currency' in l;
}

export function ListingCard({ listing, onClick, footer }: ListingCardProps) {
  const imageUrl = resolveImageUrl(listing);
  const quality = listing.item?.quality;
  const itemLabel = itemTypeLabels[listing.itemType] ?? listing.itemType;
  const title = listing.item?.type ? listing.item.type : itemLabel;

  const merged = isMerged(listing) ? listing : null;
  const priceTag = merged
    ? (merged.currency === 'watts' ? formatPrice(merged.priceWatts ?? 0) : String(merged.priceEnj))
    : formatPrice((listing as MarketplaceListing).priceSatoshis);
  const priceUnit = merged && merged.currency === 'enj' ? 'ENJ' : 'WATTS';

  return (
    <CardShell
      imageUrl={imageUrl}
      fallbackLabel={itemLabel}
      title={title}
      subtitleLeft={itemLabel}
      subtitleRight={listing.item?.level ? `Lv. ${listing.item.level}` : undefined}
      quality={quality}
      priceTag={priceTag}
      priceUnit={priceUnit}
            // No buyerNote paragraph here: the buy button already names the outcome
      // (BUY · NFT -> YOUR WALLET); five lines of prose per card drowned the grid.
      metaLeft={listing.sellerName ? `by ${listing.sellerName}` : undefined}
      metaRight={timeAgo(listing.createdAt)}
      footer={footer}
      onClick={onClick}
    />
  );
}
