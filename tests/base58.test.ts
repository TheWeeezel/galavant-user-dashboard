import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base58Encode } from '../src/lib/base58.ts';

const utf8 = (s: string) => new TextEncoder().encode(s);

test('encodes the classic vectors', () => {
  assert.equal(base58Encode(utf8('Hello World!')), '2NEpo7TZRRrLZSi2U');
  assert.equal(
    base58Encode(utf8('The quick brown fox jumps over the lazy dog.')),
    'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z',
  );
});

test('leading zero bytes become leading 1s', () => {
  assert.equal(base58Encode(new Uint8Array([0x00, 0x00, 0x28, 0x7f, 0xb4, 0xcd])), '11233QC4');
  assert.equal(base58Encode(new Uint8Array([0])), '1');
  assert.equal(base58Encode(new Uint8Array([0, 0, 0])), '111');
});

test('empty input is the empty string', () => {
  assert.equal(base58Encode(new Uint8Array()), '');
});

test('a 64-byte signature encodes to 87 or 88 characters of the alphabet', () => {
  const sig = new Uint8Array(64);
  for (let i = 0; i < 64; i++) sig[i] = (i * 37 + 11) & 0xff;
  const text = base58Encode(sig);
  assert.ok(text.length === 87 || text.length === 88, `length ${text.length}`);
  assert.match(text, /^[1-9A-HJ-NP-Za-km-z]+$/);
});
