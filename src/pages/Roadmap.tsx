import { Globe, Check, Clock, Lock, Zap, Music, Trophy, Heart, Users, Cloud, Flag, Gift } from 'pixelarticons/react';

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

const STATUS_CONFIG: Record<RoadmapItem['status'], { badge: string; badgeClass: string; dotClass: string; cardClass: string }> = {
  done: {
    badge: 'Complete',
    badgeClass: 'bg-m2e-success/15 text-m2e-success border-current',
    dotClass: 'bg-m2e-success border-m2e-success',
    cardClass: 'opacity-80',
  },
  current: {
    badge: 'In Progress',
    badgeClass: 'bg-m2e-accent/15 text-m2e-accent border-current',
    dotClass: 'bg-m2e-accent border-m2e-accent-dark animate-pulse',
    cardClass: 'ring-2 ring-m2e-accent/30',
  },
  upcoming: {
    badge: 'Upcoming',
    badgeClass: 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border',
    dotClass: 'bg-m2e-card border-m2e-border',
    cardClass: '',
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
        title: 'Daily Missions Board',
        description: '3 randomized daily missions that guide your session and reward completion with a bonus chest. A reason to open the app every single day.',
        icon: Check,
        status: 'upcoming',
      },
      {
        title: 'Sound Design',
        description: 'Chiptune soundtrack, satisfying SFX for earning ticks, level-ups, toolbox opens, and marketplace actions. Bringing the arcade to life.',
        icon: Music,
        status: 'upcoming',
      },
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

function StatusIcon({ status }: { status: RoadmapItem['status'] }) {
  if (status === 'done') return <Check className="w-3.5 h-3.5" />;
  if (status === 'current') return <Clock className="w-3.5 h-3.5" />;
  return <Lock className="w-3.5 h-3.5" />;
}

export function Roadmap() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Globe className="w-10 h-10 text-m2e-accent" />
          <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Roadmap</h1>
        </div>
        <p className="text-m2e-text-secondary text-xl">
          Where we've been and where we're headed. The journey from testnet to world domination.
        </p>
      </div>

      {/* Phases */}
      <div className="space-y-10">
        {PHASES.map((phase) => (
          <div key={phase.name} className="space-y-4">
            {/* Phase Header */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs uppercase tracking-widest bg-m2e-accent text-m2e-text-on-accent pixel-border border-m2e-accent-dark">
                {phase.name}
              </span>
              <span className="text-lg uppercase tracking-wider text-m2e-text-secondary">
                {phase.label}
              </span>
            </div>

            {/* Timeline */}
            <div className="relative space-y-4">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-m2e-border" />

              {phase.items.map((item) => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <div key={item.title} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 top-5 w-5 h-5 rounded-full border-2 ${config.dotClass}`} />

                    <div className={`pixel-card p-5 space-y-3 ${config.cardClass}`}>
                      {/* Title row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-6 h-6 text-m2e-accent" />
                          <h3 className="text-xl tracking-wide uppercase">{item.title}</h3>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest pixel-border ${config.badgeClass}`}>
                          <StatusIcon status={item.status} />
                          {config.badge}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-lg text-m2e-text-secondary leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pixel-card p-6 text-center space-y-3">
        <p className="text-lg text-m2e-text-secondary">
          Have ideas or feedback? Let us know in the community.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://t.me/galavantBTC"
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-btn pixel-btn-secondary px-4 py-2 text-sm"
          >
            Telegram
          </a>
          <a
            href="https://x.com/galavantBTC"
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-btn pixel-btn-secondary px-4 py-2 text-sm"
          >
            X / Twitter
          </a>
        </div>
      </div>

      {/* Bottom text */}
      <p className="text-center text-xs text-m2e-text-muted uppercase tracking-wider pt-4">
        Galavant &mdash; Walk to Earn on Bitcoin via OPNet
      </p>
    </div>
  );
}
