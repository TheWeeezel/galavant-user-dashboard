import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Users, MapPin, Coins, Image, Zap,
  Store, ShoppingCart, Trophy, SpeedFast,
  Heart, Scale, Chart, Fire,
  Download, Login, Gift, Human,
  Cancel, Check, Globe, Flag,
  Music, Cloud, Lock, Clock,
} from 'pixelarticons/react';
import { fetchStats, fetchLeaderboard, fetchMarketplace } from '../api';
import { StatCard } from '../components/StatCard';
import { NftDetailModal } from '../components/NftDetailModal';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { ListingCard } from '../components/ListingCard';
import { formatDistance } from '../utils/format';
import type { ChangelogData } from '../types/changelog';

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

const COMPARISON_ROWS: [string, string, string][] = [
  ['Blockchain', 'Solana, BNB, L2s', 'Bitcoin Layer 1'],
  ['Economy Management', 'None — mint and pray', 'AI Central Banker with human approval'],
  ['Token Supply Control', 'Unlimited or ignored', 'Active burns, buybacks & reserves'],
  ['Stabilization Fund', 'Non-existent', 'Revenue-backed, auditable fund'],
  ['Economy Health Visibility', 'Hidden or non-existent', 'Public real-time health score'],
  ['Asset Security', 'Chain-dependent', 'Secured by Bitcoin\'s hashrate'],
  ['Inflation Response', 'Usually too late', 'Daily AI monitoring + tunable economic levers'],
  ['Revenue Model', 'Speculation-driven', 'Platform fees fund stability operations'],
];

const ONBOARDING_STEPS = [
  { icon: Download, title: 'Download', description: 'Get the app on iOS or Android' },
  { icon: Login, title: 'Sign In', description: 'Create your account and wallet' },
  { icon: Gift, title: 'Free NFT', description: 'Claim your starter balance bike' },
  { icon: Human, title: 'Start Walking', description: 'Move to earn SAP' },
];

const ROADMAP_ITEMS: { title: string; icon: React.ComponentType<any>; status: 'done' | 'current' | 'upcoming' }[] = [
  { title: 'Testnet', icon: Zap, status: 'done' },
  { title: 'Mainnet Launch', icon: Flag, status: 'current' },
  { title: 'Daily Missions', icon: Check, status: 'upcoming' },
  { title: 'Sound Design', icon: Music, status: 'upcoming' },
  { title: 'Achievements', icon: Trophy, status: 'upcoming' },
  { title: 'Bike Legacy', icon: Heart, status: 'upcoming' },
  { title: 'Guilds / Crews', icon: Users, status: 'upcoming' },
  { title: 'Weather', icon: Cloud, status: 'upcoming' },
  { title: 'Zones', icon: Globe, status: 'upcoming' },
  { title: 'Lucky Events', icon: Gift, status: 'upcoming' },
];

