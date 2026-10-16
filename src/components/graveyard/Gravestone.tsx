import { useEffect, useRef, type CSSProperties } from 'react';
import { Cancel } from 'pixelarticons/react';
import { config } from '../../config';
import type { GraveyardStone } from '../../api';
import { EXAMPLE_CARDS, MarkedBikeCard, PixelGlyph, SneakerSprite, capitalize, formatDay, qualityTextClass } from './Pixels';

/**
 * One stone on the wall. Four cuts — arch, cross, obelisk, slab — in three sizes, chosen by the
 * sneaker's number so a stone always looks the same and a wall never looks uniform. Moss, a
 * crack and a laurel are dealt the same way. The sneaker is engraved in the stone's own colour,
 * like a ghost; a soul that lives on carries a glowing soul mark and opens its bike's card; one
 * still waiting sends a wisp up now and then.
 */

export type StoneKind = 'arch' | 'cross' | 'obelisk' | 'slab';
type StoneSize = 'sm' | 'md' | 'lg';

interface Look {
  kind: StoneKind;
  size: StoneSize;
  moss: boolean;
  crack: boolean;
  laurel: boolean;
}

const KINDS: StoneKind[] = ['arch', 'cross', 'slab', 'obelisk'];
const SIZES: StoneSize[] = ['md', 'sm', 'lg'];

/** A stone's cut, size and wear — the same for the same number, every visit. */
export function stoneLook(number: string): Look {
  let seed = 7;
  for (const ch of number) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  const kind = KINDS[seed % 4];
  return {
    kind,
    size: SIZES[(seed >>> 3) % 3],
    moss: seed % 3 !== 1,
    crack: (seed >>> 5) % 4 === 0,
    laurel: kind === 'slab' || (seed >>> 7) % 5 === 0,
  };
}

// The content starts under the cut: a cross or a cap needs headroom, an arch a little, a slab none.
const TOP_PAD: Record<StoneKind, string> = { arch: 'pt-5', cross: 'pt-[54px]', obelisk: 'pt-9', slab: 'pt-4' };
const MIN_H: Record<StoneSize, string> = { sm: 'min-h-[214px]', md: 'min-h-[236px]', lg: 'min-h-[262px]' };
const SPRITE_W: Record<StoneSize, string> = { sm: 'w-[44px]', md: 'w-[52px]', lg: 'w-[60px]' };

function Moss() {
  return (
    <svg viewBox="0 0 16 8" shapeRendering="crispEdges" aria-hidden className="absolute left-0 bottom-0 w-10 h-5 text-m2e-uncommon opacity-60">
      <g fill="currentColor">
        <rect x="0" y="5" width="7" height="3" /><rect x="1" y="3" width="3" height="2" /><rect x="5" y="4" width="2" height="1" />
        <rect x="8" y="6" width="4" height="2" /><rect x="9" y="5" width="2" height="1" /><rect x="13" y="7" width="3" height="1" />
      </g>
    </svg>
  );
}

function Crack() {
  return (
    <svg viewBox="0 0 10 16" shapeRendering="crispEdges" aria-hidden className="absolute right-4 top-2 w-[14px] h-[22px] text-m2e-stone-dark">
      <g fill="currentColor">
        <rect x="7" y="0" width="1" height="3" /><rect x="6" y="3" width="1" height="2" /><rect x="5" y="5" width="1" height="3" />
        <rect x="6" y="8" width="1" height="2" /><rect x="7" y="10" width="1" height="1" /><rect x="5" y="11" width="1" height="3" />
        <rect x="4" y="14" width="1" height="2" /><rect x="3" y="7" width="2" height="1" />
      </g>
    </svg>
  );
}

