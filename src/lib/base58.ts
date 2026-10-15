/**
 * Base58 with the Bitcoin alphabet — how Solana prints addresses and signatures, and what the
 * graveyard API takes for both (services/graveyard.ts decodes base58 first).
 *
 * Encoder only, written here on purpose: the website signs nothing itself and reads no chain, so
 * the one thing it needs from the whole Solana toolchain is these thirty lines, not an SDK and
 * not an RPC host in the CSP.
 */
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(bytes: Uint8Array): string {
  // Leading zero bytes have no place value; they become leading '1's.
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;

  // Base-256 → base-58 by long division, least significant digit first.
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let out = '1'.repeat(zeros);
  for (let k = digits.length - 1; k >= 0; k--) out += ALPHABET[digits[k]];
  return out;
}
