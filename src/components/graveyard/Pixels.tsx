import { useState, type CSSProperties } from 'react';
import { config } from '../../config';

/**
 * The graveyard's pixel pieces: our own sneaker sprites (never STEPN's art), a few glyphs and the
 * bike's trading card with its soul mark. Everything is rects on a grid with crispEdges, so it
 * stays sharp at any size and matches the app and the NFT image cell for cell. The stones live in
 * Gravestone.tsx, the hero scene in Scene.tsx; both draw with `rowsToRects` from here.
 */

export interface PixelRect { x: number; y: number; w: number; fill: string }

/**
 * Rows of characters → horizontal runs of rects, one per colour in `fills`. '.' and any character
 * mapped to null are left open. Runs keep the rect count small: a 20×10 sprite is ~40 rects.
 */
export function rowsToRects(rows: readonly string[], fills: Record<string, string | null | undefined>): PixelRect[] {
  const rects: PixelRect[] = [];
  const w = rows[0]?.length ?? 0;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < w; ) {
      const c = rows[y][x];
      const fill = c === '.' ? null : fills[c];
      if (!fill) { x++; continue; }
      let run = 0;
      while (x + run < w && rows[y][x + run] === c) run++;
      rects.push({ x, y, w: run, fill });
      x += run;
    }
  }
  return rects;
}

// o outline, u upper (quality tint), a stripe (lighter tint), l lace, s sole
const SPRITES: Record<string, string[]> = {
  walker: [
    '....................',
    '..ooooo.............',
    '.ouuuuuo............',
    '.ouuuuuoooooooo.....',
    '.ouulululuuuuuuooo..',
    '.ouuululuuuuuuuuuuo.',
    '.ouuuulululuuuuuuuo.',
    '.oooooooooooooooooo.',
    '.ossssssssssssssssso',
    '..oooooooooooooooooo',
  ],
  jogger: [
    '..ooooo.............',
    '.ouuuuuo............',
    '.ouuuuuo............',
    '.ouuuuuoooooooo.....',
    '.ouulululuuuuuuooo..',
    '.oaaaululaaaaaauuuo.',
    '.ouuuulululuuuuuuuo.',
    '.oooooooooooooooooo.',
    '.ossssssssssssssssso',
    '..oooooooooooooooooo',
  ],
  runner: [
    '....................',
    '....................',
    '..oooo..............',
    '.ouuuuoooooo........',
    '.ouulululuuuoooo....',
    '.ouuululuaaaauuuoooo',
    '.oaaaaululaaaaaaauuo',
    '.oooooooooooooooooo.',
    '.ossssssssssssssssso',
    '..ooooooooooooooooo.',
  ],
  trainer: [
    '..oooooo............',
    '.ouuuuuuo...........',
    '.ouluuluo...........',
    '.ouuluuuo...........',
    '.ouluuluooooooo.....',
    '.ouuluuluuuuuuuooo..',
    '.ouuuluuluuuuuuuuuo.',
    '.oooooooooooooooooo.',
    '.ossssssssssssssssso',
    '..oooooooooooooooooo',
  ],
};

/** STEPN's type names ("Runner") → the sprite key. Anything unknown walks. */
export function sneakerKey(type: string): string {
  const key = type.toLowerCase();
  return key in SPRITES ? key : 'walker';
}

/** The body each sneaker type suggests — the bike whose band matches its pace. Any body is allowed. */
export const SUGGESTED_BIKE: Record<string, string> = {
  walker: 'Commuter',
  jogger: 'Touring',
  runner: 'Racing',
  trainer: 'Electric',
};

const QUALITY_TEXT: Record<string, string> = {
  common: 'text-m2e-common',
  uncommon: 'text-m2e-uncommon',
  rare: 'text-m2e-rare',
  epic: 'text-m2e-epic',
  legendary: 'text-m2e-legendary',
};

