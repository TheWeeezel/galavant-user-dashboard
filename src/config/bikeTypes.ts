/**
 * The four frames, in the order the game presents them: slowest band first, the full-band Electric
 * last. The landing page's garage section and the shop both read from here, so the two can never
 * disagree about a bike's pace or drift apart in sequence.
 *
 * `lo`/`hi` are the UI-visible optimal bands in km/h — the same ones the ride HUD shows. They are
 * not a secret: a player learns them by riding, and knowing them only makes them ride better.
 */
export interface BikeTypeInfo {
  /** The catalog key, lowercase, as the server and the art filenames spell it. */
  key: string;
  /** Display name. */
  type: string;
  /** Who the frame suits. */
  best: string;
  lo: number;
  hi: number;
  accent?: boolean;
}

export const BIKE_TYPES: readonly BikeTypeInfo[] = [
  { key: 'commuter', type: 'Commuter', best: 'Leisurely walkers', lo: 2, hi: 5 },
  { key: 'touring', type: 'Touring', best: 'Brisk walkers', lo: 5, hi: 9 },
  { key: 'racing', type: 'Racing', best: 'Joggers and runners', lo: 10, hi: 18 },
  { key: 'electric', type: 'Electric', best: 'Any pace · walk to run', lo: 2, hi: 18, accent: true },
] as const;

/** The top of the scale every band is drawn against. */
export const BIKE_BAND_MAX = 18;

export function bikeTypeInfo(key: string): BikeTypeInfo | undefined {
  return BIKE_TYPES.find((b) => b.key === key.toLowerCase());
}

/** Sort whatever the shop happens to send into the order above; anything unknown keeps the tail. */
export function byBikeTypeOrder<T extends { type: string }>(items: readonly T[]): T[] {
  const rank = (t: string) => {
    const i = BIKE_TYPES.findIndex((b) => b.key === t.toLowerCase());
    return i === -1 ? BIKE_TYPES.length : i;
  };
  return [...items].sort((a, b) => rank(a.type) - rank(b.type));
}
