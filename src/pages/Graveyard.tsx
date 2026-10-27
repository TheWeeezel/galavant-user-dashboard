import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion';
import { ArrowDown } from 'pixelarticons/react';
import { fetchGraveyardWall, type GraveyardStone } from '../api';
import { LoginModal } from '../components/LoginModal';
import { GraveyardWizard } from '../components/graveyard/Wizard';
import { FieldBackdrop, GraveyardScene } from '../components/graveyard/Scene';
import { BlankStone, CardLightbox, Gravestone } from '../components/graveyard/Gravestone';
import { EXAMPLE_CARDS, MarkedBikeCard } from '../components/graveyard/Pixels';

/**
 * The Sneaker Graveyard: retire a sneaker from the old move-to-earn game on Solana, burn it in
 * your own wallet, and let its soul ride on in a Galavant bike. Public page — a graveyard hero in
 * the landing page's hero language, the memorial field, the seven-step guide (two help steps,
 * then the live sign-in-to-rebirth flow), the two marks, questions. Web only by design; the app
 * never links here (Apple 3.1.1).
 *
 * The copy never states how many spots a month there are ("limited spots each month" is all), and
 * STEPN is named only where it is descriptive: the first help step, the questions, the disclaimer.
 */

const HERO_WORDS = ['Retire', 'your', 'sneaker', 'with', 'honour.'];

const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
};
const wordReveal: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const TICKER = ['Lay to rest', 'Reborn', 'Inherited', 'Steel only', 'Your wallet, your burn', 'Limited spots each month', 'The burn is final'];

/** The two marks a soul can give, as the server draws them on a bike's card. */
const MARKS = [
  { key: 'reborn', title: 'Reborn', text: 'The bike out of the starter pack your voucher bought. Born from the soul.', src: EXAMPLE_CARDS.reborn },
  { key: 'inherited', title: 'Inherited', text: 'A Steel bike you already ride took the soul in. Two lives, one ride.', src: EXAMPLE_CARDS.inherited },
] as const;

const FAQ: [string, string][] = [
  ['Do I get a free bike?', 'No. The burn gives you 15 % off one Steel starter pack, valid 30 days. The soul goes into the bike inside that pack when you open it (Reborn), or into a Steel bike you already own (Inherited).'],
  ['Why burn it at all?', 'A sneaker can only have one soul. Burning proves the sneaker is gone, so its soul can live in exactly one bike and nobody can retire the same sneaker twice.'],
  ['What happens to my sneaker?', 'It is destroyed on Solana, in your wallet, by you. We never hold it. Before the burn we record its number, type, quality, level and mint count. That record is the soul, and it is cosmetic only.'],
  ['Do I need SOL?', 'A tiny network fee, under a cent. Most of the sneaker\'s storage deposit, a little under 0.01 SOL, comes back to your wallet when it burns. Most people end up with slightly more SOL than before.'],
  ['What if my spot expires?', 'A spot is held for 30 minutes once you reach the farewell. If it runs out before you burn, nothing happens to your sneaker. Pick it again. If you already burned, the burn is on the chain and we can still verify it; write to us.'],
  ['How many spots are there?', 'A limited number each month. When they are taken, the page says so and your sneakers wait safely in your wallet until the next month.'],
  ['Which bikes can carry a soul?', 'Steel ones only — a burn never gets more than Steel. The voucher buys a Steel starter pack, and a soul given to a bike you already own needs a Steel bike too.'],
  ['Is this a partnership with STEPN?', 'No. We are not connected to STEPN or its makers. This page is for its players. You burn in your own wallet; we only read the chain.'],
];

/** Unnamed stones behind a thin wall, so an empty field still reads as a field. */
const BLANKS = [
  { kind: 'arch', size: 'sm' }, { kind: 'cross', size: 'md' }, { kind: 'slab', size: 'sm' }, { kind: 'obelisk', size: 'md' }, { kind: 'arch', size: 'md' },
] as const;

