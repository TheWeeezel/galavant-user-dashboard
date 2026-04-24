import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
  useMotionValue,
  useInView,
  animate,
  type Variants,
} from 'framer-motion';
import {
  Users, MapPin, Coins, Image, Zap,
  Store, ShoppingCart, Trophy, SpeedFast,
  Heart, Scale, Chart, Fire,
  Download, Login, Gift, Human,
  Cancel, Check, Globe, Flag,
  Music, Cloud, Lock, Clock,
  ArrowDown, ChevronLeft, ChevronRight,
} from 'pixelarticons/react';
import { fetchStats, fetchLeaderboard, fetchMarketplace } from '../api';
import { NftDetailModal } from '../components/NftDetailModal';
import { ListingCard } from '../components/ListingCard';
import { AndroidWhitelistButton } from '../components/AndroidWhitelistButton';
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

const PILLARS: { kicker: string; title: string; tagline: string; image: string; icon: React.ComponentType<any> }[] = [
  {
    kicker: '01 / MOVE',
    title: 'WALK.',
    tagline: 'Every step is an on-chain action.',
    image: '/assets/landing/feature-earn.png',
    icon: Human,
  },
  {
    kicker: '02 / STACK',
    title: 'EARN.',
    tagline: 'Real sats. Real economy. Zero gas.',
    image: '/assets/landing/feature-ride.png',
    icon: Coins,
  },
  {
    kicker: '03 / DOMINATE',
    title: 'CONQUER.',
    tagline: 'Leaderboards. Bikes. Glory.',
    image: '/assets/landing/feature-trade.png',
    icon: Trophy,
  },
];

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
  { icon: Download, title: 'Download', description: 'iOS or Android' },
  { icon: Login, title: 'Sign In', description: 'Account + wallet' },
  { icon: Gift, title: 'Free NFT', description: 'Starter bike' },
  { icon: Human, title: 'Walk', description: 'Earn SAP' },
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

// Repeated several times for an unbroken marquee
const TICKER_ITEMS = [
  'WALK TO EARN',
  'ON BITCOIN LAYER 1',
  'ZERO GAS FEES',
  'AI CENTRAL BANKER',
  'REAL ECONOMY',
  'DAILY MISSIONS',
  'BALANCE BIKES',
  'MLDSA SECURED',
  'PUBLIC HEALTH SCORE',
  'LEADERBOARDS',
];

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
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

// ── Count-up number ─────────────────────────────────────────────────────────

function CountUp({
  value,
  duration = 1.6,
  format = (n) => Math.round(n).toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(format(0));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplay(format(value));
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, format, mv, reducedMotion]);

  return <span ref={ref}>{display}</span>;
}

// ── Main Component ──────────────────────────────────────────────────────────

