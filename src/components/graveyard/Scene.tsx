import { rowsToRects, type PixelRect } from './Pixels';

/**
 * The graveyard at dusk and by moonlight: the hero's scene, drawn as rects on a 480×270 grid the
 * way the sprites are, so it is crisp at any size and in the same hand as the rest of the page.
 * Every colour is a CSS variable set on `.gy-hero` in index.css — the day block is a dusky
 * graveyard, the night block (under [data-theme="night"]) a moonlit one — so the sky switch
 * recolours the scene without a second drawing.
 *
 * The svg covers the hero with `xMidYMax slice`: the ground always touches the bottom edge and a
 * phone sees the middle third (x 170–310), which is where the moon and the best stones stand.
 * Decorative throughout: aria-hidden, and every motion stops under prefers-reduced-motion.
 */

export const SCENE_W = 480;
export const SCENE_H = 270;

type R = { x: number; y: number; w: number; h: number };

// A tiny seeded generator, so the stars and fireflies land in the same places on every render.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ── Stones ──────────────────────────────────────────────────────────────────

export type StoneKind = 'arch' | 'cross' | 'obelisk' | 'slab';

/** A stone silhouette as rects, standing on (cx, baseY) — its bottom-centre. */
export function stoneRects(kind: StoneKind, cx: number, baseY: number, w: number, h: number): R[] {
  const left = cx - Math.floor(w / 2);
  const top = baseY - h;
  const row = (y: number, inset: number, height = 1): R => ({ x: left + inset, y, w: w - inset * 2, h: height });
  const out: R[] = [];
  if (kind === 'arch') {
    const r = w >= 11 ? 3 : 2;
    for (let i = 0; i < r; i++) out.push(row(top + i, r - i));
    out.push(row(top + r, 0, h - r));
  } else if (kind === 'slab') {
    out.push(row(top, 1));
    out.push(row(top + 1, 0, h - 1));
  } else if (kind === 'cross') {
    const arm = Math.max(1, Math.floor(w / 5));           // the cross's beam thickness
    const span = arm * 3 + (w >= 11 ? 2 : 0);              // the beam's width
    const crossH = Math.min(h - 4, arm * 5 + 1);
    out.push({ x: cx - Math.floor(arm / 2), y: top, w: arm, h: crossH });                     // upright
    out.push({ x: cx - Math.floor(span / 2), y: top + arm + 1, w: span, h: arm });          // beam
    out.push(row(top + crossH, 1));
    out.push(row(top + crossH + 1, 0, h - crossH - 1));
  } else {
    // obelisk: a stepped cap over a narrow shaft, on a plinth
    const shaft = Math.max(3, w - 4);
    const cap = Math.ceil(shaft / 2);
    for (let i = 0; i < cap; i++) {
      const width = Math.min(shaft, 1 + i * 2);
      out.push({ x: cx - Math.floor(width / 2), y: top + i, w: width, h: 1 });
    }
    out.push({ x: cx - Math.floor(shaft / 2), y: top + cap, w: shaft, h: h - cap - 2 });
    out.push(row(baseY - 2, 1));
    out.push(row(baseY - 1, 0));
  }
  return out;
}

function Rects({ rects }: { rects: R[] }) {
  return <>{rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />)}</>;
}

// ── Hills ───────────────────────────────────────────────────────────────────

/** A stepped hill: one column of `step` units per profile sample, from the profile down to `floor`. */
function hillRects(profile: (x: number) => number, step: number, floor: number): R[] {
  const out: R[] = [];
  for (let x = 0; x < SCENE_W; x += step) {
    const top = Math.round(profile(x + step / 2) / 2) * 2;
    out.push({ x, y: top, w: step, h: floor - top });
  }
  return out;
}

