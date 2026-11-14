import { useState, useEffect, useRef } from 'react';
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
  Users, MapPin, Coins, ShoppingCart, Download, Login, Human, ArrowDown,
} from 'pixelarticons/react';
import { fetchStats } from '../api';
import { AppDownload } from '../components/AppDownload';
import { CountUp } from '../components/CountUp';
import { config } from '../config';
import { BIKE_TYPES, BIKE_BAND_MAX } from '../config/bikeTypes';
import { PLAY_STORE_URL, TESTFLIGHT_URL } from '../config/appLinks';
import type { ChangelogData } from '../types/changelog';

// The guide page that explains how a season pays out; step 4 of the loop links here.
const SEASON_GUIDE = '/gameplay/progression/redeeming-watts';

/** Whole kilometres, for the proof line: "12,345 km" reads at a glance, "12345.67 km" does not. */
function formatKm(meters: number): string {
  return `${Math.round(meters / 1000).toLocaleString()} km`;
}

function formatEnj(n: number): string {
  return `${Math.round(n).toLocaleString()} ENJ`;
}

// ── Data ────────────────────────────────────────────────────────────────────


const ONBOARDING_STEPS = [
  { icon: Download, title: 'Download', description: 'Google Play or TestFlight' },
  { icon: Login, title: 'Sign In', description: 'Google account' },
  { icon: ShoppingCart, title: 'Get a Bike', description: 'Shop or market' },
  { icon: Human, title: 'Walk', description: 'Earn WATTS' },
];

const MATERIALS = [
  ['Steel', 'var(--color-m2e-common)'],
  ['Moss', 'var(--color-m2e-uncommon)'],
  ['Blue Hour', 'var(--color-m2e-rare)'],
  ['Orchid', 'var(--color-m2e-epic)'],
  ['Brass', 'var(--color-m2e-legendary)'],
] as const;

const HERO_WORDS = ['WALK.', 'EARN.', 'CONQUER.'];

/**
 * A Home section's band. Bands alternate plain and sunk so the sections read apart in either sky.
 * The band is static, only the section inside fades in.
 */
