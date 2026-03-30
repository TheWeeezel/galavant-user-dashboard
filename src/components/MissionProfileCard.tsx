import { useQuery } from '@tanstack/react-query';
import { fetchMissionStreak, fetchMissionsToday } from '../api';
import { useAuth } from '../contexts/AuthContext';

const TIER_COLORS: Record<string, string> = {
  none: 'text-gray-400 border-gray-400 bg-gray-400/20',
  iron: 'text-gray-400 border-gray-400 bg-gray-400/20',
  bronze_i: 'text-amber-600 border-amber-600 bg-amber-600/20',
  bronze_ii: 'text-amber-600 border-amber-600 bg-amber-600/20',
  bronze_iii: 'text-amber-600 border-amber-600 bg-amber-600/20',
  silver_i: 'text-slate-300 border-slate-300 bg-slate-300/20',
  silver_ii: 'text-slate-300 border-slate-300 bg-slate-300/20',
  silver_iii: 'text-slate-300 border-slate-300 bg-slate-300/20',
  gold_i: 'text-yellow-400 border-yellow-400 bg-yellow-400/20',
  gold_ii: 'text-yellow-400 border-yellow-400 bg-yellow-400/20',
  gold_iii: 'text-yellow-400 border-yellow-400 bg-yellow-400/20',
  diamond: 'text-cyan-300 border-cyan-300 bg-cyan-300/20',
  diamond_ii: 'text-cyan-300 border-cyan-300 bg-cyan-300/20',
  diamond_iii: 'text-cyan-300 border-cyan-300 bg-cyan-300/20',
  legendary: 'text-orange-500 border-orange-500 bg-orange-500/20',
};

export function MissionProfileCard() {
  const { isAuthenticated } = useAuth();

  const { data: streakData } = useQuery({
    queryKey: ['mission-streak'],
    queryFn: fetchMissionStreak,
    enabled: isAuthenticated,
  });

  const { data: missionsData } = useQuery({
    queryKey: ['missions-today'],
    queryFn: fetchMissionsToday,
    enabled: isAuthenticated,
  });

  if (!streakData) return null;

  const { streak, currentTierConfig, nextTierConfig, daysUntilNextTier } = streakData;
  const tierClasses = TIER_COLORS[streak.currentTier] ?? TIER_COLORS.none;

  return (
    <div className="pixel-card p-5 space-y-4">
      <h3 className="text-sm font-bold text-m2e-text-secondary tracking-wider uppercase">
        Daily Missions
      </h3>

      {/* Streak */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{streak.currentStreak > 0 ? '\uD83D\uDD25' : '\u2014'}</span>
        <span className="text-lg font-bold text-m2e-text">{streak.currentStreak} days</span>
        {currentTierConfig.label !== 'None' && (
          <span className={`pixel-border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${tierClasses}`}>
            {currentTierConfig.label}
          </span>
        )}
        {streak.shieldsAvailable > 0 && (
          <span className="text-xs text-m2e-info font-bold">
            {'\uD83D\uDEE1\uFE0F'} {streak.shieldsAvailable}
          </span>
        )}
      </div>

      {daysUntilNextTier != null && nextTierConfig && (
        <p className="text-xs text-m2e-text-muted">
          Next: {nextTierConfig.label} in {daysUntilNextTier} days
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-m2e-text-secondary">Longest Streak</span>
          <span className="font-bold text-m2e-text">{streak.longestStreak}d</span>
        </div>
        <div className="flex justify-between">
          <span className="text-m2e-text-secondary">Missions</span>
          <span className="font-bold text-m2e-text">{streak.totalMissionsCompleted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-m2e-text-secondary">Chests</span>
          <span className="font-bold text-m2e-text">{streak.totalChestsClaimed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-m2e-text-secondary">Shields</span>
          <span className="font-bold text-m2e-info">{streak.shieldsAvailable}/3</span>
        </div>
      </div>

      {/* Today's Missions (read-only) */}
      {missionsData && missionsData.missions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-m2e-border">
          <p className="text-xs font-bold text-m2e-text-muted uppercase tracking-wider">Today</p>
          {missionsData.missions.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              {m.completed ? (
                <span className="text-m2e-success text-xs">&#10003;</span>
              ) : (
                <span className="text-m2e-text-muted text-xs">&#9675;</span>
              )}
              <span className={`text-sm flex-1 ${m.completed ? 'text-m2e-success line-through' : 'text-m2e-text'}`}>
                {m.featured && <span className="text-m2e-warning mr-1">&#9733;</span>}
                {m.description}
              </span>
              <span className="text-xs text-m2e-text-muted font-mono">
                {Math.min(Math.round(m.progress * 10) / 10, m.targetValue)}/{m.targetValue}
              </span>
            </div>
          ))}
          <p className="text-xs text-m2e-text-muted text-center">
            {missionsData.chestClaimed
              ? 'Chest claimed!'
              : `${missionsData.missions.filter((m) => m.completed).length}/3 complete`}
          </p>
        </div>
      )}
    </div>
  );
}
