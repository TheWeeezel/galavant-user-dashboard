import { useState, useRef, useCallback, useEffect } from 'react';
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

/* ── Player ── */

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showVolume, setShowVolume] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const track: Track = tracklist[trackIdx] ?? tracklist[0];

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

  const play = useCallback((idx?: number) => {
    const i = idx ?? 0;
    setTrackIdx(i);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = tracklist[i].src;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const prev = () => {
    const i = (trackIdx - 1 + tracklist.length) % tracklist.length;
    play(i);
  };

  const next = () => {
    const i = (trackIdx + 1) % tracklist.length;
    play(i);
  };

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

  if (tracklist.length === 0) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Expanded tracklist panel */}
        {expanded && (
          <div className="bg-m2e-card border-t-2 border-x-2 border-m2e-border mx-auto max-w-7xl rounded-t-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="px-4 py-3 border-b border-m2e-border">
              <h3 className="text-xs uppercase tracking-widest text-m2e-accent">Galavant Radio</h3>
            </div>
            {tracklist.map((t, i) => (
              <button
                key={t.src}
                onClick={() => play(i)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-m2e-border-light transition-colors ${
                  i === trackIdx ? 'bg-m2e-card-alt text-m2e-accent' : 'text-m2e-text-secondary'
                }`}
              >
                <span className="text-xs font-mono w-6 text-center">{i + 1}</span>
                <MusicIcon className="w-4 h-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{t.title}</div>
                  <div className="text-xs text-m2e-text-muted truncate">
                    {t.artist} &middot; {t.credit}
                  </div>
                </div>
                {i === trackIdx && playing && (
                  <span className="text-xs text-m2e-accent animate-pulse">Playing</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main bar */}
        <div className="bg-m2e-card border-t-2 border-m2e-border shadow-lg">
          {/* Progress bar */}
          {duration > 0 && (
            <div className="h-1 bg-m2e-border cursor-pointer group" onClick={seek}>
              <div
                className="h-full bg-m2e-accent transition-all duration-300 group-hover:h-1.5"
                style={{ width: `${(progress / duration) * 100}%` }}
              />
            </div>
          )}

          <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-3">
            {/* Expand/collapse */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-m2e-text-muted hover:text-m2e-text transition-colors"
              aria-label={expanded ? 'Collapse tracklist' : 'Expand tracklist'}
            >
              {expanded ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronUpIcon className="w-5 h-5" />
              )}
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={prev}
                className="p-1.5 text-m2e-text-secondary hover:text-m2e-text transition-colors"
                aria-label="Previous track"
              >
                <PrevIcon className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="p-2 bg-m2e-accent text-m2e-text-on-accent rounded-md border-2 border-m2e-accent-dark hover:brightness-110 transition-all"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={next}
                className="p-1.5 text-m2e-text-secondary hover:text-m2e-text transition-colors"
                aria-label="Next track"
              >
                <NextIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MusicIcon className="w-4 h-4 text-m2e-accent shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{track.title}</div>
                  <div className="text-[10px] text-m2e-text-muted truncate">
                    {track.artist} &middot; {track.credit}
                  </div>
                </div>
              </div>
            </div>

            {/* Time */}
            {duration > 0 && (
              <span className="text-[10px] text-m2e-text-muted font-mono hidden sm:block">
                {fmt(progress)} / {fmt(duration)}
              </span>
            )}

            {/* Volume */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowVolume((v) => !v)}
                className="p-1.5 text-m2e-text-secondary hover:text-m2e-text transition-colors"
                aria-label="Volume"
              >
                <VolumeIcon className="w-4 h-4" />
              </button>
              {showVolume && (
                <div className="absolute bottom-full right-0 mb-2 bg-m2e-card border-2 border-m2e-border rounded-md p-3 shadow-lg">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(volume * 100)}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="w-24 accent-[var(--color-m2e-accent)]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