const mound = (x: number, cx: number, width: number, depth: number) => depth * Math.exp(-(((x - cx) / width) ** 2));
// The skyline sits in the hero's middle, level with the headline, and the ground under the words.
const GROUND_TOP = 182;
const farHill = (x: number) => 148 - mound(x, 150, 130, 22) - mound(x, 360, 110, 26) - mound(x, 470, 60, 10);
const mainHill = (x: number) => 174 - mound(x, 240, 150, 28) - mound(x, 60, 70, 8);

// ── Set dressing ────────────────────────────────────────────────────────────

const TREE = [
  '.....#........#.....',
  '......#......#......',
  '.......#....#...#...',
  '.#......#..#...#....',
  '..#.....##.#..#.....',
  '...#....###..#......',
  '....#...##.##.......',
  '.....#..##.#........',
  '......#.##..........',
  '.......###......#...',
  '........##.....#....',
  '........##....#.....',
  '........###..#......',
  '........##.##.......',
  '........####........',
  '........##..........',
  '........##..........',
  '........##..........',
  '.......####.........',
  '......######........',
];

function treeRects(cx: number, baseY: number, scale: number): R[] {
  return rowsToRects(TREE, { '#': '#' }).map((r: PixelRect) => ({
    x: cx + (r.x - 9) * scale,
    y: baseY - (TREE.length - r.y) * scale,
    w: r.w * scale,
    h: scale,
  }));
}

/** A pixel disc of radius r around (cx, cy) as rows. */
function discRects(cx: number, cy: number, r: number): R[] {
  const out: R[] = [];
  for (let y = -r; y < r; y++) {
    const half = Math.round(Math.sqrt(r * r - (y + 0.5) ** 2));
    out.push({ x: cx - half, y: cy + y, w: half * 2, h: 1 });
  }
  return out;
}

const WISP = ['..##..', '.####.', '######', '######', '.####.', '..##..'];
const WISP_RECTS = rowsToRects(WISP, { '#': '#' });

/** The stones on the main hill: centre cluster first, the rest spreading out for wide screens. */
const STONES: { x: number; kind: StoneKind; w: number; h: number }[] = [
  { x: 240, kind: 'obelisk', w: 13, h: 44 },
  { x: 206, kind: 'cross', w: 13, h: 28 },
  { x: 268, kind: 'arch', w: 15, h: 24 },
  { x: 186, kind: 'arch', w: 11, h: 17 },
  { x: 224, kind: 'slab', w: 11, h: 13 },
  { x: 292, kind: 'cross', w: 11, h: 22 },
  { x: 254, kind: 'slab', w: 9, h: 11 },
  { x: 160, kind: 'obelisk', w: 9, h: 30 },
  { x: 136, kind: 'arch', w: 13, h: 19 },
  { x: 110, kind: 'slab', w: 13, h: 14 },
  { x: 84, kind: 'cross', w: 11, h: 24 },
  { x: 318, kind: 'arch', w: 11, h: 18 },
  { x: 344, kind: 'obelisk', w: 9, h: 26 },
  { x: 372, kind: 'slab', w: 13, h: 15 },
  { x: 400, kind: 'arch', w: 13, h: 21 },
  { x: 430, kind: 'cross', w: 13, h: 27 },
  { x: 456, kind: 'slab', w: 9, h: 12 },
  { x: 34, kind: 'arch', w: 9, h: 14 },
];

/** Small stones far back on the far hill. */
const FAR_STONES = [50, 92, 128, 176, 214, 262, 300, 352, 390, 436, 470].map((x, i) => ({
  x,
  kind: (['arch', 'slab', 'cross', 'arch', 'obelisk'] as StoneKind[])[i % 5],
  w: 3 + (i % 3) * 2,
  h: 5 + (i * 7) % 6,
}));

const FRONT_STONES: { x: number; kind: StoneKind; w: number; h: number; base: number }[] = [
  { x: 30, kind: 'arch', w: 23, h: 46, base: 236 },
  { x: 452, kind: 'cross', w: 21, h: 52, base: 242 },
];

