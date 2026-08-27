import type { ComponentType, SVGProps } from 'react';
import {
  Flag, SpeedFast, Gamepad, Sparkle, Coins,
  ChartBarBig, Trophy, ToolCase, Shield,
} from 'pixelarticons/react';
import type { GuideParams } from '../../api';

export type ChartBar = { label: string; value: number; accent?: boolean };

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'divider' }
  | { type: 'chart'; title: string; bars: ChartBar[]; unit?: string };

export type GameplayPage = {
  slug: string;
  title: string;
  content: ContentBlock[];
};

export type GameplaySection = {
  slug: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  pages: GameplayPage[];
};

const DEFAULT_GUIDE_PARAMS: GuideParams = {
  maxEnergyCap: 200,
  energyRegenPercent: 25,
  energyRegenIntervalHours: 6,
  fullRechargeHours: 24,
  baseEarningRateCommon: 5,
  hpDecayPerMinute: 0.5,
  durabilityDecayPerMinute: 0.8,
  toolboxBaseDropChance: 0.02,
  platformTaxPercent: 5,
};

function buildEnergyPage(p: GuideParams): GameplayPage {
  const cap = p.maxEnergyCap;
  return {
    slug: 'energy',
    title: 'Energy',
    content: [
      { type: 'paragraph', text: 'Energy determines how many minutes you can earn per day. Without energy, you can still walk, but you won\'t earn WATTS.' },
      { type: 'heading', text: 'Energy Basics' },
      { type: 'list', items: [
        'Energy is measured in minutes of earning time. Only minutes where you actively earn WATTS consume energy — if your speed is out of range, you stop moving, or you pause your session, your energy is preserved.',
        `It refills ${p.energyRegenPercent}% every ${p.energyRegenIntervalHours} hours — a full refill takes ${p.fullRechargeHours} hours.`,
        'Your total energy pool depends on how many bikes you own and their quality.',
        `The maximum energy cap is ${cap} minutes per day.`,
        'Only bikes with HP remaining contribute to your energy pool.',
      ]},
      { type: 'heading', text: 'Base Energy by Bike Count' },
      { type: 'paragraph', text: 'Your base energy grows as you collect more bikes. At key thresholds your base energy jumps up, and between thresholds it scales smoothly.' },
      { type: 'table', headers: ['Bikes Owned', 'Base Energy'], rows: [
        ['1', `${Math.min(10, cap)} min`],
        ['3', `${Math.min(20, cap)} min`],
        ['5', `${Math.min(35, cap)} min`],
        ['9', `${Math.min(50, cap)} min`],
        ['15', `${Math.min(75, cap)} min`],
        ['30', `${Math.min(100, cap)} min`],
      ]},
      { type: 'chart', title: 'Base Energy by Bike Count', unit: ' min', bars: [
        { label: '1 bike', value: Math.min(10, cap) },
        { label: '2 bikes', value: Math.min(15, cap) },
        { label: '3 bikes', value: Math.min(20, cap) },
        { label: '5 bikes', value: Math.min(35, cap) },
        { label: '7 bikes', value: Math.min(42, cap) },
        { label: '9 bikes', value: Math.min(50, cap) },
        { label: '12 bikes', value: Math.min(62, cap) },
        { label: '15 bikes', value: Math.min(75, cap) },
        { label: '20 bikes', value: Math.min(83, cap) },
        { label: '30 bikes', value: Math.min(100, cap), accent: true },
      ]},
      { type: 'heading', text: 'Quality Bonus' },
      { type: 'paragraph', text: 'On top of the base energy, each bike adds a flat bonus depending on its quality. Higher quality bikes contribute more bonus energy per bike.' },
      { type: 'table', headers: ['Quality', 'Bonus per Bike'], rows: [
        ['Common', '+0 min'],
        ['Uncommon', '+2 min'],
        ['Rare', '+5 min'],
        ['Epic', '+8 min'],
        ['Legendary', '+12 min'],
      ]},
      { type: 'heading', text: 'Example Scenarios' },
      { type: 'paragraph', text: `Your total energy = base energy from bike count + quality bonus from each bike, capped at ${cap} minutes.` },
      { type: 'chart', title: 'Energy by Collection', unit: ' min', bars: [
        { label: '1 Common', value: 10 },
        { label: '1 Legendary', value: 22 },
        { label: '3 Common', value: 20 },
        { label: '3 Legendary', value: Math.min(56, cap) },
        { label: '5 Rare', value: Math.min(60, cap) },
        { label: '5 Legendary', value: Math.min(95, cap), accent: true },
        { label: '9 Legendary', value: Math.min(158, cap), accent: true },
      ]},
      { type: 'tip', text: 'Collecting more bikes is the best way to increase your energy. Higher quality bikes add extra energy per bike — for example, 3 Legendary bikes give you 56 minutes compared to just 20 for 3 Common bikes.' },
    ],
  };
}

// Luck multiplier per point (hardcoded constant, not a lever)
const LUCK_MULTIPLIER = 0.003;

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function buildDecayRow(stat: number, baseDecay: number): [string, string, string] {
  const decay = baseDecay / (1 + stat / 100);
  return [String(stat), `${fmt(decay)}%`, `~${Math.round(100 / decay)} min`];
}

function buildBikeAttributesPage(p: GuideParams): GameplayPage {
  const base = p.baseEarningRateCommon;
  const earningRows: string[][] = [0, 10, 50, 100, 200].map((stat) => {
    const mult = 1 + stat / 100;
    return [String(stat), `${fmt(mult)}x`, `${fmt(base * mult, 1)} WATTS/min`];
  });

  const dropRows: string[][] = [0, 10, 50, 100].map((luck) => {
    const chance = p.toolboxBaseDropChance + luck * LUCK_MULTIPLIER;
    return [String(luck), `${Math.round(chance * 100)}%`];
  });

  return {
    slug: 'bike-attributes',
    title: 'Bike Attributes',
    content: [
      { type: 'paragraph', text: 'Each balance bike has four core attributes that affect different aspects of gameplay. Attributes come from three sources: base stats (rolled at creation), level-up points you allocate, and bonuses from socketed parts.' },
      { type: 'heading', text: 'Earning' },
      { type: 'paragraph', text: 'Increases the WATTS you earn per minute of walking. Every 100 points of Earning doubles your base rate.' },
      { type: 'table', headers: ['Total Earning', 'Multiplier', 'Example (Common bike)'], rows: earningRows },
      { type: 'heading', text: 'Luck' },
      { type: 'paragraph', text: 'Improves your chances of receiving a toolbox drop each minute you walk, and increases the likelihood of higher-level toolboxes. Higher Luck means better odds, but drops are never guaranteed to be a specific level.' },
      { type: 'table', headers: ['Total Luck', 'Drop Chance per Minute'], rows: dropRows },
      { type: 'heading', text: 'Recovery' },
      { type: 'paragraph', text: 'Slows down HP drain during walks so you can go longer between repairs. Each bike also has a one-time HP safety net that activates when HP gets critically low, fully restoring it — so new players won\'t lose their bike before they can find recovery parts.' },
      { type: 'table', headers: ['Total Recovery', 'HP Decay/min', 'Full HP Lasts'], rows: [
        buildDecayRow(0, p.hpDecayPerMinute),
        buildDecayRow(10, p.hpDecayPerMinute),
        buildDecayRow(50, p.hpDecayPerMinute),
        buildDecayRow(100, p.hpDecayPerMinute),
      ]},
      { type: 'heading', text: 'Durability' },
      { type: 'paragraph', text: 'Your bike\'s Durability stat slows down wear and tear. A bike that wears more slowly spends more time in peak condition — and a bike in peak condition earns at full rate. As your bike wears down through use, its Bike Condition drops, and your earnings progressively decrease until you repair it back to peak.' },
      { type: 'paragraph', text: 'Higher Durability also means faster repairs: a well-built bike is quicker to restore between sessions. Durability parts (the helmet-shaped pieces) are the single best way to boost this stat.' },
      { type: 'table', headers: ['Total Durability', 'Wear Decay/min', 'Full Durability Lasts'], rows: [
        buildDecayRow(0, p.durabilityDecayPerMinute),
        buildDecayRow(10, p.durabilityDecayPerMinute),
        buildDecayRow(50, p.durabilityDecayPerMinute),
        buildDecayRow(100, p.durabilityDecayPerMinute),
      ]},
      { type: 'divider' },
      { type: 'paragraph', text: 'When your bike levels up, you receive stat points that you can allocate to any of these four attributes. Choose wisely based on your playstyle!' },
      { type: 'heading', text: 'Tips for Stat Allocation' },
      { type: 'list', items: [
        'Earning-focused builds maximize short-term WATTS income.',
        'Luck builds aim for valuable toolbox drops.',
        'Recovery builds reduce HP loss and the need for recovery parts.',
        'Durability builds keep your bike at peak earning rate longer and shorten repair times.',
        'A balanced build works well for casual players.',
      ]},
    ],
  };
}

