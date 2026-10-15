import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RETIRED_RUNNER_FRAME, plateDigitRects, plateText, soulFrameLayers, soulQuality } from '../src/lib/soulFrame.ts';

const { plate } = RETIRED_RUNNER_FRAME;

test('the plate text sits centred inside the plate text area', () => {
  const rects = plateDigitRects('922411691');
  // "#" + nine digits: 10 glyphs of 3 cells with 1-cell gaps = 39 cells on a 42-cell area.
  const xs = rects.map(([x, , w]) => [x, x + w] as const);
  assert.equal(Math.min(...xs.map(([a]) => a)), plate.text.x + 1);
  assert.equal(Math.max(...xs.map(([, b]) => b)), plate.text.x + 1 + 39);
  for (const [x, y, w, h] of rects) {
    assert.ok(x >= plate.text.x && x + w <= plate.text.x + plate.text.w, `x ${x}+${w}`);
    assert.ok(y >= plate.text.y && y + h <= plate.text.y + plate.text.h, `y ${y}+${h}`);
    assert.equal(h, 1);
  }
});

test('every glyph is laid out as 1-cell-high runs, with the design example count', () => {
  // The design mockup's spec readout: 58 digit rects for #922411691.
  assert.equal(plateDigitRects('922411691').length, 58);
  // "#1" — the hash is 11 cells in 5 rows (3+1+3+1+3 → runs: 2,1,2,1,2 = 8 rects), "1" is 5 rows with
  // ".#.", "##.", ".#.", ".#.", "###" → 5 rects.
  assert.equal(plateDigitRects('1').length, 8 + 5);
});

test('the plate text keeps the "#" up to nine digits, drops it at ten, and keeps the last ten past that', () => {
  assert.equal(plateText('922411691'), '#922411691');
  assert.equal(plateText('1'), '#1');
  assert.equal(plateText(''), '#');
  assert.equal(plateText('1234567890'), '1234567890');
  assert.equal(plateText('1234567890123'), '4567890123');
  // Non-digits never reach the plate.
  assert.equal(plateText('#92-24'), '#9224');
  assert.deepEqual(plateDigitRects('#92-24'), plateDigitRects('9224'));
  // Ten glyphs fill the plate text area exactly as nine digits plus the hash do.
  assert.equal(plateDigitRects('1234567890').every(([x, , w]) => x >= 44 && x + w <= 83), true);
});

test('quality names map to the four frames, Legendary wearing Epic', () => {
  assert.equal(soulQuality('Common'), 'common');
  assert.equal(soulQuality('UNCOMMON'), 'uncommon');
  assert.equal(soulQuality('rare'), 'rare');
  assert.equal(soulQuality('Epic'), 'epic');
  assert.equal(soulQuality('Legendary'), 'epic');
  assert.equal(soulQuality('anything else'), 'common');
});

test('layers follow the draw order and take the palette of the quality', () => {
  const layers = soulFrameLayers('Rare', '557120934');
  assert.deepEqual(
    layers.map((l) => l.fill),
    RETIRED_RUNNER_FRAME.drawOrder.map((role) => RETIRED_RUNNER_FRAME.palettes.rare[role]),
  );
  // Static roles are the spec's rects by reference; the digit layer is computed.
  assert.equal(layers[0].rects, RETIRED_RUNNER_FRAME.rects.band);
  assert.equal(layers[layers.length - 1].rects.length, plateDigitRects('557120934').length);
});