const rnd = lcg(20261016);
const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: Math.floor(rnd() * SCENE_W),
  y: Math.floor(rnd() * 118) + 4,
  bright: i % 6 === 0,
  twinkle: i % 2 === 0,
  delay: (i * 0.37) % 3,
}));
const FIREFLIES = Array.from({ length: 12 }, (_, i) => ({
  x: Math.floor(rnd() * SCENE_W),
  y: 150 + Math.floor(rnd() * 70),
  delay: (i * 0.61) % 4,
  dur: 2.8 + (i % 4) * 0.7,
}));
const GRASS = Array.from({ length: 70 }, (_, i) => ({
  x: Math.floor(rnd() * SCENE_W),
  y: Math.round(mainHill(0)) + 4 + Math.floor(rnd() * 60),
  w: 1 + (i % 2),
}));
/** Souls rise off these stones (by index into STONES), from just above each one's top. */
const WISPS = [
  { stone: 0, delay: 0, dur: 6.5 },
  { stone: 1, delay: 1.9, dur: 7.2 },
  { stone: 2, delay: 3.4, dur: 6.1 },
  { stone: 7, delay: 4.7, dur: 7.8 },
  { stone: 12, delay: 2.6, dur: 6.9 },
  { stone: 14, delay: 5.5, dur: 7.4 },
].map((w) => {
  const s = STONES[w.stone];
  return { ...w, x: s.x, y: Math.round(mainHill(s.x) / 2) * 2 + 1 - s.h - 3 };
});

/** A band of stepped fog puffs across (and past) the whole width, so a drift never shows an edge. */
function fogRects(yBase: number, seed: number, tall: number): R[] {
  const r = lcg(seed);
  const out: R[] = [];
  for (let x = -140; x < SCENE_W + 140; x += 26 + Math.floor(r() * 22)) {
    const w = 30 + Math.floor(r() * 44);
    const lift = Math.floor(r() * 3);
    out.push({ x, y: yBase - lift, w, h: tall + lift });
    out.push({ x: x + Math.floor(w * 0.2), y: yBase - lift - 2, w: Math.floor(w * 0.6), h: 2 });
    out.push({ x: x + Math.floor(w * 0.35), y: yBase - lift - 4, w: Math.floor(w * 0.3), h: 2 });
  }
  return out;
}
const FOG = [
  { rects: fogRects(GROUND_TOP - 22, 11, 10), cls: 'gy-fog-a', opacity: 0.34 },
  { rects: fogRects(GROUND_TOP - 8, 23, 14), cls: 'gy-fog-b', opacity: 0.26 },
  { rects: fogRects(GROUND_TOP + 8, 37, 20), cls: 'gy-fog-c', opacity: 0.2 },
];

const MOON = { x: 282, y: 46, r: 13 };
const MOON_CRATERS: R[] = [
  { x: 276, y: 40, w: 3, h: 2 }, { x: 285, y: 44, w: 4, h: 3 }, { x: 279, y: 50, w: 2, h: 2 },
  { x: 288, y: 52, w: 3, h: 2 }, { x: 274, y: 47, w: 2, h: 1 },
];

// Built once: ~900 rects, none of which ever change.
const FAR_HILL = hillRects(farHill, 12, GROUND_TOP);
const MAIN_HILL = hillRects(mainHill, 8, GROUND_TOP + 2);
const FAR_STONE_RECTS = FAR_STONES.flatMap((s) => stoneRects(s.kind, s.x, Math.round(farHill(s.x) / 2) * 2 + 1, s.w, s.h));
const STONE_RECTS = STONES.map((s) => {
  const base = Math.round(mainHill(s.x) / 2) * 2 + 1;
  const body = stoneRects(s.kind, s.x, base, s.w, s.h);
  // The moonlit edge: two columns down the right side of the body's widest run.
  const widest = body.reduce((a, b) => (b.w > a.w ? b : a));
  return { body, rim: { x: widest.x + widest.w - 2, y: widest.y + 1, w: 2, h: Math.max(1, widest.h - 2) } };
});
const FRONT_RECTS = FRONT_STONES.flatMap((s) => stoneRects(s.kind, s.x, s.base, s.w, s.h));
const TREES = [...treeRects(58, Math.round(mainHill(58)) + 2, 4), ...treeRects(474, Math.round(mainHill(474)) + 1, 2)];
const MOON_DISC = discRects(MOON.x, MOON.y, MOON.r);
const MOON_HALO_1 = discRects(MOON.x, MOON.y, MOON.r + 3);
const MOON_HALO_2 = discRects(MOON.x, MOON.y, MOON.r + 7);

