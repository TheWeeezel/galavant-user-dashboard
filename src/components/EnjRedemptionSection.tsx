import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins } from 'pixelarticons/react';
import { redemptionCurrent, redemptionSubmit } from '../api';

/**
 * Seasonal WATTS → ENJ redemption, embedded in the account (Wallet page). When
 * no window is open it shows a compact teaser; when one is open the player can
 * commit WATTS for a pro-rata share of the season's real ENJ budget. Assumes an
 * authenticated caller.
 */
export function EnjRedemptionSection() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');

  const status = useQuery({
    queryKey: ['redemption-current'],
    queryFn: redemptionCurrent,
    retry: false,
    refetchInterval: 30_000,
  });

  const submit = useMutation({
    mutationFn: (w: number) => redemptionSubmit(w),
    onSuccess: () => {
      setAmount('');
      qc.invalidateQueries({ queryKey: ['redemption-current'] });
      qc.invalidateQueries({ queryKey: ['spending-wallet'] });
    },
  });

  const s = status.data;

  if (!s || !s.open || !s.season) {
    return (
      <div className="pixel-card p-6 space-y-2">
        <div className="section-label flex items-center gap-2"><Coins className="w-4 h-4 text-m2e-accent" /> WATTS → ENJ</div>
        <p className="text-m2e-text-secondary text-sm">
          No redemption window is open right now. Each season you'll turn earned WATTS into real ENJ —
          funded by game revenue. Keep earning and staking to grow your share.
        </p>
      </div>
    );
  }

  const min = s.minWatts ?? 100;
  const n = Number(amount);
  const valid = Number.isInteger(n) && n >= min;

  return (
    <div className="space-y-4">
      <div className="section-label flex items-center gap-2">
        <Coins className="w-4 h-4 text-m2e-accent" /> WATTS → ENJ · {s.season.name}
      </div>
      <div className="pixel-card p-6 space-y-4">
        <p className="text-m2e-text-secondary text-sm">
          Put WATTS into this season's pot to claim a share of a real{' '}
          <span className="text-m2e-accent">{s.season.budgetEnj.toLocaleString()} ENJ</span> budget. WATTS you
          commit are spent. When the window closes, the budget is split among everyone who entered — your share
          depends on how much you put in (staking grows it). No fixed rate.
        </p>
        <div className="border-t border-m2e-border pt-4 space-y-2">
          <Row label="Season pot" value={`${s.season.budgetEnj.toLocaleString()} ENJ`} />
          <Row label="Committed by all players" value={`${s.season.totalWatts.toLocaleString()} WATTS`} />
          <Row label="Your commitment" value={`${(s.entry?.watts ?? 0).toLocaleString()} WATTS`} />
          <Row label="Your estimated payout" value={`≈ ${(s.entry?.estimatedEnj ?? 0).toLocaleString()} ENJ`} accent />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={min}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(min)}
            disabled={submit.isPending}
            className="flex-1 bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-lg font-bold text-m2e-text focus:border-m2e-accent outline-none"
          />
          <span className="text-m2e-text-secondary font-bold">WATTS</span>
        </div>
        <button
          className="pixel-btn-primary px-6 py-3 w-full disabled:opacity-50"
          onClick={() => valid && submit.mutate(n)}
          disabled={!valid || submit.isPending}
        >
          {submit.isPending ? 'Committing…' : 'Redeem WATTS for ENJ'}
        </button>
        <p className="text-xs text-m2e-text-muted">
          Minimum {min.toLocaleString()} WATTS. Committed WATTS are spent and can't be refunded. Your estimate
          shifts as other players join.
        </p>
        {submit.isError && <p className="text-sm text-m2e-danger">{(submit.error as Error).message}</p>}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-m2e-text-secondary">{label}</span>
      <span className={accent ? 'font-bold text-m2e-accent' : 'font-bold'}>{value}</span>
    </div>
  );
}
