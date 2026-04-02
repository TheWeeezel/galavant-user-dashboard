import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
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

// ── Data ────────────────────────────────────────────────────────────────────

const COMPARISON_DATA: { label: string; icon: React.ComponentType<any>; other: string; galavant: string }[] = [
  { label: 'Blockchain', icon: Globe, other: 'Solana, BNB, L2s', galavant: 'Bitcoin Layer 1' },
  { label: 'Economy Mgmt', icon: Chart, other: 'None — mint and pray', galavant: 'AI Central Banker + human approval' },
  { label: 'Supply Control', icon: Fire, other: 'Unlimited or ignored', galavant: 'Active burns, buybacks & reserves' },
  { label: 'Stabilization', icon: Scale, other: 'Non-existent', galavant: 'Revenue-backed, auditable fund' },
  { label: 'Health Visibility', icon: Heart, other: 'Hidden or non-existent', galavant: 'Public real-time health score' },
  { label: 'Asset Security', icon: Lock, other: 'Chain-dependent', galavant: "Secured by Bitcoin's hashrate" },
  { label: 'Inflation Response', icon: Zap, other: 'Usually too late', galavant: 'Daily AI monitoring + tunable levers' },
  { label: 'Revenue Model', icon: Coins, other: 'Speculation-driven', galavant: 'Platform fees fund stability' },
];

const ONBOARDING_STEPS = [
  { icon: Download, title: 'Download', description: 'Get the app on iOS or Android' },
  { icon: Login, title: 'Sign In', description: 'Create your account and wallet' },
  { icon: Gift, title: 'Free NFT', description: 'Claim your starter balance bike' },
  { icon: Human, title: 'Start Walking', description: 'Move to earn SAP' },
];

const ROADMAP_ITEMS: { title: string; icon: React.ComponentType<any>; status: 'done' | 'current' | 'upcoming' }[] = [
  { title: 'Testnet', icon: Zap, status: 'done' },
  { title: 'Daily Missions', icon: Check, status: 'done' },
  { title: 'Mainnet Launch', icon: Flag, status: 'current' },
  { title: 'Sound Design', icon: Music, status: 'upcoming' },
  { title: 'Achievements', icon: Trophy, status: 'upcoming' },
  { title: 'Bike Legacy', icon: Heart, status: 'upcoming' },
  { title: 'Guilds / Crews', icon: Users, status: 'upcoming' },
  { title: 'Weather', icon: Cloud, status: 'upcoming' },
  { title: 'Zones', icon: Globe, status: 'upcoming' },
  { title: 'Lucky Events', icon: Gift, status: 'upcoming' },
];

const HERO_WORDS = ['WALK.', 'EARN.', 'CONQUER.'];

// ── Animation Variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// ── Main Component ──────────────────────────────────────────────────────────