export function Home() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('distance');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('all_time');
  const [mpSort, setMpSort] = useState<MarketplaceSort>('newest');

  const changelog = useQuery<ChangelogData>({
    queryKey: ['changelog'],
    queryFn: () => fetch('/changelog.json').then(r => {
      if (!r.ok) throw new Error('Failed to load changelog');
      return r.json();
    }),
  });

  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const leaderboard = useQuery({
    queryKey: ['leaderboard', lbMetric, lbPeriod],
    queryFn: () => fetchLeaderboard(lbMetric, lbPeriod),
  });
  const marketplace = useQuery({
    queryKey: ['marketplace', mpSort],
    queryFn: () => fetchMarketplace({ page: 1, limit: 6, sortBy: mpSort }),
    retry: false,
  });

  return (
    <>
      {/* ── Hero ── full-bleed on mobile/tablet, contained on desktop ── */}
 <div className="lg:mx-auto lg:max-w-7xl lg:px-4 lg:pt-4 mb-8 md:mb-12">
 <div className="relative w-full aspect-[3/4] sm:aspect-[5/4] md:aspect-video overflow-hidden lg:rounded-xl lg:border-2 lg:border-m2e-border lg:shadow-[4px_4px_0_var(--color-m2e-shadow)] group z-10">
          <img
            src="/assets/landing/galavant-hero.png"
            alt="Galavant Hero"
 className="absolute inset-0 w-full h-full object-cover pixel-render"
          />

          {/* Gradient Overlay - Bottom Third */}
 <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

 <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-4 md:pb-6 lg:px-6 lg:pb-10">
 <h1 className="text-4xl md:text-5xl lg:text-7xl text-white mb-1 lg:mb-3 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-wider uppercase">
              WALK. EARN. CONQUER.
            </h1>
 <p className="text-lg md:text-xl lg:text-3xl text-gray-200 mb-3 lg:mb-6 max-w-3xl drop-shadow-[2px_2px_0_rgba(0,0,0,1)] leading-snug">
              The first Walk-to-Earn game with balance bikes on Bitcoin via OPNet.
            </p>
 <div className="flex gap-3 lg:gap-4">
              <a
                href="#ready-to-start"
 className="pixel-btn pixel-btn-primary text-base lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform"
              >
                Start Riding
              </a>
              <Link
                to="/gameplay"
 className="pixel-btn pixel-btn-secondary text-base lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform bg-white text-m2e-text border-white"
              >
                Guide
              </Link>
            </div>
          </div>
        </div>
      </div>

 <div className="mx-auto max-w-7xl px-4 pb-12 space-y-24 relative">
      {/* ── Features ─────────────────────────────────────────── */}
 <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <FeatureCard
          title="Earn"
          description="Walk, jog, or run to earn SAP. The more you move, the more you earn."
          icon={Coins}
        />
        <FeatureCard
          title="Ride"
          description="Equip your bike and explore the world. Upgrade your gear to maximize efficiency."
          icon={SpeedFast}
        />
        <FeatureCard
          title="Trade"
          description="Buy, sell, and trade bikes and parts on the marketplace. Build your empire."
          icon={Store}
        />
        <FeatureCard
          title="Collect"
          description="Mint unique balance bikes and parts. Build your NFT collection on Bitcoin."
          icon={Image}
        />
      </section>

      {/* ── Why Galavant ──────────────────────────────────── */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">Not Your Average M2E</h2>
          <p className="text-xl text-m2e-text-secondary max-w-3xl mx-auto">See what separates Galavant from every other move-to-earn game.</p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full border-collapse text-left text-sm sm:text-base">
            <thead>
              <tr>
                <th className="py-2 px-2 sm:px-3 text-xs uppercase tracking-widest text-m2e-text-muted border-b-2 border-m2e-border" />
                <th className="py-2 px-2 sm:px-3 text-center text-xs uppercase tracking-widest text-m2e-text-muted border-b-2 border-m2e-border">Others</th>
                <th className="py-2 px-2 sm:px-3 text-center text-xs uppercase tracking-widest text-m2e-accent border-b-2 border-m2e-accent">Galavant</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, other, galavant], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-m2e-card/50' : ''}>
                  <td className="py-1.5 px-2 sm:px-3 text-m2e-text border-b border-m2e-border-light">{label}</td>
                  <td className="py-1.5 px-2 sm:px-3 text-center border-b border-m2e-border-light">
                    <span className="inline-flex items-center gap-1 text-m2e-text-muted">
                      <Cancel className="w-3.5 h-3.5 text-m2e-danger shrink-0" />
                      {other}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 sm:px-3 text-center border-b border-m2e-border-light">
                    <span className="inline-flex items-center gap-1 text-m2e-text">
                      <Check className="w-3.5 h-3.5 text-m2e-success shrink-0" />
                      {galavant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <Link
            to="/gameplay/economic-governance/how-decisions-are-made"
            className="pixel-btn pixel-btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2"
          >
            Learn How Our Economy Works
          </Link>
        </div>
      </section>

      {/* ── Ready to Start ──────────────────────────────────── */}
 <section id="ready-to-start" className="scroll-mt-24 space-y-12 text-center py-8">
 <div className="space-y-3">
 <h2 className="text-4xl md:text-5xl tracking-wide text-m2e-text">Ready to Start the Game?</h2>
 <p className="text-m2e-text-secondary text-xl md:text-2xl max-w-2xl mx-auto">Download Galavant and start earning today.</p>
        </div>

 <div className="flex flex-wrap justify-center gap-6">
          {changelog.data?.testflightUrl && (
            <a
              href={changelog.data.testflightUrl}
              target="_blank"
              rel="noopener noreferrer"
 className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download on iOS
            </a>
          )}
          {changelog.data?.versions[0]?.apkUrl && (
            <a
              href={changelog.data.versions[0].apkUrl}
              target="_blank"
              rel="noopener noreferrer"
 className="pixel-btn inline-flex items-center gap-2 text-base px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Get it on Android
            </a>
          )}
        </div>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 text-center mt-16">
          {ONBOARDING_STEPS.map((step, i) => (
 <div key={step.title} className="flex flex-col items-center gap-1">
 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-m2e-accent/15 border-4 border-m2e-accent flex items-center justify-center pixel-shadow-sm">
 <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-m2e-accent" />
              </div>
 <div className="text-xs sm:text-sm text-m2e-text-muted uppercase tracking-widest">Step {i + 1}</div>
 <div className="text-lg sm:text-2xl text-m2e-text">{step.title}</div>
 <p className="text-sm sm:text-lg text-m2e-text-secondary leading-snug">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Global Stats ─────────────────────────────────────── */}
 <section className="space-y-10">
 <div className="space-y-2">
 <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">Global Stats</h2>
 <p className="text-xl text-m2e-text-secondary">The current state of the Galavant ecosystem.</p>
        </div>
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
              <StatCard icon={MapPin} label="Total Distance" value={formatDistance(d.totalDistance ?? 0)} />
              <StatCard icon={Coins} label="SAP Earned" value={formatSat(d.totalSapEarned ?? 0)} />
              <StatCard icon={Zap} label="Activities" value={(d.totalActivities ?? 0).toLocaleString()} />
              <StatCard icon={Image} label="Minted NFTs" value={(d.totalMintedNfts ?? 0).toLocaleString()} />
              <StatCard icon={SpeedFast} label="Avg Walk" value={avgWalk > 0 ? formatDistance(avgWalk) : '—'} />
              <StatCard icon={Trophy} label="Items Sold" value={sold.toLocaleString()} />
              <StatCard icon={Fire} label="Volume Traded" value={vol > 0 ? `${formatSat(vol)} SAP` : '—'} />
            </div>
          );
        })() : null}
      </section>

      {/* ── Economy & Marketplace Overview ─────────────────────── */}
      {stats.data && stats.data.economyHealthScore != null && (
 <section className="space-y-10">
 <div className="space-y-2">
 <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">Economy & Marketplace</h2>
 <p className="text-xl text-m2e-text-secondary">Live market conditions and economy health.</p>
          </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Economy Health */}
 <div className="pixel-card p-5 space-y-3">
 <div className="flex items-center gap-3">
 <Heart className="w-8 h-8 text-m2e-accent" />
                <div>
 <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Economy Health</div>
 <div className="text-3xl text-m2e-text">{stats.data.economyHealthScore}</div>
                </div>
              </div>
              {(() => {
                const state = economyStateColors[stats.data!.economyState] ?? economyStateColors.Healthy;
                return (
 <span className={`inline-block px-3 py-1 text-xs uppercase tracking-widest pixel-border ${state.bg} ${state.text}`}>
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
 <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Active Listings</div>
 <div className="text-3xl text-m2e-text">{stats.data.activeListings ?? 0}</div>
                </div>
              </div>
 <div className="text-xs text-m2e-text-secondary">
 Avg price: <span className="text-m2e-accent">{(stats.data.avgListingPrice ?? 0) > 0 ? `${formatSat(stats.data.avgListingPrice)} SAP` : '—'}</span>
              </div>
            </div>

            {/* Floor Price */}
 <div className="pixel-card p-5 space-y-3">
 <div className="flex items-center gap-3">
 <Scale className="w-8 h-8 text-m2e-accent" />
                <div>
 <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Floor Price</div>
 <div className="text-3xl text-m2e-text">
                    {(stats.data.floorPrice ?? 0) > 0 ? `${formatSat(stats.data.floorPrice)}` : '—'}
                  </div>
                </div>
              </div>
 <div className="text-xs text-m2e-text-secondary">
                Cheapest active listing in SAP
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Marketplace Listings ────────────────────────────────── */}
 <section className="space-y-10">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-2">
 <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase flex items-center gap-3">
 <ShoppingCart className="w-10 h-10 text-m2e-accent" />
              Marketplace
            </h2>
 <p className="text-xl text-m2e-text-secondary">Latest bikes and tools for sale.</p>
          </div>
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
 <div className="flex gap-2 bg-m2e-card p-1 rounded-lg border border-m2e-border">
              {([
                ['newest', 'Newest'],
                ['price_asc', 'Cheapest'],
                ['price_desc', 'Priciest'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMpSort(key)}
 className={`px-4 py-2 pixel-btn text-sm ${
                    mpSort === key ? 'pixel-btn-primary' : 'pixel-btn-secondary border-transparent bg-transparent hover:bg-m2e-card-alt'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
 <Link to="/market" className="px-6 py-3 text-sm uppercase tracking-wider pixel-btn pixel-btn-secondary whitespace-nowrap">
              View All
            </Link>
          </div>
        </div>

        {marketplace.isLoading ? (
 <div className="text-m2e-text-muted text-sm">Loading marketplace...</div>
        ) : marketplace.error ? (
 <div className="text-red-400 text-sm">Failed to load marketplace</div>
        ) : marketplace.data && marketplace.data.listings.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {marketplace.data.listings.slice(0, 6).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={listing.itemType === 'bike' ? () => setSelectedNftId(listing.itemId) : undefined}
                />
              ))}
            </div>
            {marketplace.data.total > 6 && (
              <div className="text-center">
                <Link to="/market" className="pixel-btn pixel-btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  View All Listings
                </Link>
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

      {/* ── Leaderboard ──────────────────────────────────────── */}
 <section className="space-y-10">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-2">
 <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase flex items-center gap-3">
 <Chart className="w-10 h-10 text-m2e-accent" />
              Leaderboard
            </h2>
 <p className="text-xl text-m2e-text-secondary">Top performers in the Galavant ecosystem.</p>
          </div>

          {/* Controls */}
 <div className="flex flex-col sm:flex-row gap-4">
            {/* Metric toggle */}
 <div className="flex bg-m2e-card p-1 rounded-lg border border-m2e-border">
              {(['distance', 'earnings'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setLbMetric(m)}
 className={`px-4 py-2 pixel-btn text-sm capitalize ${
                    lbMetric === m ? 'pixel-btn-primary' : 'pixel-btn-secondary border-transparent bg-transparent hover:bg-m2e-card-alt'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Period toggle */}
 <div className="flex bg-m2e-card p-1 rounded-lg border border-m2e-border">
              {([
                ['daily', 'Daily'],
                ['weekly', 'Weekly'],
                ['all_time', 'All Time'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setLbPeriod(key)}
 className={`px-4 py-2 pixel-btn text-sm ${
                    lbPeriod === key ? 'pixel-btn-primary' : 'pixel-btn-secondary border-transparent bg-transparent hover:bg-m2e-card-alt'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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

      {/* ── Roadmap ──────────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">What's Coming</h2>
          <p className="text-xl text-m2e-text-secondary">A glimpse at the road ahead.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ROADMAP_ITEMS.map((item) => {
            const isDone = item.status === 'done';
            const isCurrent = item.status === 'current';
            return (
              <div
                key={item.title}
                className={`pixel-card p-3 flex flex-col items-center text-center gap-2 ${
                  isCurrent ? 'ring-2 ring-m2e-accent/30' : ''
                } ${isDone ? 'opacity-70' : ''}`}
              >
                <item.icon className={`w-7 h-7 ${isDone ? 'text-m2e-success' : isCurrent ? 'text-m2e-accent' : 'text-m2e-text-muted'}`} />
                <span className="text-sm uppercase tracking-wider text-m2e-text leading-tight">{item.title}</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] uppercase tracking-widest pixel-border ${
                  isDone
                    ? 'bg-m2e-success/15 text-m2e-success border-current'
                    : isCurrent
                      ? 'bg-m2e-accent/15 text-m2e-accent border-current'
                      : 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border'
                }`}>
                  {isDone ? <Check className="w-2.5 h-2.5" /> : isCurrent ? <Clock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  {isDone ? 'Done' : isCurrent ? 'Now' : 'Soon'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/roadmap" className="pixel-btn pixel-btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2">
            <Globe className="w-5 h-5" />
            View Full Roadmap
          </Link>
        </div>
      </section>

      {/* NFT Detail Modal */}
      {selectedNftId && (
        <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
      )}
    </div>
    </>
  );
}

function FeatureCard({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<any> }) {
  return (
 <div className="bg-m2e-card-alt border-2 border-m2e-border rounded-xl p-3 sm:p-6 flex flex-col items-center text-center pixel-shadow hover:bg-m2e-card transition-colors group">
 <div className="w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-4 bg-m2e-bg rounded-full flex items-center justify-center border-2 border-m2e-border overflow-hidden pixel-shadow-sm group-hover:scale-110 transition-transform">
 <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-m2e-accent" />
      </div>
 <h3 className="text-lg sm:text-2xl text-m2e-text mb-1 sm:mb-2 uppercase tracking-wide">{title}</h3>
 <p className="text-m2e-text-secondary text-sm sm:text-lg leading-snug sm:leading-relaxed">{description}</p>
    </div>
  );
}
