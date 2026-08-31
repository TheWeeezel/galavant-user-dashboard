import { useState, useRef, useEffect, useMemo } from 'react';
import { tracklist, type Track } from '../music/tracklist';

/* ── Inline SVG icons (matches pixel-art dashboard style) ── */

function PlayIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
    </svg>
  );
}
function PrevIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  );
}
function NextIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
    </svg>
  );
}
function MusicIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
function ChevronUpIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    </svg>
  );
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
  );
}
function VolumeIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5zM14 3.23v2.06a7.007 7.007 0 0 1 0 13.42v2.06A9.007 9.007 0 0 0 14 3.23z" />
    </svg>
  );
}

function ShuffleIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  );
}
function RepeatIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  );
}
function RepeatOneIcon({ className }: { className?: string }) {
  return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    </svg>
  );
}

function EqBars({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-3 ${className ?? ''}`}>
      <span className="w-[3px] bg-m2e-accent animate-[eq_0.4s_ease-in-out_infinite_alternate]" />
      <span className="w-[3px] bg-m2e-accent animate-[eq_0.4s_ease-in-out_0.15s_infinite_alternate]" />
      <span className="w-[3px] bg-m2e-accent animate-[eq_0.4s_ease-in-out_0.3s_infinite_alternate]" />
      <style>{`@keyframes eq { from { height: 20%; } to { height: 100%; } }`}</style>
    </span>
  );
}

/** Fisher-Yates shuffle — returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type RepeatMode = 'off' | 'all' | 'one';

/* ── Player ── */

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeTrackRef = useRef<HTMLButtonElement | null>(null);
  // Pick a random starting track on each page load
  const [trackIdx, setTrackIdx] = useState(() =>
    tracklist.length > 0 ? Math.floor(Math.random() * tracklist.length) : 0,
  );
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showVolume, setShowVolume] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // The bar spans the full width and covered page content on every route, so it
  // rests as a corner button and is opened deliberately.
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // The playlist indices in current play order
  const playOrder = useMemo(
    () => (shuffled ? shuffleOrder : tracklist.map((_, i) => i)),
    [shuffled, shuffleOrder],
  );

  const track: Track = tracklist[playOrder[trackIdx]] ?? tracklist[0];

  // Keep audio element in sync with volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Auto-start: play muted (allowed by all browsers), unmute on first interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Try unmuted first
    audio.volume = volume;
    audio.play().then(() => setPlaying(true)).catch(() => {
      // Blocked — start muted (browsers always allow this)
      audio.muted = true;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    });

    // On any user interaction, unmute
    const unmute = () => {
      if (audio.muted) {
        audio.muted = false;
        audio.volume = volume;
      }
      document.removeEventListener('click', unmute);
      document.removeEventListener('keydown', unmute);
      document.removeEventListener('scroll', unmute);
    };
    document.addEventListener('click', unmute);
    document.addEventListener('keydown', unmute);
    document.addEventListener('scroll', unmute);

    return () => {
      document.removeEventListener('click', unmute);
      document.removeEventListener('keydown', unmute);
      document.removeEventListener('scroll', unmute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When trackIdx changes, load and play the new track
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return; // initial mount is handled by the autoplay effect
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [trackIdx]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const prev = () => setTrackIdx((i) => (i - 1 + playOrder.length) % playOrder.length);
  const next = () => setTrackIdx((i) => (i + 1) % playOrder.length);

  const handleEnded = () => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play(); }
    } else if (repeatMode === 'all') {
      next();
    } else {
      // 'off' — stop at end of playlist
      if (trackIdx < playOrder.length - 1) next();
      else setPlaying(false);
    }
  };

  const toggleShuffle = () => {
    if (!shuffled) {
      const order = shuffle(tracklist.map((_, i) => i));
      // Move the current real track index to position 0 so playback continues
      const realIdx = playOrder[trackIdx];
      const pos = order.indexOf(realIdx);
      [order[0], order[pos]] = [order[pos], order[0]];
      setShuffleOrder(order);
      setTrackIdx(0);
    } else {
      // Unshuffle — jump back to the real index
      const realIdx = playOrder[trackIdx];
      setTrackIdx(realIdx);
    }
    setShuffled((v) => !v);
  };

  const cycleRepeat = () =>
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Auto-scroll to the active track when the panel opens
  useEffect(() => {
    if (expanded && activeTrackRef.current) {
      activeTrackRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [expanded, trackIdx]);

  if (tracklist.length === 0) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Resting control. The left half is the transport, because play/pause is
          the one action worth reaching without opening anything; the right half
          opens everything else. */}
      <div className="fixed bottom-4 right-4 z-50 flex items-stretch rounded-full overflow-hidden border-2 border-m2e-accent-dark bg-m2e-accent text-m2e-text-on-accent shadow-lg">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pause radio' : 'Play radio'}
          className="relative w-14 h-14 flex items-center justify-center hover:bg-m2e-accent-dark transition-colors"
        >
          {playing ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          {playing && <span className="absolute inset-0 rounded-full animate-pulse-ring" aria-hidden />}
        </button>
        <button
          onClick={() => setPopoverOpen((v) => !v)}
          aria-label={popoverOpen ? 'Close radio' : 'Open Galavant Radio'}
          aria-expanded={popoverOpen}
          className="w-9 h-14 flex items-center justify-center border-l border-m2e-accent-dark/60 hover:bg-m2e-accent-dark transition-colors"
        >
          {popoverOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
        </button>
      </div>

      {popoverOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopoverOpen(false)} aria-hidden />

          <div
            role="dialog"
            aria-label="Galavant Radio"
            className="fixed bottom-24 right-4 z-50 w-[min(21rem,calc(100vw-2rem))] pixel-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-m2e-chrome">
              <h3 className="text-sm uppercase tracking-[0.2em] text-m2e-accent-light">Galavant Radio</h3>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                {trackIdx + 1}/{playOrder.length}
              </span>
            </div>

            <div className="px-4 pt-3 min-w-0">
              <div className="text-base text-m2e-text truncate">{track.title}</div>
              <div className="text-xs text-m2e-text-muted truncate">{track.artist}</div>
            </div>

            {duration > 0 && (
              <div className="px-4 pt-3">
                <div className="h-1.5 bg-m2e-bg-alt cursor-pointer" onClick={seek}>
                  <div className="h-full bg-m2e-accent" style={{ width: `${(progress / duration) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-m2e-text-muted font-mono pt-1">
                  <span>{fmt(progress)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 px-4 py-3">
              <button onClick={toggleShuffle} aria-label="Shuffle"
                className={`p-2 transition-colors ${shuffled ? 'text-m2e-accent' : 'text-m2e-text-muted hover:text-m2e-text'}`}>
                <ShuffleIcon className="w-4 h-4" />
              </button>
              <button onClick={prev} aria-label="Previous track"
                className="p-2 text-m2e-text-secondary hover:text-m2e-text transition-colors">
                <PrevIcon className="w-5 h-5" />
              </button>
              <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}
                className="w-12 h-12 flex items-center justify-center bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark hover:bg-m2e-accent-dark transition-colors">
                {playing ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </button>
              <button onClick={next} aria-label="Next track"
                className="p-2 text-m2e-text-secondary hover:text-m2e-text transition-colors">
                <NextIcon className="w-5 h-5" />
              </button>
              <button onClick={cycleRepeat} aria-label="Repeat"
                className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-m2e-accent' : 'text-m2e-text-muted hover:text-m2e-text'}`}>
                {repeatMode === 'one' ? <RepeatOneIcon className="w-4 h-4" /> : <RepeatIcon className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 pb-3">
              <VolumeIcon className="w-4 h-4 text-m2e-text-muted shrink-0" />
              <input
                type="range" min={0} max={100} value={Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-label="Volume"
                className="flex-1 accent-[var(--color-m2e-accent)]"
              />
            </div>

            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="w-full px-4 py-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-m2e-text-muted hover:text-m2e-accent border-t border-m2e-border transition-colors"
            >
              Tracklist
              {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="max-h-56 overflow-y-auto border-t border-m2e-border">
                {playOrder.map((realIdx, i) => {
                  const tr = tracklist[realIdx];
                  const isActive = i === trackIdx;
                  return (
                    <button
                      key={tr.src}
                      ref={isActive ? activeTrackRef : undefined}
                      onClick={() => setTrackIdx(i)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isActive ? 'bg-m2e-accent-soft text-m2e-accent-dark' : 'text-m2e-text-secondary hover:bg-m2e-bg-alt'
                      }`}
                    >
                      <span className="text-xs font-mono w-5 text-center shrink-0">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{tr.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
