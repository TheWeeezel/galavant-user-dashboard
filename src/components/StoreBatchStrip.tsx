import { formatUsd } from './StoreBikeCard';
import type { StoreCatalog, StoreProduct } from '../api';

/**
 * The run, in batches of fifty, and what the next one costs.
 *
 * The shop sells a limited run at a price that climbs with every batch. A buyer can only act on
 * that if they can see where the run stands — which batch, how much of it is gone, and what the
 * next tag says. Shown as the whole ladder rather than one number, because "it gets dearer" is a
 * claim and "Batch 3 of 20, 23 left, then $15.80" is a fact they can check against the card below.
 *
 * Nothing here is computed in the browser: the batch comes from `/store/products` and the next
 * price is the server's own arithmetic for the next band, so the strip cannot promise a price the
 * till would not honour.
 */
export function StoreBatchStrip({
  band,
  products,
}: {
  band: NonNullable<StoreCatalog['priceBand']>;
  products: StoreProduct[];
}) {
  const soldPct = band.size > 0 ? Math.min(100, Math.round((band.soldInBand / band.size) * 100)) : 0;
  const next = products.filter((p) => p.nextPriceUsdCents != null);

  return (
    <div className="pixel-card p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="section-label text-m2e-accent">
          Batch {band.index + 1} of {band.bands}
        </div>
        <div className="text-sm text-m2e-text-secondary tabular-nums">
          {band.soldInBand} of {band.size} sold
          {band.remainingAtThisPrice > 0 && (
            <>
              {' · '}
              <span className="text-m2e-warning-deep">
                {band.remainingAtThisPrice} left at this price
              </span>
            </>
          )}
        </div>
      </div>

      {/* The batch as a bar: fifty bikes is a number, a half-full bar is a deadline. */}
      <div
        className="relative h-3 bg-m2e-bg-alt border-2 border-m2e-border overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={band.size}
        aria-valuenow={band.soldInBand}
        aria-label={`Batch ${band.index + 1}: ${band.soldInBand} of ${band.size} sold`}
      >
        <span
          className="absolute inset-y-0 left-0 bg-m2e-accent transition-[width] duration-500"
          style={{ width: `${soldPct}%` }}
        />
      </div>

      {band.isLast ? (
        <p className="text-sm text-m2e-text-secondary">
          Final batch — {band.remainingAtThisPrice} {band.remainingAtThisPrice === 1 ? 'bike' : 'bikes'} left in
          the whole run. There is no next price; when these are gone the shop is done.
        </p>
      ) : next.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-m2e-text-secondary">
            Batch {band.index + 2} costs
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {next.map((p) => (
              <div key={p.type} className="text-sm tabular-nums">
                <span className="text-m2e-text-secondary">{p.displayName} </span>
                <span className="text-m2e-warning-deep">{formatUsd(p.nextPriceUsdCents!)}</span>
                <span className="text-m2e-text-muted text-xs"> (now {formatUsd(p.priceUsdCents)})</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
