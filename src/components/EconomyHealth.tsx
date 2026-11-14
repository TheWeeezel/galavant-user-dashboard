import { useQuery } from '@tanstack/react-query';
import { motion, type Variants } from 'framer-motion';
import { Store, Scale } from 'pixelarticons/react';
import { fetchStats } from '../api';
import { CountUp } from './CountUp';

// Keys are the server's EconomyState enum values (lowercase). Until 2026-09-12 they were
// capitalised, so no state ever matched and the badge was permanently green.
const ECONOMY_STATE: Record<string, { bg: string; text: string; label: string }> = {
  healthy: { bg: 'bg-m2e-success/15', text: 'text-m2e-success', label: 'Healthy' },
  cautious: { bg: 'bg-m2e-warning/15', text: 'text-m2e-warning', label: 'Cautious' },
  stressed: { bg: 'bg-m2e-danger/15', text: 'text-m2e-danger', label: 'Stressed' },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function formatWatts(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const formatFloor = (n: number) => (n > 0 ? formatWatts(n) : '—');

/**
 * The live economy health score, published where a reader weighing the economy looks: the guide's
 * Economic Governance chapter, under the score's own explanation. It moved off Home in the
 * 2026-11 clean-up.
 *
 * The whole block, intro line included, renders only once there is a score. Without one there is
 * nothing to publish, and a heading over an empty body (as on the old Home section) read as broken.
 */
export function EconomyHealth() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const d = stats.data;
  if (!d || d.economyHealthScore == null || d.economyHealthScore < 0) return null;

  const state = d.economyState ?? 'healthy';
  const style = ECONOMY_STATE[state] ?? ECONOMY_STATE.healthy;

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-m2e-text-muted">
        <span className="w-2 h-2 rounded-full bg-m2e-success" />
        Live · Most games hide it. We publish it.
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-m2e-accent/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <HealthGauge score={d.economyHealthScore} state={state} />
            <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Health Score</div>
            <span className={`inline-block px-3 py-1 text-xs uppercase tracking-widest pixel-border ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center">
              <Store className="w-6 h-6 text-m2e-accent" />
            </div>
            <div>
              <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Active Listings</div>
              <div className="text-4xl md:text-5xl text-m2e-text leading-none">
                <CountUp value={d.activeListings ?? 0} />
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-sm text-m2e-text-secondary flex items-center justify-between">
            <span>Avg price</span>
            <span className="text-m2e-accent font-mono">
              {(d.avgListingPrice ?? 0) > 0 ? `${formatWatts(d.avgListingPrice)} WATTS` : '—'}
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center">
              <Scale className="w-6 h-6 text-m2e-accent" />
            </div>
            <div>
              <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Floor Price</div>
              <div className="text-4xl md:text-5xl text-m2e-text leading-none">
                <CountUp value={d.floorPrice ?? 0} format={formatFloor} />
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-sm text-m2e-text-secondary">Cheapest active listing in WATTS</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function HealthGauge({ score, state }: { score: number; state: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    state === 'healthy' ? 'var(--color-m2e-success)' :
    state === 'stressed' ? 'var(--color-m2e-danger)' :
    'var(--color-m2e-warning)';

  return (
    <div className="relative w-32 h-32">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r="54" stroke="var(--color-m2e-border)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="64"
          cy="64"
          r="54"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl md:text-5xl text-m2e-text leading-none">
          <CountUp value={score} duration={1.4} />
        </span>
        <span className="text-[9px] text-m2e-text-muted uppercase tracking-[0.3em]">/ 100</span>
      </div>
    </div>
  );
}
