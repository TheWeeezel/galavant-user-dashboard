import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useInView,
  animate,
  type Variants,
} from 'framer-motion';
import {
  Users, MapPin, Coins, Image, Zap,
  Store, ShoppingCart, Trophy, SpeedFast,
  Heart, Scale, Fire,
  Download, Login, Gift, Human,
  Check, Globe, Flag,
  Music, Cloud, Lock, Clock,
  ArrowDown, ChevronRight,
} from 'pixelarticons/react';
import { fetchStats, fetchLeaderboard, fetchMarketplace } from '../api';
import { NftDetailModal } from '../components/NftDetailModal';
import { ListingCard } from '../components/ListingCard';
import { AndroidPlayStoreButton } from '../components/AndroidPlayStoreButton';
import { formatDistance } from '../utils/format';
import { config } from '../config';
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

const ONBOARDING_STEPS = [
  { icon: Download, title: 'Download', description: 'iOS or Android' },
  { icon: Login, title: 'Sign In', description: 'Google account' },
  { icon: Gift, title: 'Free NFT', description: 'Starter bike' },
  { icon: Human, title: 'Walk', description: 'Earn WATTS' },
];

const ROADMAP_ITEMS: { title: string; icon: React.ComponentType<any>; status: 'done' | 'current' | 'upcoming' }[] = [
  { title: 'Testnet', icon: Zap, status: 'done' },
  { title: 'Daily Missions', icon: Check, status: 'done' },
  { title: 'Sound Design', icon: Music, status: 'done' },
  { title: 'Mainnet Launch', icon: Flag, status: 'current' },
  { title: 'Achievements', icon: Trophy, status: 'upcoming' },
  { title: 'Bike Legacy', icon: Heart, status: 'upcoming' },
  { title: 'Guilds / Crews', icon: Users, status: 'upcoming' },
  { title: 'Weather', icon: Cloud, status: 'upcoming' },
  { title: 'Zones', icon: Globe, status: 'upcoming' },
  { title: 'Lucky Events', icon: Gift, status: 'upcoming' },
];

// The four bike types are speed bands — walk, jog, or power-walk; the town
// pays for real motion. Ranges are the UI-visible optimal bands.
const BIKE_TYPES = [
  { type: 'Commuter', best: 'Leisurely walkers', lo: 2, hi: 5 },
  { type: 'Touring', best: 'Brisk walkers', lo: 5, hi: 9 },
  { type: 'Racing', best: 'Power walkers', lo: 10, hi: 18 },
  { type: 'Electric', best: 'Any walker · full band', lo: 2, hi: 18, accent: true },
] as const;

const MATERIALS = [
  ['Steel', 'var(--color-m2e-common)'],
  ['Moss', 'var(--color-m2e-uncommon)'],
  ['Blue Hour', 'var(--color-m2e-rare)'],
  ['Orchid', 'var(--color-m2e-epic)'],
  ['Brass', 'var(--color-m2e-legendary)'],
] as const;

const HERO_WORDS = ['WALK.', 'EARN.', 'CONQUER.'];

// Repeated several times for an unbroken marquee
const TICKER_ITEMS = [
  'WALK TO EARN',
  'ON ENJIN',
  'NFT BIKES',
  'NO TOKEN TO MINT',
  'MANAGED ECONOMY',
  'SEASONAL ENJ PAYOUTS',
  'DAILY MISSIONS',
  'BALANCE BIKES',
  'ENJ STAKING BOOST',
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

/**
 * The hero is two full-bleed plates that crossfade by time of day, and at full
 * size they are 1.9 MB before anything else on the page loads. This paints a
 * 155 KB pair first and swaps in the full ones once BOTH have decoded, so the
 * day/night fade never runs against one sharp and one soft plate.
 *
 * Skipped entirely when the browser reports Save-Data or a 2g-class connection:
 * there the small pair is the right answer, not a placeholder.
 */
function useHeroPlates() {
  const SMALL = {
    night: '/assets/landing/galavant-hero-sm.webp',
    day: '/assets/landing/galavant-hero-day-sm.webp',
  };
  const FULL = {
    night: '/assets/landing/galavant-hero.webp',
    day: '/assets/landing/galavant-hero-day.webp',
  };
  const [src, setSrc] = useState(SMALL);

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return;

    let cancelled = false;
    Promise.all(
      [FULL.night, FULL.day].map(
        (href) =>
          new Promise<void>((resolve) => {
            // `Image` here is the pixelarticons icon, not the DOM constructor
            const img = document.createElement('img');
            img.onload = () => resolve();
            img.onerror = () => resolve(); // a failed upgrade keeps the small plate
            img.src = href;
          }),
      ),
    ).then(() => {
      if (!cancelled) setSrc(FULL);
    });
    return () => { cancelled = true; };
  }, []);

  return src;
}