export function Graveyard() {
  const [showLogin, setShowLogin] = useState(false);
  const [openStone, setOpenStone] = useState<GraveyardStone | null>(null);
  const wall = useQuery({ queryKey: ['graveyard-wall'], queryFn: fetchGraveyardWall, retry: false, staleTime: 60_000 });
  const stones = wall.data?.wall ?? [];

  // The same parallax the landing hero has: the scene sinks and grows, the words lift and fade.
  const heroRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    // The graveyard is always night, whatever the site's Sky Clock says — scoped here so the
    // header's clock and the rest of the site still follow the global sky.
    <div data-theme="night" className="min-h-screen bg-m2e-bg">
      {/* ══ 1 / HERO — always moonlit ══ */}
      <div ref={heroRef} className="relative">
        <div className="gy-hero relative w-full h-[92vh] min-h-[560px] overflow-hidden scanlines vignette">
          <motion.div
            aria-hidden
            className="absolute inset-0 will-change-transform origin-bottom"
            style={reducedMotion ? undefined : { y: sceneY, scale: sceneScale }}
          >
            <div className="gy-hero-glow absolute inset-0 pointer-events-none" />
            <GraveyardScene />
          </motion.div>

          {/* The landing's night starfield, so both heroes share one sky at night */}
          <div className="nightstars absolute inset-0 z-[2] pointer-events-none" />

          {/* Scan-beam sweep */}
          {!reducedMotion && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
              <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-white/8 to-transparent animate-scan-sweep" />
            </div>
          )}

          {/* Bottom grade */}
          <div className="absolute bottom-0 left-0 right-0 h-[48%] bg-gradient-to-t from-black via-black/55 to-transparent pointer-events-none z-[3]" />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 pb-10 md:pb-16 lg:px-6 z-[5]"
            style={reducedMotion ? undefined : { y: contentY, opacity: contentOpacity }}
          >
            <motion.div
              className="section-label text-m2e-accent-light mb-3 md:mb-4 text-pixel-shadow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              The Sneaker Graveyard
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-7xl text-white mb-4 md:mb-6 tracking-wider uppercase flex flex-wrap justify-center gap-x-3 md:gap-x-5 text-chroma-hero leading-[0.95] max-w-5xl"
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
              You ran a long way together. Burn it in your own wallet. <span className="text-m2e-accent-light">Its soul rides on</span> in a Steel bike: one you buy at 15 % off, or one you already ride.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-3 lg:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <a
                href="#retire"
                className="pixel-btn pixel-btn-primary text-sm md:text-lg lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform animate-glow-pulse"
              >
                Lay a sneaker to rest
              </a>
              <a
                href="#wall"
                className="pixel-btn pixel-btn-secondary text-sm md:text-lg lg:text-xl px-6 py-3 lg:px-8 lg:py-4 hover:scale-105 transition-transform bg-white text-[#2C2420] border-white"
              >
                Visit the wall
              </a>
            </motion.div>

            {/* The fine print; a phone has no room for it under the buttons */}
            <motion.p
              className="hidden md:block mt-7 text-xs tracking-[0.2em] uppercase text-white/70 text-pixel-shadow max-w-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              15 % off a Steel starter pack · a mark only a retired sneaker can give · limited spots each month · the burn is final
            </motion.p>

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

        {/* Ticker — bolted under the hero, as on the landing page */}
        <div className="relative bg-m2e-chrome text-m2e-accent-light border-y-2 border-m2e-border overflow-hidden py-3" aria-hidden>
          <div className="flex gap-10 whitespace-nowrap animate-marquee will-change-transform">
            {[...TICKER, ...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="flex items-center gap-10 text-sm md:text-base uppercase tracking-[0.2em]">
                <span className="w-2 h-2 bg-m2e-accent inline-block" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 2 / THE WALL — the field of stones ══ */}
      <section id="wall" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 pt-10 md:pt-14 pb-5">
          <div className="flex flex-wrap justify-between items-end gap-x-6 gap-y-2">
            <div className="space-y-2">
              <div className="section-label">01 · The wall</div>
              <h2 className="text-4xl md:text-6xl uppercase tracking-wide leading-none">Laid to rest</h2>
            </div>
            <p className="text-lg text-m2e-text-secondary max-w-[56ch] leading-snug">
              Every retired sneaker gets a stone. A soul that lives on says which bike it rides in — tap the stone for its card. Only the sneaker number is shown, never the owner.
            </p>
          </div>
        </div>

        <div className="gy-field relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[150px] md:h-[200px] pointer-events-none">
            <FieldBackdrop />
          </div>
          <div className="gy-field-fade absolute inset-x-0 top-[120px] md:top-[160px] h-[60px] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 pt-[110px] md:pt-[150px] pb-10">
            {wall.isPending ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 items-end">
                {[0, 1, 2, 3, 4].map((i) => <div key={i} className="pixel-card h-56 animate-pulse" />)}
              </div>
            ) : wall.isError ? (
              <div className="pixel-card p-5 text-m2e-text-secondary max-w-[520px]">The wall could not be loaded right now. The stones are still there.</div>
            ) : stones.length === 0 ? (
              <div className="relative">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-6 items-end px-6 sm:px-10">
                  {BLANKS.map((b, i) => <BlankStone key={i} kind={b.kind} size={b.size} className={i > 2 ? 'max-sm:hidden' : ''} />)}
                </div>
                <div className="absolute inset-0 grid place-items-center px-4">
                  <div className="pixel-card px-5 py-5 md:px-7 text-center max-w-[420px] space-y-2 shadow-[4px_4px_0_var(--color-m2e-shadow)]">
                    <div className="section-label justify-center">No stone yet</div>
                    <h3 className="text-2xl md:text-3xl uppercase tracking-wide leading-none">Be the first to lay a sneaker to rest</h3>
                    <p className="text-base text-m2e-text-secondary leading-snug">The first sneaker laid to rest gets the first stone on the wall.</p>
                    <a href="#retire" className="pixel-btn pixel-btn-primary px-5 py-3 text-sm mt-1">Start the guide</a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-5 gap-y-6 items-end">
                {/* A thin wall stands among unnamed stones, the real ones in the middle; a phone keeps one. */}
                {BLANKS.slice(0, Math.ceil(Math.max(0, 5 - stones.length) / 2)).map((b, i) => (
                  <BlankStone key={`left-${i}`} kind={b.kind} size={b.size} className={i >= 1 ? 'max-sm:hidden' : ''} />
                ))}
                {stones.map((stone, i) => (
                  <div key={stone.id} className={i % 3 === 1 ? 'md:translate-y-2' : i % 3 === 2 ? 'md:-translate-y-1' : ''}>
                    <Gravestone stone={stone} onOpenCard={setOpenStone} />
                  </div>
                ))}
                {BLANKS.slice(3, 3 + Math.floor(Math.max(0, 5 - stones.length) / 2)).map((b, i) => (
                  <BlankStone key={`right-${i}`} kind={b.kind} size={b.size} className="max-sm:hidden" />
                ))}
              </div>
            )}
          </div>
          <div className="gy-field-ground h-5 md:h-6" />
        </div>
      </section>

      {/* ══ 3 / THE GUIDE — the wizard ══ */}
      <section id="retire" className="band-sunk py-10 md:py-14 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 space-y-6">
          <div className="flex flex-wrap justify-between items-end gap-x-6 gap-y-2">
            <div className="space-y-2">
              <div className="section-label">02 · The guide</div>
              <h2 className="text-4xl md:text-6xl uppercase tracking-wide leading-none">How to do it</h2>
            </div>
            <p className="text-lg text-m2e-text-secondary max-w-[56ch] leading-snug">
              Seven steps, one at a time. The first two get the sneaker into a wallet of your own; the rest happen here, and the page remembers where you are.
            </p>
          </div>
          <GraveyardWizard onSignIn={() => setShowLogin(true)} />
        </div>
      </section>

      {/* ══ 4 / THE MARK — Reborn or Inherited ══ */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-[1fr_minmax(0,560px)] gap-8 md:gap-12 items-center">
          <div className="space-y-3">
            <div className="section-label">03 · The mark</div>
            <h2 className="text-4xl md:text-6xl uppercase tracking-wide leading-none">Reborn or Inherited</h2>
            <p className="text-lg max-w-[56ch] leading-snug">
              The soul shows on the bike's trading card: a soul haze around the bike, and the Reborn or Inherited mark by its level with the sneaker's number. The card's line becomes the soul's. Always a Steel bike. The same card shows in the app and is the bike's NFT when you export it.
            </p>
            <p className="text-base text-m2e-text-secondary max-w-[56ch] leading-snug">
              Stats are unchanged either way. The soul is cosmetic — a mark only a retired sneaker can give.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {MARKS.map((m) => (
              <figure key={m.key} className="m-0 grid gap-2 transition-transform motion-safe:hover:-translate-y-1">
                <MarkedBikeCard src={m.src} alt={`A bike's trading card with the ${m.title} mark`} />
                <figcaption className="text-base">
                  <span className="text-m2e-accent-dark uppercase tracking-wide">{m.title}</span>
                  <small className="block text-sm text-m2e-text-secondary leading-snug">{m.text}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5 / QUESTIONS ══ */}
      <section id="faq" className="band-sunk py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="section-label">04 · Questions</div>
          <h2 className="text-4xl md:text-6xl uppercase tracking-wide leading-none">Questions people ask</h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
            {FAQ.map(([q, a]) => (
              <div key={q} className="space-y-1.5">
                <h3 className="text-2xl leading-none">{q}</h3>
                <p className="text-lg leading-snug">{a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t-2 border-m2e-border pt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm text-m2e-text-secondary">
            <span>Galavant · pixel bikes that earn WATTS</span>
            <span>Not affiliated with STEPN. You burn in your own wallet; we only read the chain.</span>
          </div>
        </div>
      </section>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <CardLightbox stone={openStone} onClose={() => setOpenStone(null)} />
    </div>
  );
}