export const gameplaySections: GameplaySection[] = [
  // ─── 1. Getting Started ───────────────────────────────────────
  {
    slug: 'getting-started',
    title: 'Getting Started',
    icon: Flag,
    pages: [
      {
        slug: 'what-is-galavant',
        title: 'What is Galavant?',
        content: [
          { type: 'paragraph', text: 'Galavant is a walk-to-earn game built on Enjin. Grab a balance bike, head outdoors, and earn WATTS just by walking. Convert them into real value on the blockchain.' },
          { type: 'heading', text: 'How It Works' },
          { type: 'list', items: [
            'Get a balance bike — purchase one from the marketplace or breed a new one.',
            'Walk outdoors — the app tracks your real-world movement via GPS.',
            'Earn WATTS — every minute of walking earns you WATTS based on your bike and stats.',
            'Level up — improve your bike, socket parts, and climb the leaderboards.',
            'Go on-chain — export bikes as NFTs, stake ENJ for a boost, and redeem WATTS for ENJ each season.',
          ]},
          { type: 'tip', text: 'Galavant runs on the Enjin blockchain. Your bikes and tokens are real on-chain assets.' },
          { type: 'heading', text: 'What Makes Galavant Different' },
          { type: 'paragraph', text: 'Unlike other move-to-earn games, Galavant is built on Enjin, a blockchain purpose-built for gaming assets. Your NFTs and tokens live on-chain, where you truly own them. The game uses balance bikes — you walk with them, not pedal. It\'s designed for casual walkers and power walkers alike, with a sustainable economy that rewards genuine outdoor activity.' },
        ],
      },
      {
        slug: 'your-first-walk',
        title: 'Your First Walk',
        content: [
          { type: 'paragraph', text: 'Ready to start earning? Here\'s how to go from zero to your first WATTS in just a few minutes.' },
          { type: 'heading', text: 'Step by Step' },
          { type: 'list', items: [
            'Open the Galavant app and create your account.',
            'Get your first balance bike — claim your free starter bike, buy one in the web shop, or pick one up on the player marketplace.',
            'The web shop takes card or ENJ, and purchases go straight into your in-game inventory, so you can equip the bike immediately.',
            'Equip your bike from the inventory screen.',
            'Tap the "Walk" button to start a session.',
            'Head outside and walk at a pace that matches your bike type.',
            'Need a break? Tap Pause to freeze your session — no energy is consumed while paused. Tap Resume when you\'re ready to continue.',
            'When you\'re done, stop the session and collect your WATTS earnings!',
          ]},
          { type: 'tip', text: 'Make sure you have good GPS signal before starting. Indoor movement and treadmills won\'t count.' },
          { type: 'heading', text: 'What You Need' },
          { type: 'list', items: [
            'A smartphone with GPS capability.',
            'The Galavant app installed.',
            'At least one balance bike in your inventory.',
            'Outdoor space to walk — parks, streets, trails, anywhere with GPS coverage.',
          ]},
        ],
      },
    ],
  },

  // ─── 2. Bikes ─────────────────────────────────────────────────
  {
    slug: 'bikes',
    title: 'Bikes',
    icon: SpeedFast,
    pages: [
      {
        slug: 'bike-types',
        title: 'Bike Types',
        content: [
          { type: 'paragraph', text: 'There are four types of balance bikes in Galavant, each designed for a different walking pace. Pick the one that matches how you like to move.' },
          { type: 'table', headers: ['Type', 'Best For', 'Optimal Range'], rows: [
            ['Commuter', 'Leisurely walkers', '2 – 5 km/h'],
            ['Touring', 'Brisk walkers', '5 – 9 km/h'],
            ['Racing', 'Power walkers', '10 – 18 km/h'],
            ['Electric', 'Any walker', '2 – 18 km/h'],
          ]},
          { type: 'paragraph', text: 'Each bike type has an optimal speed zone. Walking within that zone maximizes your earnings. Walking too slow or too fast for your bike type will reduce or eliminate your rewards.' },
          { type: 'tip', text: 'The Electric bike is the most versatile — it works at any speed. However, it\'s the rarest and hardest to obtain through breeding.' },
        ],
      },
      {
        slug: 'bike-quality',
        title: 'Bike Quality',
        content: [
          { type: 'paragraph', text: 'Every balance bike has a quality tier that determines its overall power. Higher quality bikes have better base stats, earn more WATTS, and contribute more daily energy.' },
          { type: 'table', headers: ['Quality', 'Description'], rows: [
            ['Common', 'Standard bikes — a great starting point for new walkers.'],
            ['Uncommon', 'Slightly better stats and energy than Common.'],
            ['Rare', 'Noticeably stronger — a solid mid-game bike.'],
            ['Epic', 'Powerful bikes with excellent stats and energy.'],
            ['Legendary', 'The best of the best — maximum stats and energy potential.'],
          ]},
          { type: 'tip', text: 'Higher quality bikes also amplify the bonuses from socketed parts, making them even more valuable at end-game.' },
        ],
      },
      buildBikeAttributesPage(DEFAULT_GUIDE_PARAMS),
      {
        slug: 'leveling-up',
        title: 'Leveling Up',
        content: [
          { type: 'paragraph', text: 'Bikes can be leveled from 1 to 30. Each level increases your bike\'s power and unlocks new features like part sockets.' },
          { type: 'heading', text: 'How Leveling Works' },
          { type: 'list', items: [
            'Start a level-up from your bike\'s detail screen.',
            'Leveling takes real time — higher levels take longer.',
            'Your bike is still usable while leveling up.',
            'You can spend WATTS to boost and skip the wait time.',
            'On each level up, you receive stat points to allocate.',
          ]},
          { type: 'tip', text: 'Part sockets unlock at levels 5, 10, 15, and 20. Plan your leveling strategy around these milestones to maximize your bike\'s potential.' },
          { type: 'heading', text: 'Key Level Milestones' },
          { type: 'table', headers: ['Level', 'Unlock'], rows: [
            ['5', 'First part socket'],
            ['10', 'Second part socket'],
            ['15', 'Third part socket'],
            ['20', 'Fourth part socket'],
            ['30', 'Maximum level'],
          ]},
        ],
      },
      {
        slug: 'mint-score',
        title: 'Mint Score',
        content: [
          { type: 'paragraph', text: 'Every bike receives a Mint Score when it\'s created. This letter grade (S through F) shows how well the bike\'s stats rolled compared to other bikes of the same quality tier.' },
          { type: 'table', headers: ['Grade', 'Meaning'], rows: [
            ['S', 'Exceptional — near-perfect stats for its quality tier.'],
            ['A', 'Excellent — well above average.'],
            ['B', 'Good — above average.'],
            ['C', 'Average — typical for its quality.'],
            ['D', 'Below average — weaker than most.'],
            ['F', 'Poor — lowest possible stats for its tier.'],
          ]},
          { type: 'paragraph', text: 'Mint Score is determined at creation and never changes. It\'s a useful metric when comparing bikes on the marketplace — a Common bike with an S grade can sometimes outperform an Uncommon with an F grade.' },
          { type: 'tip', text: 'When shopping on the marketplace, check the Mint Score to make sure you\'re getting a good deal. Grade matters as much as quality!' },
        ],
      },
    ],
  },

  // ─── 3. Walking & Earning ─────────────────────────────────────
  {
    slug: 'walking-earning',
    title: 'Walking & Earning',
    icon: Gamepad,
    pages: [
      {
        slug: 'how-earning-works',
        title: 'How Earning Works',
        content: [
          { type: 'paragraph', text: 'Earning WATTS is the core loop of Galavant. Every minute you walk outdoors with an equipped balance bike, you earn WATTS. The amount depends on several factors.' },
          { type: 'heading', text: 'What Affects Your Earnings' },
          { type: 'list', items: [
            'Bike quality — higher quality bikes have better earning potential.',
            'Earning attribute — more points in Earning = more WATTS per minute.',
            'Bike level — higher level bikes earn more.',
            'Speed matching — staying in your bike\'s optimal speed zone maximizes earnings.',
            'GPS signal quality — poor signal reduces earnings.',
            'Loyalty bonuses — daily streaks and token holding boost your earnings.',
          ]},
          { type: 'tip', text: 'Focus on building a strong Earning attribute and walking consistently within your bike\'s speed zone for the best results.' },
        ],
      },
      buildEnergyPage(DEFAULT_GUIDE_PARAMS),
      {
        slug: 'speed-matching',
        title: 'Speed Matching',
        content: [
          { type: 'paragraph', text: 'Each bike type has an optimal speed zone. Walking within this zone earns you full WATTS. Walking outside of it reduces your rewards.' },
          { type: 'heading', text: 'Speed Zones by Bike Type' },
          { type: 'table', headers: ['Bike Type', 'Full Range', 'Optimal Range', 'Best For'], rows: [
            ['Commuter', '2 – 6 km/h', '2 – 5 km/h', 'Slow to normal walking'],
            ['Touring', '4 – 10 km/h', '5 – 9 km/h', 'Brisk walking to light jogging'],
            ['Racing', '8 – 20 km/h', '10 – 18 km/h', 'Jogging to running'],
            ['Electric', '2 – 20 km/h', '2 – 18 km/h', 'Any pace'],
          ]},
          { type: 'paragraph', text: 'Inside the optimal range you earn 100%. Above the optimal range, earnings taper off linearly toward zero at the full range cap. Below the optimal minimum, earnings are zero.' },
          { type: 'paragraph', text: 'When your speed is outside the earning range, your energy is preserved — only minutes where you actually earn will consume energy. So if you stop to rest or slow down, you won\'t waste your energy minutes.' },
          { type: 'tip', text: 'For reference: a casual walk is about 3 km/h, a brisk walk ~6 km/h, a jog ~8 km/h, and a run ~12–16 km/h. Pick the bike that fits your natural pace.' },
        ],
      },
      {
        slug: 'gps-outdoor',
        title: 'GPS & Outdoor Activity',
        content: [
          { type: 'paragraph', text: 'Galavant requires genuine outdoor movement. The app uses GPS to verify that you\'re actually walking through the real world.' },
          { type: 'heading', text: 'Requirements' },
          { type: 'list', items: [
            'You must be outdoors with a clear GPS signal.',
            'Indoor activities like treadmills do not count.',
            'Poor GPS signal (tunnels, dense buildings) will reduce your earnings.',
            'The game verifies genuine movement patterns — spoofing or faking won\'t work.',
            'Leaving your phone stationary (e.g. on a table) will not earn rewards — the app detects both GPS drift and lack of body motion.',
          ]},
          { type: 'tip', text: 'For the best experience, walk in open areas with good sky visibility. Parks, sidewalks, and trails work great. Keep your phone on your body while walking — it needs to sense your movement.' },
          { type: 'heading', text: 'Signal Quality' },
          { type: 'paragraph', text: 'Your GPS signal quality is reflected in your earnings. Strong, consistent signals mean full rewards. If the signal is weak or intermittent, your earnings for those minutes will be reduced. The app will let you know if signal quality is too poor to earn.' },
          { type: 'paragraph', text: 'When you stop a ride, the app syncs any final GPS points and the server finalizes your result from a validated stop moment. That means brief upload delays should not cost you legitimate earnings, while obviously inconsistent stop times are ignored to keep results fair for everyone.' },
        ],
      },
      {
        slug: 'bike-condition',
        title: 'Bike Condition & Repair',
        content: [
          { type: 'paragraph', text: 'Every bike has a Bike Condition that ranges from 0% to 100%, shown as the durability bar on the bike detail screen. Condition affects how much WATTS you earn — a bike in peak condition earns at full rate, while a worn-down bike earns progressively less per minute.' },
          { type: 'heading', text: 'How Condition Affects Earnings' },
          { type: 'list', items: [
            'A freshly repaired bike earns at full rate.',
            'As you ride, your bike wears down and Condition gradually drops.',
            'Once Condition falls below the well-maintained zone, your earning rate decreases.',
            'A heavily worn bike still earns WATTS, but at a significantly reduced rate.',
            'Repairing restores Condition to peak and returns you to full-rate earning.',
          ]},
          { type: 'heading', text: 'Repairs Take Time' },
          { type: 'paragraph', text: 'When you start a repair, your bike is locked from activities while it\'s being fixed. The amount of wall-clock time required depends on how much wear there is to undo — small top-up repairs are quick, full overhauls take longer.' },
          { type: 'paragraph', text: 'If you\'re in a hurry, you can spend extra WATTS to instantly skip the remaining wait, in the same way you can boost a level-up. The cost decays as the repair progresses, so a near-finished repair is much cheaper to skip than a freshly-started one.' },
          { type: 'heading', text: 'Keeping Your Bike in Peak Condition' },
          { type: 'list', items: [
            'Higher Durability stat means slower wear per minute of walking.',
            'Socket high-level Durability parts (the helmet-shaped pieces) to boost your effective Durability.',
            'Higher Durability also means faster repair turnaround.',
            'Partial repairs are an option — top up between long sessions without waiting for a full overhaul.',
            'Riders with multiple bikes can rotate between them: ride one while the other repairs.',
          ]},
          { type: 'tip', text: 'The Live Activity screen shows your current Bike Condition and how it\'s affecting your live earning rate. Watch the indicator during long sessions — that\'s your cue to wrap up and repair, or to switch to a fresh bike.' },
          { type: 'heading', text: 'Why This Matters' },
          { type: 'paragraph', text: 'In Galavant, a bike isn\'t just a vehicle — it\'s a piece of equipment that needs upkeep. Building a high-Durability bike with the right parts means more time at peak earning rate, faster repairs, and better returns over the long run. Multi-bike riders gain an additional edge by rotating between bikes during repair downtime, turning fleet ownership into a real strategic advantage.' },
        ],
      },
    ],
  },

  // ─── 4. Parts & Upgrades ──────────────────────────────────────
  {
    slug: 'parts-upgrades',
    title: 'Parts & Upgrades',
    icon: ToolCase,
    pages: [
      {
        slug: 'what-are-parts',
        title: 'What Are Parts?',
        content: [
          { type: 'paragraph', text: 'Parts are components that boost your balance bike\'s attributes. Each part enhances one specific stat — earning, luck, recovery, or durability.' },
          { type: 'heading', text: 'Part Types' },
          { type: 'table', headers: ['Part Type', 'Boosted Attribute'], rows: [
            ['Earning Part', 'Increases WATTS earned per minute'],
            ['Luck Part', 'Improves toolbox drop chances'],
            ['Recovery Part', 'Reduces HP drain while walking'],
            ['Durability Part', 'Reduces wear on your bike'],
          ]},
          { type: 'paragraph', text: 'Parts come in different levels. Higher level parts provide bigger bonuses. You can obtain parts from toolbox drops during walks or by upgrading existing parts.' },
        ],
      },
      {
        slug: 'socketing',
        title: 'Socketing',
        content: [
          { type: 'paragraph', text: 'Socket parts into your bike to activate their bonuses. Each bike has 4 part slots that unlock as the bike levels up.' },
          { type: 'heading', text: 'Socket Unlocks' },
          { type: 'table', headers: ['Bike Level', 'Sockets Available'], rows: [
            ['1-4', '0 sockets'],
            ['5-9', '1 socket'],
            ['10-14', '2 sockets'],
            ['15-19', '3 sockets'],
            ['20+', '4 sockets (maximum)'],
          ]},
          { type: 'heading', text: 'Important Details' },
          { type: 'list', items: [
            'Each socket has a random type assigned when the bike is created — you can\'t choose which type goes where.',
            'You can only socket a part that matches the socket type (e.g., an Earning part into an Earning socket).',
            'Higher quality bikes amplify the bonuses from socketed parts.',
            'You can remove and replace parts at any time.',
          ]},
          { type: 'tip', text: 'Check your bike\'s socket types before investing in parts. Plan your upgrades around the sockets you have.' },
        ],
      },
      {
        slug: 'upgrading-parts',
        title: 'Upgrading Parts',
        content: [
          { type: 'paragraph', text: 'Combine three parts of the same type and level to attempt an upgrade to the next level. Higher level parts provide significantly better bonuses.' },
          { type: 'heading', text: 'How Upgrading Works' },
          { type: 'list', items: [
            'Select three identical parts (same type, same level).',
            'Attempt the upgrade — there\'s a chance of success or failure.',
            'On success, you receive one part of the next level.',
            'On failure, all three parts are consumed.',
            'Higher levels have lower success rates.',
            'You can spend WATTS to boost the success chance before attempting.',
          ]},
          { type: 'tip', text: 'Boosting the success rate costs WATTS but can save you from losing three valuable parts. Consider boosting for higher level upgrades where the stakes are higher.' },
        ],
      },
      {
        slug: 'toolboxes',
        title: 'Toolboxes',
        content: [
          { type: 'paragraph', text: 'Toolboxes are reward containers that can drop while you walk and earn. You need to actually move a meaningful distance during your session before any toolbox can drop — standing still or barely moving won\'t earn you a toolbox. Both your drop chance and the level of toolbox you receive depend on your active earning time — once your energy runs out, no further drops can occur.' },
          { type: 'heading', text: 'Toolbox Levels' },
          { type: 'paragraph', text: 'Toolboxes range from Level 1 (most common) to Level 5 (rarest). Higher levels contain better parts and a chance at minting tools.' },
          { type: 'table', headers: ['Level', 'Rarity', 'Description'], rows: [
            ['Lv. 1', 'Very Common', 'Basic rewards that help early progression.'],
            ['Lv. 2', 'Common', 'A modest step up in parts and WATTS rewards.'],
            ['Lv. 3', 'Uncommon', 'Stronger mid-tier rewards with occasional premium drops.'],
            ['Lv. 4', 'Rare', 'High-value rewards and better premium-drop potential.'],
            ['Lv. 5', 'Very Rare', 'The strongest rewards and the best chance at top-tier extras.'],
          ]},
          { type: 'tip', text: 'Investing in Luck — through leveling, parts, and bike quality — significantly improves both your drop rate and the level of toolboxes you receive. More active movement time pushes the toolbox level higher. Standing still or having poor GPS signal won\'t count toward your toolbox level. However, there\'s always some randomness — even with high Luck and a long walk, you may occasionally get a lower-level toolbox.' },
          { type: 'heading', text: 'How Luck Shapes Your Boxes' },
          { type: 'paragraph', text: 'Luck does more than push you toward higher tiers. The bike you were riding when a toolbox dropped is remembered, and that bike\'s Luck shapes what you find inside the box when you open it later — swapping bikes after the drop won\'t change the contents. Riders with stronger Luck builds tend to see consistently better contents within the same tier, while lower-Luck riders sit closer to the average. Build a "lucky bike" specifically for your earning sessions if you want to chase quality.' },
          { type: 'heading', text: 'Total Score & Overflow' },
          { type: 'paragraph', text: 'During a walk, the live screen shows a continuous Total Score bar with marker ticks at each toolbox tier. Once you pass the highest tier, the bar enters an overflow zone — the further it fills, the better the contents quality your next box will lean toward. This is how high-Luck players keep getting rewarded after they\'ve already reached the top tier.' },
          { type: 'heading', text: 'Special Modifiers' },
          { type: 'paragraph', text: 'Some toolboxes drop with a rare special modifier that visibly tints the box and signals an above-average reward. These are uncommon and grow rarer toward the top — they\'re the kind of drop you\'ll remember when you see one.' },
          { type: 'heading', text: 'Cooldown Timers' },
          { type: 'paragraph', text: 'Each toolbox has a cooldown period that starts when it drops. You must wait for the timer to expire before opening. Higher-level toolboxes take longer — ranging from about 2 days for Lv. 1 up to about a week for Lv. 5.' },
          { type: 'tip', text: 'Extra inventory slots let you cool down multiple boxes in parallel, so you\'re always ready to open one while others count down.' },
          { type: 'heading', text: 'Speed Open' },
          { type: 'paragraph', text: 'Don\'t want to wait? You can spend WATTS to instantly skip the remaining cooldown. The cost scales with how much time is left — the more patient you are, the less it costs. This cost is in addition to the normal opening cost.' },
          { type: 'heading', text: 'Live Drop Progress' },
          { type: 'paragraph', text: 'During a walk, the live activity screen shows your estimated toolbox drop progress — including your cumulative drop chance so far and the likely toolbox level based on your actual movement. If you stop moving, the estimated level reflects that. This updates in real time as your walk continues.' },
          { type: 'heading', text: 'Opening Costs' },
          { type: 'paragraph', text: 'Every toolbox has an opening cost. Lower-level toolboxes are easier to open, while higher-level toolboxes may also require ENJ in addition to WATTS.' },
          { type: 'table', headers: ['Level', 'Cost Type'], rows: [
            ['Lv. 1 - 3', 'WATTS only'],
            ['Lv. 4 - 5', 'WATTS + ENJ'],
          ]},
          { type: 'paragraph', text: 'This keeps early toolboxes accessible while making the highest-level boxes a more deliberate upgrade path.' },
          { type: 'heading', text: 'Contents by Level' },
          { type: 'paragraph', text: 'Toolboxes can contain parts from any of the four part types, a small WATTS bonus, and sometimes minting tools. Opening a toolbox always costs more WATTS than the WATTS you receive back — the real value is the parts and tools inside.' },
          { type: 'list', items: [
            'Any toolbox can help you build out your parts inventory.',
            'Higher-level toolboxes are better for chasing stronger part levels.',
            'Minting tools become more likely as toolbox level increases.',
          ]},
          { type: 'heading', text: 'Inventory Slots' },
          { type: 'paragraph', text: 'You start with 2 free toolbox slots. Toolboxes waiting to be opened occupy a slot. If all slots are full, no new drops can occur.' },
          { type: 'paragraph', text: 'You can expand your toolbox inventory one slot at a time, up to 6 total slots.' },
          { type: 'tip', text: 'Don\'t let your toolbox inventory fill up! Open them regularly to keep earning drops during walks. Expanding slots is a one-time investment that pays off over time.' },
        ],
      },
    ],
  },

  // ─── 5. Breeding ──────────────────────────────────────────────
  {
    slug: 'breeding',
    title: 'Breeding',
    icon: Sparkle,
    pages: [
      {
        slug: 'how-breeding-works',
        title: 'How Breeding Works',
        content: [
          { type: 'paragraph', text: 'Breed two balance bikes together to create a brand new offspring. Breeding is the primary way to expand your collection and potentially create high-quality bikes.' },
          { type: 'heading', text: 'Requirements' },
          { type: 'list', items: [
            'Two bikes, each at level 5 or higher.',
            'Each bike can breed up to 7 times in its lifetime.',
            'There\'s a 48-hour cooldown between breeds for each bike.',
            'Breeding costs ENJ (gas), WATTS, and 1 minting tool.',
            'Costs increase with each subsequent breed for that bike.',
          ]},
          { type: 'tip', text: 'Plan your breeds carefully — each bike has limited breed count, and costs go up each time. Save your best bikes for when you\'re ready.' },
        ],
      },
      {
        slug: 'offspring',
        title: 'Offspring',
        content: [
          { type: 'paragraph', text: 'The offspring bike\'s traits are influenced by both parents, but there\'s always an element of randomness.' },
          { type: 'heading', text: 'What Parents Influence' },
          { type: 'list', items: [
            'Quality tier — offspring quality tends to be around or below the parents\' average. Higher quality offspring are always possible, but progressively rarer.',
            'Bike type — the offspring\'s type is influenced by the parents\' types.',
            'Stats are freshly rolled for the offspring — they don\'t directly inherit parent stats.',
          ]},
          { type: 'heading', text: 'Special Notes' },
          { type: 'list', items: [
            'Electric bikes are the hardest type to breed — they\'re rare even from two Electric parents.',
            'Legendary offspring are very rare — even breeding two high-tier parents usually produces a lower-quality result.',
            'Two parents of the same quality strongly favor that same quality in offspring.',
            'Cross-tier breeding tends to regress toward the lower parent\'s quality.',
            'The offspring starts at level 1 with zero breeds used.',
          ]},
          { type: 'tip', text: 'Breeding two same-quality bikes gives the most predictable results. Cross-tier breeding can surprise you, but don\'t count on getting a Legendary — they\'re earned through patience and luck!' },
        ],
      },
    ],
  },

  // ─── 6. NFTs & Wallet ─────────────────────────────────────────
  {
    slug: 'nfts-wallet',
    title: 'NFTs & Wallet',
    icon: Coins,
    pages: [
      {
        slug: 'dashboard-login',
        title: 'Dashboard Login',
        content: [
          { type: 'paragraph', text: 'The Galavant dashboard lets you manage your account, view tasks, and access the marketplace from a browser. There are two ways to log in.' },
          { type: 'heading', text: 'Wallet Extension' },
          { type: 'list', items: [
            'Install the wallet browser extension.',
            'Create a new wallet or import an existing one using your recovery phrase.',
            'On the dashboard, click "Connect Wallet" — the extension will prompt you to approve.',
          ]},
          { type: 'heading', text: 'Google Sign-In' },
          { type: 'list', items: [
            'Click "Sign in with Google" on the dashboard.',
            'This only works if your Google account was already linked to a wallet in the mobile app.',
            'If you see a "not linked" message, open the mobile app first and link Google from your profile settings.',
          ]},
          { type: 'tip', text: 'If Google sign-in shows a "not linked" message, set up the link in the mobile app first. Go to Profile → Link Google Account.' },
        ],
      },
      {
        slug: 'wallet-setup',
        title: 'Wallet Setup',
        content: [
          { type: 'paragraph', text: 'Your wallet is your identity in Galavant. Set it up in the mobile app to start earning and access all features.' },
          { type: 'heading', text: 'Create New Wallet' },
          { type: 'list', items: [
            'Choose "Create New Wallet" when you first open the app.',
            'The app generates a 12-word recovery phrase — this is your master key.',
            'Write down the recovery phrase and store it in a safe place.',
            'Confirm the phrase to complete wallet creation.',
          ]},
          { type: 'heading', text: 'Import Existing Wallet' },
          { type: 'list', items: [
            'Choose "Import Wallet" if you already have a recovery phrase.',
            'Enter your 12-word or 24-word mnemonic phrase.',
            'The app derives your wallet address and keys automatically.',
            'You\'ll be connected to the same account as before.',
          ]},
          { type: 'tip', text: 'Write down your recovery phrase and store it safely — it\'s the only way to recover your wallet. Never share it with anyone.' },
        ],
      },
      {
        slug: 'cross-platform-access',
        title: 'Cross-Platform Access',
        content: [
          { type: 'paragraph', text: 'Your wallet address is your identity across Galavant. The same wallet gives you the same account on both the mobile app and the web dashboard.' },
          { type: 'heading', text: 'How It Works' },
          { type: 'list', items: [
            'Set up your wallet in the mobile app (create new or import existing).',
            'To access the dashboard: import the same recovery phrase into the wallet browser extension, then connect on the dashboard.',
            'Alternatively, link your Google account in the mobile app and use Google sign-in on the dashboard.',
            'Both methods connect you to the same account — your bikes, WATTS balance, and progress are shared.',
          ]},
          { type: 'tip', text: 'Your wallet address is your identity — the same address everywhere means the same account. Keep your recovery phrase backed up to access your account from any device.' },
        ],
      },
      {
        slug: 'exporting-bikes',
        title: 'Exporting Bikes',
        content: [
          { type: 'paragraph', text: 'Bikes you buy in the shop or earn in-game start as normal inventory bikes. Exporting is optional and only needed when you want to move a bike onto the Enjin blockchain — for example, to sell or transfer it outside Galavant.' },
          { type: 'paragraph', text: 'Any bike with full HP can be exported as an on-chain NFT (BikeNFT). A small WATTS fee applies, and the export only completes if your in-game balance can cover it at mint time.' },
          { type: 'heading', text: 'How Exporting Works' },
          { type: 'list', items: [
            'Open your Profile and tap the bike you want to export.',
            'In the bike details, choose "Export to Wallet" and confirm.',
            'The bike must be at full HP and not currently equipped — equip a different bike first if needed.',
            'A small WATTS fee is reserved from your in-game balance for the export and only sticks if the mint succeeds.',
            'The bike leaves your in-game inventory and appears in your Profile under "Inventory · NFTs".',
            'Any socketed parts are automatically unsocketed and returned to your parts inventory.',
            'The NFT is now in your wallet and can be traded on-chain or on compatible marketplaces.',
          ]},
          { type: 'tip', text: 'Unsocket any valuable parts before exporting if you want to equip them on another bike right away. The bike must have full HP and be unequipped to export.' },
        ],
      },
      {
        slug: 'importing-bikes',
        title: 'Importing Bikes',
        content: [
          { type: 'paragraph', text: 'If you own a BikeNFT on-chain, you can import it back into Galavant to use it for walking and earning.' },
          { type: 'heading', text: 'How Importing Works' },
          { type: 'list', items: [
            'Open your Profile and scroll to "Inventory · NFTs" — any BikeNFTs in your wallet appear here.',
            'Tap the NFT and choose "Import to Game" in the details panel.',
            'The NFT is burned (destroyed on-chain).',
            'The bike appears in your in-game inventory at full HP and durability.',
            'You can immediately equip it, socket parts, and start walking.',
          ]},
          { type: 'paragraph', text: 'Importing is a one-way operation for that NFT — it\'s burned when imported. You can always export it again later if you want to trade it.' },
        ],
      },
    ],
  },

  // ─── 7. Economy ───────────────────────────────────────────────
  {
    slug: 'economy',
    title: 'Economy',
    icon: ChartBarBig,
    pages: [
      {
        slug: 'watts-and-enj',
        title: 'WATTS & ENJ',
        content: [
          { type: 'paragraph', text: 'Galavant runs on two currencies. WATTS is what you earn and spend inside the game. ENJ is the Enjin blockchain\'s own token, and it only shows up at the edges — staking for a boost, trading NFTs, and the seasonal redemption.' },
          { type: 'heading', text: 'WATTS' },
          { type: 'list', items: [
            'Earned by walking with your balance bike.',
            'Used for leveling, repairs, upgrades, breeding, boosts, and marketplace trades.',
            'Stored in your game account — no wallet needed to earn or spend it.',
            'Everything in the game is priced in WATTS. You never need crypto to play.',
          ]},
          { type: 'heading', text: 'Earned WATTS vs Store WATTS' },
          { type: 'paragraph', text: 'WATTS comes in two flavours, and the difference matters at the end of a season.' },
          { type: 'table', headers: ['', 'Earned WATTS', 'Store WATTS'], rows: [
            ['Where it comes from', 'Walking, missions, social rewards, selling to other players', 'Bought with card or ENJ in the web shop'],
            ['Spends on game costs', 'Yes', 'Yes — and it is spent first'],
            ['Sell on the player marketplace', 'Yes', 'No'],
            ['Redeem for ENJ at season end', 'Yes', 'No'],
          ]},
          { type: 'tip', text: 'Store WATTS is there to save you time, not to buy your way to a payout. It spends on everything in the game, but only Earned WATTS can be redeemed or traded to other players.' },
          { type: 'heading', text: 'ENJ' },
          { type: 'list', items: [
            'The native token of the Enjin blockchain — it lives in your own wallet, never in ours.',
            'Stake it in the Galavant pool for a permanent earning boost (see Progression → ENJ Staking).',
            'Buy and sell NFT bikes with it on Enjin marketplaces.',
            'Receive it when you redeem WATTS at the end of a season.',
          ]},
          { type: 'heading', text: 'The Seasonal Redemption Window' },
          { type: 'paragraph', text: 'This is how your walking turns into real value. Galavant runs in seasons. Each season, a share of the platform\'s revenue is set aside as an ENJ prize budget. When the season closes, a redemption window opens: burn your Earned WATTS and receive a slice of that budget.' },
          { type: 'list', items: [
            'Your share is proportional — the more Earned WATTS you burn relative to everyone else, the larger your slice of that season\'s budget.',
            'The rate floats. It is never fixed in advance, because it depends on the budget that season and how much WATTS the whole player base redeems.',
            'Staking ENJ gates and weights your redemption — bigger, longer-held stakes claim a bigger share.',
            'WATTS you burn is gone for good. That burn is what keeps the currency from inflating away.',
          ]},
          { type: 'tip', text: 'You are never forced to redeem. WATTS keeps its full value inside the game, and plenty of players will simply keep spending it on better bikes and parts.' },
          { type: 'heading', text: 'Why Not Just Mint a Token?' },
          { type: 'paragraph', text: 'Most move-to-earn games mint their own token and let players cash out of it freely. Supply grows faster than demand, the price falls, and the reward loop dies. Galavant deliberately does not do this. There is no Galavant token to inflate — payouts come out of a budget funded by real revenue, so the game can only pay out what it has actually earned.' },
        ],
      },
      {
        slug: 'marketplace',
        title: 'Marketplace',
        content: [
          { type: 'paragraph', text: 'The in-game marketplace lets you buy and sell bikes, parts, and minting tools using WATTS.' },
          { type: 'heading', text: 'Selling' },
          { type: 'list', items: [
            'List any bike, part, or minting tool for a WATTS price you choose.',
            'Bikes must be at 100% durability to be listed — repair first if needed.',
            'Listed bikes stay visible in your inventory, but bike-management actions stay locked until the listing is sold or cancelled.',
            'Listed parts stay visible too, but missions only count loose, unlisted parts and unlisted bikes as ready-to-use resources.',
            'A 5% fee is deducted from the sale price when an item sells.',
            'You can have up to 20 active listings at once.',
            'Cancel listings to get your item back. Listings tied to a daily mission may have a short cooldown before they can be cancelled.',
          ]},
          { type: 'heading', text: 'Buying' },
          { type: 'list', items: [
            'Browse listings by type, quality, and price.',
            'Purchase instantly at the listed price.',
            'Items are transferred immediately to your inventory.',
          ]},
          { type: 'tip', text: 'Check Mint Scores when buying bikes — a high grade at a low price is a great find!' },
        ],
      },
    ],
  },

  // ─── 8. Economic Governance ──────────────────────────────────
  {
    slug: 'economic-governance',
    title: 'Economic Governance',
    icon: Shield,
    pages: [
      {
        slug: 'how-decisions-are-made',
        title: 'How Economic Decisions Are Made',
        content: [
          { type: 'paragraph', text: 'Galavant\'s economy isn\'t left to chance. Behind the scenes, an AI-powered economy agent continuously monitors the health of the entire game economy and proposes adjustments to keep things balanced and sustainable.' },
          { type: 'heading', text: 'The Economy Agent' },
          { type: 'paragraph', text: 'Every day, the economy agent analyzes real-time data from across the game — player activity, how WATTS flows in and out, marketplace trends, staking momentum, and more. Based on this analysis, it identifies potential risks like inflation, deflation, or market imbalances and proposes corrective actions.' },
          { type: 'list', items: [
            'The agent reviews economy health metrics daily.',
            'It produces a risk assessment (low, medium, high, or critical) based on current conditions.',
            'It can propose changes to economic parameters — like earning rates, costs, or how a season\'s budget is set.',
            'Every proposal requires human admin approval before taking effect. The agent cannot act unilaterally.',
          ]},
          { type: 'tip', text: 'No economic change happens automatically. The AI proposes, humans approve. This ensures accountability while benefiting from data-driven analysis.' },
          { type: 'heading', text: 'Economy Health Score' },
          { type: 'paragraph', text: 'The game maintains a real-time economy health score visible on the dashboard homepage. This score reflects the overall balance between earning, spending, staking, and redemption across the ecosystem.' },
          { type: 'list', items: [
            'Healthy — the economy is well-balanced with strong player activity and stable token flows.',
            'Cautious — some metrics are trending outside ideal ranges. The team is monitoring closely.',
            'Stressed — significant imbalance detected. Active measures may be in progress to restore stability.',
          ]},
          { type: 'paragraph', text: 'This score is calculated from multiple factors including player activity levels, how currency flows through the game, and the balance between earning sources and spending sinks.' },
        ],
      },
      {
        slug: 'central-banking',
        title: 'The Central Banking System',
        content: [
          { type: 'paragraph', text: 'Galavant runs an AI-driven central banking system over its economy. In most move-to-earn games nobody is minding the shop: rewards are printed, value leaks out, and the loop collapses. Galavant treats the economy as something to be actively budgeted and managed.' },
          { type: 'heading', text: 'A Budget, Not a Printing Press' },
          { type: 'paragraph', text: 'Galavant does not mint its own token, so there is no supply to inflate or defend. Instead the system is fiscal: a share of the platform\'s real revenue — NFT sales, marketplace commission, shop purchases, staking commission — is set aside each season as an ENJ budget. That budget is what funds player payouts.' },
          { type: 'heading', text: 'Where the Season Budget Goes' },
          { type: 'list', items: [
            'The redemption pot — the larger share, paid out to players who burn Earned WATTS during the season\'s redemption window.',
            'Leaderboard prizes — the remainder, awarded to top riders for the season.',
            'A minimum budget gate — if a season does not clear the threshold, the budget rolls forward rather than paying out something meaningless.',
          ]},
          { type: 'tip', text: 'The important consequence: Galavant can only ever pay out what it has actually earned. Payouts scale with the health of the business, not with how fast a token can be minted.' },
          { type: 'heading', text: 'What the Economy Agent Does' },
          { type: 'list', items: [
            'Reviews economy health daily and produces a risk assessment.',
            'Proposes adjustments to earning rates, costs, and sinks when metrics drift out of range.',
            'Runs a fiscal review at the end of every season, before the budget is set and the redemption window opens.',
            'Watches the WATTS flow ratio — how much WATTS enters the game versus how much is spent or burned — as its core inflation signal.',
          ]},
          { type: 'tip', text: 'Every proposal is reviewed by the team and requires explicit admin approval before it takes effect. The AI proposes; humans decide. Nothing changes automatically.' },
        ],
      },
      {
        slug: 'what-can-change',
        title: 'What Can Change',
        content: [
          { type: 'paragraph', text: 'Galavant\'s economy is a living system. To keep it healthy and fair, the team can adjust a wide range of economic parameters over time. This is by design — a static economy can\'t respond to real-world conditions like player growth, market shifts, or emerging imbalances.' },
          { type: 'tip', text: 'Changes are always made carefully, proposed by the AI economy agent, and approved by the team. The goal is never to disadvantage players — it\'s to keep the economy sustainable so your earnings and assets hold value long-term.' },
          { type: 'heading', text: 'Adjustable Economic Levers' },
          { type: 'paragraph', text: 'The following table shows the categories of parameters the team can tune. No exact values are listed — just what each lever controls and why it might be adjusted.' },
          { type: 'table', headers: ['Area', 'What Can Be Adjusted', 'Why It Might Change'], rows: [
            ['Earning Rates', 'Base WATTS earned per minute by bike quality', 'To balance inflation if too much WATTS is entering the economy'],
            ['Energy System', 'Daily energy caps, regen speed, quality bonuses', 'To balance earning capacity as the player base grows'],
            ['Repair & Maintenance', 'Cost to repair HP and durability', 'To calibrate how much WATTS flows back out as a spending sink'],
            ['Leveling Costs', 'WATTS and ENJ costs for leveling bikes', 'To ensure progression costs stay meaningful at all stages'],
            ['Part Upgrades', 'Upgrade costs and success rates', 'To balance the part economy and prevent excess supply'],
            ['Breeding Costs', 'ENJ and WATTS costs per breed attempt', 'To control the rate of new bike creation'],
            ['Toolbox System', 'Drop rates, cooldowns, opening costs', 'To manage the flow of parts and resources into the game'],
            ['Marketplace Fees', 'Platform fee on trades', 'To adjust the WATTS sink from player-to-player trading'],
            ['Staking Rewards', 'Earning boosts and redemption weight from staked ENJ', 'To calibrate how much staking commitment is rewarded'],
            ['Loyalty Multipliers', 'Daily streak bonus tiers', 'To calibrate how much consistency is rewarded'],
            ['Season Budget', 'Share of revenue set aside as the seasonal ENJ budget', 'To keep payouts in step with what the platform actually earns'],
            ['Redemption Split', 'How the season budget divides between the redemption pot and leaderboard prizes', 'To balance rewarding everyone against rewarding the top of the board'],
            ['Store WATTS Pricing', 'What a WATT Pack costs in the web shop', 'To keep bought WATTS priced fairly against earned WATTS'],
          ]},
          { type: 'divider' },
          { type: 'heading', text: 'What Stays the Same' },
          { type: 'paragraph', text: 'Some things are fixed by design and will not change:' },
          { type: 'list', items: [
            'No Galavant token — payouts come from a revenue-funded budget, so there is no supply anyone can inflate.',
            'Store WATTS is never redeemable and never tradable to other players — that firewall is structural, not a setting.',
            'On-chain ownership — your bikes and tokens are real on-chain assets you control.',
            'Human approval requirement — no economy change happens without team review.',
            'Transparency — the economy health score remains public.',
          ]},
        ],
      },
      {
        slug: 'why-this-matters',
        title: 'Why This Matters',
        content: [
          { type: 'paragraph', text: 'Most move-to-earn games suffer from a common problem: their token value crashes over time because there\'s nothing managing the economy. Tokens are minted endlessly, early players cash out, and the game becomes worthless for everyone else.' },
          { type: 'heading', text: 'Galavant\'s Approach' },
          { type: 'list', items: [
            'No token to inflate — payouts come from a revenue-funded budget, so rewards can never outrun the business.',
            'Data-driven decisions — the AI economy agent uses real metrics, not guesswork, to propose adjustments.',
            'Human oversight — no automated system can change the economy without team approval.',
            'Transparent health monitoring — the economy health score is public, so you always know the state of the game.',
            'Revenue-backed payouts — the season budget is built from real platform revenue, not printed tokens.',
          ]},
          { type: 'heading', text: 'Designed for Sustainability' },
          { type: 'paragraph', text: 'The central banking system is designed to keep the Galavant economy healthy over months and years, not just weeks. By budgeting payouts against real revenue, monitoring risk indicators, and burning WATTS at every redemption, the platform aims to avoid the boom-and-bust cycles that have plagued other blockchain games.' },
          { type: 'paragraph', text: 'Combined with Galavant\'s many spending sinks (repair, leveling, upgrades, breeding, marketplace fees) and the seasonal redemption burn, the economy has both natural deflationary pressure and active management tools to maintain balance.' },
          { type: 'tip', text: 'The economy health score on the homepage gives you a real-time view of how things are going. A healthy economy means your earnings and assets hold their value over time.' },
        ],
      },
    ],
  },

  // ─── 9. Progression & Rewards ─────────────────────────────────
  {
    slug: 'progression',
    title: 'Progression & Rewards',
    icon: Trophy,
    pages: [
      {
        slug: 'loyalty-rewards',
        title: 'Loyalty Rewards',
        content: [
          { type: 'paragraph', text: 'Galavant rewards consistent players with earning bonuses through the loyalty system.' },
          { type: 'heading', text: 'Daily Streaks' },
          { type: 'list', items: [
            'Walk every day to build your activity streak.',
            'Longer streaks unlock higher earning multiplier tiers.',
            'There are three tiers: Bronze, Silver, and Gold — each with increasing bonuses.',
            'Missing two or more consecutive days resets your streak.',
          ]},
          { type: 'heading', text: 'Stacking With ENJ Staking' },
          { type: 'paragraph', text: 'Your streak bonus stacks with the earning boost from staked ENJ. They are separate systems — one rewards showing up every day, the other rewards long-term commitment — and they multiply together on every walk.' },
          { type: 'tip', text: 'A long daily streak combined with a steady ENJ stake is the strongest earning setup in the game. Consistency is key!' },
        ],
      },
      {
        slug: 'enj-staking',
        title: 'ENJ Staking',
        content: [
          { type: 'paragraph', text: 'Stake real ENJ in the Galavant Peloton nomination pool from your own Enjin Wallet and earn a permanent boost on everything you earn in the game. Your ENJ never leaves your wallet — you keep it and its on-chain staking yield; the in-game boost is a thank-you for staking with us.' },
          { type: 'heading', text: 'How it works' },
          { type: 'list', items: [
            'Link your Enjin Wallet in the app (Staking → Stake ENJ for a boost). Linking only reads your public address — it never moves funds.',
            'Stake ENJ into the Galavant Peloton pool from your wallet.',
            'Your earning boost appears in the app within about an hour and grows with the amount you stake.',
          ]},
          { type: 'heading', text: 'Why the boost rewards commitment' },
          { type: 'paragraph', text: 'Your boost is based on your average stake over the last two weeks, not a single moment. Staking a large amount for an instant and pulling it straight out does almost nothing — steady, committed stakers get the real reward.' },
          { type: 'heading', text: 'The bigger the stake, the bigger the boost' },
          { type: 'paragraph', text: 'The boost rises smoothly as you stake more, up to a maximum. Small stakes give a small boost; larger, longer-held stakes approach the cap. You always keep full control of your ENJ.' },
          { type: 'tip', text: 'You earn your normal on-chain staking rewards on top of the in-game boost — staking in the Galavant pool works exactly like staking anywhere else, it just also powers up your game.' },
        ],
      },
      {
        slug: 'social-rewards',
        title: 'Social Rewards',
        content: [
          { type: 'paragraph', text: 'Earn WATTS by engaging with Galavant on X (Twitter). Follow our account, like our posts, and retweet to earn rewards.' },
          { type: 'heading', text: 'Getting Started' },
          { type: 'list', items: [
            'Go to the Earn More page and link your X username.',
            'Follow @galavanteer to earn a one-time reward.',
            'Browse posted tweets and like or retweet them to earn additional rewards.',
          ]},
          { type: 'heading', text: 'How It Works' },
          { type: 'list', items: [
            'Each like and retweet on a Galavant tweet earns you WATTS.',
            'You can only earn once per action per tweet — no double-dipping.',
            'Likes and retweets are verified through the Twitter API before rewards are credited.',
            'The follow reward is a one-time bonus for following our account.',
          ]},
          { type: 'tip', text: 'Visit the Earn More page regularly — new tweets appear as they\'re posted, and each one is a fresh opportunity to earn WATTS!' },
        ],
      },
      {
        slug: 'leaderboards',
        title: 'Leaderboards',
        content: [
          { type: 'paragraph', text: 'Compete with other players on the Galavant leaderboards. Show off your walking prowess and earning power.' },
          { type: 'heading', text: 'Leaderboard Categories' },
          { type: 'table', headers: ['Category', 'What It Tracks'], rows: [
            ['Distance', 'Total distance covered while walking'],
            ['Earnings', 'Total WATTS earned from walking'],
          ]},
          { type: 'heading', text: 'Time Periods' },
          { type: 'list', items: [
            'Daily — resets every 24 hours.',
            'Weekly — resets every 7 days.',
            'All-Time — cumulative since you started playing.',
          ]},
          { type: 'paragraph', text: 'Leaderboards use privacy-friendly nicknames. Your real identity is never exposed to other players.' },
          { type: 'tip', text: 'Check the leaderboard from the home page to see where you rank. Daily leaderboards give everyone a fresh start each day!' },
        ],
      },
    ],
  },

  // ─── Daily Missions ──────────────────────────────────────────────────
  {
    slug: 'daily-missions',
    title: 'Daily Missions',
    icon: Trophy,
    pages: [
      {
        slug: 'how-it-works',
        title: 'How Missions Work',
        content: [
          { type: 'paragraph', text: 'Every day you receive 3 missions tailored to your current game state. Complete all 3 to unlock a Mission Chest filled with parts and WATTS.' },
          { type: 'heading', text: 'Mission Types' },
          { type: 'list', items: [
            'Engagement — walking goals like "Ride for 15 minutes" or "Walk 2 km".',
            'Sink — spending goals like "Repair a bike" or "Open a toolbox".',
            'Marketplace — trading goals like "List an item" or "Buy something".',
            'Progression — investment goals like "Socket a part" or "Start a level-up".',
          ]},
          { type: 'paragraph', text: 'Mission targets are scaled to your current capacity. If you have 10 energy, you might get "Ride for 5 minutes." If you have 80 energy, you might get "Ride for 30 minutes." The system also checks your inventory, bike milestones, socket availability, toolbox state, and live market conditions, so missions only appear when you have a real action to take right now, like an item you can list, a listing you can afford, or a toolbox you can actually open or speed-open. Bikes and loose parts that are already listed for sale do not count as ready-to-use mission resources until the listing ends.' },
          { type: 'heading', text: 'Mission Reroll' },
          { type: 'paragraph', text: 'Got a mission you can\'t complete? You can reroll one mission per day for free. Tap the reroll icon on any incomplete mission card to swap it for a new randomly-selected mission. The replacement follows the same rules — it\'ll be something you can actually do right now. Once you\'ve claimed your daily chest, rerolls are locked until tomorrow, and rapid repeat taps still only consume your normal daily allowance.' },
          { type: 'tip', text: 'One of your 3 daily missions can be highlighted as a Featured Mission by the live economy controls. It may come with a bonus indicator!' },
        ],
      },
      {
        slug: 'mission-chest',
        title: 'Mission Chest',
        content: [
          { type: 'paragraph', text: 'Complete all 3 missions to unlock a Mission Chest. The chest contains parts, a small WATTS bonus, and a rare chance at a minting tool.' },
          { type: 'heading', text: 'Chest Contents' },
          { type: 'list', items: [
            'Parts (guaranteed) — 1 or more parts to help you progress.',
            'WATTS (guaranteed) — a small WATTS bonus.',
            'Minting Tool (rare) — valuable tools used for breeding new bikes.',
          ]},
          { type: 'paragraph', text: 'Higher streak tiers increase chest quality — more parts, higher part levels, bigger WATTS bonuses, and better minting tool odds.' },
        ],
      },
      {
        slug: 'mission-streak',
        title: 'Mission Streak',
        content: [
          { type: 'paragraph', text: 'Complete all 3 missions every day to build a Mission Streak. Your streak locks in as soon as the third mission is finished, and the longer it gets, the better your chest rewards become.' },
          { type: 'heading', text: 'Streak Tiers' },
          { type: 'list', items: [
            'Iron (3 days) — small chest bonus.',
            'Bronze (7-30 days) — improved parts and tool chance.',
            'Silver (60-180 days) — significantly better rewards.',
            'Gold (365-730 days) — powerful chest upgrades.',
            'Diamond (1000+ days) — elite rewards and exclusive title.',
            'Legendary (2000+ days) — the ultimate tier, scaling infinitely.',
          ]},
          { type: 'heading', text: 'Streak Shields' },
          { type: 'paragraph', text: 'At major milestones (Silver II, Gold I, Gold III) you earn Streak Shields. A shield covers one missed day, so your streak can stay protected while you recover it on your next full mission clear. That protection is consumed as soon as it saves a missed day. You can bank up to 3 shields, and you can still claim an already-unlocked chest later without losing that day of streak progress.' },
          { type: 'tip', text: 'If you miss more than one day in a row, the streak is lost and your next full 3-mission clear starts a fresh run. A shield only covers the first missed day in that gap. The app also shows whether your streak is active, protected, or lost so you always know where you stand.' },
        ],
      },
    ],
  },
];

