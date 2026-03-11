import type { LeaderboardEntry } from '../api';

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  metric: 'distance' | 'earnings';
}

export function LeaderboardRow({ entry, metric }: LeaderboardRowProps) {
  const medal = medals[entry.rank];
  const formattedValue =
    metric === 'distance'
      ? `${(entry.value / 1000).toFixed(1)} km`
      : `${entry.value.toLocaleString()} SAT`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-m2e-border/50 last:border-0 hover:bg-m2e-card/30 transition-colors">
      {/* Rank */}
      <span className="w-8 text-center font-black text-sm">
        {medal ?? <span className="text-m2e-text-muted">{entry.rank}</span>}
      </span>

      {/* Name */}
      <span className="flex-1 font-bold text-sm truncate">
        {entry.displayName ?? 'Anonymous'}
      </span>

      {/* Value */}
      <span className="text-sm font-mono text-m2e-accent">{formattedValue}</span>
    </div>
  );
}
