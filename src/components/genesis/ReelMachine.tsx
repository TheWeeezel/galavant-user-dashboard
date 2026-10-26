import { useEffect, useRef, useState } from 'react';
import { Close, Zap, Tools, Gear, Star, DiamondGem } from 'pixelarticons/react';
import type { ReelFace } from '../../api';
import { reelSfx } from './reelSound';

/**
 * Three pixel reels, the app's ReelMachine on the web. The machine never decides anything: it is
 * handed the faces the server rolled and only animates towards them. While `spinning` each window
 * flickers through the face set, then the reels stop left to right and settle with a small drop. The
 * parent parks the server result until `onStopped` fires, so a slow network never shows a prize
 * before the reels have stopped. Reduced motion: one short cut to the final faces.
 */

const FACE_SET: ReelFace[] = ['blank', 'bolt', 'wrench', 'gear', 'star', 'genesis'];
const STOP_AT = [900, 1350, 1800];
const REDUCED_STOP_AT = [100, 200, 300];
const FLICKER_MS = 70;

const ICON: Record<ReelFace, typeof Star> = { blank: Close, bolt: Zap, wrench: Tools, gear: Gear, star: Star, genesis: DiamondGem };
const COLOR: Record<ReelFace, string> = {
  blank: 'var(--color-m2e-text-muted)',
  bolt: 'var(--color-m2e-warning)',
  wrench: 'var(--color-m2e-text-secondary)',
  gear: 'var(--color-m2e-accent)',
  star: 'var(--color-m2e-luck)',
  genesis: '#7A5210',
};

type Faces = [ReelFace, ReelFace, ReelFace];

export function ReelMachine({ faces, spinning, target, hits, onStopped }: {
  faces: Faces;
  spinning: boolean;
  /** The server's faces; null while the request is in flight. */
  target: Faces | null;
  /** Which windows lit up once the result is revealed. */
  hits: [boolean, boolean, boolean];
  onStopped: () => void;
}) {
  const [shown, setShown] = useState<Faces>(faces);
  const [stopped, setStopped] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [settling, setSettling] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const stoppedRef = useRef(stopped);
  stoppedRef.current = stopped;
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduce = useRef(false);
  const doneRef = useRef(onStopped);
  doneRef.current = onStopped;

  useEffect(() => {
    reduce.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  useEffect(() => { if (!spinning) setShown(faces); }, [faces, spinning]);

  // Flicker all three until each reel's stop time has passed.
  useEffect(() => {
    if (!spinning) return;
    startedAt.current = Date.now();
    setStopped([false, false, false]);
    const tick = setInterval(() => {
      setShown((prev) => prev.map((f, i) => (stoppedRef.current[i] ? f : FACE_SET[Math.floor(Math.random() * FACE_SET.length)])) as Faces);
      if (!reduce.current) reelSfx('tick');
    }, FLICKER_MS);
    return () => { clearInterval(tick); timers.current.forEach(clearTimeout); timers.current = []; };
  }, [spinning]);

  // Once the target arrives, schedule the stops relative to the start: a fast answer still takes the
  // full 1.8 s, a slow one stops the moment it lands.
  useEffect(() => {
    if (!spinning || !target) return;
    const plan = reduce.current ? REDUCED_STOP_AT : STOP_AT;
    const elapsed = Date.now() - startedAt.current;
    plan.forEach((at, i) => {
      timers.current.push(setTimeout(() => {
        setShown((prev) => { const next = [...prev] as Faces; next[i] = target[i]; return next; });
        setStopped((prev) => { const next = [...prev] as typeof prev; next[i] = true; return next; });
        setSettling((prev) => { const next = [...prev] as typeof prev; next[i] = true; return next; });
        timers.current.push(setTimeout(() => setSettling((prev) => { const next = [...prev] as typeof prev; next[i] = false; return next; }), 260));
        reelSfx('stop');
        if (i === 2) timers.current.push(setTimeout(() => doneRef.current(), reduce.current ? 50 : 220));
      }, Math.max(0, at - elapsed)));
    });
  }, [spinning, target]);

  const anyHit = hits.some(Boolean);

  return (
    <div className={`reel-cabinet ${spinning ? 'is-spinning' : ''} ${anyHit ? 'is-win' : ''}`}>
      <div className="reel-lamps" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }} />)}
      </div>
      <div className="reel-windows" role="img" aria-label={`Reel: ${shown.join(', ')}`}>
        {shown.map((face, i) => {
          const Icon = ICON[face];
          const flicker = !stopped[i];
          return (
            <div key={i} className={`reel-window ${hits[i] ? 'is-hit' : ''}`}>
              <span className="reel-shade reel-shade-top" />
              <span className="reel-shade reel-shade-bottom" />
              <span className={`reel-face ${flicker ? 'is-flicker' : ''} ${settling[i] ? 'is-settle' : ''}`} style={{ color: flicker ? 'var(--color-m2e-text-muted)' : COLOR[face] }}>
                <Icon className="w-12 h-12 sm:w-16 sm:h-16" />
              </span>
            </div>
          );
        })}
      </div>
      <div className="reel-line" aria-hidden />
    </div>
  );
}
