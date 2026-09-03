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

/**
 * The fallback the static `gameplaySections` export is built from, used before the live values
 * arrive from `/economy/guide-params` (and forever, for the sidebar, which never waits on a
 * fetch).
 *
 * It holds only what the owner's decision of 2026-08-30 leaves publishable — verbatim: "no
 * gameplay metrics publishing which helps player perfect against the algorithm." Four numbers
 * that used to sit here are gone: the base WATTS a Common bike earns per minute, the HP decay per
 * minute, the wear decay per minute, and the base toolbox drop chance. Each was the numeric half
 * of a lever a player tunes against, and together they let anyone with a spreadsheet rank their
 * next stat point by expected value instead of playing. What survives is a ceiling and a clock a
 * player merely plans a day around, plus the platform fee — price information a seller needs
 * BEFORE committing to a sale, which is a decision rather than an optimisation.
 */
const DEFAULT_GUIDE_PARAMS: GuideParams = {
  maxEnergyCap: 200,
  energyRegenPercent: 25,
  energyRegenIntervalHours: 6,
  fullRechargeHours: 24,
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
        'If a refill lands while you\'re mid-session and out of energy, it\'s automatically credited to your ride — the session screen shows a banner when this happens. The "energy full" notification waits until your session ends.',
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

/**
 * Bike Attributes — the page the owner's 2026-08-30 decision hit hardest, and the reason it is a
 * plain constant now rather than a builder.
 *
 * It used to render four tables computed from live economy levers: Earning stat against a
 * multiplier and an example WATTS-per-minute figure, Luck against a drop chance per minute, and
 * Recovery and Durability against a decay percentage per minute plus how many minutes a full bar
 * therefore survives. Those tables did not merely mention the levers, they EXISTED to display
 * them — which is why the fix could not be to feed them different numbers. Four rows of
 * "stat → exact yield" is the whole input a player needs to compute the marginal value of the
 * next stat point and stop making a choice: the build with the highest number wins, every time,
 * for everyone, and the four attributes collapse into one correct answer.
 *
 * So each table is replaced by the qualitative claim it was decorating. A player still learns
 * WHICH WAY each attribute pushes — more Earning is more WATTS a minute, more Luck is more
 * toolboxes, more Recovery and more Durability is slower wear and longer between repairs — which
 * is everything the allocation decision actually needs. What they no longer get is the exchange
 * rate, and without it the choice goes back to being about how they want to play.
 *
 * Nothing here varies with the server any more, so the page takes no GuideParams and
 * buildGameplaySections no longer has to rebuild it. That is deliberate and load-bearing: a
 * builder still threading params through this page would be an open invitation to plug a fresh
 * lever back into a table.
 */
const bikeAttributesPage: GameplayPage = {
  slug: 'bike-attributes',
  title: 'Bike Attributes',
  content: [
    { type: 'paragraph', text: 'Each balance bike has four core attributes that affect different aspects of gameplay. Attributes come from three sources: base stats (rolled at creation), level-up points you allocate, and bonuses from socketed parts.' },
    { type: 'heading', text: 'Earning' },
    { type: 'paragraph', text: 'The WATTS you earn per minute of walking. A higher Earning attribute means every minute of a walk is worth more, and it is the most direct lever you have on your income — level-up points and socketed Earning parts both feed it, and a strong Earning part moves it more than anything else.' },
    { type: 'heading', text: 'Luck' },
    { type: 'paragraph', text: 'Improves your chances of receiving a toolbox drop each minute you walk, and increases the likelihood of higher-level toolboxes. The higher your Luck, the more often toolboxes fall and the better they tend to be — but drops stay a roll, never a schedule, and are never guaranteed to be a specific level.' },
    { type: 'heading', text: 'Recovery' },
    { type: 'paragraph', text: 'Slows down HP drain during walks, so a higher Recovery attribute means a full HP bar carries you through more walking before it needs attention and your repairs sit further apart. Each bike also has a one-time HP safety net that activates when HP gets critically low, fully restoring it — so new players won\'t lose their bike before they can find recovery parts.' },
    { type: 'heading', text: 'Durability' },
    { type: 'paragraph', text: 'Your bike\'s Durability stat slows down wear and tear. A bike that wears more slowly spends more time in peak condition — and a bike in peak condition earns at full rate. As your bike wears down through use, its Bike Condition drops, and your earnings progressively decrease until you repair it back to peak.' },
    { type: 'paragraph', text: 'Higher Durability also means faster repairs: a well-built bike is quicker to restore between sessions. Durability parts (the helmet-shaped pieces) are the single best way to boost this stat.' },
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
            'Go on-chain — mint bikes as NFTs to trade them, stake ENJ for a boost, and redeem WATTS for ENJ each season.',
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
      {
        slug: 'report-a-problem',
        title: 'Report a Problem',
        content: [
          { type: 'paragraph', text: 'Something broken, stuck or just wrong? Tell us. Reports go straight to the developers, and during the test month they are the whole point — a month of riding with nobody saying what broke teaches us nothing.' },
          { type: 'heading', text: 'Where to Find It' },
          { type: 'list', items: [
            'In the app: Player tab → Report a Problem.',
            'On the web: the "Report a Problem" link in the footer of every page.',
          ]},
          { type: 'heading', text: 'What to Write' },
          { type: 'paragraph', text: 'Just what happened, and what you were doing right before it happened. There is no form to fill in and nothing to categorise. Your app version, your device and any ride you had running are attached automatically, so you never have to describe them.' },
          { type: 'heading', text: 'The Reward' },
          { type: 'list', items: [
            'Your first report completes the "Report a problem" testing task, worth 100 WATTS.',
            'It pays once. Sending more reports does not pay more — we would rather have one useful report than twenty written for the reward.',
            'Reports are tied to your account so we can follow up. There is no anonymous option, and no reply arrives inside the app.',
          ]},
          { type: 'tip', text: 'Reporting the small annoyances is worth as much as reporting the crashes — those are the ones that never get found otherwise.' },
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
          { type: 'table', headers: ['Quality', 'In-App Name', 'Description'], rows: [
            ['Common', 'Steel', 'Standard bikes — a great starting point for new walkers.'],
            ['Uncommon', 'Moss', 'Slightly better stats and energy than Common.'],
            ['Rare', 'Blue Hour', 'Noticeably stronger — a solid mid-game bike.'],
            ['Epic', 'Orchid', 'Powerful bikes with excellent stats and energy.'],
            ['Legendary', 'Brass', 'The best of the best — maximum stats and energy potential.'],
          ]},
          { type: 'paragraph', text: 'In the app, quality tiers wear their material names — the gem tag on a bike or part reads Steel, Moss, Blue Hour, Orchid or Brass rather than the tier word.' },
          { type: 'tip', text: 'Higher quality bikes also amplify the bonuses from socketed parts, making them even more valuable at end-game.' },
        ],
      },
      bikeAttributesPage,
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
          { type: 'paragraph', text: 'Earning WATTS is the core loop of Galavant. Every minute you walk outdoors with an equipped balance bike, you earn WATTS. It comes down to two numbers and one check.' },
          { type: 'heading', text: 'Your Bike' },
          { type: 'paragraph', text: 'How much your bike is worth per minute right now. Three things set it, and you control all three.' },
          { type: 'list', items: [
            'Quality — a higher quality bike starts from a higher rate.',
            'Earning attribute — the biggest lever by far. Level-up points and socketed Earning parts both feed it, and a strong Earning part outweighs everything else in the game.',
            'Condition — a bike in peak condition earns its full rate. A worn bike earns less until you repair it.',
          ]},
          { type: 'heading', text: 'Your Bonus' },
          { type: 'paragraph', text: 'A single account-wide multiplier applied to everything you earn. It has two ingredients, and both reward sticking with the game rather than spending anything.' },
          { type: 'list', items: [
            'Loyalty — walking day after day, and holding what you earn instead of dumping it.',
            'ENJ staking — keeping ENJ staked in the Galavant pool, from your own wallet.',
          ]},
          { type: 'paragraph', text: 'Your bike rate multiplied by your bonus is your WATTS per minute. That is the whole formula.' },
          { type: 'heading', text: 'Does This Minute Count?' },
          { type: 'paragraph', text: 'Everything else is a yes-or-no check on the minute you just walked, not a number to optimise. A minute counts fully when you are inside your bike\'s speed zone with a clean GPS signal. Outside the speed zone, or with a weak signal, that minute counts for less or not at all — and a minute that does not count does not spend your energy either.' },
          { type: 'tip', text: 'Grow the Earning attribute first, keep your bike repaired, and walk every day. Those three habits beat every other optimisation combined.' },
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
            'Only movement at a human pace counts toward your distance. Stretches that would need a vehicle are left out of your totals, and the same fix is never counted twice.',
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
          { type: 'heading', text: 'Toolbox Slots' },
          { type: 'paragraph', text: 'Toolboxes sit in slots while they cool down, so the number of slots you have decides how many boxes you can have going at once. You start with a couple of free slots and can buy more with WATTS.' },
          { type: 'paragraph', text: 'You also earn extra slots automatically as your bike gets stronger: once your best bike\'s Earning power — from the bike itself plus any Earning parts socketed into it — is high enough, bonus slots unlock on their own, up to a limit. Building a genuinely powerful bike widens how much you can have cooling down at once, so your rewards keep pace with your riding.' },
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
          { type: 'paragraph', text: 'If a daily earning limit is in force and what you have left for the day is too small to cover a toolbox\'s opening cost, opening is blocked until the limit resets — you are never charged for a box whose WATTS reward that limit would swallow.' },
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
  /*
   * Restructured 2026-08-31 (second pass) so the section reads in ONE direction and matches
   * what the two clients actually do: what an NFT is here → where it lies → how it is made →
   * how it comes back → where it is traded → why you want the Enjin Wallet. The pages were
   * previously ordered around the wallet rather than the item, so a player met "linking is
   * read-only" before they had been told what an NFT is, and the freeze rule — the single fact
   * that explains every disabled button in the game — was buried inside Exporting.
   *
   * ONE CLAIM RETIRED IN THIS PASS, and it was actionable and wrong: "Not the bike you have
   * equipped. Switch to another one first." `POST /blockchain/mint-bike` (server
   * routes/blockchain.ts) has NO equipped guard — the claiming update sets `isEquipped: false`
   * itself. The guide was sending players to perform a step the server performs for them, and
   * an instruction nobody needs is indistinguishable from an instruction that failed.
   *
   * Claims retired in the previous pass and still gone: wallet-extension login and recovery
   * phrases (`/auth/connect` is a 410 stub; sign-in is Google), the per-token SWEEP to
   * self-custody (route, service and button removed 2026-08-30 — `sweepManagedWallet` survives
   * in enjin/platform-client.ts with no caller anywhere), a WATTS export fee
   * (`GET /blockchain/fees` returns 0 for both; a LEVEL FLOOR gates an export now), and any
   * withdrawal of ENJ out of the Galavant-run wallet.
   *
   * THREE THINGS THE COPY IS CAREFUL ABOUT, each one measured rather than assumed:
   *   • WHERE a thing happens. Export and import exist on the WEBSITE only — the app's Export
   *     button opens a dialog pointing at galavant.run (app/bike/[id].tsx) and there is no
   *     import call in the app at all. SELLING is not web-only: the app lists NFTs for WATTS or
   *     ENJ through the same ListingComposer. Saying "NFTs are a website thing" would be false
   *     in one direction and would hide the app's own sell button.
   *   • Buying an NFT for ENJ is REFUSED today (services/market.ts `canBuyHere: !isEnj`,
   *     `buyEnabled: false`). The text describes the route's SHAPE — the token changes hands
   *     and stays an NFT — while saying plainly that the button is not live here yet. It is
   *     written to survive the fix: when the buyer-signs path ships, one paragraph goes.
   *   • An NFT bought on the chain cannot be brought into the game. The import ENDPOINT already
   *     accepts a buyer's takeover (task 880b2130, by token id, chain-authorised), but the proof
   *     it demands is a positive balance in the caller's MANAGED wallet, and no endpoint exposes
   *     that wallet's address — so a buyer holding the token in their own wallet has nowhere to
   *     send it and no screen to claim from. "Not built yet" is the honest state.
   *
   * Quantities stay out (owner decision 2026-08-30): the export level floor and the settle
   * cooldown are tunables and are described, never numbered. The market cut is NOT duplicated
   * here — it has one table, in Economy → The Market, and two copies of a percentage is two
   * places for it to go stale.
   */
  {
    slug: 'nfts-wallet',
    title: 'NFTs & Wallet',
    icon: Coins,
    pages: [
      {
        slug: 'what-is-an-nft',
        title: 'NFTs in Galavant',
        content: [
          { type: 'paragraph', text: 'Galavant has two halves, and almost every question in this section is answered by knowing which one you are standing in.' },
          { type: 'table', headers: ['', 'In the game', 'On the chain'], rows: [
            ['Priced in', 'WATTS', 'ENJ'],
            ['Who signs', 'Nobody — you tap a button', 'You do, in your own Enjin Wallet'],
            ['Chain fees', 'There are none', 'Galavant pays for minting; importing costs your wallet a tiny network fee; listing for ENJ costs a fee plus a refundable deposit, held while the listing is live'],
            ['Where you do it', 'App and website', 'App or website to export, import, list and buy for ENJ; your Enjin Wallet approves each of those'],
          ]},
          { type: 'heading', text: 'What an NFT is here' },
          { type: 'paragraph', text: 'An NFT is one of your bikes or parts, minted as a token on the Enjin chain and placed straight into your own Enjin Wallet. It is not a copy of the item and not a certificate hanging beside it — it is the item, moved out of the game and onto the chain. One token per item, one item per token, never both at once.' },
          { type: 'heading', text: 'An NFT is frozen' },
          { type: 'paragraph', text: 'The moment an item is minted it freezes. It keeps the level and the stats it had at that second, and it cannot be ridden, levelled, repaired, socketed or upgraded for as long as the token exists.' },
          { type: 'paragraph', text: 'That is not a restriction bolted on afterwards — it is what makes the token worth anything. A buyer can see exactly what they are buying, and nothing about it can move behind their back while they own it.' },
          { type: 'paragraph', text: 'Two things still work on a frozen item: you can trade it on the chain, and you can import it. Importing burns the token and hands the item back to the game exactly as it was minted. Import is the only way back — nothing else unfreezes it.' },
          { type: 'tip', text: 'If a button has gone quiet on a bike or a part, check whether it is an NFT. The game answers the same way every time: import it back into the game before using it.' },
          { type: 'heading', text: 'Where each thing happens' },
          { type: 'list', items: [
            'Playing — levelling, repairs, socketing, breeding — happens in the app, all of it in WATTS, none of it signed by you.',
            'Selling works in the app and on the website for both halves: an in-game item is listed for WATTS, an NFT for ENJ. You set the price here and approve the listing in your Enjin Wallet. Buying an NFT works the same way: tap Buy, approve it in your wallet.',
            'Exporting and importing work in both — the app has Export and Import right on the bike.',
            'Anything paid for with money is on the website only. No card purchase happens inside the app.',
          ]},
        ],
      },
      {
        slug: 'wallets',
        title: 'Your Wallet',
        content: [
          { type: 'paragraph', text: 'You have one account and one wallet — your own Enjin Wallet. Galavant never runs a wallet for you and never holds a key of yours. That is worth two minutes, because it explains most of what follows.' },
          { type: 'heading', text: 'Signing in' },
          { type: 'list', items: [
            'Your account is created in the mobile app with Google sign-in. That is the only way to make one.',
            'The website uses the same Google sign-in and opens the same account — same bikes, same parts, same WATTS balance.',
            'There is no wallet login anywhere. No browser extension, no recovery phrase, nothing to type in. If the website says your Google account is not set up yet, sign in once in the app and come back.',
          ]},
          { type: 'heading', text: 'Your Enjin Wallet' },
          { type: 'paragraph', text: 'The Enjin Wallet is the app on your phone, and only you hold its keys. You link it to your account yourself, and linking is read-only: it tells Galavant your public address and nothing more. It never moves funds, and it is never a login.' },
          { type: 'paragraph', text: 'Everything that leaves the game goes to it, and everything that comes back in is signed from it. An NFT you export is minted straight into it. ENJ the game pays you — a season redemption — is sent to it. An NFT you import back is burned by a request you approve in it. There is nothing to move between wallets, because there is only the one.' },
          { type: 'heading', text: 'What needs the wallet and what does not' },
          { type: 'list', items: [
            'Playing needs no wallet at all. Walking, earning, levelling, repairing, breeding, toolboxes and the WATTS market never touch it.',
            'Exporting an NFT needs it — that is where the token is minted.',
            'Importing an NFT needs it — you approve the burn there, and it pays the small network fee.',
            'Cashing WATTS out for ENJ needs it — that is where the ENJ is paid. Without a linked wallet you cannot commit WATTS to a season.',
            'Staking needs it — you stake from it, and the game reads your stake from the chain.',
          ]},
          { type: 'tip', text: 'One rule covers it: everything you earn inside the game needs no wallet; everything that leaves the game needs the one you linked.' },
        ],
      },
      {
        slug: 'exporting-bikes',
        title: 'Exporting: Minting an NFT',
        content: [
          { type: 'paragraph', text: 'Bikes and parts you buy, earn or breed are ordinary in-game items. Exporting one mints it as an NFT on the Enjin chain, straight into your own Enjin Wallet — which is what lets it be traded for real ENJ, and what freezes it.' },
          { type: 'heading', text: 'Where you do it' },
          { type: 'paragraph', text: 'In the app: open the bike and tap Export. On the website: sign in at galavant.run with the same Google account, open Profile, scroll to your inventory, tap a bike and choose Export to Wallet; tap a part and choose Export as NFT. Parts are exported on the website.' },
          { type: 'heading', text: 'What the item needs first' },
          { type: 'list', items: [
            'A linked Enjin Wallet. The NFT is minted into it, so without one there is nowhere to mint to.',
            'Fully healed — full HP and full durability — so no worn item is ever minted.',
            'At or above a minimum level. Starter bikes and dust-level parts cannot be exported; the floor keeps the collection from filling up with them.',
            'No unpaid servicing. Settle a bike\'s maintenance before it leaves.',
            'Nothing in flight: not listed on the market, not mid level-up, and not in a ride you have not finished.',
            'A part has to be out of its bike. Unsocket it first.',
          ]},
          { type: 'paragraph', text: 'Equip a different bike first: the export button stays disabled while a bike is the one you are riding. Exporting costs no WATTS and needs no signature from you — Galavant mints the token and pays for the chain write.' },
          { type: 'heading', text: 'What changes the moment it is minted' },
          { type: 'list', items: [
            'The item stops being playable and moves to the on-chain part of your inventory, still yours, with its token number — and it is sitting in your Enjin Wallet, where any wallet app or marketplace can see it.',
            'A bike no longer counts toward your maximum energy — exporting lowers your cap, importing puts it back.',
            'Parts stay socketed in an exported bike and pause with it. Take them out any time to use them on another bike.',
            'Trading is the one thing that still works — on the chain, from your wallet. The game market does not list NFTs.',
          ]},
          { type: 'tip', text: 'Export in order to trade, not in order to keep: a frozen bike earns nothing. If you just want it back in the game later, that is what Import is for.' },
        ],
      },
      {
        slug: 'importing-bikes',
        title: 'Importing: Bringing It Back',
        content: [
          { type: 'paragraph', text: 'Importing turns an NFT back into a playable item, and it is the only thing that does. Nothing else unfreezes it, so this is always the first step before you use the item for anything.' },
          { type: 'heading', text: 'How importing works' },
          { type: 'list', items: [
            'On the website, open Profile and find the item — exported bikes and exported parts each sit in their own on-chain group. Tap it and choose Import to Game. In the app, open the bike and use Import.',
            'Galavant asks the chain that the token is in your linked wallet, then sends a burn request to your Enjin Wallet.',
            'Open the Enjin Wallet on your phone — Settings, then Connected Apps — and approve the request. The burn is signed by you, and your wallet pays the small network fee for it — a fraction of a cent in ENJ, so keep a little ENJ in the wallet.',
            'The token is burned — destroyed on-chain, permanently — and the item comes back exactly as it was minted: same level, same stats, full condition. The screen updates on its own once the chain confirms; you can close it and come back.',
            'It is fully playable again. Equip it, socket parts, level it, start walking. A bike puts your maximum energy back up too.',
          ]},
          { type: 'paragraph', text: 'The burn is one-way for that token, but the item is not: you can export it again later whenever you want to trade it.' },
          { type: 'heading', text: 'An NFT you bought or were sent' },
          { type: 'paragraph', text: 'A Galavant NFT that arrives in your Enjin Wallet from anywhere — a marketplace purchase, a gift, a trade — is already where it needs to be. Open Profile on the website, or the Vault tab in the app, and it shows under NFTs in your wallet. Claim it the same way: approve the burn in your wallet, and the item lands in your inventory with the level and stats it was minted with. Any parts that were fitted stay with the previous owner, so it arrives bare.' },
        ],
      },
      {
        slug: 'selling-nfts',
        title: 'Trading NFTs',
        content: [
          { type: 'paragraph', text: 'There are two markets, and which one you use depends on whether the item is in the game or on the chain.' },
          { type: 'table', headers: ['The item is', 'Where it sells', 'Priced in', 'What the buyer gets'], rows: [
            ['In the game', 'The Galavant market, app or website', 'WATTS', 'An ordinary in-game item, right away'],
            ['An NFT in your wallet', 'The Galavant market, app or website — approved in your Enjin Wallet', 'ENJ', 'The NFT itself — frozen until they import it'],
          ]},
          { type: 'heading', text: 'Selling an NFT for ENJ' },
          { type: 'paragraph', text: 'An exported item is in your Enjin Wallet, and you list it from the game: open the item, choose Sell, and set a price in ENJ. The listing request then appears in your Enjin Wallet — approve it there, and the chain puts the listing up a short while later. Your wallet pays a small network fee and holds a refundable deposit while the listing is live, so keep a little ENJ in it. Galavant never touches the token. The buyer pays you directly, on the chain, and the token moves to their wallet — frozen, exactly as it was minted, until they import it into their own game.' },
          { type: 'paragraph', text: 'Cancelling works the same way: ask for it in the game, approve it in your wallet, and the item is back in your inventory once the chain confirms. A listing you cancel straight from your wallet or an Enjin marketplace comes back the same way — the game checks the chain, not the button you pressed.' },
          { type: 'paragraph', text: 'Every Galavant NFT carries a small royalty for the game on each sale, applied by the chain itself. It is the same on any marketplace, and it is what funds the season pot alongside the game\'s other revenue.' },
          { type: 'heading', text: 'Selling an NFT for WATTS' },
          { type: 'paragraph', text: 'An NFT is priced in ENJ. If you would rather sell to another player for WATTS, import the item first — it becomes an ordinary in-game item again — and list it on the game market like anything else you own. The buyer gets a normal item, and the token is gone.' },
          { type: 'heading', text: 'Buying' },
          { type: 'list', items: [
            'In-game items are bought on the Galavant market with WATTS, in the app or on the website. Browse by type, quality, and price.',
            'Galavant NFTs are bought with ENJ right on the game market, in the app or on the website: tap Buy, then approve the purchase in your Enjin Wallet, which pays the price and a small network fee. The NFT lands in your wallet and shows in your Items as a frozen NFT — Importing tells you how to bring it into the game.',
          ]},
          { type: 'tip', text: 'Check Mint Scores when buying bikes — a high grade at a low price is a great find!' },
        ],
      },
      {
        slug: 'part-nfts',
        title: 'Part NFTs',
        content: [
          { type: 'paragraph', text: 'Parts can be NFTs too, and they follow the same model as bikes. A part is either an ordinary in-game part or its own on-chain NFT, never both, and a part is never sold inside a bike.' },
          { type: 'heading', text: 'Exporting a part' },
          { type: 'list', items: [
            'On the website: Profile, then your parts inventory, then the part, then Export as NFT. It is minted into your linked Enjin Wallet.',
            'It must be unsocketed and not listed — take it out of its bike first.',
            'It must be at or above a minimum level. Dust-level parts stay off the chain.',
            'No WATTS fee. Galavant pays for the chain write.',
          ]},
          { type: 'heading', text: 'While a part is an NFT' },
          { type: 'paragraph', text: 'Everything you would normally do with the part is paused until you import it back. An NFT part cannot be socketed into a bike, fed into an upgrade, or burned to repair a bike\'s HP. Trading it on the chain is the exception — that works from your wallet.' },
          { type: 'paragraph', text: 'Importing works exactly as it does for a bike: open the part on your Profile, choose Import to Game, and approve the burn in your Enjin Wallet. The token is burned and the part comes back at the level it was minted at, ready to socket and upgrade again.' },
          { type: 'heading', text: 'Selling parts' },
          { type: 'paragraph', text: 'Part NFTs are listed for ENJ like bikes: set the price in the game, approve the listing in your Enjin Wallet. To sell one for WATTS, import it first. Everything on the previous page applies here.' },
          { type: 'tip', text: 'High-level parts are the ones worth exporting — a top-tier part took a lot of upgrades to make, and the level floor is there to keep the cheap ones out.' },
        ],
      },
      {
        slug: 'enjin-wallet',
        title: 'Get the Enjin Wallet',
        content: [
          { type: 'paragraph', text: 'The Enjin Wallet is a free app from Enjin, the chain Galavant\'s NFTs live on. Galavant does not build it and cannot see inside it. Download it from enjin.io/products/wallet, or search for "Enjin Wallet" in your phone\'s app store.' },
          { type: 'paragraph', text: 'Get it before you need it. It is the wallet that does your signing, and every step below waits on it.' },
          { type: 'heading', text: 'What you need it for' },
          { type: 'list', items: [
            'Signing. Anything that happens on the chain in your name is approved in your wallet, not by us. That is the point of holding your own keys.',
            'Staking ENJ. You stake in the Galavant Peloton pool from the app or from the pool page, and approve it in your own wallet — Galavant never holds your ENJ.',
            'Holding your own ENJ. Once a wallet is linked, your account page shows what is in it and what you have staked.',
            'Holding the NFTs you export, approving the listings you create for them, and buying Galavant NFTs on the Enjin marketplace. A Galavant NFT in your wallet can be claimed into the game from Profile — read Importing.',
            'Looking at Galavant NFTs from outside the game. Every token points at its own live stat sheet, so a bike renders the same in a wallet or on a marketplace as it does here.',
          ]},
          { type: 'heading', text: 'What you do NOT need it for' },
          { type: 'list', items: [
            'Logging in. Galavant is Google sign-in, in the app and on the web.',
            'Playing. Everything in the game is priced in WATTS. You never need crypto to walk, earn, level, repair, breed or trade in-game items.',
          ]},
          { type: 'heading', text: 'Linking it, step by step' },
          { type: 'paragraph', text: 'Linking works the same way in both places: Galavant hands out a one-time code and your wallet approves it.' },
          { type: 'list', items: [
            'In the mobile app: open the Wallet tab and tap LINK WALLET, or use the same button on the You tab. The Enjin Wallet app opens on the request — approve it there, and the screen updates itself.',
            'On the website: open your account page, find ENJ Staking and press Link Enjin Wallet.',
            'The website hides the code behind a Show code button. Reveal it, then scan the QR square with the Enjin Wallet app or type the digits into it — the square and the digits are the same secret.',
            'Approve the request in Enjin Wallet. The page notices by itself; there is nothing to paste back.',
          ]},
          // On desktop the deep link has no app to hand off to and lands on Enjin's download
          // page, which reads as a broken button (EnjStakingSection.tsx). Say so before it
          // happens.
          { type: 'paragraph', text: 'On a desktop there is no wallet app for the link to open, so the QR square is the way in — scan it with the phone your wallet lives on. The code expires, and the website counts the time down for you; if it runs out, start again for a fresh one.' },
          { type: 'heading', text: 'Approving a request' },
          { type: 'paragraph', text: 'When Galavant needs your signature it creates a request instead of signing for you — importing an NFT is the one that does this. Open the Enjin Wallet on your phone, go to Settings, then Connected Apps, and you will find it waiting there. Check what it says, approve it, and the Galavant screen updates on its own. Nothing happens on our side until you do.' },
          { type: 'paragraph', text: 'Staking is not one of those requests. You do it in the pool yourself, and there is nothing waiting in Connected Apps for it.' },
          { type: 'paragraph', text: 'One wallet per account and one account per wallet. You can unlink whenever you like: your ENJ, your stake and everything else in the wallet stay exactly where they are — only the connection goes, and your staking bonus stops until you link again.' },
          { type: 'tip', text: 'Treat the linking code like a one-time password. Anyone who photographs it — over your shoulder, on a shared screen — can attach their own wallet to your account and take the one link slot. Reveal it only when you are ready to scan.' },
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
            // "never in ours" was false in both directions: redemption payouts and the
            // proceeds of an ENJ sale are paid to the Galavant-run managed wallet
            // (server services/redemption.ts, services/nft-marketplace.ts listForEnj).
            'The native token of the Enjin blockchain. ENJ you stake stays in your own wallet; ENJ the game pays you arrives in the wallet Galavant runs (see NFTs & Wallet → Your Two Wallets).',
            'Stake it in the Galavant pool for a permanent earning boost (see Progression → ENJ Staking).',
            'Buy and sell NFT bikes with it on Enjin marketplaces.',
            'Receive it when you redeem WATTS at the end of a season.',
          ]},
          { type: 'heading', text: 'The Seasonal Redemption Window' },
          { type: 'paragraph', text: 'This is how your walking turns into real value. Galavant runs in seasons. Each season, a share of the platform\'s revenue is set aside as an ENJ prize budget. When the season closes, a redemption window opens: burn your Earned WATTS and receive a slice of that budget.' },
          { type: 'list', items: [
            'Your share is proportional — the more Earned WATTS you burn relative to everyone else, the larger your slice of that season\'s budget.',
            'The rate floats. It is never fixed in advance, because it depends on the budget that season and how much WATTS the whole player base redeems.',
            'Timing counts. WATTS committed early in a window weigh more than the same WATTS committed just before it closes, so there is no reward for waiting to see what everyone else does.',
            'WATTS you burn is gone for good. That burn is what keeps the currency from inflating away.',
          ]},
          { type: 'tip', text: 'You are never forced to redeem. WATTS keeps its full value inside the game, and plenty of players will simply keep spending it on better bikes and parts.' },
          { type: 'heading', text: 'Why Not Just Mint a Token?' },
          { type: 'paragraph', text: 'Most move-to-earn games mint their own token and let players cash out of it freely. Supply grows faster than demand, the price falls, and the reward loop dies. Galavant deliberately does not do this. There is no Galavant token to inflate — payouts come out of a budget funded by real revenue, so the game can only pay out what it has actually earned.' },
        ],
      },
      {
        slug: 'marketplace',
        title: 'The Market',
        content: [
          { type: 'paragraph', text: 'There is one market. Everything players own is on the same shelf — in-game bikes, parts and minting tools, and on-chain NFT bikes and parts. The item is the item; what changes is the currency the seller chose.' },
          { type: 'heading', text: 'Selling' },
          { type: 'paragraph', text: 'Pick the item, pick the currency. You always set the price yourself, in WATTS or in ENJ. WATTS is open to everything you own; ENJ is only for items that are already NFTs, because an ENJ sale hands the buyer a token.' },
          { type: 'list', items: [
            'List any bike, part, or minting tool for a WATTS price you choose.',
            'An NFT can be listed for WATTS or for ENJ — being an NFT never stops you selling it.',
            'Bikes must be at 100% durability to be listed — repair first if needed. NFTs are exempt: their condition is frozen at mint.',
            'Listed bikes stay visible in your inventory, but bike-management actions stay locked until the listing is sold or cancelled.',
            'Listed parts stay visible too, but missions only count loose, unlisted parts and unlisted bikes as ready-to-use resources.',
            'You can have up to 20 active listings at once.',
            'Cancel listings to get your item back. Listings tied to a daily mission may have a short cooldown before they can be cancelled.',
          ]},
          { type: 'heading', text: 'What the sale costs you' },
          { type: 'paragraph', text: 'You set the price; the only thing that differs between the two currencies is our cut, and it is shown on the listing screen before you commit.' },
          { type: 'table', headers: ['Selling', 'Our cut'], rows: [
            ['An in-game item for WATTS', '5% platform fee'],
            ['An NFT for ENJ', '5% royalty only, no platform fee'],
          ]},
          { type: 'paragraph', text: 'Selling for ENJ is deliberately the cheaper route. It leaves the NFT alive on-chain, where it can be traded on again; importing it and selling for WATTS ends the token for good.' },
          { type: 'heading', text: 'Listing for ENJ: what your wallet pays' },
          // Verbatim from ENJ_LISTING_DEPOSIT_WARNING (@m2e/shared utils/market.ts), which is
          // the one definition the app and the listing screen also render. Kept word for word
          // so the guide cannot drift away from the sentence the seller sees at the moment of
          // the decision — and it names no amount, per the economy-secrets rule.
          { type: 'paragraph', text: 'Listing an NFT for ENJ is signed in your Enjin Wallet. Your wallet pays a small network fee and holds a refundable deposit while the listing is live — keep a little ENJ in it, or the listing cannot be created. The deposit comes back to your wallet when the listing sells or is cancelled. Listing for WATTS costs you nothing up front.' },
          { type: 'heading', text: 'Buying' },
          { type: 'paragraph', text: 'Every card says what you will actually walk away with, because there are three different purchases on the same shelf.' },
          { type: 'table', headers: ['You buy', 'What happens', 'You receive'], rows: [
            ['An in-game item for WATTS', 'Ownership transfers instantly', 'A normal in-game item'],
            ['An NFT for ENJ', 'The NFT changes hands on-chain', 'An NFT — frozen until you import it'],
          ]},
          { type: 'list', items: [
            'Browse listings by type, quality, and price.',
            'A WATTS purchase is instant. Buying an NFT for WATTS takes a moment longer while the token is burned on-chain, then the item appears in your inventory.',
            'ENJ purchases cannot be paid from inside Galavant yet — an ENJ sale has to be signed from your own Enjin wallet, and that step is still being built. The listing is live on-chain in the meantime, so it can be filled from a wallet or marketplace that talks to the chain directly. Each ENJ card explains this where the buy button would be.',
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
            ['Staking Rewards', 'Earning boost and extra energy from staked ENJ', 'To calibrate how much staking commitment is rewarded'],
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
          { type: 'paragraph', text: 'Loyalty is the free half of your account bonus. It costs nothing to build — it only asks that you keep showing up.' },
          { type: 'heading', text: 'Two Ways to Earn It' },
          { type: 'list', items: [
            'Walk every day. Consecutive days build a streak, and longer streaks move you up through Bronze, Silver and Gold. Miss a couple of days in a row and the streak starts over.',
            'Hold what you earn. Selling a large share of your recent WATTS to other players trims this part of the bonus; holding it keeps the bonus at full strength.',
          ]},
          { type: 'paragraph', text: 'Both feed one number. Redeeming WATTS at the end of a season is not selling and never costs you loyalty.' },
          { type: 'heading', text: 'How It Fits With Staking' },
          { type: 'paragraph', text: 'Loyalty and ENJ staking are the only two things in your account bonus. Loyalty is earned by playing, staking is earned by committing — together they form the single multiplier applied to every walk.' },
          { type: 'tip', text: 'A long daily streak is the cheapest earning upgrade in the game. It costs nothing but turning up.' },
        ],
      },
      {
        slug: 'enj-staking',
        title: 'ENJ Staking',
        content: [
          { type: 'paragraph', text: 'Staking is the optional half of your account bonus. Stake ENJ in the Galavant Peloton nomination pool from your own Enjin Wallet, and the game rewards you for it. Your ENJ never leaves your wallet and never enters ours — the stake is made in the pool, by you, and we only read the result.' },
          { type: 'heading', text: 'The short version' },
          { type: 'list', items: [
            'You keep your ENJ, and you keep the normal on-chain staking rewards it already pays you.',
            'Galavant adds an in-game bonus on top, as a thank-you for staking with our pool.',
            'Stake more, get more. Stay staked, get more. That is the entire rule.',
          ]},
          { type: 'heading', text: 'Setting it up' },
          { type: 'list', items: [
            'Link your Enjin Wallet under Staking → Stake ENJ, in the app or in your account on the website. Linking only reads your public address — it never moves funds.',
            'On that screen, enter how much ENJ to stake and approve the request in your Enjin Wallet — the ENJ has to be on the Relaychain side of your wallet. Or open the Galavant Peloton pool page and stake there. You choose the amount and you sign it either way.',
            'Your bonus appears on its own within an hour or so and then keeps building. There is nothing to claim and nothing to confirm — we read the pool from the chain and find your stake there.',
          ]},
          { type: 'heading', text: 'Why it takes a while to build' },
          { type: 'paragraph', text: 'Your bonus is based on how much you have had staked over recent weeks, not on what is in the pool at this instant. Staking a large amount and pulling it straight back out does almost nothing. If you have just staked, expect the bonus to keep climbing for a while before it settles — that is the system recognising that you actually stayed.' },
          { type: 'heading', text: 'What it gets you' },
          { type: 'list', items: [
            'A bigger multiplier on every walk.',
            'A little more daily energy, so you can walk longer before running out.',
            'A tier badge that goes up as your stake does.',
          ]},
          { type: 'paragraph', text: 'One thing staking does not do: it does not enlarge your slice of the seasonal redemption pot. The boost is already paid to you while you ride — you earn more WATTS per walk — so it is not applied a second time when you cash those WATTS out. Stake for the earning bonus and the energy, not for a better redemption rate.' },
          { type: 'tip', text: 'Staking is never required. You can reach the top of the game without it — it rewards players who want to back the pool as well as ride for it. Staking does carry the usual on-chain risks, which are spelled out on the staking screen before you commit.' },
        ],
      },
      {
        slug: 'redeeming-watts',
        title: 'Cashing Out — WATTS → ENJ',
        content: [
          { type: 'paragraph', text: 'Each season, a WATTS → ENJ redemption window opens. It is how you turn the WATTS you earn into real ENJ — funded by a share of the game\'s actual revenue, not a printed token.' },
          { type: 'heading', text: 'Where the ENJ comes from' },
          { type: 'paragraph', text: 'The pot is never printed out of thin air. It is assembled from money the game actually takes in each season — a share of real revenue (like premium purchases and the pool\'s staking commission) — and, when the studio chooses, a slice of the studio\'s own staking rewards on top. Because it is funded by real income, the game only ever pays out what it has genuinely earned.' },
          { type: 'heading', text: 'How it works' },
          { type: 'paragraph', text: 'Three simple steps: you commit WATTS, your commitment is weighed (the earlier in the window, the heavier it counts), and the pot is split.' },
          { type: 'list', items: [
            'Link your Enjin Wallet first. The ENJ is paid to it, and the game will not take WATTS it cannot pay out for.',
            'When a window is open, choose how much WATTS to put in. Those WATTS are spent — they leave your balance for good.',
            'Commit early. The same WATTS are worth the most on the day a window opens and steadily less as the closing time approaches, so an early commitment beats an identical one made at the end.',
            'Every window has a published closing time, and it is a real deadline: the moment it passes, no further WATTS can be committed. There is no grace period, so do not leave it to the last minute.',
            'When the window closes, a real ENJ budget is split among everyone who entered. Your share depends on how much you put in compared to everyone else.',
            'Your ENJ is sent to your linked Enjin Wallet — the one you own. That is also why you need a linked wallet before you can commit: without an address to pay, there is nothing to commit to.',
          ]},
          { type: 'paragraph', text: 'Between the close and the payout you can still see the season and what you committed — your estimated share is final at that point, because nobody can add to the pool any more. The payout runs on its own shortly after the window closes; you do not need to do anything.' },
          { type: 'heading', text: 'There is no fixed exchange rate' },
          { type: 'paragraph', text: 'You are not swapping at a set price — you are claiming a slice of a real budget. The bigger the budget (the more the game earns), and the more you put in relative to others, the more ENJ you receive. How early you commit counts too: staking ENJ does not change your share, but committing sooner does.' },
          { type: 'heading', text: 'A quick example' },
          { type: 'paragraph', text: 'Say the season pot is 500 ENJ and three players enter on the same day: one commits 1,000 WATTS, one 3,000, and one 6,000 — 10,000 in total. They split the pot in proportion to what they put in: roughly 10%, 30% and 60% — about 50, 150 and 300 ENJ. If a new player joins and commits more, everyone else\'s slice gets a little thinner, because the pot is fixed. Now change one thing: if the player with 6,000 waits until just before the window shuts while the others commit on day one, their late WATTS carry less weight and their slice shrinks accordingly. Same WATTS, later, smaller share.' },
          { type: 'tip', text: 'The redemption pot is funded by real revenue, so the game only ever pays out what it has actually earned — that is what keeps the economy sustainable.' },
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
    // The 'bikes' section is deliberately absent from this list. Bike Attributes used to be
    // rebuilt here from the live economy levers; since the owner's 2026-08-30 decision it is a
    // static page (see bikeAttributesPage) and there is nothing left for the server to fill in.
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
