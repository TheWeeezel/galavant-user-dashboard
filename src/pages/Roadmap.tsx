import { useMemo } from 'react';
import { Link } from 'react-router';
import { motion, type Variants } from 'framer-motion';
import {
  Globe, Check, Clock, Lock, Zap, Music, Trophy, Heart, Users, Cloud, Flag, Gift,
  ChevronLeft,
} from 'pixelarticons/react';

interface RoadmapItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'done' | 'current' | 'upcoming';
}

interface RoadmapPhase {
  name: string;
  label: string;
  items: RoadmapItem[];
}

const STATUS_CONFIG: Record<RoadmapItem['status'], { badge: string; badgeClass: string; dotClass: string; cardClass: string; accent: string }> = {
  done: {
    badge: 'Cleared',
    badgeClass: 'bg-m2e-success/15 text-m2e-success border-current',
    dotClass: 'bg-m2e-success border-m2e-success',
    cardClass: 'opacity-80',
    accent: 'text-m2e-success',
  },
  current: {
    badge: 'In Progress',
    badgeClass: 'bg-m2e-accent/15 text-m2e-accent border-current',
    dotClass: 'bg-m2e-accent border-m2e-accent-dark animate-pulse-ring',
    cardClass: 'ring-2 ring-m2e-accent/40',
    accent: 'text-m2e-accent',
  },
  upcoming: {
    badge: 'Locked',
    badgeClass: 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border',
    dotClass: 'bg-m2e-card border-m2e-border',
    cardClass: '',
    accent: 'text-m2e-text-muted',
  },
};

const PHASES: RoadmapPhase[] = [
  {
    name: 'Phase 1',
    label: 'Foundation',
    items: [
      {
        title: 'Testnet',
        description: 'Public testnet launch with core gameplay: ride-to-earn, bikes, marketplace, breeding, staking, and token conversion. Community testing and feedback.',
        icon: Zap,
        status: 'done',
      },
      {
        title: 'Daily Missions Board',
        description: '3 randomized daily missions that guide your session and reward completion with a bonus chest. A reason to open the app every single day.',
        icon: Check,
        status: 'done',
      },
      {
        title: 'Sound Design',
        description: 'Arcade-style SFX for coin pickups, chest opens, level-ups, mission completions, forge results, and more. Sound on/off toggle in Profile.',
        icon: Music,
        status: 'done',
      },
      {
        title: 'Mainnet Launch',
        description: 'Full mainnet deployment on Bitcoin via OPNet. Live SAT token, on-chain NFT bikes, NativeSwap trading, and real BTC earnings.',
        icon: Flag,
        status: 'current',
      },
    ],
  },
  {
    name: 'Phase 2',
    label: 'Core Features',
    items: [
      {
        title: 'Achievements & Personal Bests',
        description: 'Track your longest ride, biggest earning session, and highest streak. Unlock achievement badges displayed on your profile for all to see.',
        icon: Trophy,
        status: 'upcoming',
      },
    ],
  },
  {
    name: 'Phase 3',
    label: 'Endgame & Social',
    items: [
      {
        title: 'Bike Retirement & Legacy',
        description: 'Max-level bikes can be retired as permanent trophies, granting passive earning boosts to your entire fleet. A dignified endgame for your most loyal rides.',
        icon: Heart,
        status: 'upcoming',
      },
      {
        title: 'Guilds / Crews',
        description: 'Form crews of 3-10 riders. Shared energy bonuses, crew leaderboards, crew chat, and weekly crew challenges. Ride together, earn together.',
        icon: Users,
        status: 'upcoming',
      },
      {
        title: 'Weather Modifiers',
        description: 'Real-world weather affects gameplay. Rain boosts luck, night rides increase earnings, and extreme conditions test your durability. The world comes alive.',
        icon: Cloud,
        status: 'upcoming',
      },
    ],
  },
  {
    name: 'Phase 4',
    label: 'World Domination',
    items: [
      {
        title: 'Zones & Territories',
        description: 'Claim real-world hex zones by riding through them. Earn passive SAP from controlled territory. Contest rivals, defend your turf, and conquer the map.',
        icon: Globe,
        status: 'upcoming',
      },
      {
        title: 'Lucky Events',
        description: 'Server-wide surprise events: Double Toolbox Hour, SAP Rain, Breeding Festivals. Push notifications bring everyone back for limited-time bonuses.',
        icon: Gift,
        status: 'upcoming',
      },
    ],
  },
];