export function Home() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('distance');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('all_time');
  const [mpSort, setMpSort] = useState<MarketplaceSort>('newest');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, scrollStart: 0, velX: 0, lastX: 0, lastT: 0 });
  const reducedMotion = useReducedMotion();

  // Hero parallax
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], [0, 150]);
  const heroContentY = useTransform(heroProgress, [0, 1], [0, -30]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  // Queries
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

  // Carousel: track which card is leftmost visible
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    const onScroll = () => {
      const firstCard = container.children[0] as HTMLElement | undefined;
      if (!firstCard) return;
      const cardWidth = firstCard.offsetWidth;
      const gap = 16;
      const idx = Math.round(container.scrollLeft / (cardWidth + gap));
      setCarouselIndex(Math.max(0, Math.min(idx, COMPARISON_DATA.length - 1)));
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Arrows: scroll by one card width
  const scrollCarouselBy = useCallback((direction: number) => {
    const container = carouselRef.current;
    if (!container || !container.children[0]) return;
    const cardWidth = (container.children[0] as HTMLElement).offsetWidth + 16;
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  }, []);

  // Dots: scroll to a specific card
  const scrollCarouselTo = useCallback((index: number) => {
    const container = carouselRef.current;
    if (!container || !container.children[index]) return;
    const card = container.children[index] as HTMLElement;
    container.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  }, []);

  // Drag-to-scroll with momentum (mouse only — touch uses native scroll)
  const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const container = carouselRef.current;
    if (!container) return;
    dragState.current = { active: true, startX: e.clientX, scrollStart: container.scrollLeft, velX: 0, lastX: e.clientX, lastT: Date.now() };
    container.setPointerCapture(e.pointerId);
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  }, []);

  const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    if (!ds.active) return;
    const container = carouselRef.current;
    if (!container) return;
    e.preventDefault();
    container.scrollLeft = ds.scrollStart - (e.clientX - ds.startX);
    const now = Date.now();
    const dt = now - ds.lastT;
    if (dt > 0) {
      ds.velX = (e.clientX - ds.lastX) / dt;
      ds.lastX = e.clientX;
      ds.lastT = now;
    }
  }, []);

  const onDragEnd = useCallback(() => {
    const ds = dragState.current;
    if (!ds.active) return;
    ds.active = false;
    const container = carouselRef.current;
    if (!container) return;
    container.style.cursor = '';
    container.style.userSelect = '';
    // Momentum coast
    const momentum = -ds.velX * 800;
    if (Math.abs(momentum) > 50) {
      container.scrollBy({ left: momentum, behavior: 'smooth' });
    }
  }, []);

  const vp = { once: true, margin: '-80px' };

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <div ref={heroRef} className="mb-8 md:mb-12">
        <div className="relative w-full aspect-[3/4] sm:aspect-[5/4] md:aspect-video overflow-hidden shadow-[0_8px_30px_-5px_rgba(0,0,0,0.15)] group z-10">
          <motion.img
            src="/assets/landing/galavant-hero.png"
            alt="Galavant Hero"
            className="absolute inset-0 w-full h-full object-cover pixel-render will-change-transform"
            style={reducedMotion ? undefined : { y: heroImageY, scale: 1.15 }}
          />

          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-4 md:pb-6 lg:px-6 lg:pb-10"
            style={reducedMotion ? undefined : { y: heroContentY, opacity: heroOpacity }}
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-7xl text-white mb-1 lg:mb-3 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-wider uppercase flex flex-wrap justify-center gap-x-3 lg:gap-x-5"
              variants={staggerSlow}
              initial="hidden"
              animate="visible"
            >
              {HERO_WORDS.map((word) => (
                <motion.span key={word} variants={wordReveal} className="inline-block">
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl lg:text-3xl text-gray-200 mb-3 lg:mb-6 max-w-3xl drop-shadow-[2px_2px_0_rgba(0,0,0,1)] leading-snug"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              The first Walk-to-Earn game with balance bikes on Bitcoin via OPNet.
            </motion.p>

            <motion.div
              className="flex gap-3 lg:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <a
                href="#ready-to-start"
                className="pixel-btn pixel-btn-primary text-base lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform animate-glow-pulse"
              >
                Start Riding
              </a>
              <Link
                to="/gameplay"
                className="pixel-btn pixel-btn-secondary text-base lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform bg-white text-m2e-text border-white"
              >
                Guide
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 space-y-24 relative">

        {/* ── Features ─────────────────────────────────────────── */}
        <motion.section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <FeatureCard title="Earn" description="Walk, jog, or run to earn SAP. The more you move, the more you earn." icon={Coins} />
          <FeatureCard title="Ride" description="Equip your bike and explore the world. Upgrade your gear to maximize efficiency." icon={SpeedFast} />
          <FeatureCard title="Trade" description="Buy, sell, and trade bikes and parts on the marketplace. Build your empire." icon={Store} />
          <FeatureCard title="Collect" description="Mint unique balance bikes and parts. Build your NFT collection on Bitcoin." icon={Image} />
        </motion.section>

        {/* ── Why Galavant (Comparison Carousel) ─────────────── */}
        <motion.section
          className="space-y-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="space-y-3 text-center">
            <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">Not Your Average M2E</h2>
            <p className="text-xl text-m2e-text-secondary max-w-3xl mx-auto">See what separates Galavant from every other move-to-earn game.</p>
          </div>

          <div className="relative">
            {/* Arrow nav — desktop only */}
            <button
              onClick={() => scrollCarouselBy(-1)}
              className={`hidden md:flex absolute left-2 top-[calc(50%-28px)] z-10 w-10 h-10 items-center justify-center bg-m2e-card/90 backdrop-blur-sm border-2 border-m2e-border rounded-lg pixel-shadow-sm hover:bg-m2e-accent hover:text-white hover:border-m2e-accent-dark transition-colors ${carouselIndex === 0 ? 'opacity-30 pointer-events-none' : ''}`}
              aria-label="Previous"
            >
              <span className="text-xl leading-none select-none">&lsaquo;</span>
            </button>
            <button
              onClick={() => scrollCarouselBy(1)}
              className={`hidden md:flex absolute right-2 top-[calc(50%-28px)] z-10 w-10 h-10 items-center justify-center bg-m2e-card/90 backdrop-blur-sm border-2 border-m2e-border rounded-lg pixel-shadow-sm hover:bg-m2e-accent hover:text-white hover:border-m2e-accent-dark transition-colors ${carouselIndex >= COMPARISON_DATA.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
              aria-label="Next"
            >
              <span className="text-xl leading-none select-none">&rsaquo;</span>
            </button>

            {/* Scrollable card track */}
            <motion.div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              {COMPARISON_DATA.map((item) => (
                <ComparisonCard key={item.label} {...item} />
              ))}
            </motion.div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-6">
              {COMPARISON_DATA.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollCarouselTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === carouselIndex
                      ? 'w-6 h-2 bg-m2e-accent'
                      : 'w-2 h-2 bg-m2e-border hover:bg-m2e-accent/50'
                  }`}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/gameplay/economic-governance/how-decisions-are-made"
              className="pixel-btn pixel-btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2"
            >
              Learn How Our Economy Works
            </Link>
          </div>
        </motion.section>

        {/* ── Roadmap ──────────────────────────────────────────── */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">What's Coming</h2>
            <p className="text-xl text-m2e-text-secondary">A glimpse at the road ahead.</p>
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {ROADMAP_ITEMS.map((item) => {
              const isDone = item.status === 'done';
              const isCurrent = item.status === 'current';
              return (
                <motion.div
                  key={item.title}
                  variants={staggerItem}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
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
                </motion.div>
              );
            })}
          </motion.div>

          <div className="text-center">
            <Link to="/roadmap" className="pixel-btn pixel-btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2">
              <Globe className="w-5 h-5" />
              View Full Roadmap
            </Link>
          </div>
        </motion.section>

        {/* ── Global Stats ─────────────────────────────────────── */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
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
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                {[
                  { icon: Users, label: 'Walkers', value: (d.totalUsers ?? 0).toLocaleString() },
                  { icon: MapPin, label: 'Total Distance', value: formatDistance(d.totalDistance ?? 0) },
                  { icon: Coins, label: 'SAP Earned', value: formatSat(d.totalSapEarned ?? 0) },
                  { icon: Zap, label: 'Activities', value: (d.totalActivities ?? 0).toLocaleString() },
                  { icon: Image, label: 'Minted NFTs', value: (d.totalMintedNfts ?? 0).toLocaleString() },
                  { icon: SpeedFast, label: 'Avg Walk', value: avgWalk > 0 ? formatDistance(avgWalk) : '\u2014' },
                  { icon: Trophy, label: 'Items Sold', value: sold.toLocaleString() },
                  { icon: Fire, label: 'Volume Traded', value: vol > 0 ? `${formatSat(vol)} SAP` : '\u2014' },
                ].map((s) => (
                  <motion.div key={s.label} variants={staggerItem}>
                    <StatCard icon={s.icon} label={s.label} value={s.value} />
                  </motion.div>
                ))}
              </motion.div>
            );
          })() : null}
        </motion.section>

        {/* ── Leaderboard ──────────────────────────────────────── */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase flex items-center gap-3">
                <Chart className="w-10 h-10 text-m2e-accent" />
                Leaderboard
              </h2>
              <p className="text-xl text-m2e-text-secondary">Top performers in the Galavant ecosystem.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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
        </motion.section>

        {/* ── Live Economy & Marketplace ─────────────────────────── */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl tracking-wide text-m2e-text uppercase">Live Economy & Marketplace</h2>
              <p className="text-xl text-m2e-text-secondary">Real-time economy health and what's for sale right now.</p>
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

          {/* Economy health cards */}
          {stats.data && stats.data.economyHealthScore != null && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              <motion.div variants={staggerItem} className="pixel-card p-5 space-y-3">
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
              </motion.div>

              <motion.div variants={staggerItem} className="pixel-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Store className="w-8 h-8 text-m2e-accent" />
                  <div>
                    <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Active Listings</div>
                    <div className="text-3xl text-m2e-text">{stats.data.activeListings ?? 0}</div>
                  </div>
                </div>
                <div className="text-xs text-m2e-text-secondary">
                  Avg price: <span className="text-m2e-accent">{(stats.data.avgListingPrice ?? 0) > 0 ? `${formatSat(stats.data.avgListingPrice)} SAP` : '\u2014'}</span>
                </div>
              </motion.div>

              <motion.div variants={staggerItem} className="pixel-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Scale className="w-8 h-8 text-m2e-accent" />
                  <div>
                    <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Floor Price</div>
                    <div className="text-3xl text-m2e-text">
                      {(stats.data.floorPrice ?? 0) > 0 ? `${formatSat(stats.data.floorPrice)}` : '\u2014'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-m2e-text-secondary">
                  Cheapest active listing in SAP
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Marketplace listings */}
          {marketplace.isLoading ? (
            <div className="text-m2e-text-muted text-sm">Loading marketplace...</div>
          ) : marketplace.error ? (
            <div className="text-red-400 text-sm">Failed to load marketplace</div>
          ) : marketplace.data && marketplace.data.listings.length > 0 ? (
            <>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                {marketplace.data.listings.slice(0, 6).map((listing) => (
                  <motion.div key={listing.id} variants={staggerItem}>
                    <ListingCard
                      listing={listing}
                      onClick={listing.itemType === 'bike' ? () => setSelectedNftId(listing.itemId) : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
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
        </motion.section>

        {/* ── Ready to Start ──────────────────────────────────── */}
        <motion.section
          id="ready-to-start"
          className="scroll-mt-24 space-y-12 text-center py-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
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
                className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3 animate-glow-pulse"
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

          <div className="flex justify-center pt-2">
            <Link
              to="/marketplace"
              className="text-m2e-accent hover:underline text-lg uppercase tracking-wider"
            >
              Or buy your first bike on the web &rarr;
            </Link>
          </div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 text-center mt-16"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {ONBOARDING_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={staggerItem}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-m2e-accent/15 border-4 border-m2e-accent flex items-center justify-center pixel-shadow-sm"
                  whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
                >
                  <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-m2e-accent" />
                </motion.div>
                <div className="text-xs sm:text-sm text-m2e-text-muted uppercase tracking-widest">Step {i + 1}</div>
                <div className="text-lg sm:text-2xl text-m2e-text">{step.title}</div>
                <p className="text-sm sm:text-lg text-m2e-text-secondary leading-snug">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* NFT Detail Modal */}
        {selectedNftId && (
          <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
        )}
      </div>
    </>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────────

function FeatureCard({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<any> }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-m2e-card-alt border-2 border-m2e-border rounded-xl p-3 sm:p-6 flex flex-col items-center text-center pixel-shadow hover:bg-m2e-card hover:border-m2e-accent-dark transition-colors group cursor-default"
    >
      <div className="w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-4 bg-m2e-bg rounded-full flex items-center justify-center border-2 border-m2e-border overflow-hidden pixel-shadow-sm group-hover:scale-110 transition-transform">
        <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-m2e-accent" />
      </div>
      <h3 className="text-lg sm:text-2xl text-m2e-text mb-1 sm:mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-m2e-text-secondary text-sm sm:text-lg leading-snug sm:leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ComparisonCard({ label, icon: Icon, other, galavant }: {
  label: string;
  icon: React.ComponentType<any>;
  other: string;
  galavant: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="min-w-[80vw] sm:min-w-[340px] lg:min-w-[360px] snap-start flex-shrink-0"
    >
      <motion.div
        className="pixel-card p-5 space-y-4 h-full transition-colors hover:border-m2e-accent-dark"
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-m2e-accent" />
          </div>
          <h3 className="text-base sm:text-lg uppercase tracking-wider text-m2e-text leading-tight">{label}</h3>
        </div>

        {/* Others — dimmed */}
        <div className="p-3 rounded-lg bg-m2e-danger/5 border border-m2e-danger/15">
          <div className="text-xs uppercase tracking-[0.15em] text-m2e-danger/70 mb-1.5">Others</div>
          <div className="flex items-start gap-2">
            <Cancel className="w-4 h-4 text-m2e-danger shrink-0 mt-1" />
            <span className="text-base text-m2e-text-muted leading-snug">{other}</span>
          </div>
        </div>

        {/* Galavant — highlighted */}
        <div className="p-3 rounded-lg bg-m2e-accent/10 border border-m2e-accent/25 ring-1 ring-m2e-accent/10">
          <div className="text-xs uppercase tracking-[0.15em] text-m2e-accent mb-1.5">Galavant</div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-m2e-success shrink-0 mt-1" />
            <span className="text-base text-m2e-text leading-snug">{galavant}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
