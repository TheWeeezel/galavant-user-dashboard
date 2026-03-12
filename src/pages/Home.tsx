import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Users, MapPin, Coins, Image, Zap,
  Store, ShoppingCart, Trophy, SpeedFast,
  Heart, Scale, Chart, Fire,
  Download, Smartphone, Login, Gift, Human,
} from 'pixelarticons/react';
import { fetchStats, fetchNfts, fetchLeaderboard, fetchMarketplace } from '../api';
import { StatCard } from '../components/StatCard';

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}
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

import { FloatingAsset } from '../components/FloatingAsset';

const FLOATING_ASSETS = [
  '/assets/floating/gem-luck.png',
  '/assets/floating/tool-earning.png',
  '/assets/floating/gem-durability.png',
  '/assets/floating/tool-recovery.png',
  '/assets/floating/gem-earning.png',
  '/assets/floating/tool-luck.png',
];

const ONBOARDING_STEPS = [
  { icon: Download, title: 'Download', description: 'Get the app on iOS or Android' },
  { icon: Login, title: 'Sign In', description: 'Create your account and wallet' },
  { icon: Gift, title: 'Free NFT', description: 'Claim your starter balance bike' },
  { icon: Human, title: 'Start Walking', description: 'Move to earn SAT tokens' },
];

interface ChangelogData {
  testflightUrl: string;
  versions: { version: string; date: string; title: string; apkUrl?: string; changes: { type: string; text: string }[] }[];
}

interface FloatingItem {
  id: number;
  src: string;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export function Home() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('distance');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('all_time');
  const [mpSort, setMpSort] = useState<MarketplaceSort>('newest');

  const changelog = useQuery<ChangelogData>({
    queryKey: ['changelog'],
    queryFn: () => fetch('/changelog.json').then(r => r.json()),
  });

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