/** Replace fee percentages in text content blocks */
function replaceFeeInPage(page: GameplayPage, fee: number): GameplayPage {
  const feeStr = `${fee}%`;
  const needsUpdate = page.content.some((block) => {
    if (block.type === 'list') return block.items.some((item) => item.includes('5%'));
    if ('text' in block) return block.text.includes('5%');
    return false;
  });
  if (!needsUpdate) return page;

  return {
    ...page,
    content: page.content.map((block) => {
      if (block.type === 'list') {
        return { ...block, items: block.items.map((item) => item.replace(/5%/g, feeStr)) };
      }
      if ('text' in block && block.text.includes('5%')) {
        return { ...block, text: block.text.replace(/5%/g, feeStr) };
      }
      return block;
    }),
  };
}

/** Build sections with dynamic economy params (for runtime use) */
export function buildGameplaySections(params: GuideParams): GameplaySection[] {
  return gameplaySections.map((section) => {
    if (section.slug === 'walking-earning') {
      return {
        ...section,
        pages: section.pages.map((page) =>
          page.slug === 'energy' ? buildEnergyPage(params) : page,
        ),
      };
    }
    if (section.slug === 'bikes') {
      return {
        ...section,
        pages: section.pages.map((page) =>
          page.slug === 'bike-attributes' ? buildBikeAttributesPage(params) : page,
        ),
      };
    }
    if (section.slug === 'economy') {
      return {
        ...section,
        pages: section.pages.map((page) => replaceFeeInPage(page, params.platformTaxPercent)),
      };
    }
    return section;
  });
}

/** Flat list of all pages with section context for prev/next navigation */
export type FlatPage = {
  sectionSlug: string;
  sectionTitle: string;
  page: GameplayPage;
};

function toFlatPages(sections: GameplaySection[]): FlatPage[] {
  return sections.flatMap((s) =>
    s.pages.map((page) => ({
      sectionSlug: s.slug,
      sectionTitle: s.title,
      page,
    })),
  );
}

export const flatPages: FlatPage[] = toFlatPages(gameplaySections);

export function buildFlatPages(params: GuideParams): FlatPage[] {
  return toFlatPages(buildGameplaySections(params));
}
