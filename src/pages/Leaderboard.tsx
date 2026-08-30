import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, Coins, Users, Clock } from 'pixelarticons/react';
import {
  fetchLeaderboard,
  redemptionLeaderboard,
  type RedemptionStanding,
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import { EnjRedemptionSection } from '../components/EnjRedemptionSection';
import { formatDistance } from '../utils/format';

type Metric = 'distance' | 'earnings';
type Period = 'daily' | 'weekly' | 'all_time';

/**
 * Season standings. The allocation panel sits on top because it is the part with
 * money attached: it answers "what have others put in, what have I put in, and
 * what does that make my share". The rider boards below are the vanity metrics.
 */
export function Leaderboard() {
  const { isAuthenticated } = useAuth();
  const [metric, setMetric] = useState<Metric>('distance');
  const [period, setPeriod] = useState<Period>('all_time');

  const alloc = useQuery({
    queryKey: ['redemption-leaderboard'],
    queryFn: () => redemptionLeaderboard(25),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 30_000,
  });

  const riders = useQuery({
    queryKey: ['leaderboard', metric, period],
    queryFn: () => fetchLeaderboard(metric, period),
  });

  const season = alloc.data?.open ? alloc.data.season : undefined;
  const me = alloc.data?.me ?? null;

  return (
    <>
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-m2e-accent text-xs uppercase tracking-[0.25em]">
                <ChevronLeft className="w-4 h-4" />
                Home
              </Link>
              <span className="text-white/30">/</span>
              <div className="section-label">Standings</div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
              High<br />
              <span className="text-m2e-accent">Scores.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl">
              Who has committed what to this season's pot, and who is putting in the kilometres.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 space-y-12">
        {/* ── Season pot ─────────────────────────────────────────── */}
        <section className="space-y-5">
          {!isAuthenticated ? (
            <div className="pixel-card p-6 space-y-2">
              <div className="section-label">This season's pot</div>
              <p className="text-m2e-text-secondary">
                Sign in to see what players have committed this season and what your share would be.
              </p>
            </div>
          ) : !season ? (
            <div className="pixel-card p-6 space-y-2">
              <div className="section-label">This season's pot</div>
              <p className="text-m2e-text-secondary">
                No redemption window is open right now. When one opens, everything committed shows up
                here — including your share of it.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div className="section-label">{season.name} · the pot</div>
                {season.closesAt && (
                  <span className="text-xs uppercase tracking-widest text-m2e-text-muted inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Closes {new Date(season.closesAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <PotStat icon={Coins} label="Season pot" value={`${season.budgetEnj.toLocaleString()} ENJ`} accent />
                <PotStat icon={Trophy} label="Committed" value={`${season.totalWatts.toLocaleString()} WATTS`} />
                <PotStat icon={Users} label="Players in" value={season.entrants.toLocaleString()} />
                <PotStat
                  icon={Coins}
                  label="Your share"
                  value={me ? `${me.sharePct}%` : '—'}
                  sub={me ? `≈ ${me.estimatedEnj.toLocaleString()} ENJ` : 'nothing committed'}
                />
              </div>

              {me && (
                <ShareBar mine={me.sharePct} />
              )}

              <p className="text-sm text-m2e-text-secondary">
                Your share is your committed WATTS weighted by your ENJ stake, against everyone else's.
                It moves every time another player commits, so the figure above is an estimate until the
                window closes.
              </p>
            </>
          )}
        </section>

        {/* Commit form — the same one the wallet uses, so there is one implementation. */}
        {isAuthenticated && <EnjRedemptionSection />}

        {/* ── Who has committed ──────────────────────────────────── */}
        {isAuthenticated && season && (alloc.data?.top?.length ?? 0) > 0 && (
          <section className="space-y-4">
            <div className="section-label">Committed this season</div>
            <div className="pixel-card p-0 overflow-hidden">
              <div className="hidden md:grid grid-cols-[3rem_1fr_9rem_6rem_8rem] gap-3 px-5 py-3 bg-m2e-bg-alt text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Committed</span>
                <span className="text-right">Share</span>
                <span className="text-right">Est. payout</span>
              </div>
              {alloc.data!.top!.map((row) => (
                <StandingRow key={`${row.rank}-${row.nickname}`} row={row} />
              ))}
            </div>
            {me?.rank != null && me.rank > (alloc.data?.top?.length ?? 0) && (
              <p className="text-sm text-m2e-text-secondary">
                You are ranked #{me.rank} with {me.watts.toLocaleString()} WATTS committed.
              </p>
            )}
          </section>
        )}

        {/* ── Rider boards ───────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="section-label">Top riders</div>
            <div className="flex flex-wrap gap-2">
              <Chips value={metric} onChange={setMetric} options={[
                { value: 'distance', label: 'Distance' },
                { value: 'earnings', label: 'Earnings' },
              ]} />
              <Chips value={period} onChange={setPeriod} options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'all_time', label: 'All time' },
              ]} />
            </div>
          </div>

          <div className="pixel-card p-0 overflow-hidden">
            {riders.isLoading ? (
              <div className="p-10 text-center text-m2e-text-muted text-sm">Loading standings…</div>
            ) : !riders.data?.length ? (
              <div className="p-10 text-center text-m2e-text-muted text-sm">No entries yet.</div>
            ) : (
              riders.data.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-4 px-5 py-3 border-b border-m2e-border/40 last:border-0"
                >
                  <span className={`text-lg tabular-nums w-10 shrink-0 ${entry.rank <= 3 ? 'text-m2e-accent' : 'text-m2e-text-muted'}`}>
                    {String(entry.rank).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-m2e-text">{entry.nickname ?? 'Player'}</span>
                  <span className="text-m2e-text-secondary tabular-nums">
                    {metric === 'distance'
                      ? formatDistance(entry.value)
                      : `${entry.value.toLocaleString()} WATTS`}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PotStat({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`pixel-card p-4 space-y-1.5 ${accent ? 'border-m2e-accent bg-m2e-accent-soft' : ''}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-xl md:text-2xl leading-none ${accent ? 'text-m2e-accent-dark' : 'text-m2e-text'}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-m2e-text-muted">{sub}</div>}
    </div>
  );
}

/** Your slice against everyone else's, so the percentage has a shape. */
function ShareBar({ mine }: { mine: number }) {
  const pct = Math.max(0, Math.min(100, mine));
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-full pixel-border border-m2e-border bg-m2e-bg-alt overflow-hidden">
        <div className="h-full bg-m2e-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted">
        <span>Your share · {pct}%</span>
        <span>Everyone else · {Math.round((100 - pct) * 100) / 100}%</span>
      </div>
    </div>
  );
}

function StandingRow({ row }: { row: RedemptionStanding }) {
  return (
    <div
      className={`grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[3rem_1fr_9rem_6rem_8rem] gap-3 items-center px-5 py-3 border-b border-m2e-border/40 last:border-0 ${
        row.isMe ? 'bg-m2e-accent-soft' : ''
      }`}
    >
      <span className={`tabular-nums ${row.rank <= 3 ? 'text-m2e-accent' : 'text-m2e-text-muted'}`}>
        {String(row.rank).padStart(2, '0')}
      </span>
      <span className="min-w-0 truncate text-m2e-text">
        {row.nickname}
        {row.isMe && <span className="ml-2 text-[10px] uppercase tracking-widest text-m2e-accent-dark">you</span>}
      </span>
      <span className="text-right tabular-nums text-m2e-text-secondary">
        {row.watts.toLocaleString()}
        <span className="hidden md:inline"> WATTS</span>
      </span>
      <span className="hidden md:block text-right tabular-nums text-m2e-text">{row.sharePct}%</span>
      <span className="hidden md:block text-right tabular-nums text-m2e-accent-dark">
        ≈ {row.estimatedEnj.toLocaleString()} ENJ
      </span>
    </div>
  );
}

function Chips<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs uppercase tracking-wider pixel-border transition-colors ${
            value === o.value
              ? 'bg-m2e-accent text-m2e-text-on-accent border-m2e-accent-dark'
              : 'bg-m2e-card border-m2e-border text-m2e-text-secondary hover:border-m2e-accent'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
