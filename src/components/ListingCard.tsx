import type { ReactNode } from 'react';
import { config } from '../config';
import type { MarketplaceListing, StoreListingInfo } from '../api';

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

// Optimal km/h speed range per bike type, sourced from gameplay-content.ts (Bikes → Bike Types).
const BIKE_TYPE_RANGE: Record<string, string> = {
  commuter: '2 – 5 km/h',
  touring: '5 – 9 km/h',
  racing: '10 – 18 km/h',
  electric: '2 – 18 km/h',
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

function bikeImageUrl(bikeType: string): string {
  return `${config.apiUrl}/art/bases/bike-${bikeType.toLowerCase()}.png`;
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
      <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center">
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
            <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide border-opacity-50 ${qualityColors[quality] ?? qualityColors.common}`}>
              {quality}
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

type ListingCardProps =
  | {
      listing: MarketplaceListing;
      onClick?: () => void;
    }
  | {
      storeListing: StoreListingInfo;
      onBuy: () => void;
      isBuying?: boolean;
      disabled?: boolean;
      canAfford?: boolean;
      isAuthenticated?: boolean;
    };

export function ListingCard(props: ListingCardProps) {
  // ── Store mode (BTC) ─────────────────────────────────────
  if ('storeListing' in props) {
    const { storeListing, onBuy, isBuying, disabled, canAfford = true, isAuthenticated = false } = props;
    const typeKey = storeListing.type.toLowerCase();
    const description = BIKE_TYPE_RANGE[typeKey] ?? null;
    const isDisabled = disabled || !storeListing.available || (isAuthenticated && !canAfford);

    return (
      <CardShell
        imageUrl={bikeImageUrl(storeListing.type)}
        fallbackLabel={storeListing.displayName}
        title={storeListing.displayName}
        subtitleLeft="Balance Bike"
        quality={storeListing.quality}
        priceTag={formatPrice(storeListing.priceSats)}
        priceUnit="BTC"
        description={description}
        footer={
          <>
            {isAuthenticated && !canAfford && (
              <p className="text-[10px] text-m2e-danger">Insufficient BTC</p>
            )}
            <button
              onClick={onBuy}
              disabled={isDisabled}
              className="pixel-btn pixel-btn-primary w-full py-2 text-xs disabled:opacity-50"
            >
              {isBuying
                ? 'Purchasing...'
                : !storeListing.available
                ? 'Sold Out'
                : !isAuthenticated
                ? 'Login to Buy'
                : 'Buy with BTC'}
            </button>
          </>
        }
      />
    );
  }

  // ── Marketplace mode (SAP) ───────────────────────────────
  const { listing, onClick } = props;
  const imageUrl = resolveImageUrl(listing);
  const quality = listing.item?.quality;
  const itemLabel = itemTypeLabels[listing.itemType] ?? listing.itemType;
  const title = listing.item?.type ? listing.item.type : itemLabel;

  return (
    <CardShell
      imageUrl={imageUrl}
      fallbackLabel={itemLabel}
      title={title}
      subtitleLeft={itemLabel}
      subtitleRight={listing.item?.level ? `Lv. ${listing.item.level}` : undefined}
      quality={quality}
      priceTag={formatPrice(listing.priceSatoshis)}
      priceUnit="SAP"
      metaLeft={listing.sellerName ? `by ${listing.sellerName}` : undefined}
      metaRight={timeAgo(listing.createdAt)}
      onClick={onClick}
    />
  );
}
