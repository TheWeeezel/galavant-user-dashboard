import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { fetchGenesisLounge, pullGenesisReel, type ReelFace, type ReelPullResult, type ReelStake } from '../api';

/**
 * The Genesis Lounge on the website: the Reel for Genesis holders. The server rolls and settles every
 * pull (routes/genesis.ts); this page only asks and shows. The app's iOS build has no Reel (App Store
 * rule on simulated gambling), and the app never links here. No odds are shown, only symbols.
 */

const PART_TYPES = ['earning', 'luck', 'recovery', 'durability'] as const;
const FACE: Record<ReelFace, string> = { blank: '·', bolt: '⚡', wrench: '🔧', gear: '⚙', star: '★', genesis: '◆' };

function describe(r: ReelPullResult): string {
  if (r.prize.part) return `A level ${r.prize.part.level} ${r.prize.part.type} part`;
  if (r.prize.watts > 0) return `+${r.prize.watts} WATTS`;
  return 'No prize this time';
}

export function GenesisLounge() {
  const { isAuthenticated, isRestoring } = useAuth();
  const queryClient = useQueryClient();
  const [showLogin, setShowLogin] = useState(false);
  const [result, setResult] = useState<ReelPullResult | null>(null);
  const [picking, setPicking] = useState(false);

  const lounge = useQuery({ queryKey: ['genesis-lounge'], queryFn: fetchGenesisLounge, enabled: isAuthenticated, retry: false });

  const pull = useMutation({
    mutationFn: ({ stake, partId }: { stake: ReelStake; partId?: string }) => pullGenesisReel(stake, partId),
    onMutate: () => { setResult(null); setPicking(false); },
    onSuccess: (data) => setResult(data),
    // Win or lose, balance, free pulls and the loose parts changed: refresh every view that shows them.
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['genesis-lounge'] }),
      queryClient.invalidateQueries({ queryKey: ['spending-wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['spending'] }),
      queryClient.invalidateQueries({ queryKey: ['userParts'] }),
    ]),
  });

  const data = lounge.data;
  const busy = pull.isPending;
  const canPull = !!data?.holder && data.enabled && !busy;
  const byType = (t: string) => (data?.stakeable ?? []).filter((p) => p.type === t);

  if (isRestoring) return null;

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="uppercase tracking-wide text-3xl mb-3">Genesis Lounge</h1>
        <p className="text-m2e-text-secondary mb-6">The room of the Genesis holders from the October launch. Sign in to enter.</p>
        <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-4 py-3 text-sm disabled:opacity-40">Sign in</button>
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  if (lounge.isPending) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-m2e-text-secondary">Loading…</div>;

  if (lounge.isError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <p className="text-m2e-danger">{(lounge.error as Error).message}</p>
        <button className="pixel-btn pixel-btn-primary px-4 py-3 text-sm" onClick={() => lounge.refetch()}>Try again</button>
      </div>
    );
  }

  if (!data?.holder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="uppercase tracking-wide text-3xl mb-3">Genesis Lounge</h1>
        <p className="text-m2e-text-secondary">The Lounge is for Genesis holders: a Genesis bike or part in your garage opens it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="uppercase tracking-wide text-3xl">Genesis Lounge</h1>
        <div className="flex items-center gap-2">
          <img src="/assets/token-silver.png" alt="WATTS" className="w-5 h-5 pixel-render" />
          <span className="uppercase tracking-wide text-xl">{data.balance.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="pixel-card p-6 flex flex-col items-center gap-4">
        <div className="flex gap-3 text-5xl" aria-label="Reel">
          {(result?.faces ?? data.recent[0]?.faces ?? ['bolt', 'gear', 'star']).map((f, i) => (
            <span key={i} className={`w-20 h-24 flex items-center justify-center pixel-card ${busy ? 'animate-pulse' : ''}`}>{busy ? '?' : FACE[f]}</span>
          ))}
        </div>
        <p className="min-h-6 uppercase tracking-wide text-lg">{busy ? 'Spinning…' : result ? describe(result) : ''}</p>
        {!data.enabled && <p className="text-m2e-danger text-sm tracking-wide">THE REEL IS CLOSED RIGHT NOW</p>}
        {pull.isError && <p className="text-m2e-danger text-sm">{(pull.error as Error).message}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button className="pixel-btn pixel-btn-primary px-4 py-3 text-sm disabled:opacity-40" disabled={!canPull || data.freePullsLeft <= 0} onClick={() => pull.mutate({ stake: 'free' })}>
            Free pull · {data.freePullsLeft}
          </button>
          <button className="pixel-btn pixel-btn-primary px-4 py-3 text-sm disabled:opacity-40" disabled={!canPull || data.balance < data.pullCostWatts} onClick={() => pull.mutate({ stake: 'watts' })}>
            {data.pullCostWatts} WATTS · one pull
          </button>
        </div>
        <button className="pixel-btn pixel-btn-primary px-4 py-3 text-sm disabled:opacity-40" disabled={!canPull || data.stakeable.length === 0} onClick={() => setPicking((v) => !v)}>
          Trade a level {data.stakePartMaxLevel} part {data.stakeable.length === 0 ? '· none loose right now' : `· ${data.stakeable.length} in your garage`}
        </button>
        {picking && (
          <div className="grid grid-cols-4 gap-2">
            {PART_TYPES.map((t) => {
              const first = byType(t)[0];
              return (
                <button key={t} className="pixel-card p-2 text-xs uppercase disabled:opacity-40" disabled={!first} onClick={() => pull.mutate({ stake: 'part', partId: first.id })}>
                  {t}<br />{first ? `L${first.level} ×${byType(t).length}` : '×0'}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-m2e-text-secondary">
          Two bolts pay a little WATTS, three bolts pay more. Any other three of a kind pays a part, and three GENESIS is the top line. Rarer symbols pay more. No odds are published — it is a game of luck. Free pulls reset at midnight UTC.
        </p>
      </div>

      {data.recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="uppercase tracking-wide text-lg">Last pulls</h2>
          <div className="flex flex-wrap gap-2">
            {data.recent.map((r, i) => (
              <span key={i} className="pixel-card px-2 py-1 text-sm">
                {r.faces.map((f) => FACE[f]).join(' ')} {r.prizeWatts > 0 ? `+${r.prizeWatts}` : r.prizePartLevel ? `L${r.prizePartLevel}` : '·'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
