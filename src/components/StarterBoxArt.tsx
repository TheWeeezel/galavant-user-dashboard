import { useId } from 'react';
import { config } from '../config';

/**
 * The starter pack box (owner 2026-10-15), drawn as one SVG so it scales to any card width. The
 * same design as the app's StarterBox (packages/app/components/packs/StarterBox.tsx in the infra
 * repo) — four skies, one per bike type: dawn lilac Commuter (the approved canvas box), morning
 * meadow Touring, sunset Racing, neon night Electric. The bike's card leans in a die-cut window,
 * the fixed contents are printed on the box, the price sits on the gold tag.
 */

const D = 16;
const FW = 304;
const FH = 504;
const BW = FW + D;
const BH = FH + D;
const WIN = { x: 34, y: 118, w: 236, h: 236 };

interface BoxPalette {
  bands: string[];
  top: [string, string];
  side: [string, string];
  ink: string;
  tile: string;
  lattice: string;
  deco: string;
}

const PALETTES: Record<string, BoxPalette> = {
  commuter: {
    bands: ['#9A8FDE', '#A99BE0', '#B8ABE3', '#CBBCE6', '#DFD2E6', '#EBE2E4'],
    top: ['#B8ABE3', '#A99BE0'], side: ['#6655C4', '#5F4FC0'], ink: '#2A2254', tile: '#CBBCE6',
    lattice: 'rgba(140,126,245,0.16)', deco: 'rgba(255,255,255,0.75)',
  },
  touring: {
    bands: ['#4E7A3C', '#5E8C48', '#729F57', '#8DB56C', '#B5D193', '#DDEBC4'],
    top: ['#8DB56C', '#729F57'], side: ['#3A5E2B', '#335426'], ink: '#1E3216', tile: '#B5D193',
    lattice: 'rgba(155,192,119,0.18)', deco: 'rgba(255,248,200,0.8)',
  },
  racing: {
    bands: ['#A8382A', '#BF4A33', '#D4613E', '#E37E4E', '#EFA36C', '#F7CC9C'],
    top: ['#E37E4E', '#D4613E'], side: ['#7E2619', '#722215'], ink: '#3E120B', tile: '#EFA36C',
    lattice: 'rgba(239,163,108,0.16)', deco: 'rgba(255,236,214,0.7)',
  },
  electric: {
    bands: ['#14254A', '#1A3462', '#22477A', '#2B5F92', '#3A7DA8', '#56A3BC'],
    top: ['#2B5F92', '#22477A'], side: ['#0F1C3A', '#0C1830'], ink: '#081226', tile: '#7FD0C9',
    lattice: 'rgba(127,240,216,0.16)', deco: 'rgba(127,240,216,0.85)',
  },
};

const BAND_STOPS = [0, 0.14, 0.28, 0.42, 0.58, 0.76, 1];

const DECO: Record<string, string> = {
  commuter: 'M12 150h12v4H12zM8 154h20v4H8zM278 236h12v4h-12zM274 240h22v4h-22zM14 300h8v4h-8zM10 304h16v4H10z',
  touring: 'M278 140h12v12h-12zM274 144h4v4h-4zM290 144h4v4h-4zM282 136h4v4h-4zM282 152h4v4h-4zM10 230h4v4h-4zM14 226h4v4h-4zM18 230h4v4h-4zM14 234h4v4h-4zM12 300h4v4h-4zM16 296h4v4h-4zM20 300h4v4h-4zM16 304h4v4h-4z',
  racing: 'M6 150h22v3H6zM12 160h16v3H12zM8 170h20v3H8zM276 250h22v3h-22zM276 260h16v3h-16zM276 270h20v3h-20z',
  electric: 'M16 140h2v6h-2zM14 142h6v2h-6zM282 200h2v6h-2zM280 202h6v2h-6zM12 240h2v2h-2zM22 290h2v2h-2zM286 150h2v2h-2zM278 300h2v2h-2zM20 190h2v2h-2z',
};

const TITLES: Record<string, string> = { commuter: 'THE COMMUTER', touring: 'THE TOURER', racing: 'THE RACER', electric: 'THE ELECTRIC' };
const NAMES: Record<string, string> = { commuter: 'Commuter', touring: 'Touring', racing: 'Racing', electric: 'Electric' };
/** Optimal speed band per type, as the app's bike screen shows it (shared SPEED_RANGES). */
export const PACE: Record<string, string> = { commuter: 'WALK 2–5 KM/H', touring: 'JOG 5–9 KM/H', racing: 'RUN 10–18 KM/H', electric: 'ANY PACE 2–18 KM/H' };

