import type { ComponentType, SVGProps } from 'react';
import {
  Flag, SpeedFast, Gamepad, Sparkle, Coins,
  ChartBarBig, Trophy, ToolCase,
} from 'pixelarticons/react';

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
          { type: 'paragraph', text: 'Galavant is a walk-to-earn game built on Bitcoin. Grab a balance bike, head outdoors, and earn Satoshi Activity Points (SAP) just by walking. Convert them into real value on the blockchain.' },
          { type: 'heading', text: 'How It Works' },
          { type: 'list', items: [
            'Get a balance bike — purchase one from the marketplace or breed a new one.',
            'Walk outdoors — the app tracks your real-world movement via GPS.',
            'Earn SAP — every minute of walking earns you SAP based on your bike and stats.',
            'Level up — improve your bike, socket parts, and climb the leaderboards.',
            'Go on-chain — convert SAP into SAT tokens (an OP_20 token on Bitcoin) and swap for BTC.',
          ]},
          { type: 'tip', text: 'Galavant runs entirely on Bitcoin Layer 1 via the OPNet protocol. Your bikes and tokens are real on-chain assets.' },
          { type: 'heading', text: 'What Makes Galavant Different' },
          { type: 'paragraph', text: 'Unlike other move-to-earn games, Galavant is built natively on Bitcoin — not a sidechain or L2. Your NFTs and tokens live on the most secure blockchain in the world. The game uses balance bikes — you walk with them, not pedal. It\'s designed for casual walkers and power walkers alike, with a sustainable economy that rewards genuine outdoor activity.' },
        ],
      },
      {
        slug: 'your-first-walk',
        title: 'Your First Walk',
        content: [
          { type: 'paragraph', text: 'Ready to start earning? Here\'s how to go from zero to your first SAT in just a few minutes.' },
          { type: 'heading', text: 'Step by Step' },
          { type: 'list', items: [
            'Open the Galavant app and create your wallet.',
            'Get your first balance bike — check the marketplace or receive one from a friend.',
            'Equip your bike from the inventory screen.',
            'Tap the "Walk" button to start a session.',
            'Head outside and walk at a pace that matches your bike type.',
            'When you\'re done, stop the session and collect your SAT earnings!',
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
          { type: 'paragraph', text: 'Every balance bike has a quality tier that determines its overall power. Higher quality bikes have better base stats, earn more SAT, and contribute more daily energy.' },
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
      {
        slug: 'bike-attributes',
        title: 'Bike Attributes',
        content: [
          { type: 'paragraph', text: 'Each balance bike has four core attributes that affect different aspects of gameplay. Attributes come from three sources: base stats (rolled at creation), level-up points you allocate, and bonuses from socketed parts.' },
          { type: 'heading', text: 'Earning' },
          { type: 'paragraph', text: 'Increases the SAT you earn per minute of walking. Every 100 points of Earning doubles your base rate.' },
          { type: 'table', headers: ['Total Earning', 'Multiplier', 'Example (Common bike)'], rows: [
            ['0', '1.00x', '5.0 SAP/min'],
            ['10', '1.10x', '5.5 SAP/min'],
            ['50', '1.50x', '7.5 SAP/min'],
            ['100', '2.00x', '10.0 SAP/min'],
            ['200', '3.00x', '15.0 SAP/min'],
          ]},
          { type: 'heading', text: 'Luck' },
          { type: 'paragraph', text: 'Improves your chances of receiving a toolbox drop each minute you walk, and increases the likelihood of higher-level toolboxes. Higher Luck means better odds, but drops are never guaranteed to be a specific level.' },
          { type: 'table', headers: ['Total Luck', 'Drop Chance per Minute'], rows: [
            ['0', '2%'],
            ['10', '5%'],
            ['50', '17%'],
            ['100', '32%'],
          ]},
          { type: 'heading', text: 'Recovery' },
          { type: 'paragraph', text: 'Slows down HP drain during walks so you can go longer between repairs.' },
          { type: 'table', headers: ['Total Recovery', 'HP Decay/min', 'Full HP Lasts'], rows: [
            ['0', '0.50%', '~200 min'],
            ['10', '0.45%', '~220 min'],
            ['50', '0.33%', '~300 min'],
            ['100', '0.25%', '~400 min'],
          ]},
          { type: 'heading', text: 'Durability' },
          { type: 'paragraph', text: 'Slows down wear and tear on your bike, reducing maintenance costs over time.' },
          { type: 'table', headers: ['Total Durability', 'Wear Decay/min', 'Full Durability Lasts'], rows: [
            ['0', '0.80%', '~125 min'],
            ['10', '0.73%', '~137 min'],
            ['50', '0.53%', '~188 min'],
            ['100', '0.40%', '~250 min'],
          ]},
          { type: 'divider' },
          { type: 'paragraph', text: 'When your bike levels up, you receive stat points that you can allocate to any of these four attributes. Choose wisely based on your playstyle!' },
          { type: 'heading', text: 'Tips for Stat Allocation' },
          { type: 'list', items: [
            'Earning-focused builds maximize short-term SAT income.',
            'Luck builds aim for valuable toolbox drops.',
            'Recovery and Durability builds reduce ongoing costs and let you walk more efficiently.',
            'A balanced build works well for casual players.',
          ]},
        ],
      },
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
            'You can spend SAT to boost and skip the wait time.',
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
          { type: 'paragraph', text: 'Earning SAP is the core loop of Galavant. Every minute you walk outdoors with an equipped balance bike, you earn SAP. The amount depends on several factors.' },
          { type: 'heading', text: 'What Affects Your Earnings' },
          { type: 'list', items: [
            'Bike quality — higher quality bikes have better earning potential.',
            'Earning attribute — more points in Earning = more SAP per minute.',
            'Bike level — higher level bikes earn more.',
            'Speed matching — staying in your bike\'s optimal speed zone maximizes earnings.',
            'GPS signal quality — poor signal reduces earnings.',
            'Loyalty bonuses — daily streaks and token holding boost your earnings.',
          ]},
          { type: 'tip', text: 'Focus on building a strong Earning attribute and walking consistently within your bike\'s speed zone for the best results.' },
        ],
      },
      {
        slug: 'energy',
        title: 'Energy',
        content: [
          { type: 'paragraph', text: 'Energy determines how many minutes you can earn per day. Without energy, you can still walk, but you won\'t earn SAT.' },
          { type: 'heading', text: 'Energy Basics' },
          { type: 'list', items: [
            'Energy is measured in minutes of earning time.',
            'It refills 25% every 6 hours — a full refill takes 24 hours.',
            'Your total energy pool depends on how many bikes you own and their quality.',
            'The maximum energy cap is 100 minutes per day.',
            'Only bikes with HP remaining contribute to your energy pool.',
          ]},
          { type: 'heading', text: 'Base Energy by Bike Count' },
          { type: 'paragraph', text: 'Your base energy grows as you collect more bikes. At key thresholds your base energy jumps up, and between thresholds it scales smoothly.' },
          { type: 'table', headers: ['Bikes Owned', 'Base Energy'], rows: [
            ['1', '10 min'],
            ['3', '20 min'],
            ['5', '35 min'],
            ['9', '50 min'],
            ['15', '75 min'],
            ['30', '100 min'],
          ]},
          { type: 'chart', title: 'Base Energy by Bike Count', unit: ' min', bars: [
            { label: '1 bike', value: 10 },
            { label: '2 bikes', value: 15 },
            { label: '3 bikes', value: 20 },
            { label: '5 bikes', value: 35 },
            { label: '7 bikes', value: 42 },
            { label: '9 bikes', value: 50 },
            { label: '12 bikes', value: 62 },
            { label: '15 bikes', value: 75 },
            { label: '20 bikes', value: 83 },
            { label: '30 bikes', value: 100, accent: true },
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
          { type: 'paragraph', text: 'Your total energy = base energy from bike count + quality bonus from each bike, capped at 100 minutes.' },
          { type: 'chart', title: 'Energy by Collection', unit: ' min', bars: [
            { label: '1 Common', value: 10 },
            { label: '1 Legendary', value: 22 },
            { label: '3 Common', value: 20 },
            { label: '3 Legendary', value: 56 },
            { label: '5 Rare', value: 60 },
            { label: '5 Legendary', value: 95, accent: true },
            { label: '6+ Legendary', value: 100, accent: true },
          ]},
          { type: 'tip', text: 'Collecting more bikes is the best way to increase your energy. Higher quality bikes add extra energy per bike — for example, 3 Legendary bikes give you 56 minutes compared to just 20 for 3 Common bikes.' },
        ],
      },
      {
        slug: 'speed-matching',
        title: 'Speed Matching',
        content: [
          { type: 'paragraph', text: 'Each bike type has an optimal speed zone. Walking within this zone earns you full SAT. Walking outside of it reduces your rewards.' },
          { type: 'heading', text: 'Speed Zones by Bike Type' },
          { type: 'table', headers: ['Bike Type', 'Full Range', 'Optimal Range', 'Best For'], rows: [
            ['Commuter', '1 – 6 km/h', '2 – 5 km/h', 'Slow to normal walking'],
            ['Touring', '4 – 10 km/h', '5 – 9 km/h', 'Brisk walking to light jogging'],
            ['Racing', '8 – 20 km/h', '10 – 18 km/h', 'Jogging to running'],
            ['Electric', '1 – 20 km/h', '2 – 18 km/h', 'Any pace'],
          ]},
          { type: 'paragraph', text: 'Inside the optimal range you earn 100%. In the buffer zones (between full range and optimal range) earnings scale linearly. Outside the full range earnings are zero.' },
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
          ]},
          { type: 'tip', text: 'For the best experience, walk in open areas with good sky visibility. Parks, sidewalks, and trails work great.' },
          { type: 'heading', text: 'Signal Quality' },
          { type: 'paragraph', text: 'Your GPS signal quality is reflected in your earnings. Strong, consistent signals mean full rewards. If the signal is weak or intermittent, your earnings for those minutes will be reduced. The app will let you know if signal quality is too poor to earn.' },
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
            ['Earning Part', 'Increases SAT earned per minute'],
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
            'You can spend SAT to boost the success chance before attempting.',
          ]},
          { type: 'tip', text: 'Boosting the success rate costs SAT but can save you from losing three valuable parts. Consider boosting for higher level upgrades where the stakes are higher.' },
        ],
      },
      {
        slug: 'toolboxes',
        title: 'Toolboxes',
        content: [
          { type: 'paragraph', text: 'Toolboxes are reward containers that drop randomly while you walk. Your actual walking movement determines the level of toolbox you receive — only minutes where you\'re actively moving and earning count toward toolbox level. Standing still won\'t improve your toolbox level, even on a long session.' },
          { type: 'heading', text: 'Toolbox Levels' },
          { type: 'paragraph', text: 'Toolboxes range from Level 1 (most common) to Level 5 (rarest). Higher levels contain better parts, more SAP, and a chance at minting tools.' },
          { type: 'table', headers: ['Level', 'Rarity', 'Description'], rows: [
            ['Lv. 1', 'Very Common', 'Basic rewards that help early progression.'],
            ['Lv. 2', 'Common', 'A modest step up in parts and SAP rewards.'],
            ['Lv. 3', 'Uncommon', 'Stronger mid-tier rewards with occasional premium drops.'],
            ['Lv. 4', 'Rare', 'High-value rewards and better premium-drop potential.'],
            ['Lv. 5', 'Very Rare', 'The strongest rewards and the best chance at top-tier extras.'],
          ]},
          { type: 'tip', text: 'Investing in Luck — through leveling, parts, and bike quality — significantly improves both your drop rate and the level of toolboxes you receive. More active movement time pushes the toolbox level higher. Standing still or having poor GPS signal won\'t count toward your toolbox level. However, there\'s always some randomness — even with high Luck and a long walk, you may occasionally get a lower-level toolbox.' },
          { type: 'heading', text: 'Cooldown Timers' },
          { type: 'paragraph', text: 'Each toolbox has a cooldown period that starts when it drops. You must wait for the timer to expire before opening. Higher-level toolboxes take longer — ranging from about 2 days for Lv. 1 up to about a week for Lv. 5.' },
          { type: 'tip', text: 'Extra inventory slots let you cool down multiple boxes in parallel, so you\'re always ready to open one while others count down.' },
          { type: 'heading', text: 'Speed Open' },
          { type: 'paragraph', text: 'Don\'t want to wait? You can spend SAP to instantly skip the remaining cooldown. The cost scales with how much time is left — the more patient you are, the less it costs. This cost is in addition to the normal opening cost.' },
          { type: 'heading', text: 'Live Drop Progress' },
          { type: 'paragraph', text: 'During a walk, the live activity screen shows your estimated toolbox drop progress — including your cumulative drop chance so far and the likely toolbox level based on your actual movement. If you stop moving, the estimated level reflects that. This updates in real time as your walk continues.' },
          { type: 'heading', text: 'Opening Costs' },
          { type: 'paragraph', text: 'Every toolbox has an opening cost. Lower-level toolboxes are easier to open, while higher-level toolboxes may also require BTC in addition to SAP.' },
          { type: 'table', headers: ['Level', 'Cost Type'], rows: [
            ['Lv. 1 - 3', 'SAP only'],
            ['Lv. 4 - 5', 'SAP + BTC'],
          ]},
          { type: 'paragraph', text: 'This keeps early toolboxes accessible while making the highest-level boxes a more deliberate upgrade path.' },
          { type: 'heading', text: 'Contents by Level' },
          { type: 'paragraph', text: 'Toolboxes can contain parts from any of the four part types, SAP rewards, and sometimes minting tools. Higher-level toolboxes generally give stronger parts, better SAP payouts, and better premium-drop potential.' },
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
            'Breeding costs BTC (gas), SAP, and 1 minting tool.',
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
            'Quality tier — better parents have better odds of producing higher quality offspring.',
            'Bike type — the offspring\'s type is influenced by the parents\' types.',
            'Stats are freshly rolled for the offspring — they don\'t directly inherit parent stats.',
          ]},
          { type: 'heading', text: 'Special Notes' },
          { type: 'list', items: [
            'Electric bikes are the hardest type to breed — they\'re rare even from two Electric parents.',
            'Legendary offspring are possible but rare, even from two Legendary parents.',
            'The offspring starts at level 1 with zero breeds used.',
          ]},
          { type: 'tip', text: 'Breeding two high-quality bikes of the same type gives you the best odds of a strong offspring. But surprises happen — sometimes a Common pair produces something amazing!' },
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
          { type: 'heading', text: 'OPNet Wallet Extension' },
          { type: 'list', items: [
            'Install the OPNet Wallet browser extension.',
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
            'To access the dashboard: import the same recovery phrase into the OPNet browser extension, then connect on the dashboard.',
            'Alternatively, link your Google account in the mobile app and use Google sign-in on the dashboard.',
            'Both methods connect you to the same account — your bikes, SAT balance, and progress are shared.',
          ]},
          { type: 'tip', text: 'Your wallet address is your identity — the same address everywhere means the same account. Keep your recovery phrase backed up to access your account from any device.' },
        ],
      },
      {
        slug: 'exporting-bikes',
        title: 'Exporting Bikes',
        content: [
          { type: 'paragraph', text: 'Any bike with full HP can be exported as an on-chain NFT (BikeNFT). This puts your balance bike on the Bitcoin blockchain where it can be traded, sold, or transferred to other wallets.' },
          { type: 'heading', text: 'How Exporting Works' },
          { type: 'list', items: [
            'Select a bike with full HP from your inventory.',
            'Choose "Export to NFT" — this mints a BikeNFT on-chain.',
            'The bike leaves your in-game inventory.',
            'Any socketed parts are automatically removed and returned to your inventory.',
            'The NFT can now be traded on-chain or on supported marketplaces.',
          ]},
          { type: 'tip', text: 'Make sure to unsocket any valuable parts before exporting, as they\'ll be auto-removed. The bike must have full HP to export.' },
        ],
      },
      {
        slug: 'importing-bikes',
        title: 'Importing Bikes',
        content: [
          { type: 'paragraph', text: 'If you own a BikeNFT on-chain, you can import it back into Galavant to use it for walking and earning.' },
          { type: 'heading', text: 'How Importing Works' },
          { type: 'list', items: [
            'Connect your wallet containing the BikeNFT.',
            'Select the NFT and choose "Import to Game."',
            'The NFT is burned (destroyed on-chain).',
            'The bike appears in your in-game inventory with full HP and durability.',
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
        slug: 'sap-and-sat-tokens',
        title: 'SAP & SAT Tokens',
        content: [
          { type: 'paragraph', text: 'Galavant has a dual-currency system designed for both casual players and crypto-savvy users.' },
          { type: 'heading', text: 'Satoshi Activity Points (SAP)' },
          { type: 'list', items: [
            'Earned by walking with your balance bike.',
            'Used for leveling, upgrades, marketplace trades, and breeding.',
            'Stored in your game account — no wallet needed.',
            'The primary in-game currency for all activities.',
          ]},
          { type: 'heading', text: 'SAT Token (On-Chain)' },
          { type: 'list', items: [
            'An OP_20 token on Bitcoin with a fixed supply of 210 million.',
            'Created by converting SAP into SAT tokens.',
            'The conversion rate gets harder as more tokens are minted — early converters get the best rate.',
            'A 5% platform fee applies to conversions.',
            'Can be swapped for BTC on NativeSwap.',
          ]},
          { type: 'tip', text: 'You don\'t need to convert to tokens to enjoy the game. SAP works for everything in-game. Converting to SAT tokens is optional for those who want on-chain value.' },
          { type: 'heading', text: 'Token Supply Management' },
          { type: 'paragraph', text: 'The platform actively manages the SAT token supply to maintain a healthy economy. A portion of platform revenue goes into a stabilization fund used for token burns (permanently reducing supply) and buybacks (purchasing tokens on the open market). These operations are reviewed and approved by the team to ensure long-term token value stability.' },
        ],
      },
      {
        slug: 'marketplace',
        title: 'Marketplace',
        content: [
          { type: 'paragraph', text: 'The in-game marketplace lets you buy and sell bikes, parts, and minting tools using SAP.' },
          { type: 'heading', text: 'Selling' },
          { type: 'list', items: [
            'List any bike, part, or minting tool for a SAP price you choose.',
            'A 5% fee is deducted from the sale price when an item sells.',
            'You can have up to 20 active listings at once.',
            'Cancel listings at any time to get your item back.',
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
      {
        slug: 'swapping',
        title: 'Swapping',
        content: [
          { type: 'paragraph', text: 'Swap between BTC and SAT tokens using NativeSwap, a decentralized exchange on Bitcoin.' },
          { type: 'heading', text: 'Buying SAT Tokens' },
          { type: 'list', items: [
            'Send BTC to reserve SAT tokens.',
            'Complete the swap to receive your tokens.',
            'This is a two-step process for security.',
            'A 5% platform fee applies.',
          ]},
          { type: 'heading', text: 'Selling SAT Tokens' },
          { type: 'list', items: [
            'Approve your tokens for the swap contract.',
            'List your SAT tokens for sale.',
            'Receive BTC when a buyer matches your listing.',
          ]},
          { type: 'paragraph', text: 'Swap rates are determined by the liquidity pool. Larger swaps may experience price impact.' },
        ],
      },
    ],
  },

  // ─── 8. Progression & Rewards ─────────────────────────────────
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
          { type: 'heading', text: 'Token Holding Bonus' },
          { type: 'paragraph', text: 'Holding your SAT tokens instead of immediately selling them also contributes to your earning bonus. Players who hold a healthy token balance receive additional earning multipliers on top of their streak bonus.' },
          { type: 'tip', text: 'The combination of a long daily streak and strong token holding can significantly boost your daily earnings. Consistency is key!' },
        ],
      },
      {
        slug: 'staking',
        title: 'Staking',
        content: [
          { type: 'paragraph', text: 'Lock your SAT tokens for a fixed period to receive earning boosts and energy bonuses.' },
          { type: 'heading', text: 'Staking Options' },
          { type: 'table', headers: ['Lock Period', 'Benefit'], rows: [
            ['7 days', 'Small earning boost + minor energy bonus'],
            ['30 days', 'Medium earning boost + moderate energy bonus'],
            ['90 days', 'Large earning boost + significant energy bonus'],
          ]},
          { type: 'heading', text: 'Important Rules' },
          { type: 'list', items: [
            'Tokens are locked for the full duration — you can\'t use them during this time.',
            'Early withdrawal is possible but incurs a 20% penalty on your staked amount.',
            'Bonuses apply immediately when you stake and end when the lock period expires.',
            'You can have multiple active stakes at different durations.',
          ]},
          { type: 'tip', text: 'Only stake tokens you won\'t need for a while. The 20% early withdrawal penalty is steep — plan ahead!' },
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
            ['Earnings', 'Total SAT earned from walking'],
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
];

/** Flat list of all pages with section context for prev/next navigation */
export type FlatPage = {
  sectionSlug: string;
  sectionTitle: string;
  page: GameplayPage;
};

export const flatPages: FlatPage[] = gameplaySections.flatMap((s) =>
  s.pages.map((page) => ({
    sectionSlug: s.slug,
    sectionTitle: s.title,
    page,
  })),
);
