import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { Close, Zap, Tools, Gear, Star, DiamondGem, Volume2, VolumeX } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { ReelMachine } from '../components/genesis/ReelMachine';
import { reelSfx, reelSoundOn, setReelSound } from '../components/genesis/reelSound';
import {
  fetchGenesisLounge, pullGenesisReel,
  type GenesisLounge as Lounge, type ReelFace, type ReelPullResult, type ReelStake,
} from '../api';

/**
 * The Genesis Lounge on the website: the Reel for Genesis holders. The server rolls and settles every
 * pull (routes/genesis.ts); this page only asks and shows. The app's iOS build has no Reel (App Store
 * rule on simulated gambling), and the app never links here. No odds are shown, only symbols.
 *
 * Layout mirrors the app's Lounge: the Genesis pass on top, the cabinet, the result card, the stakes,
 * the last pulls. The cabinet and its sounds live in components/genesis.
 */

type Faces = [ReelFace, ReelFace, ReelFace];
const REST_FACES: Faces = ['bolt', 'gear', 'star'];
const PART_TYPES = ['earning', 'luck', 'recovery', 'durability'] as const;
const FACE_ICON: Record<ReelFace, typeof Star> = { blank: Close, bolt: Zap, wrench: Tools, gear: Gear, star: Star, genesis: DiamondGem };
const FACE_COLOR: Record<ReelFace, string> = {
  blank: 'var(--color-m2e-text-muted)', bolt: 'var(--color-m2e-warning)', wrench: 'var(--color-m2e-text-secondary)',
  gear: 'var(--color-m2e-accent)', star: 'var(--color-m2e-luck)', genesis: '#7A5210',
};
const PART_COLOR: Record<string, string> = {
  earning: 'var(--color-m2e-earning)', luck: 'var(--color-m2e-luck)',
  recovery: 'var(--color-m2e-recovery)', durability: 'var(--color-m2e-durability)',
};
const GILT = { gilt: '#D9A83C', light: '#FFE9A6', dark: '#7A5210', ink: '#241804' };

type Phase = 'idle' | 'spinning' | 'result';

function hitMask(r: ReelPullResult): [boolean, boolean, boolean] {
  if (r.line === 'blank') return [false, false, false];
  const [a, b, c] = r.faces;
  return [true, true, c === a || c === b];
}

function describeHeld(held: Lounge['held']): string {
  const bikes = held.filter((h) => h.kind === 'bike').length;
  const parts = held.length - bikes;
  const bits: string[] = [];
  if (bikes) bits.push(bikes === 1 ? 'Genesis bike' : `${bikes} Genesis bikes`);
  if (parts) bits.push(parts === 1 ? 'Genesis part' : `${parts} Genesis parts`);
  return bits.join(' + ');
}

function mintedLabel(l: Lounge): string {
  const first = l.held[0];
  const total = first ? l.totalMinted?.[first.kind] : undefined;
  if (!first || !total || first.number > total) return '';
  return `${first.kind.toUpperCase()} ${first.number} OF ${total}`;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">{children}</div>;
}