export function Home() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('distance');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('all_time');
  const [mpSort, setMpSort] = useState<MarketplaceSort>('newest');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, scrollStart: 0, velX: 0, lastX: 0, lastT: 0 });
  const reducedMotion = useReducedMotion();

  // Hero parallax
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], [0, 180]);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1.15, 1.28]);
  const heroContentY = useTransform(heroProgress, [0, 1], [0, -40]);
  const heroOpacity = useTransform(heroProgress, [0, 0.85], [1, 0]);

  // Pillars horizontal scroll (pinned section)
  const { scrollYProgress: pillarsProgress } = useScroll({
    target: pillarsRef,
    offset: ['start start', 'end end'],
  });
  const pillarsX = useTransform(pillarsProgress, [0, 1], ['0%', '-66.667%']);
  const pillarsXSpring = useSpring(pillarsX, { damping: 20, stiffness: 60, mass: 0.3 });

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

  // Comparison carousel — track leftmost visible card
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

  const scrollCarouselBy = useCallback((direction: number) => {
    const container = carouselRef.current;
    if (!container || !container.children[0]) return;
    const cardWidth = (container.children[0] as HTMLElement).offsetWidth + 16;
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  }, []);

  const scrollCarouselTo = useCallback((index: number) => {
    const container = carouselRef.current;
    if (!container || !container.children[index]) return;
    const card = container.children[index] as HTMLElement;
    container.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  }, []);

  // Mouse drag-to-scroll with momentum
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
    const momentum = -ds.velX * 800;
    if (Math.abs(momentum) > 50) {
      container.scrollBy({ left: momentum, behavior: 'smooth' });
    }
  }, []);

  const vp = { once: true, margin: '-80px' };

  const tickerTwice = useMemo(() => [...TICKER_ITEMS, ...TICKER_ITEMS], []);

  const economyState = stats.data?.economyState ?? 'Healthy';
  const stateStyle = economyStateColors[economyState] ?? economyStateColors.Healthy;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          1 / HERO — Cold open
          ══════════════════════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative">
        <div className="relative w-full h-[92vh] min-h-[560px] overflow-hidden scanlines vignette">
          <motion.img
            src="/assets/landing/galavant-hero.png"
            alt="Galavant"
            className="absolute inset-0 w-full h-full object-cover pixel-render will-change-transform"
            style={reducedMotion ? undefined : { y: heroImageY, scale: heroImageScale }}
          />

          {/* Scan-beam sweep */}
          {!reducedMotion && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
              <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-white/8 to-transparent animate-scan-sweep" />
            </div>
          )}

          {/* Bottom grade */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-[3]" />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-10 md:pb-16 lg:px-6 z-[5]"
            style={reducedMotion ? undefined : { y: heroContentY, opacity: heroOpacity }}
          >
            {/* Kicker strip */}
            <motion.div
              className="flex items-center gap-3 mb-4 md:mb-6 text-[10px] md:text-xs tracking-[0.4em] uppercase text-m2e-accent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-block w-8 h-[2px] bg-m2e-accent" />
              Walk-To-Earn · On Bitcoin
              <span className="inline-block w-8 h-[2px] bg-m2e-accent" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl md:text-7xl lg:text-9xl text-white mb-4 md:mb-6 tracking-wider uppercase flex flex-wrap justify-center gap-x-3 md:gap-x-6 text-chroma-hero leading-[0.95]"
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
              className="text-base md:text-2xl lg:text-3xl text-gray-100 mb-6 md:mb-10 max-w-3xl text-pixel-shadow leading-snug"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              Move to earn SAP. <span className="text-m2e-accent">Zero gas.</span> Real sats. On Bitcoin.
            </motion.p>

            <motion.div
              className="flex gap-3 lg:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <a
                href="#endgame"
                className="pixel-btn pixel-btn-primary text-sm md:text-lg lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform animate-glow-pulse"
              >
                Press Start
              </a>
              <Link
                to="/gameplay"
                className="pixel-btn pixel-btn-secondary text-sm md:text-lg lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform bg-white text-m2e-text border-white"
              >
                Read Guide
              </Link>
            </motion.div>

            {/* Scroll hint */}
            <motion.div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
              <motion.div
                animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Live ticker — bolted under the hero */}
        <LiveTicker items={tickerTwice} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2 / PILLARS — Walk. Earn. Conquer. (horizontal-pinned on desktop)
          ══════════════════════════════════════════════════════════════════════ */}
      <section ref={pillarsRef} className="relative hidden md:block" style={{ height: '300vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center pixel-noise-bg">
          <motion.div
            className="flex w-[300vw] h-full"
            style={reducedMotion ? undefined : { x: pillarsXSpring }}
          >
            {PILLARS.map((p, i) => (
              <PillarPanel key={p.title} pillar={p} index={i} total={PILLARS.length} />
            ))}
          </motion.div>

          {/* Progress dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {PILLARS.map((_, i) => (
              <PillarDot key={i} index={i} progress={pillarsProgress} />
            ))}
          </div>

          {/* Section label */}
          <div className="absolute top-6 left-6 md:top-8 md:left-10 z-20 section-label">
            01 · Loop
          </div>
        </div>
      </section>

      {/* Mobile vertical pillars */}
      <section className="md:hidden px-4 py-12 space-y-8 pixel-noise-bg">
        <div className="section-label justify-center mx-auto w-fit">01 · Loop</div>
        <div className="space-y-6">
          {PILLARS.map((p, i) => (
            <PillarMobile key={p.title} pillar={p} index={i} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-12 space-y-24 md:space-y-32 relative">

        {/* ══════════════════════════════════════════════════════════════════
            3 / LIVE STATS — count-up numbers
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-8 pt-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="section-label">02 · Live</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                World<br className="md:hidden" /><span className="text-m2e-accent"> in Motion</span>
              </h2>
            </div>
            <p className="text-base md:text-xl text-m2e-text-secondary max-w-md">
              Every second, walkers somewhere are earning on-chain. Live from the network.
            </p>
          </div>

          {stats.isLoading ? (
            <SkeletonRow />
          ) : stats.error ? (
            <div className="text-m2e-danger text-sm">Failed to load stats</div>
          ) : stats.data ? (() => {
            const d = stats.data;
            const avgWalk = d.avgDistancePerActivity ?? 0;
            const sold = d.totalSold ?? 0;
            const vol = d.totalVolume ?? 0;
            return (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                <BigStat icon={Users} label="Walkers" value={d.totalUsers ?? 0} />
                <BigStat icon={MapPin} label="Total Distance" value={d.totalDistance ?? 0} format={(n) => formatDistance(n)} />
                <BigStat icon={Coins} label="SAP Earned" value={d.totalSapEarned ?? 0} format={(n) => formatSat(n)} />
                <BigStat icon={Zap} label="Activities" value={d.totalActivities ?? 0} />
                <BigStat icon={Image} label="Minted NFTs" value={d.totalMintedNfts ?? 0} />
                <BigStat icon={SpeedFast} label="Avg Walk" value={avgWalk} format={(n) => n > 0 ? formatDistance(n) : '—'} />
                <BigStat icon={Trophy} label="Items Sold" value={sold} />
                <BigStat icon={Fire} label="Volume" value={vol} format={(n) => n > 0 ? `${formatSat(n)} SAP` : '—'} />
              </motion.div>
            );
          })() : null}
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            4 / THE DIFFERENCE — horizontal-snap comparison
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="section-label">03 · The Difference</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                Not Another<br /><span className="text-m2e-accent">Ponzi Sim.</span>
              </h2>
            </div>
            <div className="flex items-center gap-6 text-sm uppercase tracking-widest">
              <span className="text-m2e-danger/80 line-through decoration-2 flex items-center gap-1.5">
                <Cancel className="w-4 h-4" /> Them
              </span>
              <span className="text-m2e-accent flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Galavant
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollCarouselBy(-1)}
              className={`hidden md:flex absolute left-2 top-[calc(50%-28px)] z-10 w-11 h-11 items-center justify-center bg-m2e-card border-2 border-m2e-border rounded-lg pixel-shadow-sm hover:bg-m2e-accent hover:text-white hover:border-m2e-accent-dark transition-colors ${carouselIndex === 0 ? 'opacity-30 pointer-events-none' : ''}`}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollCarouselBy(1)}
              className={`hidden md:flex absolute right-2 top-[calc(50%-28px)] z-10 w-11 h-11 items-center justify-center bg-m2e-card border-2 border-m2e-border rounded-lg pixel-shadow-sm hover:bg-m2e-accent hover:text-white hover:border-m2e-accent-dark transition-colors ${carouselIndex >= COMPARISON_DATA.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <motion.div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 cursor-grab active:cursor-grabbing snap-x snap-mandatory"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              {COMPARISON_DATA.map((item, i) => (
                <ComparisonCard key={item.label} index={i} {...item} />
              ))}
            </motion.div>

            <div className="flex justify-center gap-1.5 mt-6">
              {COMPARISON_DATA.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollCarouselTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === carouselIndex ? 'w-6 h-2 bg-m2e-accent' : 'w-2 h-2 bg-m2e-border hover:bg-m2e-accent/50'
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
              How the economy actually works
            </Link>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            5 / HIGH SCORES — arcade-style leaderboard
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="section-label">04 · High Scores</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                Top Riders<span className="text-m2e-accent animate-blink">_</span>
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Pills
                value={lbMetric}
                onChange={(v) => setLbMetric(v as LeaderboardMetric)}
                options={[
                  ['distance', 'Distance'],
                  ['earnings', 'Earnings'],
                ]}
              />
              <Pills
                value={lbPeriod}
                onChange={(v) => setLbPeriod(v as LeaderboardPeriod)}
                options={[
                  ['daily', 'Daily'],
                  ['weekly', 'Weekly'],
                  ['all_time', 'All Time'],
                ]}
              />
            </div>
          </div>

          <div className="relative pixel-card p-0 overflow-hidden">
            {/* Arcade title bar */}
            <div className="bg-m2e-text text-m2e-accent px-5 py-3 border-b-2 border-m2e-border flex items-center justify-between">
              <span className="text-xs md:text-sm tracking-[0.3em] uppercase">&gt; Score Board</span>
              <span className="text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-m2e-success animate-pulse-ring" />
                Live
              </span>
            </div>

            <div className="scanlines-light">
              {leaderboard.isLoading ? (
                <div className="p-10 text-m2e-text-muted text-sm text-center">Loading scores…</div>
              ) : leaderboard.error ? (
                <div className="p-10 text-m2e-danger text-sm text-center">Failed to load leaderboard</div>
              ) : leaderboard.data && leaderboard.data.length > 0 ? (
                <div>
                  {leaderboard.data.slice(0, 10).map((entry, i) => (
                    <ArcadeRow key={entry.userId} entry={entry} metric={lbMetric} index={i} />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-m2e-text-muted text-sm text-center">No entries yet — be the first.</div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            6 / ECONOMY PULSE — health score
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="section-label">05 · Pulse</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                Economy<br className="md:hidden" /> <span className="text-m2e-accent">Live.</span>
              </h2>
            </div>
            <p className="text-base md:text-xl text-m2e-text-secondary max-w-md">
              Most games hide it. We publish it. Real-time health, right here.
            </p>
          </div>

          {stats.data && stats.data.economyHealthScore != null ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              {/* Health gauge */}
              <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col items-center text-center gap-3 md:col-span-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-m2e-accent/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <HealthGauge score={stats.data.economyHealthScore} state={economyState} />
                  </div>
                  <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Health Score</div>
                  <span className={`inline-block px-3 py-1 text-xs uppercase tracking-widest pixel-border ${stateStyle.bg} ${stateStyle.text}`}>
                    {stateStyle.label}
                  </span>
                </div>
              </motion.div>

              {/* Listings */}
              <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center">
                    <Store className="w-6 h-6 text-m2e-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Active Listings</div>
                    <div className="text-4xl md:text-5xl text-m2e-text leading-none">
                      <CountUp value={stats.data.activeListings ?? 0} />
                    </div>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="text-sm text-m2e-text-secondary flex items-center justify-between">
                  <span>Avg price</span>
                  <span className="text-m2e-accent font-mono">
                    {(stats.data.avgListingPrice ?? 0) > 0 ? `${formatSat(stats.data.avgListingPrice)} SAP` : '—'}
                  </span>
                </div>
              </motion.div>

              {/* Floor price */}
              <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-m2e-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Floor Price</div>
                    <div className="text-4xl md:text-5xl text-m2e-text leading-none">
                      <CountUp value={stats.data.floorPrice ?? 0} format={(n) => n > 0 ? formatSat(n) : '—'} />
                    </div>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="text-sm text-m2e-text-secondary">
                  Cheapest active listing in SAP
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            7 / ROADMAP — quest log
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="section-label">06 · Quest Log</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                What's<br className="md:hidden" /> <span className="text-m2e-accent">Coming.</span>
              </h2>
            </div>
            <p className="text-base md:text-xl text-m2e-text-secondary max-w-md">
              Unlocked, now-playing, coming-soon. A glimpse at the road ahead.
            </p>
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
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`pixel-card p-3 flex flex-col items-center text-center gap-2 relative overflow-hidden ${
                    isCurrent ? 'ring-2 ring-m2e-accent/40' : ''
                  } ${isDone ? 'opacity-70' : ''}`}
                >
                  {isCurrent && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-m2e-accent/0 via-m2e-accent to-m2e-accent/0" />
                  )}
                  <item.icon className={`w-8 h-8 ${isDone ? 'text-m2e-success' : isCurrent ? 'text-m2e-accent' : 'text-m2e-text-muted'}`} />
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

        {/* ══════════════════════════════════════════════════════════════════
            8 / MARKETPLACE — on sale now
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="section-label">07 · On Sale</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                The<br className="md:hidden" /> <span className="text-m2e-accent">Market.</span>
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Pills
                value={mpSort}
                onChange={(v) => setMpSort(v as MarketplaceSort)}
                options={[
                  ['newest', 'Newest'],
                  ['price_asc', 'Cheapest'],
                  ['price_desc', 'Priciest'],
                ]}
              />
              <Link to="/market" className="pixel-btn pixel-btn-secondary px-5 py-3 text-sm whitespace-nowrap inline-flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                View All
              </Link>
            </div>
          </div>

          {marketplace.isLoading ? (
            <div className="text-m2e-text-muted text-sm">Loading marketplace…</div>
          ) : marketplace.error ? (
            <div className="text-m2e-danger text-sm">Failed to load marketplace</div>
          ) : marketplace.data && marketplace.data.listings.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              {marketplace.data.listings.slice(0, 6).map((listing) => (
                <motion.div
                  key={listing.id}
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <ListingCard
                    listing={listing}
                    onClick={listing.itemType === 'bike' ? () => setSelectedNftId(listing.itemId) : undefined}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="pixel-card p-12 text-center">
              <Store className="w-12 h-12 text-m2e-text-muted mx-auto mb-3" />
              <div className="text-m2e-text-muted text-sm">No listings yet — be the first to list.</div>
            </div>
          )}
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            9 / ENDGAME — Insert Coin
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="endgame"
          className="scroll-mt-24 space-y-10 py-12 relative"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="pixel-corners pixel-card p-8 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 pixel-grid-bg opacity-40 pointer-events-none" />
            <div className="relative z-10 space-y-8">
              <div className="space-y-3">
                <div className="section-label justify-center w-fit mx-auto">08 · Endgame</div>
                <h2 className="text-4xl md:text-7xl text-m2e-text uppercase tracking-wide text-chroma-soft leading-none">
                  Insert Coin<br />
                  <span className="text-m2e-accent">To Continue.</span>
                </h2>
                <p className="text-m2e-text-secondary text-lg md:text-2xl max-w-2xl mx-auto">
                  Download Galavant and start earning today.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
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
                <AndroidWhitelistButton playStoreUrl={changelog.data?.playStoreUrl} />
              </div>

              <div className="pt-2">
                <Link to="/market" className="text-m2e-accent hover:underline text-base uppercase tracking-wider">
                  Or buy your first bike on the web &rarr;
                </Link>
              </div>

              <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-6"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                {ONBOARDING_STEPS.map((step, i) => (
                  <motion.div
                    key={step.title}
                    variants={staggerItem}
                    className="flex flex-col items-center gap-2 relative"
                  >
                    {i < ONBOARDING_STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px] border-t-2 border-dashed border-m2e-border" />
                    )}
                    <motion.div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-m2e-card border-4 border-m2e-accent flex items-center justify-center pixel-shadow-sm relative z-10"
                      whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
                    >
                      <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-m2e-accent" />
                    </motion.div>
                    <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Step {i + 1}</div>
                    <div className="text-lg sm:text-2xl text-m2e-text uppercase">{step.title}</div>
                    <p className="text-sm sm:text-base text-m2e-text-secondary leading-snug">{step.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {selectedNftId && (
          <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
        )}
      </div>
    </>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────────

function LiveTicker({ items }: { items: string[] }) {
  return (
    <div className="relative bg-m2e-text text-m2e-accent border-y-2 border-m2e-border overflow-hidden py-3">
      <div className="flex gap-10 whitespace-nowrap animate-marquee will-change-transform">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-sm md:text-base uppercase tracking-[0.2em]">
            <span className="w-2 h-2 bg-m2e-accent inline-block" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function PillarPanel({ pillar, index, total }: {
  pillar: typeof PILLARS[number];
  index: number;
  total: number;
}) {
  return (
    <div
      className="w-screen h-screen flex-shrink-0 flex items-center justify-center px-8 lg:px-20 relative"
      style={{ backgroundColor: index % 2 === 0 ? 'var(--color-m2e-bg)' : 'var(--color-m2e-bg-alt)' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl w-full">
        <div className="space-y-6 order-2 lg:order-1">
          <div className="text-xs tracking-[0.35em] uppercase text-m2e-accent">{pillar.kicker}</div>
          <h3 className="text-[20vw] md:text-[14vw] lg:text-[10vw] xl:text-[9rem] uppercase leading-[0.85] text-m2e-text text-chroma-soft">
            {pillar.title}
          </h3>
          <p className="text-2xl md:text-3xl lg:text-4xl text-m2e-text-secondary leading-tight max-w-md">
            {pillar.tagline}
          </p>
          <div className="flex items-center gap-3 text-sm text-m2e-text-muted uppercase tracking-widest">
            <pillar.icon className="w-5 h-5 text-m2e-accent" />
            {index + 1} / {total}
          </div>
        </div>
        <div className="flex justify-center lg:justify-end order-1 lg:order-2">
          <motion.img
            src={pillar.image}
            alt={pillar.title}
            className="w-60 md:w-80 lg:w-[28rem] h-auto pixel-render drop-shadow-[0_8px_0_rgba(0,0,0,0.15)]"
            animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}

function PillarMobile({ pillar, index }: { pillar: typeof PILLARS[number]; index: number }) {
  return (
    <motion.div
      className="pixel-card p-6 flex flex-col items-center gap-4 text-center"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="text-[10px] tracking-[0.35em] uppercase text-m2e-accent">{pillar.kicker}</div>
      <img
        src={pillar.image}
        alt={pillar.title}
        className="w-40 h-40 object-contain pixel-render"
      />
      <h3 className="text-5xl uppercase leading-none text-m2e-text text-chroma-soft">{pillar.title}</h3>
      <p className="text-base text-m2e-text-secondary leading-snug max-w-xs">{pillar.tagline}</p>
    </motion.div>
  );
}

function PillarDot({ index, progress }: { index: number; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const active = useTransform(progress, (v) => {
    const section = Math.floor(v * 3);
    return Math.min(2, Math.max(0, section)) === index;
  });
  const [isActive, setIsActive] = useState(index === 0);
  useEffect(() => active.on('change', setIsActive), [active]);

  return (
    <motion.span
      className="block h-2 rounded-full transition-all duration-300"
      animate={{
        width: isActive ? 32 : 8,
        backgroundColor: isActive ? 'var(--color-m2e-accent)' : 'var(--color-m2e-border)',
      }}
    />
  );
}

function BigStat({ icon: Icon, label, value, format }: {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  format?: (n: number) => string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="pixel-card p-4 md:p-5 flex flex-col gap-2 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <Icon className="w-6 h-6 text-m2e-accent" />
        <span className="text-[9px] text-m2e-text-muted uppercase tracking-[0.3em]">{label}</span>
      </div>
      <div className="text-3xl md:text-4xl lg:text-5xl text-m2e-text leading-none tracking-wider">
        {format ? <CountUp value={value} format={format} /> : <CountUp value={value} />}
      </div>
    </motion.div>
  );
}

function ComparisonCard({ label, icon: Icon, other, galavant, index }: {
  label: string;
  icon: React.ComponentType<any>;
  other: string;
  galavant: string;
  index: number;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="min-w-[80vw] sm:min-w-[360px] lg:min-w-[380px] snap-start flex-shrink-0"
    >
      <motion.div
        className="pixel-card p-5 space-y-4 h-full transition-colors hover:border-m2e-accent-dark relative overflow-hidden"
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        <div className="absolute top-3 right-4 text-5xl text-m2e-border/60 leading-none pointer-events-none">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="w-11 h-11 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-m2e-accent" />
          </div>
          <h3 className="text-lg uppercase tracking-wider text-m2e-text leading-tight">{label}</h3>
        </div>

        <div className="p-3 rounded-lg bg-m2e-danger/5 border border-m2e-danger/20 relative">
          <div className="text-[10px] uppercase tracking-[0.25em] text-m2e-danger/70 mb-1.5">Them</div>
          <div className="flex items-start gap-2">
            <Cancel className="w-4 h-4 text-m2e-danger shrink-0 mt-1" />
            <span className="text-base text-m2e-text-muted leading-snug line-through decoration-m2e-danger/40">{other}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-m2e-accent/10 border border-m2e-accent/30 ring-1 ring-m2e-accent/10 relative">
          <div className="text-[10px] uppercase tracking-[0.25em] text-m2e-accent mb-1.5">Galavant</div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-m2e-success shrink-0 mt-1" />
            <span className="text-base text-m2e-text leading-snug">{galavant}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Pills<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <div className="flex bg-m2e-card p-1 rounded-lg border border-m2e-border">
      {options.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 pixel-btn text-sm ${
            value === key ? 'pixel-btn-primary' : 'pixel-btn-secondary border-transparent bg-transparent hover:bg-m2e-card-alt'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ArcadeRow({ entry, metric, index }: {
  entry: { userId: string; rank: number; nickname?: string | null; value: number };
  metric: 'distance' | 'earnings';
  index: number;
}) {
  const formattedValue =
    metric === 'distance'
      ? formatDistance(entry.value)
      : `${entry.value.toLocaleString()} SAP`;

  const isPodium = entry.rank <= 3;
  const rankLabel = String(entry.rank).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={`flex items-center gap-4 px-5 py-4 border-b border-m2e-border/40 last:border-0 hover:bg-m2e-accent/5 transition-colors ${
        isPodium ? 'bg-m2e-accent/5' : ''
      }`}
    >
      <span className={`w-10 text-2xl md:text-3xl leading-none ${
        entry.rank === 1 ? 'text-m2e-accent' : entry.rank === 2 ? 'text-m2e-accent-dark' : entry.rank === 3 ? 'text-m2e-warning' : 'text-m2e-text-muted'
      }`}>
        {rankLabel}
      </span>
      {isPodium && (
        <span className="text-xl">
          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
        </span>
      )}
      <span className="flex-1 text-sm md:text-base truncate text-m2e-text uppercase tracking-wider">
        {entry.nickname ?? 'Anonymous'}
      </span>
      <span className="text-base md:text-lg font-mono text-m2e-accent tracking-wide">
        {formattedValue}
      </span>
    </motion.div>
  );
}

function HealthGauge({ score, state }: { score: number; state: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    state === 'Healthy' ? 'var(--color-m2e-success)' :
    state === 'Stressed' ? 'var(--color-m2e-danger)' :
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

function SkeletonRow() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="pixel-card p-5 h-24 animate-pulse bg-m2e-card-alt" />
      ))}
    </div>
  );
}
