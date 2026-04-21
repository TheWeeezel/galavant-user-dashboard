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

/** Format raw satoshi amount as localized number */
export function formatSats(raw: string): string {
  return Number(raw).toLocaleString();
}

/** OPNet testnet block explorer base URL. */
export const OPNET_EXPLORER_BASE = 'https://testnet.opscan.org';

/** Link to a tx on the OPNet explorer. */
export function txExplorerUrl(txHash: string): string {
  return `${OPNET_EXPLORER_BASE}/tx/${txHash}`;
}

/**
 * Format a transaction amount for display given its currency.
 * - sat_token: 8 decimal places, shown as SAT
 * - btc: raw sats
 * - sap (and anything else): integer
 */
export function formatTxAmount(amount: number | string, currency: string): { value: string; unit: string } {
  const raw = typeof amount === 'number' ? amount.toString() : amount;
  switch (currency) {
    case 'sat_token':
      return { value: formatTokens(raw), unit: 'SAT' };
    case 'btc':
      return { value: formatSats(raw), unit: 'sats' };
    default:
      return { value: Number(raw).toLocaleString(), unit: currency.toUpperCase() };
  }
}

/**
 * Safely convert a decimal string (e.g. "0.29") to integer base units (satoshis).
 * Avoids IEEE 754 floating-point precision loss by splitting on the decimal point.
 */
export function decimalToBaseUnits(input: string, decimals = 8): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === '.' || trimmed === '0') return '0';

  const negative = trimmed.startsWith('-');
  const abs = negative ? trimmed.slice(1) : trimmed;
  const [intPart = '0', fracPart = ''] = abs.split('.');
  const paddedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0');
  const combined = intPart + paddedFrac;
  // Strip leading zeros but keep at least '0'
  const result = combined.replace(/^0+/, '') || '0';
  return negative && result !== '0' ? `-${result}` : result;
}
