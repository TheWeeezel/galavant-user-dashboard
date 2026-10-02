import { formatUsd } from './StoreBikeCard';
import type { StoreCatalog, StoreProduct, StoreStock } from '../api';

/**
 * The run, in batches of fifty: where it stands, what the next batch costs, and — unfolded — the
 * whole ladder to the last bike.
 *
 * A limited run whose price climbs is only a reason to buy today if the buyer can SEE it. One
 * number ("it gets dearer") is a claim; "batch 1 of 20, 23 left, then $5.30, and here is every
 * price to the end" is something they can check against the card below and decide on.
 *
 * Nothing is computed here. The batch, the next price and the ladder all come from
 * `/store/products`, which is the same arithmetic the till charges with — a page that worked out
 * its own prices would eventually promise one the shop does not honour.
 */
export function StoreBatchStrip({
  band,
  ladder,
  products,
  stock,
}: {
  band: NonNullable<StoreCatalog['priceBand']>;
  ladder: StoreCatalog['priceLadder'];
  products: StoreProduct[];
  stock: StoreStock | undefined;
}) {
  const soldPct = band.size > 0 ? Math.min(100, Math.round((band.soldInBand / band.size) * 100)) : 0;
  const next = products.filter((p) => p.nextPriceUsdCents != null);
  const names = products.map((p) => ({ type: p.type, name: p.displayName }));

  return (
    <div className="pixel-card p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="section-label text-m2e-accent">
          Batch {band.index + 1} of {band.bands}
        </div>
        <div className="text-sm text-m2e-text-secondary tabular-nums">
          {band.soldInBand} of {band.size} sold in this batch
          {band.remainingAtThisPrice > 0 && (
            <>
              {' · '}
              <span className="text-m2e-warning-deep">{band.remainingAtThisPrice} left at this price</span>
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

      {stock && stock.totalCap > 0 && (
        <div className="text-xs text-m2e-text-secondary tabular-nums">
          {stock.totalSold} of {stock.totalCap} bikes sold in the whole run
          {stock.dailyCap > 0 && <> · {Math.max(0, stock.dailyCap - stock.soldToday)} still available today</>}
        </div>
      )}

      {band.isLast ? (
        <p className="text-sm text-m2e-text-secondary">
          Final batch — {band.remainingAtThisPrice} {band.remainingAtThisPrice === 1 ? 'bike' : 'bikes'} left in the
          whole run. There is no next price; when these are gone the shop is done.
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

      {ladder && ladder.length > 1 && (
        <details className="group">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-m2e-accent marker:content-['']">
            <span className="group-open:hidden">Show every batch to the last bike ▾</span>
            <span className="hidden group-open:inline">Hide the full run ▴</span>
          </summary>

          {/* Wide on purpose: five columns of numbers read better side by side than stacked, so the
              table scrolls inside its own box rather than pushing the page sideways. */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs tabular-nums border-collapse">
              <thead>
                <tr className="text-m2e-text-secondary uppercase tracking-wider text-[10px]">
                  <th className="text-left py-1 pr-3 font-normal">Batch</th>
                  <th className="text-left py-1 pr-3 font-normal">Bikes</th>
                  {names.map((n) => (
                    <th key={n.type} className="text-right py-1 pl-3 font-normal">{n.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ladder.map((row) => {
                  const current = row.index === band.index;
                  const past = row.index < band.index;
                  return (
                    <tr
                      key={row.index}
                      className={
                        current
                          ? 'text-m2e-accent border-y-2 border-m2e-accent'
                          : past
                            ? 'text-m2e-text-muted line-through'
                            : 'text-m2e-text'
                      }
                    >
                      <td className="py-1 pr-3">
                        {row.index + 1}
                        {current && <span className="text-[10px] uppercase tracking-wider"> · now</span>}
                      </td>
                      <td className="py-1 pr-3">{row.from}–{row.to}</td>
                      {names.map((n) => (
                        <td key={n.type} className="py-1 pl-3 text-right">{formatUsd(row.prices[n.type] ?? 0)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