export function Gravestone({ stone, onOpenCard }: { stone: GraveyardStone; onOpenCard: (stone: GraveyardStone) => void }) {
  const look = stoneLook(stone.number);
  const waiting = !stone.rebornAs;
  const verb = stone.mark === 'inherited' ? 'lives on in a' : 'reborn as';
  const delay = `${(Number(stone.number.slice(-1)) || 0) * 0.3}s`;

  return (
    <div className={`gy-stone gy-stone--${look.kind} ${MIN_H[look.size]} transition-transform motion-safe:hover:-translate-y-1`}>
      <div className={`gy-stone-in relative h-full px-2.5 sm:px-3 pb-5 ${TOP_PAD[look.kind]} grid content-center gap-1 justify-items-center text-center`}>
        {look.crack && <Crack />}
        {look.moss && <Moss />}

        {look.laurel && <PixelGlyph name="laurel" className="w-[45px] h-[27px] gy-engraved opacity-70" />}

        {/* The sneaker, cut into the stone */}
        <div className={`relative ${SPRITE_W[look.size]} gy-engraved-sprite ${look.laurel ? '' : 'mt-1'}`}>
          <SneakerSprite type={stone.type} quality={stone.quality} mono="var(--color-m2e-stone-text)" />
          {waiting && (
            <PixelGlyph name="wisp" className="gy-hover absolute left-[42%] -top-3 w-2.5 text-m2e-accent" style={{ animationDelay: delay } as CSSProperties} />
          )}
        </div>

        <div className="gy-engraved text-2xl leading-none tabular-nums tracking-wider">#{stone.number}</div>
        <div className="text-base leading-tight">
          {capitalize(stone.type)} · <span className={qualityTextClass(stone.quality)}>{capitalize(stone.quality)}</span>
          <span className="whitespace-nowrap"> · Lv {stone.level}</span>
        </div>
        <div className="text-sm opacity-75 border-t-2 border-dotted border-m2e-stone-dark pt-1.5 mt-1 w-full">
          laid to rest {formatDay(stone.burnedAt)}
        </div>

        {stone.rebornAs ? (
          <div className="flex items-start gap-1.5 mt-0.5 max-w-full">
            <PixelGlyph name="soul" className="gy-soul-mark w-3 h-3 mt-1 text-m2e-accent shrink-0" />
            {stone.card ? (
              <button
                type="button"
                onClick={() => onOpenCard(stone)}
                className="text-base text-m2e-accent-dark underline decoration-dotted underline-offset-2 cursor-pointer leading-tight text-left min-w-0"
              >
                {verb} {capitalize(stone.rebornAs)}
              </button>
            ) : (
              <span className="text-base text-m2e-accent-dark leading-tight text-left min-w-0">{verb} {capitalize(stone.rebornAs)}</span>
            )}
          </div>
        ) : (
          <div className="text-sm opacity-70 border-2 border-dashed border-m2e-stone-dark px-2 mt-0.5 uppercase tracking-wider">soul waiting</div>
        )}
      </div>
    </div>
  );
}

/** An unnamed stone standing in the background of a thin wall, so the field never looks bare. */
export function BlankStone({ kind, size, className = '' }: { kind: StoneKind; size: StoneSize; className?: string }) {
  return (
    <div aria-hidden className={`gy-stone gy-stone--${kind} ${MIN_H[size]} opacity-50 ${className}`}>
      <div className={`gy-stone-in h-full ${TOP_PAD[kind]} grid content-start justify-items-center gap-3 px-3 text-m2e-stone-text`}>
        <PixelGlyph name="laurel" className="w-[45px] h-[27px] gy-engraved opacity-40 mt-2" />
        {/* a name the weather took */}
        <div className="grid gap-1.5 justify-items-center opacity-30">
          <div className="w-[64px] h-[3px] bg-current" />
          <div className="w-[44px] h-[3px] bg-current" />
        </div>
        <Moss />
      </div>
    </div>
  );
}

/** The soul's bike card, on the page rather than in a new tab. Esc, the backdrop and the button close it. */
export function CardLightbox({ stone, onClose }: { stone: GraveyardStone | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (stone && !dialog.open) dialog.showModal();
    if (!stone && dialog.open) dialog.close();
  }, [stone]);

  const verb = stone?.mark === 'inherited' ? 'lives on in a' : 'reborn as';
  // The card is 5:7; the width keeps the whole card plus its caption inside the viewport.
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-label={stone ? `The card of the ${capitalize(stone.rebornAs ?? '')} bike that carries ${capitalize(stone.type)} #${stone.number}` : 'Bike card'}
      className="gy-lightbox m-auto w-[min(92vw,400px,60vh)] bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      {stone && (
        <div className="grid gap-3 p-1 outline-none">
          <MarkedBikeCard
            src={`${config.apiUrl}${stone.card}`}
            fallback={stone.mark === 'inherited' ? EXAMPLE_CARDS.inherited : EXAMPLE_CARDS.reborn}
            alt={`The ${capitalize(stone.rebornAs ?? '')} bike's trading card with the ${stone.mark === 'inherited' ? 'Inherited' : 'Reborn'} mark of ${capitalize(stone.type)} #${stone.number}`}
          />
          <div className="flex items-center justify-between gap-3 text-white">
            <p className="text-base leading-tight">
              <span className="text-m2e-accent-light">{capitalize(stone.type)} #{stone.number}</span> {verb} {capitalize(stone.rebornAs ?? '')}
              <small className="block text-sm text-white/70">Its card carries the soul's mark.</small>
            </p>
            <button type="button" onClick={onClose} className="pixel-btn pixel-btn-secondary px-3 py-2 text-xs gap-1.5" autoFocus>
              <Cancel className="w-4 h-4" /> Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