// ── Animation Variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const phaseStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardFlyIn: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const dotReveal: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const lineGrow: Variants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

// ── Components ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: RoadmapItem['status'] }) {
  if (status === 'done') return <Check className="w-3.5 h-3.5" />;
  if (status === 'current') return <Clock className="w-3.5 h-3.5" />;
  return <Lock className="w-3.5 h-3.5" />;
}

export function Roadmap() {
  const vp = { once: true, margin: '-60px' };

  const totals = useMemo(() => {
    let done = 0, current = 0, upcoming = 0;
    for (const phase of PHASES) {
      for (const item of phase.items) {
        if (item.status === 'done') done++;
        else if (item.status === 'current') current++;
        else upcoming++;
      }
    }
    const total = done + current + upcoming;
    const pct = total === 0 ? 0 : Math.round(((done + current * 0.5) / total) * 100);
    return { done, current, upcoming, total, pct };
  }, []);

  return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-text text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <motion.div
            className="space-y-5"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-m2e-accent text-xs uppercase tracking-[0.25em]">
                <ChevronLeft className="w-4 h-4" />
                Home
              </Link>
              <span className="text-white/30">/</span>
              <div className="section-label">11 · Quest Log</div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
              The<br />
              <span className="text-m2e-accent">Roadmap.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl">
              From testnet to world domination. The full quest log — cleared, in progress, and locked.
            </p>

            {/* Progress bar */}
            <div className="pt-4 space-y-2 max-w-xl">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/60">
                <span>Overall Progress</span>
                <span className="text-m2e-accent">{totals.pct}%</span>
              </div>
              <div className="h-3 bg-white/10 border border-white/20 relative overflow-hidden">
                <motion.div
                  className="h-full bg-m2e-accent relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${totals.pct}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 space-y-12">
        {/* Totals strip */}
        <motion.div
          className="grid grid-cols-3 gap-3 md:gap-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <QuestStat icon={Check} label="Cleared" value={totals.done} color="text-m2e-success" />
          <QuestStat icon={Clock} label="In Progress" value={totals.current} color="text-m2e-accent" pulse />
          <QuestStat icon={Lock} label="Locked" value={totals.upcoming} color="text-m2e-text-muted" />
        </motion.div>

        {/* Phases */}
        <div className="space-y-12">
          {PHASES.map((phase, phaseIdx) => {
            const phaseDone = phase.items.filter(i => i.status === 'done').length;
            const phaseTotal = phase.items.length;
            const phaseComplete = phaseDone === phaseTotal;
            const phaseActive = phase.items.some(i => i.status === 'current');

            return (
              <motion.div
                key={phase.name}
                className="space-y-5"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                {/* Phase Header */}
                <div className="flex items-end justify-between gap-3 flex-wrap border-b-2 border-m2e-border pb-3">
                  <div className="flex items-center gap-4">
                    <span className={`text-5xl md:text-6xl leading-none ${
                      phaseComplete ? 'text-m2e-success/30' :
                      phaseActive ? 'text-m2e-accent text-chroma-soft' :
                      'text-m2e-border'
                    }`}>
                      {String(phaseIdx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-[10px] text-m2e-text-muted uppercase tracking-[0.3em]">
                        {phase.name}
                      </div>
                      <div className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text leading-none">
                        {phase.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest pixel-border ${
                      phaseComplete ? 'bg-m2e-success/15 text-m2e-success border-current' :
                      phaseActive ? 'bg-m2e-accent/15 text-m2e-accent border-current' :
                      'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border'
                    }`}>
                      {phaseDone} / {phaseTotal} Cleared
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <motion.div
                  className="relative space-y-4"
                  variants={phaseStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                >
                  {/* Vertical line */}
                  <motion.div
                    className={`absolute left-[19px] top-4 bottom-4 w-[2px] origin-top ${
                      phaseComplete ? 'bg-m2e-success' :
                      phaseActive ? 'bg-gradient-to-b from-m2e-success via-m2e-accent to-m2e-border' :
                      'bg-m2e-border'
                    }`}
                    variants={lineGrow}
                  />

                  {phase.items.map((item, itemIdx) => {
                    const config = STATUS_CONFIG[item.status];
                    return (
                      <motion.div
                        key={item.title}
                        className="relative pl-12"
                        variants={cardFlyIn}
                      >
                        {/* Timeline dot */}
                        <motion.div
                          className={`absolute left-2.5 top-5 w-5 h-5 rounded-full border-2 ${config.dotClass}`}
                          variants={dotReveal}
                        />

                        <motion.div
                          className={`pixel-card p-5 md:p-6 space-y-3 relative overflow-hidden ${config.cardClass}`}
                          whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        >
                          {/* Accent top stripe on current */}
                          {item.status === 'current' && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-m2e-accent to-transparent" />
                          )}

                          {/* Ghost quest number */}
                          <div className="absolute -top-2 -right-2 text-6xl md:text-7xl text-m2e-border/30 leading-none pointer-events-none select-none">
                            {String(itemIdx + 1).padStart(2, '0')}
                          </div>

                          {/* Title row */}
                          <div className="flex items-center justify-between flex-wrap gap-2 relative">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                                item.status === 'done' ? 'bg-m2e-success/15 border-m2e-success/30' :
                                item.status === 'current' ? 'bg-m2e-accent/15 border-m2e-accent/40' :
                                'bg-m2e-bg-alt border-m2e-border'
                              }`}>
                                <item.icon className={`w-5 h-5 ${config.accent}`} />
                              </div>
                              <h3 className="text-lg md:text-xl tracking-wide uppercase text-m2e-text">
                                {item.title}
                              </h3>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest pixel-border ${config.badgeClass}`}>
                              <StatusIcon status={item.status} />
                              {config.badge}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-base md:text-lg text-m2e-text-secondary leading-relaxed relative">
                            {item.description}
                          </p>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Community callout */}
        <motion.div
          className="pixel-corners pixel-card p-6 md:p-8 text-center space-y-4 relative overflow-hidden"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <div className="absolute inset-0 pixel-grid-bg opacity-30 pointer-events-none" />
          <div className="relative space-y-3">
            <div className="section-label justify-center w-fit mx-auto">Unlock Next</div>
            <h3 className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text">
              Your vote shapes the roadmap.
            </h3>
            <p className="text-base text-m2e-text-secondary max-w-xl mx-auto">
              Ideas, feedback, bug reports — drop them in Telegram or X. What you say moves next on this list.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="https://t.me/galavantBTC"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn pixel-btn-secondary px-5 py-2.5 text-sm"
              >
                Telegram
              </a>
              <a
                href="https://x.com/galavantBTC"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn pixel-btn-secondary px-5 py-2.5 text-sm"
              >
                X / Twitter
              </a>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-m2e-text-muted uppercase tracking-widest pt-4">
          &gt; END OF LOG · Walk to Earn on Bitcoin via OPNet
        </p>
      </div>
    </>
  );
}

function QuestStat({ icon: Icon, label, value, color, pulse }: {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="pixel-card p-4 md:p-5 flex items-center gap-3 md:gap-4 relative overflow-hidden"
    >
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-m2e-bg-alt border border-m2e-border flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div className="min-w-0">
        <div className={`text-3xl md:text-4xl leading-none ${color} flex items-center gap-2`}>
          {value}
          {pulse && value > 0 && (
            <span className="w-2 h-2 rounded-full bg-m2e-accent animate-blink" />
          )}
        </div>
        <div className="text-[10px] text-m2e-text-muted uppercase tracking-[0.3em] mt-1">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
