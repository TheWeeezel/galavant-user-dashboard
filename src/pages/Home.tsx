import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Users, MapPin, Coins, Image, Zap,
  Store, ShoppingCart, Trophy, SpeedFast,
  Heart, Scale, Chart, Fire,
} from 'pixelarticons/react';
import { fetchStats, fetchNfts, fetchLeaderboard, fetchMarketplace } from '../api';
import { StatCard } from '../components/StatCard';
import { NftCard } from '../components/NftCard';
import { NftDetailModal } from '../components/NftDetailModal';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { ListingCard } from '../components/ListingCard';

type LeaderboardMetric = 'distance' | 'earnings';
type LeaderboardPeriod = 'daily' | 'weekly' | 'all_time';
type MarketplaceSort = 'newest' | 'price_asc' | 'price_desc';

const economyStateColors: Record<string, { bg: string; text: string; label: string }> = {
  Healthy: { bg: 'bg-m2e-success/15', text: 'text-m2e-success', label: 'Healthy' },
  Cautious: { bg: 'bg-m2e-warning/15', text: 'text-m2e-warning', label: 'Cautious' },
  Stressed: { bg: 'bg-m2e-danger/15', text: 'text-m2e-danger', label: 'Stressed' },
};

function formatSat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function Home() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('distance');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('all_time');
  const [mpSort, setMpSort] = useState<MarketplaceSort>('newest');

  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const nfts = useQuery({ queryKey: ['nfts'], queryFn: () => fetchNfts(1, 12) });
  const leaderboard = useQuery({
    queryKey: ['leaderboard', lbMetric, lbPeriod],
    queryFn: () => fetchLeaderboard(lbMetric, lbPeriod),
  });
  const marketplace = useQuery({
    queryKey: ['marketplace', mpSort],
    queryFn: () => fetchMarketplace({ page: 1, limit: 8, sortBy: mpSort }),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-16">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="text-center py-12 space-y-4">
        <img src="/logo.png" alt="Galavant" className="h-44 w-44 mx-auto" />
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          <span className="text-m2e-accent-dark">Galavant</span>
        </h1>
        <p className="text-m2e-text-secondary text-lg font-medium">Walk to Earn on Bitcoin</p>
        <p className="text-m2e-text-muted text-sm max-w-md mx-auto">
          Grab your balance bike, walk to earn SAT points, mint NFTs, and trade on-chain &mdash; all on Bitcoin L1 via OPNet.
        </p>
      </section>

      {/* ── Global Stats ─────────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight">Global Stats</h2>
        {stats.isLoading ? (
          <div className="text-m2e-text-muted text-sm">Loading stats...</div>
        ) : stats.error ? (
          <div className="text-red-400 text-sm">Failed to load stats</div>
        ) : stats.data ? (() => {
          const d = stats.data;
          const avgWalk = d.avgDistancePerActivity ?? 0;
          const sold = d.totalSold ?? 0;
          const vol = d.totalVolume ?? 0;
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Walkers" value={(d.totalUsers ?? 0).toLocaleString()} />
              <StatCard icon={MapPin} label="Total Distance" value={`${((d.totalDistance ?? 0) / 1000).toFixed(0)} km`} />
              <StatCard icon={Coins} label="SAT Earned" value={formatSat(d.totalSatEarned ?? 0)} />
              <StatCard icon={Zap} label="Activities" value={(d.totalActivities ?? 0).toLocaleString()} />
              <StatCard icon={Image} label="Minted NFTs" value={(d.totalMintedNfts ?? 0).toLocaleString()} />
              <StatCard icon={SpeedFast} label="Avg Walk" value={avgWalk > 0 ? `${(avgWalk / 1000).toFixed(1)} km` : '—'} />
              <StatCard icon={Trophy} label="Items Sold" value={sold.toLocaleString()} />
              <StatCard icon={Fire} label="Volume Traded" value={vol > 0 ? `${formatSat(vol)} SAT` : '—'} />
            </div>
          );
        })() : null}
      </section>

      {/* ── Economy & Marketplace Overview ─────────────────────── */}
      {stats.data && stats.data.economyHealthScore != null && (
        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Economy & Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Economy Health */}
            <div className="pixel-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-m2e-accent" />
                <div>
                  <div className="text-xs font-bold text-m2e-text-muted uppercase tracking-widest">Economy Health</div>
                  <div className="text-3xl font-black text-m2e-text">{stats.data.economyHealthScore}</div>
                </div>
              </div>
              {(() => {
                const state = economyStateColors[stats.data!.economyState] ?? economyStateColors.Healthy;
                return (
                  <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest pixel-border ${state.bg} ${state.text}`}>
                    {state.label}
                  </span>
                );
              })()}
            </div>

            {/* Active Listings */}
            <div className="pixel-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Store className="w-8 h-8 text-m2e-accent" />
                <div>
                  <div className="text-xs font-bold text-m2e-text-muted uppercase tracking-widest">Active Listings</div>
                  <div className="text-3xl font-black text-m2e-text">{stats.data.activeListings ?? 0}</div>
                </div>
              </div>
              <div className="text-xs text-m2e-text-secondary font-bold">
                Avg price: <span className="text-m2e-accent">{(stats.data.avgListingPrice ?? 0) > 0 ? `${formatSat(stats.data.avgListingPrice)} SAT` : '—'}</span>
              </div>
            </div>

            {/* Floor Price */}
            <div className="pixel-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Scale className="w-8 h-8 text-m2e-accent" />
                <div>
                  <div className="text-xs font-bold text-m2e-text-muted uppercase tracking-widest">Floor Price</div>
                  <div className="text-3xl font-black text-m2e-text">
                    {(stats.data.floorPrice ?? 0) > 0 ? `${formatSat(stats.data.floorPrice)}` : '—'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-m2e-text-secondary font-bold">
                Cheapest active listing in SAT
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Marketplace Listings ────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-m2e-accent" />
              Marketplace
            </h2>
            <Link to="/market" className="px-3 py-1 text-xs font-black uppercase tracking-wider pixel-btn pixel-btn-secondary">
              View All
            </Link>
          </div>
          <div className="flex gap-2">
            {([
              ['newest', 'Newest'],
              ['price_asc', 'Cheapest'],
              ['price_desc', 'Priciest'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMpSort(key)}
                className={`px-4 py-2 pixel-btn text-xs ${
                  mpSort === key ? 'pixel-btn-primary' : 'pixel-btn-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {marketplace.isLoading ? (
          <div className="text-m2e-text-muted text-sm">Loading marketplace...</div>
        ) : marketplace.error ? (
          <div className="text-red-400 text-sm">Failed to load marketplace</div>
        ) : marketplace.data && marketplace.data.listings.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {marketplace.data.listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={listing.itemType === 'bike' ? () => setSelectedNftId(listing.itemId) : undefined}
                />
              ))}
            </div>
            {marketplace.data.total > 8 && (
              <div className="text-center text-sm text-m2e-text-muted font-bold">
                Showing 8 of {marketplace.data.total} listings
              </div>
            )}
          </>
        ) : (
          <div className="pixel-card p-8 text-center">
            <Store className="w-12 h-12 text-m2e-text-muted mx-auto mb-3" />
            <div className="text-m2e-text-muted text-sm">No listings yet &mdash; be the first to list!</div>
          </div>
        )}
      </section>

      {/* ── Minted NFTs Gallery ──────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight">Minted Balance Bikes</h2>
        {nfts.isLoading ? (
          <div className="text-m2e-text-muted text-sm">Loading NFTs...</div>
        ) : nfts.error ? (
          <div className="text-red-400 text-sm">Failed to load NFTs</div>
        ) : nfts.data && nfts.data.nfts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.data.nfts.map((nft) => (
              <NftCard key={nft.id} nft={nft} onClick={() => setSelectedNftId(nft.id)} />
            ))}
          </div>
        ) : (
          <div className="text-m2e-text-muted text-sm">No minted NFTs yet</div>
        )}
      </section>

      {/* ── Leaderboard ──────────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Chart className="w-7 h-7 text-m2e-accent" />
          Leaderboard
        </h2>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Metric toggle */}
          <div className="flex gap-2">
            {(['distance', 'earnings'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setLbMetric(m)}
                className={`px-4 py-2 pixel-btn ${
                  lbMetric === m ? 'pixel-btn-primary' : 'pixel-btn-secondary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Period toggle */}
          <div className="flex gap-2">
            {([
              ['daily', 'Daily'],
              ['weekly', 'Weekly'],
              ['all_time', 'All Time'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLbPeriod(key)}
                className={`px-4 py-2 pixel-btn ${
                  lbPeriod === key ? 'pixel-btn-primary' : 'pixel-btn-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div className="rounded-xl border border-m2e-border bg-m2e-card/30 overflow-hidden">
          {leaderboard.isLoading ? (
            <div className="p-6 text-m2e-text-muted text-sm">Loading leaderboard...</div>
          ) : leaderboard.error ? (
            <div className="p-6 text-red-400 text-sm">Failed to load leaderboard</div>
          ) : leaderboard.data && leaderboard.data.length > 0 ? (
            leaderboard.data.slice(0, 10).map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} metric={lbMetric} />
            ))
          ) : (
            <div className="p-6 text-m2e-text-muted text-sm">No entries yet</div>
          )}
        </div>
      </section>

      {/* NFT Detail Modal */}
      {selectedNftId && (
        <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
      )}
    </div>
  );
}