export function GenesisLounge() {
  const { isAuthenticated, isRestoring } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [showLogin, setShowLogin] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [faces, setFaces] = useState<Faces>(REST_FACES);
  const [target, setTarget] = useState<Faces | null>(null);
  const [result, setResult] = useState<ReelPullResult | null>(null);
  const [picking, setPicking] = useState(false);
  const [sound, setSound] = useState(reelSoundOn());
  const pendingRef = useRef<ReelPullResult | null>(null);

  const lounge = useQuery({ queryKey: ['genesis-lounge'], queryFn: fetchGenesisLounge, enabled: isAuthenticated, retry: false });
  const data = lounge.data;

  useEffect(() => {
    if (data?.recent[0] && phase === 'idle' && !result) setFaces(data.recent[0].faces);
  }, [data, phase, result]);

  const refresh = useCallback(() => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['genesis-lounge'] }),
    queryClient.invalidateQueries({ queryKey: ['spending-wallet'] }),
    queryClient.invalidateQueries({ queryKey: ['spending'] }),
    queryClient.invalidateQueries({ queryKey: ['userParts'] }),
  ]), [queryClient]);

  const pull = useMutation({
    mutationFn: ({ stake, partId }: { stake: ReelStake; partId?: string }) => pullGenesisReel(stake, partId),
    onMutate: () => { pendingRef.current = null; setResult(null); setTarget(null); setPicking(false); setPhase('spinning'); },
    onSuccess: (r) => { pendingRef.current = r; setTarget(r.faces); },
    onError: () => { setPhase('idle'); void refresh(); },
  });

  // The third reel has stopped: only now does the prize appear.
  const onStopped = useCallback(() => {
    const r = pendingRef.current;
    if (!r) return;
    setFaces(r.faces);
    setResult(r);
    setPhase('result');
    reelSfx(r.line === 'blank' ? 'miss' : r.line === 'genesis' || r.prize.part ? 'big' : 'win');
    void refresh();
  }, [refresh]);

  if (isRestoring) return null;

  if (!isAuthenticated) {
    return (
      <Centered>
        <h1 className="text-4xl uppercase tracking-wide">Genesis Lounge</h1>
        <p className="text-m2e-text-secondary text-lg">The room of the Genesis holders from the October launch. Sign in to enter.</p>
        <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-6 py-3">Sign in</button>
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </Centered>
    );
  }

  if (lounge.isPending) return <Centered><p className="text-m2e-text-secondary">Loading…</p></Centered>;

  if (lounge.isError) {
    return (
      <Centered>
        <p className="text-m2e-danger">{(lounge.error as Error).message}</p>
        <button className="pixel-btn pixel-btn-primary px-4 py-3 text-sm" onClick={() => lounge.refetch()}>Try again</button>
      </Centered>
    );
  }

  if (!data?.holder) {
    return (
      <Centered>
        <h1 className="text-4xl uppercase tracking-wide">Genesis Lounge</h1>
        <p className="text-m2e-text-secondary text-lg">The Lounge is for Genesis holders: a Genesis bike or part in your garage opens it.</p>
      </Centered>
    );
  }

  const spinning = phase === 'spinning';
  const canPull = data.enabled && !spinning;
  const byType = (t: string) => data.stakeable.filter((p) => p.type === t);
  const first = data.held[0];
  const number = first ? String(first.number).padStart(2, '0') : '··';

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl uppercase tracking-wide">Genesis Lounge</h1>
        <button
          onClick={() => { const next = !sound; setSound(next); setReelSound(next); if (next) reelSfx('stop'); }}
          className="p-2 text-m2e-text-secondary hover:text-m2e-text"
          aria-label={sound ? 'Turn reel sounds off' : 'Turn reel sounds on'}
          title={sound ? 'Sound on' : 'Sound off'}
        >
          {sound ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>

      {/* The pass — the app's certificate: dark stage, gilt seal with the holder's number. */}
      <div className="relative overflow-hidden rounded-[8px] border-2 px-5 py-4 flex items-center gap-5"
        style={{ background: '#171225', borderColor: GILT.dark, borderTopColor: '#E3B95C', borderBottomWidth: 5 }}>
        <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
          <span className="absolute w-14 h-14 rotate-45 border-[3px]" style={{ background: GILT.gilt, borderColor: GILT.dark, borderTopColor: '#FFF0B8', borderLeftColor: '#FFF0B8' }} />
          <span className="absolute w-10 h-10 rotate-45 border-2" style={{ borderColor: GILT.dark }} />
          <span className="relative text-xl leading-none" style={{ color: GILT.ink }}>#{number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] tracking-[0.24em] font-bold" style={{ color: '#E3B95C' }}>GENESIS PASS</span>
            {mintedLabel(data) && <span className="text-[9px] tracking-[0.14em] font-bold" style={{ color: '#B0A8C8' }}>{mintedLabel(data)}</span>}
          </div>
          <p className="text-2xl uppercase tracking-wide" style={{ color: '#FFF0B8' }}>You were there</p>
          <p className="text-sm" style={{ color: '#B0A8C8' }}>{describeHeld(data.held)}</p>
        </div>
        <span aria-hidden className="reel-glint" />
      </div>

      {/* The Reel */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] font-bold text-m2e-text-secondary">THE REEL</span>
          <span className="flex items-center gap-1.5" title="Your WATTS">
            <img src="/assets/token-silver.png" alt="WATTS" className="w-5 h-5 pixel-render" />
            <span className="text-2xl leading-none tabular-nums">{data.balance.toLocaleString('en-US')}</span>
          </span>
        </div>
        <ReelMachine faces={faces} spinning={spinning} target={target} hits={phase === 'result' && result ? hitMask(result) : [false, false, false]} onStopped={onStopped} />
        {!data.enabled && <p className="text-center text-xs tracking-widest font-bold text-m2e-danger">THE REEL IS CLOSED RIGHT NOW</p>}
        {pull.isError && <p className="text-center text-sm text-m2e-danger">{(pull.error as Error).message}</p>}
      </div>

      {phase === 'result' && result && <ResultCard key={result.faces.join('-') + result.balance} result={result} reduceMotion={!!reduceMotion} />}

      {/* Stakes */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <StakeButton gilt title={`FREE PULL · ${data.freePullsLeft}`} sub={data.freePullsLeft > 0 ? 'on the house' : 'resets midnight UTC'}
            disabled={!canPull || data.freePullsLeft <= 0} onClick={() => pull.mutate({ stake: 'free' })} />
          <StakeButton title={`${data.pullCostWatts}`} icon sub="one pull"
            disabled={!canPull || data.balance < data.pullCostWatts} onClick={() => pull.mutate({ stake: 'watts' })} />
        </div>
        <StakeButton wide title={`TRADE A LEVEL ${data.stakePartMaxLevel} PART`}
          sub={picking ? 'pick the type to give up' : data.stakeable.length > 0 ? `${data.stakeable.length} in your garage` : 'none loose right now'}
          disabled={!canPull || data.stakeable.length === 0} onClick={() => setPicking((v) => !v)} />
        {picking && !spinning && (
          <div className="grid grid-cols-4 gap-2">
            {PART_TYPES.map((t) => {
              const list = byType(t);
              const firstPart = list[0];
              return (
                <button key={t} disabled={!firstPart}
                  onClick={() => pull.mutate({ stake: 'part', partId: firstPart.id })}
                  className="pixel-card flex flex-col items-center gap-0.5 py-2 cursor-pointer disabled:cursor-default disabled:opacity-40 hover:-translate-y-0.5 transition-transform"
                  style={{ borderColor: firstPart ? PART_COLOR[t] : undefined }}>
                  <span className="text-[9px] tracking-widest font-bold" style={{ color: PART_COLOR[t] }}>{t.toUpperCase()}</span>
                  <span className="text-lg leading-none">{firstPart ? `L${firstPart.level} ×${list.length}` : '×0'}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs leading-relaxed text-m2e-text-secondary">
          Two bolts pay a little WATTS, three bolts pay more. Any other three of a kind pays a part, and three GENESIS is the top line. Rarer symbols pay more. No odds are published — it is a game of luck. Free pulls reset at midnight UTC.
        </p>
      </div>

      {data.recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] font-bold text-m2e-text-secondary">LAST PULLS</span>
          <div className="flex flex-wrap gap-2">
            {data.recent.map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-1 rounded-[4px] border text-[11px] font-bold"
                style={r.line === 'blank'
                  ? { background: 'var(--color-m2e-card)', borderColor: 'var(--color-m2e-border)', color: 'var(--color-m2e-text-muted)' }
                  : { background: GILT.light, borderColor: GILT.dark, color: GILT.ink }}>
                {r.faces.map((f, j) => { const Icon = FACE_ICON[f]; return <Icon key={j} className="w-3.5 h-3.5" style={{ color: FACE_COLOR[f] }} />; })}
                <span className="ml-0.5">{r.prizeWatts > 0 ? `+${r.prizeWatts}` : r.prizePartLevel ? `L${r.prizePartLevel}` : '·'}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StakeButton({ title, sub, gilt, wide, icon, disabled, onClick }: { title: string; sub: string; gilt?: boolean; wide?: boolean; icon?: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`pixel-btn flex-col py-2.5 px-2 gap-0.5 disabled:opacity-45 disabled:cursor-default active:translate-y-0.5 ${wide ? 'w-full' : ''}`}
      style={gilt
        ? { background: GILT.gilt, color: GILT.ink, borderColor: GILT.dark, borderTopColor: GILT.light, textShadow: 'none' }
        : { background: 'var(--color-m2e-card)', color: 'var(--color-m2e-text)', borderColor: 'var(--color-m2e-border)', borderTopColor: 'var(--color-m2e-border-light)', textShadow: 'none' }}>
      <span className="inline-flex items-center gap-1.5 text-xl leading-none">
        {title}{icon && <img src="/assets/token-silver.png" alt="WATTS" className="w-4 h-4 pixel-render" />}
      </span>
      <span className="text-[9px] tracking-[0.12em] font-bold opacity-80">{sub.toUpperCase()}</span>
    </button>
  );
}

function ResultCard({ result, reduceMotion }: { result: ReelPullResult; reduceMotion: boolean }) {
  const win = result.line !== 'blank';
  const jackpot = result.line === 'genesis';
  const part = result.prize.part;
  const watts = result.prize.watts;
  const shown = useCountUp(watts, win && watts > 0 && !reduceMotion);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : win ? { opacity: 0, scale: 0.7 } : { opacity: 0, x: 0 }}
      animate={reduceMotion ? { opacity: 1 } : win ? { opacity: 1, scale: 1 } : { opacity: 1, x: [0, -10, 10, -6, 0] }}
      transition={win ? { type: 'spring', stiffness: 220, damping: 12 } : { duration: 0.25 }}
      className="relative overflow-hidden rounded-[8px] border-2 px-5 py-5 text-center flex flex-col items-center gap-1"
      style={win
        ? { background: GILT.light, borderColor: GILT.dark, borderTopColor: '#FFF6D2', borderBottomWidth: 5, boxShadow: '2px 2px 0 var(--color-m2e-shadow)' }
        : { background: 'var(--color-m2e-card)', borderColor: 'var(--color-m2e-border)', borderBottomWidth: 5 }}>
      {win && !reduceMotion && <Sparks big={jackpot || !!part} />}
      <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color: win ? GILT.dark : 'var(--color-m2e-text-muted)' }}>
        {jackpot ? 'THREE GENESIS' : win ? 'STAGE CLEAR' : 'NO LINE'}
      </span>
      {part ? (
        <>
          <span className="text-3xl uppercase tracking-wide" style={{ color: PART_COLOR[part.type] }}>Level {part.level} {part.type} part</span>
          <span className="text-sm" style={{ color: GILT.ink }}>added to your inventory</span>
        </>
      ) : watts > 0 ? (
        <>
          <span className="text-5xl leading-none tabular-nums" style={{ color: GILT.dark }}>+{shown} WATTS</span>
          <span className="text-sm" style={{ color: GILT.ink }}>credited to your balance</span>
        </>
      ) : (
        <span className="text-3xl uppercase tracking-wide text-m2e-text-secondary">Nothing this time</span>
      )}
    </motion.div>
  );
}

/** Counts a WATTS prize up from 0 in about 600 ms; the final value is always the server's. */
function useCountUp(to: number, animate: boolean): number {
  const [v, setV] = useState(animate ? 0 : to);
  useEffect(() => {
    if (!animate) { setV(to); return; }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      setV(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, animate]);
  return v;
}

/** Pixel sparks that fly out of a winning card: squares, no images, gone after a second. */
function Sparks({ big }: { big: boolean }) {
  const n = big ? 22 : 12;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: n }).map((_, i) => {
        const angle = (i / n) * Math.PI * 2 + (i % 2) * 0.2;
        const dist = 70 + ((i * 37) % 60);
        return (
          <motion.span key={i}
            className="absolute left-1/2 top-1/2 block w-2 h-2"
            style={{ background: i % 3 === 0 ? '#FFF0B8' : i % 3 === 1 ? '#D9A83C' : '#7A5210' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.7 + 18, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.9 + (i % 4) * 0.08, ease: 'easeOut' }} />
        );
      })}
    </span>
  );
}
