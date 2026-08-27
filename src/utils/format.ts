export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Format a raw token amount (in base units, 1e8 per token) to human-readable string */
export function formatTokens(raw: string): string {
  const val = BigInt(raw);
  const whole = val / 100_000_000n;
  const frac = val % 100_000_000n;
  if (frac === 0n) return whole.toLocaleString();
  const fracStr = frac.toString().padStart(8, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

/** Enjin block explorer base URL. */
export const ENJIN_EXPLORER_BASE = 'https://matrix.subscan.io';

/** Link to a tx on the Enjin explorer. */
export function txExplorerUrl(txHash: string): string {
  return `${ENJIN_EXPLORER_BASE}/extrinsic/${txHash}`;
}

/**
 * Format a transaction amount for display given its currency.
 * - enj: 18 decimals on chain, but the API sends a plain number
 * - sap (the legacy column name for WATTS) and anything else: integer
 */
export function formatTxAmount(amount: number | string, currency: string): { value: string; unit: string } {
  const raw = typeof amount === 'number' ? amount.toString() : amount;
  switch (currency) {
    case 'enj':
      return { value: Number(raw).toLocaleString(), unit: 'ENJ' };
    case 'sap':
      return { value: Number(raw).toLocaleString(), unit: 'WATTS' };
    default:
      return { value: Number(raw).toLocaleString(), unit: currency.toUpperCase() };
  }
}
