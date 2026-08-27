import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap, ExternalLink } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { enjinLinkStart, enjinLinkStatus, enjinStakingStatus } from '../api';

// Mainnet pool 84, "Galavant Peloton". Players stake from their own Enjin
// Wallet — Galavant never custodies their ENJ.
const POOL_URL = 'https://nft.io/staking/pool/84';

/**
 * ENJ Staking (web) — link a real Enjin Wallet and stake ENJ in the Galavant
 * pool for a permanent earning boost. Mirrors the app screen and reuses the
 * same backend endpoints. Degrades gracefully to a "coming soon" card when the
 * backend returns 503 (Enjin not yet enabled).
 */
export default function EnjStaking() {
  const { isAuthenticated } = useAuth();

  const link = useQuery({
    queryKey: ['enjin-link-status'],
    queryFn: enjinLinkStatus,
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: (q) => (q.state.data?.linked ? false : 5000),
  });

  const staking = useQuery({
    queryKey: ['enjin-staking-status'],
    queryFn: enjinStakingStatus,
    enabled: isAuthenticated && link.data?.linked === true,
    retry: false,
    refetchInterval: 60_000,
  });

  const startLink = useMutation({
    mutationFn: enjinLinkStart,
    onSuccess: (data) => {
      if (data.url) window.open(data.url, '_blank', 'noopener');
      link.refetch();
    },
  });

  const notEnabled =
    (link.error as { message?: string } | undefined)?.message?.includes('not enabled') ||
    link.error != null && !link.data;

  const boostPercent = staking.data?.earningBoost
    ? Math.round((staking.data.earningBoost - 1) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Zap className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">ENJ Staking</h1>
      </div>

      {notEnabled ? (
        <div className="pixel-card p-6 space-y-3">
          <h2 className="text-2xl uppercase tracking-wide">Coming soon</h2>
          <p className="text-m2e-text-secondary">
            Galavant is moving to the Enjin blockchain. Soon you'll stake real ENJ in the Galavant
            Peloton pool and earn a permanent boost on everything you earn in the game. Your stake
            stays in your own wallet — we never hold it.
          </p>
        </div>
      ) : (
        <>
          <div className="pixel-card p-6 space-y-3">
            <h2 className="text-2xl uppercase tracking-wide">Stake ENJ, earn more</h2>
            <p className="text-m2e-text-secondary">
              Stake ENJ in the <span className="text-m2e-accent">Galavant Peloton</span> pool from
              your own Enjin Wallet. The more you stake, the bigger your earning boost. You keep your
              ENJ and its staking yield — the boost is our thank-you for riding with the pack.
            </p>
            <p className="text-sm text-m2e-text-muted">
              Your boost is based on your average stake over the last two weeks, so it rewards
              commitment — not quick in-and-out moves.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="pixel-card p-6 space-y-3">
              <h2 className="text-xl uppercase tracking-wide">Step 1 — Link your Enjin Wallet</h2>
              <p className="text-m2e-text-secondary">
                Sign in to link your Enjin Wallet and see your earning boost. Linking only reads your
                public address — it never moves any funds.
              </p>
            </div>
          ) : !link.data?.linked ? (
            <div className="pixel-card p-6 space-y-4">
              <h2 className="text-xl uppercase tracking-wide">Step 1 — Link your Enjin Wallet</h2>
              <p className="text-m2e-text-secondary">
                Tap below to open a linking request, then approve it in your Enjin Wallet. We only
                read your public address to see your stake — linking never moves any funds.
              </p>
              <button
                className="pixel-btn-primary px-6 py-3"
                onClick={() => startLink.mutate()}
                disabled={startLink.isPending}
              >
                {startLink.isPending
                  ? 'Opening…'
                  : link.data?.pending
                    ? 'Waiting for approval…'
                    : 'Link Enjin Wallet'}
              </button>
              {link.data?.pending && (
                <p className="text-sm text-m2e-text-muted">
                  Approve the request in your Enjin Wallet — this page updates automatically.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="pixel-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-m2e-accent" />
                  <span className="text-4xl text-m2e-accent">+{boostPercent}%</span>
                  <span className="text-m2e-text-secondary">earning boost</span>
                </div>
                <div className="border-t border-m2e-border pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-m2e-text-secondary">Currently staked</span>
                    <span className="font-bold">
                      {(staking.data?.currentBondedEnj ?? 0).toLocaleString()} ENJ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-m2e-text-secondary">Boost basis (14-day avg)</span>
                    <span className="font-bold">
                      {(staking.data?.timeWeightedBondedEnj ?? 0).toLocaleString()} ENJ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-m2e-text-secondary">Energy bonus</span>
                    <span className="font-bold">+{staking.data?.energyBonus ?? 0} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-m2e-text-secondary">Tier</span>
                    <span className="font-bold">{staking.data?.tier ?? 'None'}</span>
                  </div>
                </div>
                {!staking.data?.staked && (
                  <p className="text-sm text-m2e-text-muted">
                    Wallet linked — stake ENJ in the pool to start your boost.
                  </p>
                )}
              </div>

              <div className="pixel-card p-6 space-y-4">
                <h2 className="text-xl uppercase tracking-wide">Step 2 — Stake in the pool</h2>
                <p className="text-m2e-text-secondary">
                  Open the Galavant Peloton pool to stake or add ENJ. New stakes show up here within
                  an hour.
                </p>
                <a
                  className="pixel-btn-secondary px-6 py-3 inline-flex items-center gap-2"
                  href={POOL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Galavant Peloton pool <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {staking.data?.slashingRisk && (
                <p className="text-sm text-m2e-text-muted">{staking.data.slashingRisk}</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