export function GraveyardScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={`gy-scene block w-full h-full ${className}`}
    >
      {/* Stars, brightest at night, a few early ones at dusk */}
      <g className="gy-stars" style={{ opacity: 'var(--gy-stars)' }}>
        {STARS.map((s, i) => (
          <g key={i} className={s.twinkle ? 'gy-twinkle' : undefined} style={{ animationDelay: `${s.delay}s` }}>
            <rect x={s.x} y={s.y} width={1} height={1} />
            {s.bright && (
              <>
                <rect x={s.x - 1} y={s.y} width={1} height={1} opacity={0.5} />
                <rect x={s.x + 1} y={s.y} width={1} height={1} opacity={0.5} />
                <rect x={s.x} y={s.y - 1} width={1} height={1} opacity={0.5} />
                <rect x={s.x} y={s.y + 1} width={1} height={1} opacity={0.5} />
              </>
            )}
          </g>
        ))}
      </g>

      {/* The moon — full and cratered at night, a pale ghost of itself at dusk */}
      <g className="gy-moon" style={{ opacity: 'var(--gy-moon-opacity)' }}>
        <g fill="var(--gy-moon)" opacity={0.08}><Rects rects={MOON_HALO_2} /></g>
        <g fill="var(--gy-moon)" opacity={0.14}><Rects rects={MOON_HALO_1} /></g>
        <g fill="var(--gy-moon)"><Rects rects={MOON_DISC} /></g>
        <g fill="var(--gy-moon-crater)" style={{ opacity: 'var(--gy-craters)' }}><Rects rects={MOON_CRATERS} /></g>
      </g>

      {/* Far hill with its tiny stones */}
      <g className="gy-layer" fill="var(--gy-hill-far)"><Rects rects={FAR_HILL} /></g>
      <g className="gy-layer" fill="var(--gy-hill-far-stone)"><Rects rects={FAR_STONE_RECTS} /></g>

      {/* The first fog, behind the main hill */}
      <g className={`gy-fog ${FOG[0].cls}`} fill="var(--gy-fog)" style={{ opacity: FOG[0].opacity }}><Rects rects={FOG[0].rects} /></g>

      {/* Main hill, the trees and the stones */}
      <g className="gy-layer" fill="var(--gy-hill)"><Rects rects={MAIN_HILL} /></g>
      <g className="gy-layer" fill="var(--gy-tree)"><Rects rects={TREES} /></g>
      <g className="gy-layer" fill="var(--gy-stone)">
        {STONE_RECTS.map((s, i) => <Rects key={i} rects={s.body} />)}
      </g>
      <g fill="var(--gy-stone-rim)">
        {STONE_RECTS.map((s, i) => <rect key={i} x={s.rim.x} y={s.rim.y} width={s.rim.w} height={s.rim.h} />)}
      </g>

      {/* Souls rising off the stones */}
      <g fill="var(--gy-wisp)">
        {WISPS.map((w, i) => (
          <g key={i} className="gy-soul" style={{ animationDelay: `${w.delay}s`, animationDuration: `${w.dur}s` }}>
            <g transform={`translate(${w.x - 4} ${w.y - 4})`} opacity={0.22}>
              <rect x={0} y={1} width={8} height={6} /><rect x={1} y={0} width={6} height={8} />
            </g>
            <g transform={`translate(${w.x - 3} ${w.y - 3})`}>
              {WISP_RECTS.map((r, j) => <rect key={j} x={r.x} y={r.y} width={r.w} height={1} />)}
            </g>
          </g>
        ))}
      </g>

      {/* The second fog, through the stones */}
      <g className={`gy-fog ${FOG[1].cls}`} fill="var(--gy-fog)" style={{ opacity: FOG[1].opacity }}><Rects rects={FOG[1].rects} /></g>

      {/* Foreground ground with its grass */}
      <g className="gy-layer" fill="var(--gy-ground)"><rect x={0} y={GROUND_TOP} width={SCENE_W} height={SCENE_H - GROUND_TOP} /></g>
      <g className="gy-layer" fill="var(--gy-grass)">
        {GRASS.map((g, i) => <rect key={i} x={g.x} y={g.y} width={g.w} height={1} />)}
      </g>
      <g className="gy-layer" fill="var(--gy-stone-front)"><Rects rects={FRONT_RECTS} /></g>

      {/* Fireflies over the ground, night only */}
      <g fill="var(--gy-firefly)" style={{ opacity: 'var(--gy-fireflies)' }}>
        {FIREFLIES.map((f, i) => (
          <rect key={i} className="gy-firefly" x={f.x} y={f.y} width={1} height={1} style={{ animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />
        ))}
      </g>

      {/* The third fog, lowest and slowest, over everything */}
      <g className={`gy-fog ${FOG[2].cls}`} fill="var(--gy-fog)" style={{ opacity: FOG[2].opacity }}><Rects rects={FOG[2].rects} /></g>
    </svg>
  );
}

