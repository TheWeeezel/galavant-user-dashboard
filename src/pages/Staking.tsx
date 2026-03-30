import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Zap } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchStaking, createStake, unstake, fetchMainWallet, type StakeInfo } from '../api';
import { formatTokens } from '../utils/format';
import { TransactionDialog } from '../components/TransactionDialog';

const LOCK_OPTIONS = [
  { days: 7, label: '7 Days', multiplier: '1.0x' },
  { days: 30, label: '30 Days', multiplier: '2.0x' },
  { days: 90, label: '90 Days', multiplier: '3.5x' },
] as const;

function daysRemaining(endsAt: string): number {
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function Staking() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState(7);
  const [unstakeTarget, setUnstakeTarget] = useState<StakeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: staking } = useQuery({
    queryKey: ['staking'],
    queryFn: fetchStaking,
    enabled: isAuthenticated,
  });

  const { data: mainWallet } = useQuery({
    queryKey: ['main-wallet'],
    queryFn: fetchMainWallet,
    enabled: isAuthenticated,
  });

  const stakeMutation = useMutation({
    mutationFn: () => createStake('tokens', parseFloat(amount), lockPeriod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staking'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      setSuccess(`Staked ${amount} SAT tokens for ${lockPeriod} days`);
      setError(null);
      setAmount('');
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); },
  });

  const unstakeMutation = useMutation({
    mutationFn: (stakeId: string) => unstake(stakeId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staking'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      const msg = data.penalty > 0
        ? `Unstaked. Returned ${data.returned}, penalty: ${data.penalty}`
        : `Unstaked. Returned ${data.returned}`;
      setSuccess(msg);
      setError(null);
      setUnstakeTarget(null);
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); setUnstakeTarget(null); },
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-m2e-text-secondary text-lg">Sign in to manage your stakes.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Lock className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Staking</h1>
      </div>

      {/* Alerts */}
      {success && <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 text-m2e-success">{success}</div>}
      {error && <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{error}</div>}

      {/* Power Overview */}
      {staking && (
        <div className="pixel-card p-5 space-y-3">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Staking Power</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-m2e-text-muted uppercase">Power</p>
              <p className="text-2xl text-m2e-accent">{staking.effectivePower}</p>
            </div>
            <div>
              <p className="text-xs text-m2e-text-muted uppercase">Earning Boost</p>
              <p className="text-2xl text-m2e-success flex items-center gap-1">
                <Zap className="w-5 h-5" /> +{staking.earningBoostPercent}%
              </p>
            </div>
            <div>
              <p className="text-xs text-m2e-text-muted uppercase">Energy Bonus</p>
              <p className="text-2xl text-m2e-info">+{staking.energyBonus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Stake */}
      <div className="pixel-card p-5 space-y-4">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Stake SAT Tokens</p>

        {mainWallet && (
          <p className="text-xs text-m2e-text-muted">
            Available: {formatTokens(mainWallet.satTokenBalance)} SAT
          </p>
        )}

        <input
          type="number"
          className="w-full bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-xl text-m2e-text focus:border-m2e-accent outline-none"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="flex gap-2">
          {LOCK_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setLockPeriod(opt.days)}
              className={`flex-1 pixel-btn text-sm py-2 ${
                lockPeriod === opt.days ? 'pixel-btn-primary' : 'pixel-btn-secondary'
              }`}
            >
              {opt.label}
              <span className="block text-[10px] opacity-75">{opt.multiplier}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => stakeMutation.mutate()}
          disabled={!amount || parseFloat(amount) <= 0 || stakeMutation.isPending}
          className="pixel-btn pixel-btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {stakeMutation.isPending ? 'Staking...' : 'Stake'}
        </button>
      </div>

      {/* Active Stakes */}
      <div className="pixel-card p-5 space-y-3">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Active Stakes</p>
        {!staking?.stakes.length ? (
          <p className="text-sm text-m2e-text-muted">No active stakes.</p>
        ) : (
          <div className="space-y-2">
            {staking.stakes.map((s) => {
              const days = daysRemaining(s.endsAt);
              const matured = days === 0;
              return (
                <div key={s.id} className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg">
                      {s.amount.toLocaleString()} <span className="text-sm text-m2e-text-secondary">{s.type === 'tokens' ? 'SAT' : 'SAP'}</span>
                    </p>
                    <p className="text-xs text-m2e-text-muted">
                      {s.lockPeriod}d lock &middot; {matured ? <span className="text-m2e-success">Matured</span> : `${days}d remaining`}
                    </p>
                  </div>
                  <button
                    onClick={() => setUnstakeTarget(s)}
                    className={`pixel-btn text-xs px-3 py-1.5 ${matured ? 'pixel-btn-primary' : 'pixel-btn-outline'}`}
                  >
                    Unstake
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unstake Confirmation */}
      <TransactionDialog
        open={!!unstakeTarget}
        onClose={() => setUnstakeTarget(null)}
        onConfirm={() => unstakeTarget && unstakeMutation.mutate(unstakeTarget.id)}
        title="Unstake"
        confirmLabel="Unstake"
        loading={unstakeMutation.isPending}
      >
        {unstakeTarget && (
          <>
            <p>Unstake {unstakeTarget.amount.toLocaleString()} {unstakeTarget.type === 'tokens' ? 'SAT' : 'SAP'}?</p>
            {daysRemaining(unstakeTarget.endsAt) > 0 && (
              <p className="text-m2e-warning text-sm">
                Early unstake incurs a penalty. {daysRemaining(unstakeTarget.endsAt)} days remaining.
              </p>
            )}
          </>
        )}
      </TransactionDialog>
    </div>
  );
}
