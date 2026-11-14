import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useMotionValue, useReducedMotion } from 'framer-motion';

// One function for the default, not a fresh arrow per render: a new `format` every render
// restarted the count each frame, so it crept towards the value instead of landing on it.
const wholeNumber = (n: number) => Math.round(n).toLocaleString();

/** A number that counts up from zero the first time it scrolls into view. */
export function CountUp({
  value,
  duration = 1.6,
  format = wholeNumber,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Vertical margin only. With '-60px' on all four sides the observed span had to sit 60px
  // inside the viewport horizontally too — and on a phone the left-column stats start as a
  // narrow "0" about 40-50px from the left edge, entirely inside that dead zone, so their
  // count-up never fired and Walkers / WATTS / Items Sold stayed at 0 (seen 2026-09-07).
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(format(0));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplay(format(value));
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, format, mv, reducedMotion]);

  return <span ref={ref}>{display}</span>;
}