const SANS = 'ui-sans-serif, system-ui, -apple-system, sans-serif';
const STEEL = { frame: '#958877', ink: '#5E5349', body: '#F1EDE6', rule: '#D9D0BE' };
const ATTR_COLORS = ['#B56A28', '#2C8577', '#B54A60', '#62788C'];

export function StarterBoxArt({ type, price, className }: { type: string; price?: string | null; className?: string }) {
  const p = PALETTES[type] ?? PALETTES.commuter;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const wy = D + WIN.y;
  let lattice = '';
  for (let x = -WIN.h; x < WIN.w + WIN.h; x += 18) lattice += `M${x} 0L${x + WIN.h} ${WIN.h}M${x} ${WIN.h}L${x + WIN.h} 0`;
  const bikeArt = `${config.apiUrl}/art/bases/bike-${type}.png`;
  const tileW = (FW - 28 - 16) / 3;
  const tilesY = wy + WIN.h + 16;

  return (
    <svg viewBox={`-2 -2 ${BW + 12} ${BH + 14}`} className={className} role="img" aria-label={`${NAMES[type] ?? type} starter pack: one bike, three parts, one toolbox`}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          {p.bands.flatMap((c, i) => [
            <stop key={`a${i}`} offset={BAND_STOPS[i]} stopColor={c} />,
            <stop key={`b${i}`} offset={BAND_STOPS[i + 1]} stopColor={c} />,
          ])}
        </linearGradient>
        <clipPath id={`win${id}`}>
          <rect x={4} y={4} width={WIN.w - 8} height={WIN.h - 8} />
        </clipPath>
      </defs>

      {/* Shadow, outline, top face, side, front */}
      <path d={`M${D + 8} 10H${BW + 8}V${BH - D + 10}L${BW - D + 8} ${BH + 10}H8V${D + 10}Z`} fill="rgba(0,0,0,0.55)" />
      <path d={`M${D - 2} -2H${BW + 2}V${BH - D + 2}L${BW - D + 2} ${BH + 2}H-2V${D - 2}Z`} fill="#0F0C1A" />
      <path d={`M${D} 0H${BW}L${BW - D} ${D}H0Z`} fill={p.top[0]} />
      <path d={`M${D + (BW - D) / 2} 0H${BW}L${BW - D} ${D}H${(BW - D) / 2}Z`} fill={p.top[1]} />
      <path d={`M${BW - D} ${D}L${BW} 0V${BH - D}L${BW - D} ${BH}Z`} fill={p.side[0]} />
      <path d={`M${BW - D} ${D + FH / 2}L${BW} ${FH / 2}V${BH - D}L${BW - D} ${BH}Z`} fill={p.side[1]} />
      <rect x={0} y={D} width={FW} height={FH} fill={`url(#sky${id})`} />
      <path d={DECO[type] ?? ''} fill={p.deco} transform={`translate(0 ${D})`} />
      <rect x={1.5} y={D + 1.5} width={FW - 3} height={FH - 3} fill="none" stroke={p.ink} strokeWidth={3} />

      {/* Header */}
      <rect x={14} y={D + 14} width={FW - 28} height={26} fill={p.ink} />
      <text x={24} y={D + 33} fontSize={20} fill="#F0EBE0" letterSpacing={2}>STARTER PACK</text>
      <text x={FW - 24} y={D + 30} fontSize={8} fontWeight={900} fontFamily={SANS} fill="#B0A8C8" letterSpacing={2} textAnchor="end">SERIES 1</text>

      {/* Title and pace */}
      <text x={FW / 2 + 3} y={D + 86} fontSize={46} fill={p.ink} textAnchor="middle">{TITLES[type] ?? 'STARTER'}</text>
      <text x={FW / 2} y={D + 83} fontSize={46} fill="#FFFFFF" textAnchor="middle">{TITLES[type] ?? 'STARTER'}</text>
      <rect x={FW / 2 - 112} y={D + 92} width={224} height={16} fill={p.ink} />
      <text x={FW / 2} y={D + 103.5} fontSize={9} fontWeight={900} fontFamily={SANS} fill="#F0EBE0" letterSpacing={2} textAnchor="middle">
        {PACE[type] ?? ''} · READY TO RIDE
      </text>

      {/* Window */}
      <g transform={`translate(${WIN.x} ${wy})`}>
        <rect width={WIN.w} height={WIN.h} fill="#171225" />
        <g clipPath={`url(#win${id})`}>
          <path d={lattice} stroke={p.lattice} strokeWidth={2} />
          {/* The face-down card behind */}
          <g transform="translate(96 12) rotate(6)">
            <rect width={124} height={174} fill="#2A2257" stroke="#0F0C1A" strokeWidth={2} />
            <rect x={6} y={6} width={112} height={162} fill="none" stroke="#8C7EF5" strokeWidth={2} />
            <image href="/assets/logo-wings.png" x={22} y={62} width={80} height={40} />
          </g>
          {/* The bike's card in front: what the box holds, numbers rolled when it opens */}
          <g transform="translate(14 14) rotate(-4)">
            <rect width={140} height={196} fill={STEEL.frame} stroke="#2C2420" strokeWidth={2} />
            <rect x={5} y={5} width={130} height={186} fill={STEEL.body} stroke={STEEL.ink} strokeWidth={1} />
            <text x={11} y={22} fontSize={17} fill="#2C2420">{NAMES[type] ?? ''}</text>
            <text x={129} y={22} fontSize={14} fill="#2C2420" textAnchor="end">LV 0</text>
            <rect x={10} y={27} width={120} height={70} fill="#FFFFFF" stroke={STEEL.ink} strokeWidth={2} />
            <image href={bikeArt} x={30} y={25} width={80} height={72} style={{ imageRendering: 'pixelated' }} />
            <rect x={16} y={98} width={108} height={7} fill={STEEL.ink} />
            {ATTR_COLORS.map((c, i) => (
              <g key={c} transform={`translate(12 ${112 + i * 13})`}>
                <rect x={0} y={0} width={6} height={6} fill={c} transform="rotate(45 3 3)" />
                <rect x={11} y={2} width={86} height={3} fill={STEEL.rule} />
                <text x={114} y={7} fontSize={11} fill="#2C2420" textAnchor="end">?</text>
              </g>
            ))}
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={12 + i * 22} y={166} width={16} height={16} fill="#EFE9DD" stroke="#C4B89C" strokeWidth={1} />
            ))}
            <text x={124} y={180} fontSize={11} fill="#2C2420" textAnchor="end">0/7</text>
          </g>
        </g>
        <rect x={0} y={0} width={WIN.w} height={8} fill="rgba(0,0,0,0.35)" />
        <rect x={2} y={2} width={WIN.w - 4} height={WIN.h - 4} fill="none" stroke={p.ink} strokeWidth={4} />
        {/* Sticker */}
        <g transform={`translate(${WIN.w - 100} ${WIN.h - 52}) rotate(-8)`}>
          <rect width={88} height={40} fill="#E6A833" />
          <rect y={37} width={88} height={3} fill="#A6791C" />
          <text x={44} y={17} fontSize={17} fill="#221703" textAnchor="middle">FIXED</text>
          <text x={44} y={32} fontSize={17} fill="#221703" textAnchor="middle">CONTENTS</text>
        </g>
      </g>

      {/* Contents */}
      {[
        { label: '1 BIKE', href: bikeArt, w: 44, h: 40 },
        { label: '3 PARTS', href: '/parts/part-earning-lv1.png', w: 36, h: 36 },
        { label: '1 TOOLBOX', href: '/toolboxes/toolbox-lv1.png', w: 40, h: 34 },
      ].map((t, i) => {
        const x = 14 + i * (tileW + 8);
        return (
          <g key={t.label}>
            <rect x={x} y={tilesY} width={tileW} height={70} fill="#FEFCF7" stroke={p.ink} strokeWidth={2} />
            <rect x={x + 1} y={tilesY + 64} width={tileW - 2} height={5} fill={p.tile} />
            <image href={t.href} x={x + (tileW - t.w) / 2} y={tilesY + 8} width={t.w} height={t.h} style={{ imageRendering: 'pixelated' }} />
            <text x={x + tileW / 2} y={tilesY + 58} fontSize={15} fill="#2C2420" textAnchor="middle">{t.label}</text>
          </g>
        );
      })}

      {/* Footer: printed contents, and the price tag when the shop has one */}
      <image href="/assets/logo-wings.png" x={14} y={D + FH - 38} width={40} height={20} />
      <text x={58} y={D + FH - 24} fontSize={8} fontWeight={900} fontFamily={SANS} fill={p.ink} letterSpacing={1.4}>
        {price ? 'CONTENTS ON THE BOX' : 'CONTENTS PRINTED ON THE BOX'}
      </text>
      {price && (
        <g transform={`translate(${FW - 14 - 86} ${D + FH - 44})`}>
          <rect width={86} height={30} fill="#E6A833" />
          <rect y={27} width={86} height={3} fill="#A6791C" />
          <rect x={9} y={12} width={6} height={6} fill="#221703" />
          <text x={50} y={22} fontSize={20} fill="#221703" textAnchor="middle">{price}</text>
        </g>
      )}
    </svg>
  );
}