function Band({ tone, className = 'py-16 md:py-24', children }: { tone: 'plain' | 'sunk'; className?: string; children: React.ReactNode }) {
  return <div className={`${className} ${tone === 'sunk' ? 'band-sunk' : ''}`}>{children}</div>;
}

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

  // changelog.json may still override the store links; until it has loaded the buttons use the
  // same links from config, so the iOS button is there on the first paint and the hero never jumps.
  const changelog = useQuery<ChangelogData>({
    queryKey: ['changelog'],
    queryFn: () => fetch('/changelog.json').then(r => {
      if (!r.ok) throw new Error('Failed to load changelog');
      return r.json();
    }),
  });
  const testflightUrl = changelog.data?.testflightUrl ?? TESTFLIGHT_URL;
  const playStoreUrl = changelog.data?.playStoreUrl ?? PLAY_STORE_URL;

  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  // The live season, straight off /explorer/stats — one source for step 4, the proof line and the
  // close, so a budget change on the box reaches all three within the endpoint's minute of cache.
  const season = stats.data?.season ?? null;
  const seasonDaysLeft = season
    ? Math.max(0, Math.ceil((new Date(season.closesAt).getTime() - Date.now()) / 86_400_000))
    : 0;

  const vp = { once: true, margin: '-80px' };
  const heroSrc = useHeroPlates();

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          1 / HERO — Cold open
          ══════════════════════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative">
        <div className="relative w-full h-[92vh] min-h-[560px] overflow-hidden scanlines vignette">
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

            {/* The store buttons themselves, not a scroll to them: the site's one job is the install.
                The iOS button is the one primary button on the site and the only one that glows. */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 lg:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <AppDownload
                testflightUrl={testflightUrl}
                playStoreUrl={playStoreUrl}
                variant="hero"
                iosLabel="Download on iOS"
                glow
              />
              <Link
                to="/gameplay"
                className="pixel-btn pixel-btn-secondary text-base px-6 py-3 transition-colors bg-transparent text-white border-white/70 hover:bg-white/10"
              >
                Read Guide
              </Link>
            </motion.div>

            {/* Scroll hint. Not on a phone: there the store buttons stack down to it and it sat on them. */}
            <motion.div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-white/70"
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
      </div>

      <div className="mx-auto max-w-7xl px-4 relative">

        {/* ══════════════════════════════════════════════════════════════════
            01 / THE LOOP — walk, earn, fit
            ══════════════════════════════════════════════════════════════════ */}
        <Band tone="sunk">
          <motion.section
            className="space-y-8"
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
                  WATTS per earning minute — boosted by your Rider bonus: your Ride streak and staked ENJ. Spend it in the workshop or trade it.
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
                {/* The live pot: the real budget and the real entrants. Weights and committed WATTS stay
                    out: they are the rule, not the prize. Between seasons there is no pot to show. */}
                <Link
                  to={SEASON_GUIDE}
                  className="mt-auto block bg-m2e-bg-alt border border-m2e-border rounded-lg px-4 py-3 space-y-1.5 hover:border-m2e-accent transition-colors no-underline"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] tracking-[0.25em] uppercase">
                    <span className="text-m2e-text-muted flex items-center gap-1.5 min-w-0">
                      {season && <span className="w-2 h-2 shrink-0 rounded-full bg-m2e-success" />}
                      <span className="truncate">{season ? season.name : 'Season pot'}</span>
                    </span>
                    <span className="text-m2e-accent whitespace-nowrap">
                      {season ? (seasonDaysLeft === 0 ? 'Closes today' : `${seasonDaysLeft}d left`) : 'Between seasons'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src="/assets/token-enj.svg" alt="ENJ" className="w-6 h-6 pixel-render" />
                    <span className="text-2xl uppercase tracking-wide text-m2e-text leading-none">
                      {season ? `${season.budgetEnj.toLocaleString()} ENJ` : '—'}
                    </span>
                  </div>
                  <div className="text-xs text-m2e-text-secondary">
                    {season ? `${season.entrants} rider${season.entrants === 1 ? '' : 's'} in` : 'The next season opens after the reset'}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-m2e-accent pt-0.5">How seasons pay &rarr;</div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.section>
        </Band>

        {/* ══════════════════════════════════════════════════════════════════
            02 / GARAGE — four bikes, four paces
            ══════════════════════════════════════════════════════════════════ */}
        <Band tone="plain">
          <motion.section
            className="space-y-8"
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
                  className={`pixel-card p-4 flex flex-col gap-3 ${b.accent ? 'border-m2e-accent' : ''}`}
                >
                  <img
                    src={`${config.apiUrl}/art/bases/bike-${b.key}.png`}
                    alt={`${b.type} bike`}
                    className="w-full h-28 object-contain pixel-render night:bg-white night:rounded-sm"
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
                      style={{ left: `${(b.lo / BIKE_BAND_MAX) * 100}%`, width: `${((b.hi - b.lo) / BIKE_BAND_MAX) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-m2e-text-muted"><span>0</span><span>{BIKE_BAND_MAX} km/h</span></div>
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
        </Band>

        {/* ══════════════════════════════════════════════════════════════════
            PROOF — three live figures, one line
            ══════════════════════════════════════════════════════════════════ */}
        <Band tone="sunk" className="py-10 md:py-14">
          <motion.section
            aria-label="Live from the network"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            <div className="pixel-card px-5 py-5 md:px-8 md:py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 sm:divide-x-2 divide-m2e-border">
              <ProofFigure icon={Users} label="Walkers">
                {stats.data ? <CountUp value={stats.data.totalUsers ?? 0} /> : '—'}
              </ProofFigure>
              <ProofFigure icon={MapPin} label="Walked so far">
                {stats.data ? <CountUp value={stats.data.totalDistance ?? 0} format={formatKm} /> : '—'}
              </ProofFigure>
              <ProofFigure icon={Coins} label="Season pot">
                {season ? <CountUp value={season.budgetEnj} format={formatEnj} /> : 'Between seasons'}
              </ProofFigure>
            </div>
          </motion.section>
        </Band>

        {/* ══════════════════════════════════════════════════════════════════
            03 / ENDGAME — Insert Coin
            ══════════════════════════════════════════════════════════════════ */}
        <Band tone="plain">
          <motion.section
            id="endgame"
            className="scroll-mt-24 space-y-10 relative"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            <div className="pixel-corners pixel-card p-8 md:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 pixel-grid-bg opacity-40 pointer-events-none" />
              <div className="relative z-10 space-y-8">
                <div className="space-y-3">
                  <div className="section-label justify-center w-fit mx-auto">03 · Endgame</div>
                  <h2 className="text-4xl md:text-7xl text-m2e-text uppercase tracking-wide text-chroma-soft leading-none">
                    Insert Coin<br />
                    <span className="text-m2e-accent">To Continue.</span>
                  </h2>
                  <p className="text-m2e-text-secondary text-lg md:text-2xl max-w-2xl mx-auto">
                    Download Galavant and start earning today.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <AppDownload
                    testflightUrl={testflightUrl}
                    playStoreUrl={playStoreUrl}
                    variant="hero"
                    iosLabel="Download on iOS"
                  />
                </div>

                <div className="pt-2">
                  <Link to="/market?tab=shop" className="text-m2e-accent hover:underline text-base uppercase tracking-wider">
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
                      {/* Step 4's payoff, live: the pot this walking feeds, off the same /explorer/stats
                          season as the season card. Between seasons there is no pot, so nothing shows. */}
                      {i === ONBOARDING_STEPS.length - 1 && season && (
                        <Link
                          to="/leaderboard"
                          className="pixel-card mt-1 px-3 py-2 flex flex-col items-center gap-1 hover:-translate-y-0.5 transition-transform"
                        >
                          <span className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-m2e-text-muted flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-m2e-success animate-pulse-ring [--pulse-ring:var(--color-m2e-success)]" />
                            Season pot
                          </span>
                          <span className="text-xl sm:text-2xl uppercase tracking-wide text-m2e-accent leading-none">
                            {season.budgetEnj.toLocaleString()} ENJ
                          </span>
                          <span className="text-xs text-m2e-text-secondary flex flex-col sm:flex-row items-center sm:gap-1">
                            <span className="whitespace-nowrap">{seasonDaysLeft === 0 ? 'Closes today' : `${seasonDaysLeft}d left`}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="whitespace-nowrap">{season.entrants} rider{season.entrants === 1 ? '' : 's'} in</span>
                          </span>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.section>
        </Band>
      </div>
    </>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────────

function ProofFigure({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 sm:justify-center sm:px-2">
      <Icon className="w-7 h-7 text-m2e-accent shrink-0" />
      <div className="min-w-0">
        <div className="text-3xl md:text-4xl text-m2e-text leading-none tracking-wider whitespace-nowrap">{children}</div>
        <div className="text-[10px] md:text-xs text-m2e-text-muted uppercase tracking-[0.3em] mt-1">{label}</div>
      </div>
    </div>
  );
}
