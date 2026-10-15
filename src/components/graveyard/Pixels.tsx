import { useState, type CSSProperties } from 'react';
import { config } from '../../config';
import type { GraveyardStone } from '../../api';

/**
 * The graveyard's pixel pieces: our own sneaker sprites (never STEPN's art), a few glyphs, the
 * bike's trading card with its soul ribbon, and a tombstone. Everything is rects on a grid with
 * crispEdges, so it stays sharp at any size and matches the app and the NFT image cell for cell.
 */

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
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  for (let y = 0; y < h; y++) {
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
 * Steel card with the soul's ribbon («Reborn» or «Inherited» + the sneaker number) across the art.
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

/**
 * One stone on the wall. The sneaker is engraved in the stone's own colour, like a ghost; a soul
 * still waiting for its bike sends a wisp up now and then, staggered by the sneaker number so the
 * wall never breathes in step.
 */
export function Tombstone({ stone }: { stone: GraveyardStone }) {
  const waiting = !stone.rebornAs;
  return (
    <div className="gy-stone transition-transform motion-safe:hover:-translate-y-1">
      <div className="gy-stone-in px-3 pt-4 pb-3 grid gap-1 justify-items-center text-center">
        <div className="relative w-[52px] opacity-80 mb-1">
          <SneakerSprite type={stone.type} quality={stone.quality} mono="var(--color-m2e-stone-text)" />
          {waiting && (
            <PixelGlyph
              name="wisp"
              className="gy-wisp absolute left-[42%] -top-2 w-2.5 text-m2e-accent"
              style={{ animationDelay: `${(Number(stone.number.slice(-1)) || 0) * 0.3}s` }}
            />
          )}
        </div>
        <div className="text-2xl leading-none tabular-nums">#{stone.number}</div>
        <div className="text-base whitespace-nowrap">
          {capitalize(stone.type)} · <span className={qualityTextClass(stone.quality)}>{capitalize(stone.quality)}</span>
        </div>
        <div className="text-sm opacity-80">Level {stone.level}</div>
        <div className="text-sm opacity-75 border-t-2 border-dotted border-m2e-stone-dark pt-1.5 mt-1 w-full">
          laid to rest {formatDay(stone.burnedAt)}
        </div>
        {stone.rebornAs ? (
          stone.card ? (
            <a href={`${config.apiUrl}${stone.card}`} target="_blank" rel="noopener noreferrer" className="text-base text-m2e-accent-dark underline decoration-dotted underline-offset-2">
              {stone.mark === 'inherited' ? 'lives on in a' : 'reborn as'} {capitalize(stone.rebornAs)}
            </a>
          ) : (
            <div className="text-base text-m2e-accent-dark">{stone.mark === 'inherited' ? 'lives on in a' : 'reborn as'} {capitalize(stone.rebornAs)}</div>
          )
        ) : (
          <div className="text-base opacity-70 border-2 border-dashed border-m2e-stone-dark px-2 mt-0.5">soul waiting</div>
        )}
      </div>
    </div>
  );
}