  // Generate random floating items on mount
  const floatingItems = useMemo(() => {
    const items: FloatingItem[] = [];
    const count = 6; // Reduced count to prevent duplicates (since we have 6 unique assets)
    
    // Shuffle the assets array to get unique random items
    const shuffledAssets = [...FLOATING_ASSETS].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < count; i++) {
      // Distribute evenly across the page height
      // 5% to 95% range
      const top = 5 + (i * (90 / count)) + (Math.random() * 5); 

      items.push({
        id: i,
        src: shuffledAssets[i], // Use unique asset from shuffled array
        top,
        left: Math.random() * 90 + 5, // 5-95% width
        size: Math.floor(Math.random() * 40) + 60, // 60-100px
        delay: Math.random() * 5,
        duration: Math.random() * 4 + 6, // 6-10s
      });
    }
    return items;
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-24 relative">
      {/* ── Floating Game Assets (Global) ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 h-full">
        {floatingItems.map((item) => (
          <div
            key={item.id}
            className="absolute"
            style={{
              top: `${item.top}%`,
              left: `${item.left}%`,
            }}
          >
            <FloatingAsset
              src={item.src}
              size={item.size}
              initialTop={0}
              initialLeft={0}
              delay={item.delay}
              duration={item.duration}
            />
          </div>
        ))}
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative w-full h-[600px] rounded-xl overflow-hidden pixel-shadow border-2 border-m2e-border group z-10">
        <img 
          src="/assets/landing/galavant-hero.png" 
          alt="Galavant Hero" 
          className="absolute inset-0 w-full h-full object-cover pixel-render"
        />
        
        {/* Gradient Overlay - Bottom Half Only */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-6 pb-12">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-wider uppercase">
            WALK. EARN. CONQUER.
          </h1>
          <p className="text-xl md:text-3xl text-gray-200 mb-10 max-w-3xl drop-shadow-[2px_2px_0_rgba(0,0,0,1)] font-bold leading-relaxed">
            The first Walk-to-Earn game with balance bikes on Bitcoin via OPNet.
          </p>
          <div className="flex gap-4">
            <Link 
              to="/market" 
              className="pixel-btn pixel-btn-primary text-xl px-8 py-4 hover:scale-105 transition-transform"
            >
              Start Riding
            </Link>
            <Link 
              to="/gameplay" 
              className="pixel-btn pixel-btn-secondary text-xl px-8 py-4 hover:scale-105 transition-transform bg-white text-m2e-text border-white"
            >
              Guide
            </Link>
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <FeatureCard 
          title="Earn" 
          description="Walk, jog, or run to earn SAT tokens. The more you move, the more you earn."
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
      </section>

      {/* ── Ready to Start ──────────────────────────────────── */}
      <section className="space-y-12 text-center py-8">
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-m2e-text">Ready to Start the Game?</h2>
          <p className="text-m2e-text-secondary font-bold text-lg md:text-xl max-w-2xl mx-auto">Download Galavant and start earning today.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {changelog.data?.testflightUrl && (
            <a
              href={changelog.data.testflightUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base font-bold px-6 py-3"
            >
              <Smartphone className="w-5 h-5" />
              Get it on iOS
            </a>
          )}
          {changelog.data?.versions[0]?.apkUrl && (
            <a
              href={changelog.data.versions[0].apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn pixel-btn-secondary inline-flex items-center gap-2 text-base font-bold px-6 py-3"
            >
              <Download className="w-5 h-5" />
              Get it on Android
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center mt-16">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-m2e-accent/15 border-4 border-m2e-accent flex items-center justify-center pixel-shadow-sm mb-2">
                <step.icon className="w-10 h-10 text-m2e-accent" />
              </div>
              <div className="text-sm font-black text-m2e-text-muted uppercase tracking-widest">Step {i + 1}</div>
              <div className="text-2xl font-black text-m2e-text">{step.title}</div>
              <p className="text-base text-m2e-text-secondary font-bold leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Global Stats ─────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-m2e-text uppercase">Global Stats</h2>
          <p className="text-lg text-m2e-text-secondary font-bold">The current state of the Galavant ecosystem.</p>
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
              <StatCard icon={Coins} label="SAT Earned" value={formatSat(d.totalSatEarned ?? 0)} />
              <StatCard icon={Zap} label="Activities" value={(d.totalActivities ?? 0).toLocaleString()} />
              <StatCard icon={Image} label="Minted NFTs" value={(d.totalMintedNfts ?? 0).toLocaleString()} />
              <StatCard icon={SpeedFast} label="Avg Walk" value={avgWalk > 0 ? formatDistance(avgWalk) : '—'} />
              <StatCard icon={Trophy} label="Items Sold" value={sold.toLocaleString()} />
              <StatCard icon={Fire} label="Volume Traded" value={vol > 0 ? `${formatSat(vol)} SAT` : '—'} />
            </div>
          );
        })() : null}
      </section>

      {/* ── Economy & Marketplace Overview ─────────────────────── */}
      {stats.data && stats.data.economyHealthScore != null && (
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-m2e-text uppercase">Economy & Marketplace</h2>
            <p className="text-lg text-m2e-text-secondary font-bold">Live market conditions and economy health.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-m2e-text uppercase flex items-center gap-3">
              <ShoppingCart className="w-10 h-10 text-m2e-accent" />
              Marketplace
            </h2>
            <p className="text-lg text-m2e-text-secondary font-bold">Latest bikes and tools for sale.</p>
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
                  className={`px-4 py-2 pixel-btn text-sm font-bold ${
                    mpSort === key ? 'pixel-btn-primary' : 'pixel-btn-secondary border-transparent bg-transparent hover:bg-m2e-card-alt'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link to="/market" className="px-6 py-3 text-sm font-black uppercase tracking-wider pixel-btn pixel-btn-secondary whitespace-nowrap">
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
      <section className="space-y-10">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-m2e-text uppercase">Minted Balance Bikes</h2>
          <p className="text-lg text-m2e-text-secondary font-bold">Recently minted bikes by the community.</p>
        </div>
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
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-m2e-text uppercase flex items-center gap-3">
              <Chart className="w-10 h-10 text-m2e-accent" />
              Leaderboard
            </h2>
            <p className="text-lg text-m2e-text-secondary font-bold">Top performers in the Galavant ecosystem.</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Metric toggle */}
            <div className="flex bg-m2e-card p-1 rounded-lg border border-m2e-border">
              {(['distance', 'earnings'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setLbMetric(m)}
                  className={`px-4 py-2 pixel-btn text-sm font-bold capitalize ${
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
                  className={`px-4 py-2 pixel-btn text-sm font-bold ${
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

      {/* NFT Detail Modal */}
      {selectedNftId && (
        <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
      )}
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<any> }) {
  return (
    <div className="bg-m2e-card-alt border-2 border-m2e-border rounded-xl p-6 flex flex-col items-center text-center pixel-shadow hover:bg-m2e-card transition-colors group">
      <div className="w-24 h-24 mb-4 bg-m2e-bg rounded-full flex items-center justify-center border-2 border-m2e-border overflow-hidden pixel-shadow-sm group-hover:scale-110 transition-transform">
        <Icon className="w-12 h-12 text-m2e-accent" />
      </div>
      <h3 className="text-2xl font-black text-m2e-text mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-m2e-text-secondary font-bold text-sm leading-relaxed">{description}</p>
    </div>
  );
}
