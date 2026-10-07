import { useSyncExternalStore } from 'react';

/**
 * The site's sky, mirrored on the app's SKY setting (stores/theme.ts there): AUTO follows the
 * visitor's local clock — night from 20:00 to 05:00 — and DAY or NIGHT pins it. The inline script
 * in index.html applies the stored choice before first paint; this store takes over from there.
 */
export type SkyMode = 'auto' | 'day' | 'night';
export const SKY_MODES: SkyMode[] = ['auto', 'day', 'night'];

// Read by the inline script in index.html as well — keep the two in step.
const STORAGE_KEY = 'galavant-sky';

export function isNightHour(date: Date = new Date()): boolean {
  const h = date.getHours();
  return h >= 20 || h < 5;
}

function readStored(): SkyMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'auto' || stored === 'day' || stored === 'night') return stored;
  } catch {
    // Storage blocked (private window, previews): the sky just follows the clock.
  }
  return 'auto';
}

let mode: SkyMode = readStored();
const listeners = new Set<() => void>();

function applySky() {
  const night = mode === 'night' || (mode === 'auto' && isNightHour());
  document.documentElement.dataset.theme = night ? 'night' : 'day';
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function setSkyMode(next: SkyMode) {
  mode = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not remembered, but still applied for this visit.
  }
  applySky();
  notify();
}

export function cycleSkyMode() {
  setSkyMode(SKY_MODES[(SKY_MODES.indexOf(mode) + 1) % SKY_MODES.length]);
}

// AUTO turns at 20:00 and 05:00 without a reload; a choice made in another tab follows here.
window.setInterval(() => {
  if (mode === 'auto') applySky();
}, 60_000);
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  mode = readStored();
  applySky();
  notify();
});

export function useSkyMode(): SkyMode {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => mode,
  );
}