/** The rarity colour class for a quality name in any case. */
export function qualityTextClass(quality: string): string {
  return QUALITY_TEXT[quality.toLowerCase()] ?? QUALITY_TEXT.common;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** "2/7" as STEPN writes it → "minted twice". Null when the trait is missing. */
export function mintCountText(mintCount: string | null): string | null {
  if (!mintCount) return null;
  const n = Number(mintCount.split('/')[0]);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 'never minted';
  if (n === 1) return 'minted once';
  if (n === 2) return 'minted twice';
  return `minted ${n} times`;
}

/** "Lv 6 · minted twice" — the soul after its quality, which callers colour themselves. */
export function soulDetail(soul: { level: number; mintCount: string | null }): string {
  return [`Lv ${soul.level}`, mintCountText(soul.mintCount)].filter(Boolean).join(' · ');
}

/** "Common · Lv 6 · minted twice" — the soul in one line. */
export function soulLine(soul: { quality: string; level: number; mintCount: string | null }): string {
  return `${capitalize(soul.quality)} · ${soulDetail(soul)}`;
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "20 Oct 2026, 14:03 UTC" — the chain's clock, so two players never see two different times. */
export function formatDayTimeUtc(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  return `${day}, ${time} UTC`;
}

/** The shop's base art for a bike type — the same picture the store card shows. */
export function bikeArtUrl(type: string): string {
  return `${config.apiUrl}/art/bases/bike-${type.toLowerCase()}.png`;
}

interface SpriteProps {
  type: string;
  quality: string;
  /** One colour for the whole sneaker: engraved on a stone, a ghost, a soul. Laces are left open. */
  mono?: string;
  className?: string;
}

export function SneakerSprite({ type, quality, mono, className = '' }: SpriteProps) {
  const rows = SPRITES[sneakerKey(type)];
  const h = rows.length;
  const w = rows[0].length;
  const q = `var(--color-m2e-${qualityTextClass(quality).replace('text-m2e-', '')})`;
  const fills: Record<string, string | null> = mono
    ? { o: mono, u: `color-mix(in srgb, ${mono} 42%, transparent)`, a: `color-mix(in srgb, ${mono} 62%, transparent)`, l: null, s: mono }
    : { o: 'var(--color-m2e-chrome)', u: q, a: `color-mix(in srgb, ${q} 55%, #FEFCF7)`, l: '#FEFCF7', s: 'var(--color-m2e-text-secondary)' };
  const rects = rowsToRects(rows, fills);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden className={`block w-full h-auto ${className}`}>
      {rects.map((r) => <rect key={`${r.y}-${r.x}`} x={r.x} y={r.y} width={r.w} height={1} style={{ fill: r.fill }} />)}
    </svg>
  );
}

const GLYPHS = {
  check: ['.......#', '......##', '.....##.', '#...##..', '##.##...', '.###....', '..#.....'],
  arrow: ['....#...', '.....#..', '......#.', '########', '......#.', '.....#..', '....#...'],
  wisp: ['..##..', '.####.', '######', '######', '.####.', '..##..'],
  /** A soul: the wisp with a tail, as the card's soul icon draws it. */
  soul: ['...##...', '..####..', '.######.', '.######.', '..####..', '...##...', '..#..#..', '.#....#.'],
  /** Two laurel branches, engraved on a slab stone. */
  laurel: [
    '#......#......#',
    '.#..#..#..#..#.',
    '.#.#.#.#.#.#.#.',
    '..#.##.#.##.#..',
    '..#..#.#.#..#..',
    '...#.#.#.#.#...',
    '....##.#.##....',
    '.....#.#.#.....',
    '......###......',
  ],
} as const;

/** A tiny pixel glyph in currentColor, so no icon font has to carry a seven-pixel arrow. */
export function PixelGlyph({ name, className = '', style }: { name: keyof typeof GLYPHS; className?: string; style?: CSSProperties }) {
  const rows = GLYPHS[name];
  const h = rows.length;
  const w = rows[0].length;
  const cells: [number, number][] = [];
  rows.forEach((row, y) => { for (let x = 0; x < w; x++) if (row[x] === '#') cells.push([x, y]); });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden className={`inline-block ${className}`} style={style}>
      {cells.map(([x, y]) => <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill="currentColor" />)}
    </svg>
  );
}

/** The example cards the page shows before a player has their own (rendered by the server's card code). */
export const EXAMPLE_CARDS = { reborn: '/graveyard/card-reborn.jpg', inherited: '/graveyard/card-inherited.jpg' } as const;

interface MarkedBikeCardProps {
  /** The card image: the server's /graveyard/card/<claim>.png, or an example. */
  src: string;
  /** Shown when `src` cannot be loaded (a card is drawn on demand and can be slow the first time). */
  fallback?: string;
  alt: string;
  className?: string;
}

/**
 * A soul's bike as its trading card — the same card the app reveals and the NFT shows: the bike's
 * Steel card with the soul's mark («Reborn» or «Inherited» + the sneaker number) and a soul haze
 * around the bike.
 */
export function MarkedBikeCard({ src, fallback, alt, className = '' }: MarkedBikeCardProps) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed && fallback ? fallback : src}
      alt={alt}
      width={720}
      height={1008}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`block w-full h-auto drop-shadow-[4px_4px_0_rgba(44,36,32,0.85)] ${className}`}
    />
  );
}