export function Home() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('distance');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('all_time');
  const [mpSort, setMpSort] = useState<MarketplaceSort>('newest');

  const heroRef = useRef<HTMLDivElement>(null);
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

  const vp = { once: true, margin: '-80px' };

  const tickerTwice = useMemo(() => [...TICKER_ITEMS, ...TICKER_ITEMS], []);
  const heroSrc = useHeroPlates();

  const economyState = stats.data?.economyState ?? 'Healthy';
  const stateStyle = economyStateColors[economyState] ?? economyStateColors.Healthy;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          1 / HERO — Cold open
          ══════════════════════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative">
        <div className="relative w-full h-[calc(92vh-var(--player-h))] min-h-[560px] overflow-hidden scanlines vignette">
          <motion.img
            src={heroSrc.night}
            alt="Galavant"
            className="absolute inset-0 w-full h-full object-cover pixel-render will-change-transform"
            style={reducedMotion ? undefined : { y: heroImageY, scale: heroImageScale }}
          />
          {/* Day art — the same square at dawn; fades out at night to reveal the dusk plate */}
          <motion.img
            src={heroSrc.day}
            alt=""
            aria-hidden
            className="dayart absolute inset-0 w-full h-full object-cover pixel-render will-change-transform"
            style={reducedMotion ? undefined : { y: heroImageY, scale: heroImageScale }}
          />

          {/* Night: violet wash + starfield over the town (sky clock) */}
          <div className="nightwash absolute inset-0 z-[1] pointer-events-none" />
          <div className="nightstars absolute inset-0 z-[2] pointer-events-none" />

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
            {/* Headline */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-7xl text-white mb-4 md:mb-6 tracking-wider uppercase flex flex-wrap justify-center gap-x-3 md:gap-x-6 text-chroma-hero leading-[0.95]"
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
              Move to earn WATTS. <span className="text-m2e-accent">Balance bikes.</span> Real assets. On Enjin.
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

      <div className="mx-auto max-w-7xl px-4 pb-12 space-y-24 md:space-y-32 relative">

        {/* ══════════════════════════════════════════════════════════════════
            1 / THE LOOP — walk, earn, fit
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
              <div className="section-label">01 · The Loop</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                Walk. Earn.<br className="md:hidden" /> Upgrade. <span className="text-m2e-accent">Redeem.</span>
              </h2>
            </div>
            <p className="text-base md:text-xl text-m2e-text-secondary max-w-md">
              Every real-world walk burns energy, mints WATTS, and wears your bike — a loop the town's economy actually manages.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
              <div className="text-xs tracking-[0.3em] uppercase text-m2e-text-muted">Step 1</div>
              <div className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text leading-none">Walk the Town</div>
              <p className="text-sm md:text-base text-m2e-text-secondary leading-snug">
                Walk, jog, or run with your NFT balance bike — minutes inside your bike's speed band burn energy cells and earn.
              </p>
              <div className="flex gap-1 mt-auto pt-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`flex-1 h-4 rounded-[2px] border ${i < 7 ? 'bg-m2e-info border-m2e-info' : 'bg-m2e-bg-alt border-m2e-border'}`}
                    style={i < 7 ? { boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)' } : undefined}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
              <div className="text-xs tracking-[0.3em] uppercase text-m2e-text-muted">Step 2</div>
              <div className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text leading-none">Earn Credits</div>
              <p className="text-sm md:text-base text-m2e-text-secondary leading-snug">
                WATTS per earning minute — boosted by loyalty streaks and staked ENJ. Spend it in the workshop or trade it.
              </p>
              <div className="inline-flex items-center gap-3 bg-m2e-bg-alt border border-m2e-border rounded-lg px-4 py-2 mt-auto w-fit">
                <img src="/assets/token-silver.png" alt="WATTS" className="w-7 h-7 pixel-render" />
                <span className="text-2xl text-m2e-text">+272</span>
                <span className="text-[10px] tracking-[0.25em] uppercase text-m2e-text-muted">per walk</span>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3">
              <div className="text-xs tracking-[0.3em] uppercase text-m2e-text-muted">Step 3</div>
              <div className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text leading-none">Fit the Hardpoints</div>
              <p className="text-sm md:text-base text-m2e-text-secondary leading-snug">
                Sockets take parts. Parts add attributes. Attributes change how the next walk pays. The loop closes.
              </p>
              <div className="relative w-24 rounded-md bg-m2e-bg-alt border-2 border-m2e-earning overflow-hidden flex flex-col items-center justify-center gap-1 py-2 mt-auto">
                <span className="absolute top-0 inset-x-0 h-[3px] bg-m2e-earning opacity-80" />
                <img src="/parts/part-earning-lv5.png" alt="Earning part" className="w-10 h-10 object-contain pixel-render" />
                <span className="text-m2e-earning text-lg leading-none">+25</span>
                <span className="text-[8px] tracking-[0.2em] uppercase text-m2e-text-muted">Earning</span>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="pixel-card p-6 flex flex-col gap-3 border-m2e-accent">
              <div className="text-xs tracking-[0.3em] uppercase text-m2e-text-muted">Step 4</div>
              <div className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text leading-none">Join the Season</div>
              <p className="text-sm md:text-base text-m2e-text-secondary leading-snug">
                Commit WATTS to the season pool — commits burn, and when the season closes, the leaders share the ENJ budget.
              </p>
              <div className="flex items-center gap-3 bg-m2e-bg-alt border border-m2e-border rounded-lg px-4 py-2.5 mt-auto">
                <img src="/assets/token-silver.png" alt="WATTS" className="w-6 h-6 pixel-render" />
                <span className="flex-1 border-t-2 border-dashed border-m2e-border-dark" />
                <Fire className="w-4 h-4 text-m2e-warning" />
                <span className="flex-1 border-t-2 border-dashed border-m2e-border-dark" />
                <img src="/assets/token-enj.svg" alt="ENJ" className="w-6 h-6 pixel-render" />
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            2 / GARAGE — four bikes, four paces
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
              <div className="section-label">02 · Garage</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                Four Bikes,<br className="md:hidden" /> <span className="text-m2e-accent">Four Paces.</span>
              </h2>
            </div>
            <p className="text-base md:text-xl text-m2e-text-secondary max-w-md">
              Every type earns in its own speed band — pick the one that matches how you actually move.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {BIKE_TYPES.map((b) => (
              <motion.div
                key={b.type}
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`pixel-card p-4 flex flex-col gap-3 ${'accent' in b && b.accent ? 'border-m2e-accent' : ''}`}
              >
                <img
                  src={`${config.apiUrl}/art/bases/bike-${b.type.toLowerCase()}.png`}
                  alt={`${b.type} bike`}
                  className="w-full h-28 object-contain pixel-render"
                  loading="lazy"
                />
                <div className="flex items-end justify-between gap-2">
                  <span className="text-2xl uppercase tracking-wide text-m2e-text leading-none">{b.type}</span>
                  <span className="text-m2e-accent text-lg leading-none whitespace-nowrap">
                    {b.lo}–{b.hi} <span className="text-xs text-m2e-text-muted">km/h</span>
                  </span>
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-m2e-text-muted">{b.best}</div>
                <div className="relative h-2.5 rounded-full bg-m2e-bg-alt border border-m2e-border overflow-hidden">
                  <span
                    className="absolute top-0 bottom-0 bg-m2e-accent"
                    style={{ left: `${(b.lo / 18) * 100}%`, width: `${((b.hi - b.lo) / 18) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-m2e-text-muted"><span>0</span><span>18 km/h</span></div>
              </motion.div>
            ))}
          </motion.div>

          {/* Materials strip — the rarity dimension, worn as an aura */}
          <div className="pixel-card px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-m2e-text-muted">
              Every type rolls a material grade — worn as an aura:
            </span>
            {MATERIALS.map(([name, color]) => (
              <span key={name} className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rotate-45 rounded-[2px]" style={{ backgroundColor: color }} />
                <span className="uppercase tracking-[0.15em] text-sm" style={{ color }}>{name}</span>
              </span>
            ))}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            3 / SEASONS — how the ENJ pool pays out
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
              <div className="section-label">03 · Seasons</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                Seasons Pay<br className="md:hidden" /> <span className="text-m2e-accent">In ENJ.</span>
              </h2>
            </div>
            <p className="text-base md:text-xl text-m2e-text-secondary max-w-md">
              Every season sets aside an ENJ budget from platform revenue. Commit WATTS to claim a slice — commits burn, and the budget is the ceiling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-3 md:gap-2">
            <FlowNode icon={Coins} label="Earn WATTS" sub="Walk the town" />
            <FlowArrow />
            <FlowNode icon={Fire} label="Commit" sub="WATTS burn into the pool" accent />
            <FlowArrow />
            <FlowNode icon={Trophy} label="Season pays" sub="Leaders share the ENJ" />
          </div>

          <div className="pixel-card p-5 space-y-3 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.25em] uppercase text-m2e-text-muted">Season ENJ Pool</span>
              <span className="text-m2e-accent uppercase tracking-wider">Top riders share</span>
            </div>
            <div className="h-3 rounded-full bg-m2e-bg-alt border border-m2e-border overflow-hidden">
              <span className="block h-full w-[84%] bg-m2e-accent" />
            </div>
            <p className="text-sm text-m2e-text-secondary">
              The budget is set aside up front — payouts never exceed it, and never come from the next player.
            </p>
            <div className="pt-1">
              <Link to="/leaderboard" className="pixel-btn pixel-btn-secondary text-sm px-5 py-2.5 inline-flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                View season standings
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            4 / POWER STATION — ENJ staking
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="space-y-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="section-label">04 · Power Station</div>
              <h2 className="text-4xl md:text-6xl tracking-wide text-m2e-text uppercase leading-none">
                The Power<br /> <span className="text-m2e-accent">Station.</span>
              </h2>
              <p className="text-base md:text-xl text-m2e-text-secondary leading-snug max-w-md">
                Bond ENJ to the town's pool and every walk pays more — the bigger the bond, the bigger the boost, plus bonus daily energy. Real chain, real assets, no token to mint.
              </p>
              <Link to="/wallet" className="pixel-btn pixel-btn-primary text-base px-7 py-3 inline-flex items-center gap-2 animate-glow-pulse">
                Stake ENJ
              </Link>
            </div>
            <div className="pixel-card p-8 flex flex-col items-center text-center gap-3">
              <img src="/assets/vault-enj.png" alt="ENJ vault" className="w-44 md:w-56 h-auto pixel-render" />
              <div className="text-xl md:text-2xl uppercase tracking-wide text-m2e-text">Bond ENJ · Earn more WATTS</div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-m2e-text-muted">
                Tiers from Iron to Legend · boost + bonus energy
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            5 / MARKETPLACE — on sale now
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
              <div className="section-label">05 · On Sale</div>
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
            6 / LIVE STATS — count-up numbers
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
              <div className="section-label">06 · Live</div>
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
                <BigStat icon={Coins} label="WATTS Earned" value={d.totalSapEarned ?? 0} format={(n) => formatSat(n)} />
                <BigStat icon={Zap} label="Activities" value={d.totalActivities ?? 0} />
                <BigStat icon={Image} label="Minted NFTs" value={d.totalMintedNfts ?? 0} />
                <BigStat icon={SpeedFast} label="Avg Walk" value={avgWalk} format={(n) => n > 0 ? formatDistance(n) : '—'} />
                <BigStat icon={Trophy} label="Items Sold" value={sold} />
                <BigStat icon={Fire} label="Volume" value={vol} format={(n) => n > 0 ? `${formatSat(n)} WATTS` : '—'} />
              </motion.div>
            );
          })() : null}
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            7 / HIGH SCORES — arcade-style leaderboard
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
              <div className="section-label">07 · High Scores</div>
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
            <div className="bg-m2e-chrome text-m2e-accent-light px-5 py-3 border-b-2 border-m2e-border flex items-center justify-between">
              <span className="text-xs md:text-sm tracking-[0.3em] uppercase">&gt; Score Board</span>
              <span className="text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-m2e-success animate-pulse-ring [--pulse-ring:var(--color-m2e-success)]" />
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
            8 / ECONOMY PULSE — health score
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
              <div className="section-label">08 · Pulse</div>
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
                    {(stats.data.avgListingPrice ?? 0) > 0 ? `${formatSat(stats.data.avgListingPrice)} WATTS` : '—'}
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
                  Cheapest active listing in WATTS
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            9 / ROADMAP — quest log
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
              <div className="section-label">09 · Quest Log</div>
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
            10 / ENDGAME — Insert Coin
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
                <div className="section-label justify-center w-fit mx-auto">10 · Endgame</div>
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
                <AndroidPlayStoreButton playStoreUrl={changelog.data?.playStoreUrl} />
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
    <div className="relative bg-m2e-chrome text-m2e-accent-light border-y-2 border-m2e-border overflow-hidden py-3">
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

function FlowNode({ icon: Icon, label, sub, accent }: {
  icon: React.ComponentType<any>;
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`pixel-card px-4 py-6 flex flex-col items-center text-center gap-2 h-full ${
        accent ? 'border-m2e-accent bg-m2e-accent-soft' : ''
      }`}
    >
      <Icon className={`w-10 h-10 ${accent ? 'text-m2e-accent-dark' : 'text-m2e-accent'}`} />
      <div className="text-lg md:text-xl uppercase tracking-wide text-m2e-text leading-none">{label}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-m2e-text-muted">{sub}</div>
    </div>
  );
}

/** Points right on desktop, down once the strip stacks. */
function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-m2e-border" aria-hidden>
      <ChevronRight className="w-7 h-7 rotate-90 md:rotate-0" />
    </div>
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
      : `${entry.value.toLocaleString()} WATTS`;

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
