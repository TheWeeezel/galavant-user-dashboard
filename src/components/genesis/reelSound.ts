/**
 * Tiny synthesised sounds for the Reel (no audio files): a tick while the drums run, a thunk as each
 * reel stops, a rising arpeggio on a win. Browsers only allow audio after a tap, and every sound here
 * follows one. Off switch persisted per browser; a failure to make sound is never an error.
 */
const KEY = 'galavant_reel_sound';
let ctx: AudioContext | null = null;

export function reelSoundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setReelSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private window */ }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function reelSfx(kind: 'tick' | 'stop' | 'win' | 'big' | 'miss') {
  if (!reelSoundOn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if (kind === 'tick') tone(900, 0, 0.03, 'square', 0.015);
    else if (kind === 'stop') { tone(180, 0, 0.09, 'triangle', 0.09); tone(90, 0.02, 0.12, 'sine', 0.08); }
    else if (kind === 'miss') tone(140, 0, 0.18, 'triangle', 0.05);
    else {
      const notes = kind === 'big' ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
      notes.forEach((f, i) => tone(f, i * 0.09, 0.22, 'square', 0.04));
    }
  } catch { /* no audio available */ }
}