// ── The wall's field ────────────────────────────────────────────────────────

const FIELD_W = 480;
const FIELD_H = 72;
const fieldHill = (x: number) => 46 - mound(x, 120, 120, 14) - mound(x, 340, 140, 18);
const FIELD_HILL = hillRects(fieldHill, 8, FIELD_H);
const FIELD_STONES = [22, 48, 70, 104, 130, 152, 178, 210, 236, 262, 290, 318, 346, 372, 398, 426, 452, 474].map((x, i) => ({
  x,
  kind: (['arch', 'cross', 'slab', 'obelisk', 'arch', 'slab'] as StoneKind[])[i % 6],
  w: 5 + (i % 3) * 2,
  h: 8 + ((i * 5) % 9),
}));
const FIELD_STONE_RECTS = FIELD_STONES.flatMap((s) => stoneRects(s.kind, s.x, Math.round(fieldHill(s.x) / 2) * 2 + 1, s.w, s.h));
const FIELD_TREES = [...treeRects(86, Math.round(fieldHill(86)) + 1, 2), ...treeRects(410, Math.round(fieldHill(410)) + 1, 2)];
const FIELD_FOG = [
  { rects: fogRects(50, 41, 8), cls: 'gy-fog-b', opacity: 0.3 },
  { rects: fogRects(60, 53, 12), cls: 'gy-fog-c', opacity: 0.22 },
];

/**
 * The far edge of the memorial field: a hill of unnamed stones behind the real ones, so the wall
 * reads as a graveyard with one stone on it rather than one stone on a page.
 */
export function FieldBackdrop({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={`gy-scene block w-full h-full ${className}`}
    >
      <g className="gy-layer" fill="var(--gy-hill-far)"><Rects rects={FIELD_HILL} /></g>
      <g className="gy-layer" fill="var(--gy-tree)"><Rects rects={FIELD_TREES} /></g>
      <g className="gy-layer" fill="var(--gy-stone)"><Rects rects={FIELD_STONE_RECTS} /></g>
      {FIELD_FOG.map((f, i) => (
        <g key={i} className={`gy-fog ${f.cls}`} fill="var(--gy-fog)" style={{ opacity: f.opacity }}><Rects rects={f.rects} /></g>
      ))}
    </svg>
  );
}
