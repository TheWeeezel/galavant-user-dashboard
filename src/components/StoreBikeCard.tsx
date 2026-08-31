import { config } from '../config';
import type { StoreProduct, StoreStock } from '../api';

/** Quality tiers wear material names everywhere else in the game, so the shop says Steel, not "common". */
const MATERIAL_NAMES: Record<string, string> = {
  common: 'Steel',
  uncommon: 'Moss',
  rare: 'Blue Hour',
  epic: 'Orchid',
  legendary: 'Brass',
};

const QUALITY_BADGE: Record<string, string> = {
  common: 'pixel-badge-common',
  uncommon: 'pixel-badge-uncommon',
  rare: 'pixel-badge-rare',
  epic: 'pixel-badge-epic',
  legendary: 'pixel-badge-legendary',
};

/** Who each frame suits, in the same words the landing page uses. No speed numbers. */
const TYPE_FIT: Record<string, string> = {
  commuter: 'Leisurely walkers',
  touring: 'Brisk walkers',
  racing: 'Power walkers',
  electric: 'Any walker',
};

export type PayMethod = 'card' | 'enj';

export interface Offer {
  buyable: boolean;
  /** Why the bike cannot be bought, in the player's words. Null while it is on sale. */
  reason: string | null;
}

/**
 * Why a bike is not buyable.
 *
 * The catalog only ever says `available: false`, and the three reasons behind that flag ask the
 * player for completely different things: wait a day, wait for the shop, or stop waiting. So the
 * reason is reconstructed from the two public payloads — the price and the flag on the product,
 * the caps on the stock endpoint — rather than guessed. Telling someone "sold out" when checkout
 * is merely still switched off sends them away for good over a problem that clears by Friday.
 */
export function describeOffer(
  product: StoreProduct,
  catalogEnabled: boolean,
  stock: StoreStock | undefined,
): Offer {
  if (product.available) return { buyable: true, reason: null };
  if (!(product.priceUsdCents > 0)) {
    return { buyable: false, reason: 'Not for sale right now — this frame has no price yet.' };
  }
  if (stock) {
    if (stock.totalCap > 0 && stock.totalSold >= stock.totalCap) {
      return { buyable: false, reason: 'Sold out — this run of shop bikes is gone.' };
    }
    if (stock.dailyCap > 0 && stock.soldToday >= stock.dailyCap) {
      return { buyable: false, reason: "Today's batch is gone — fresh bikes tomorrow." };
    }
  }
  if (!catalogEnabled) {
    // Deliberately terse: the page already carries the full explanation once, above the grid, and
    // four cards repeating the same sentence under four prices is noise, not honesty.
    return { buyable: false, reason: 'Not on sale yet.' };
  }
  return { buyable: false, reason: 'Not available right now.' };
}

/**
 * The ENJ price as the server sent it, or null. The whole ENJ block hangs off this: no usable
 * number from the server means no ENJ price and no ENJ button, so an unfinished ENJ path can
 * never put a button in front of a player that leads nowhere.
 */
export function enjPrice(product: StoreProduct): number | null {
  const raw = product.priceEnj;
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function formatEnj(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface StoreBikeCardProps {
  product: StoreProduct;
  catalogEnabled: boolean;
  stock: StoreStock | undefined;
  signedIn: boolean;
  /** Which of this card's buttons is mid-checkout, if any. */
  busy: PayMethod | null;
  /** True while any checkout on the page runs — one order at a time keeps the money story clear. */
  locked: boolean;
  /** The last checkout failure for this card. Null once another attempt starts. */
  error: string | null;
  onBuy: (method: PayMethod) => void;
}

export function StoreBikeCard({
  product,
  catalogEnabled,
  stock,
  signedIn,
  busy,
  locked,
  error,
  onBuy,
}: StoreBikeCardProps) {
  const offer = describeOffer(product, catalogEnabled, stock);
  const enj = enjPrice(product);
  const material = MATERIAL_NAMES[product.quality] ?? product.quality;
  const badge = QUALITY_BADGE[product.quality] ?? QUALITY_BADGE.common;
  const fit = TYPE_FIT[product.type];
  const disabled = !offer.buyable || locked;

  return (
    <div className="pixel-card overflow-hidden flex flex-col">
      <div className="relative aspect-[16/9] bg-white border-b-2 border-m2e-border flex items-center justify-center">
        <span className="absolute text-2xl text-m2e-text-muted uppercase tracking-widest">
          {product.displayName}
        </span>
        {/* Sits on top of the label, so a missing PNG uncovers the name instead of a hole. */}
        <img
          src={`${config.apiUrl}/art/bases/bike-${product.type}.png`}
          alt={`${material} ${product.displayName} bike`}
          className="relative w-full h-full object-contain pixel-render"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide ${badge}`}>
          {material}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="text-xl uppercase tracking-wide">{product.displayName}</div>
          {fit && <div className="text-xs uppercase tracking-wider text-m2e-text-secondary">{fit}</div>}
        </div>

        <div>
          {product.priceUsdCents > 0 ? (
            <div className="text-3xl text-m2e-accent">{formatUsd(product.priceUsdCents)}</div>
          ) : (
            <div className="text-3xl text-m2e-text-muted">—</div>
          )}
          {enj !== null && (
            <>
              <div className="text-sm text-m2e-text-secondary">or {formatEnj(enj)} ENJ</div>
              {/* The listed ENJ figure follows the market; the amount you owe is the one fixed when
                  you start the payment. Saying so here is cheaper than a surprise at the till. */}
              <div className="text-[10px] uppercase tracking-wider text-m2e-text-secondary">
                ENJ amount is fixed when you start
              </div>
            </>
          )}
        </div>

        {offer.reason && <p className="text-xs text-m2e-text-secondary">{offer.reason}</p>}

        <div className="mt-auto flex flex-col gap-2">
          <button
            className="pixel-btn pixel-btn-primary px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            onClick={() => onBuy('card')}
          >
            {busy === 'card' ? 'Opening checkout…' : signedIn ? 'Buy with card' : 'Sign in to buy'}
          </button>

          {/* Second way, and only ever a real one: this button exists only while the server itself
              quotes ENJ for this bike. */}
          {enj !== null && (
            <button
              className="pixel-btn pixel-btn-outline px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
              onClick={() => onBuy('enj')}
            >
              {busy === 'enj' ? 'Opening ENJ payment…' : signedIn ? 'Pay with ENJ' : 'Sign in to pay'}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-m2e-danger-deep">{error}</p>}
      </div>
    </div>
  );
}
