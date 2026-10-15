import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGraveyardWall } from '../api';
import { LoginModal } from '../components/LoginModal';
import { GraveyardFlow } from '../components/graveyard/GraveyardFlow';
import { EXAMPLE_CARDS, MarkedBikeCard, PixelGlyph, SneakerSprite, Tombstone, capitalize } from '../components/graveyard/Pixels';

/**
 * The Sneaker Graveyard: retire a sneaker from the old move-to-earn game on Solana, burn it in
 * your own wallet, and let its soul ride on in a Galavant bike. Public page — hero, how it works,
 * the sign-in-to-rebirth flow, the memorial wall, the two marks, questions. Web only by design; the
 * app never links here (Apple 3.1.1).
 *
 * The copy never states how many spots a month there are ("limited spots each month" is all), and
 * STEPN is named only in the questions and the disclaimer at the foot.
 */

/** The design's example pair, shown until the wall has a reborn sneaker of its own to point at. */
const EXAMPLE = { number: '922411691', type: 'Runner', quality: 'Common', rebornAs: 'racing' };

const HOW = [
  { title: 'Connect your wallet', text: 'Sign in with your Galavant account, then connect Phantom and sign a short message. No transaction, no cost.' },
  { title: 'Choose a sneaker', text: 'We read its number, type, quality, level and mint count. That record is its soul. Nothing else is taken.' },
  { title: 'Burn and rebirth', text: 'You burn it yourself in Phantom. The storage deposit comes back to you. You get 15 % off a starter pack, and the soul goes into its Steel bike: a mark on the bike\'s card.' },
];

/** The two marks a soul can give, as the server draws them on a bike's card. */
const MARKS = [
  { key: 'reborn', title: 'Reborn', text: 'The bike out of the starter pack your voucher bought. Born from the soul.', src: EXAMPLE_CARDS.reborn },
  { key: 'inherited', title: 'Inherited', text: 'A Steel bike you already ride took the soul in. Two lives, one ride.', src: EXAMPLE_CARDS.inherited },
] as const;

const FAQ: [string, string][] = [
  ['Why burn it at all?', 'A sneaker can only have one soul. Burning proves the sneaker is gone, so its soul can live in exactly one bike and nobody can retire the same sneaker twice.'],
  ['What happens to my sneaker?', 'It is destroyed on Solana, in your wallet, by you. We never hold it. Before the burn we record its number, type, quality, level and mint count. That record is the soul, and it is cosmetic only.'],
  ['Do I need SOL?', 'A tiny network fee, under a cent. Most of the sneaker\'s storage deposit, a little under 0.01 SOL, comes back to your wallet when it burns. Most people end up with slightly more SOL than before.'],
  ['What if my spot expires?', 'A spot is held for 30 minutes once you reach the farewell. If it runs out before you burn, nothing happens to your sneaker. Pick it again. If you already burned, the burn is on the chain and we can still verify it; write to us.'],
  ['How many spots are there?', 'A limited number each month. When they are taken, the page says so and your sneakers wait safely in your wallet until the next month.'],
  ['Is this a partnership with STEPN?', 'No. We are not connected to STEPN or its makers. This page is for its players. You burn in your own wallet; we only read the chain.'],
];

export function Graveyard() {
  const [showLogin, setShowLogin] = useState(false);
  const wall = useQuery({ queryKey: ['graveyard-wall'], queryFn: fetchGraveyardWall, retry: false, staleTime: 60_000 });
  const stones = wall.data?.wall ?? [];
  // The hero shows a real pair as soon as the wall has one; the design's example until then.
  const example = stones.find((s) => s.rebornAs) ?? EXAMPLE;
  const exampleBike = example.rebornAs ?? EXAMPLE.rebornAs;

  return (
    <div>
      {/* Hero — a strip of sky over the ground the stones stand on */}
      <section className="bg-gradient-to-b from-m2e-sky-top to-m2e-bg border-b-[6px] border-m2e-ground">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14 grid md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div className="space-y-4">
            <div className="section-label">The Sneaker Graveyard</div>
            <h1 className="text-5xl md:text-6xl uppercase tracking-wide leading-none">Retire your sneaker with honour.</h1>
            <p className="text-xl leading-snug max-w-[34ch]">
              You ran a long way together. If your sneaker from the old move-to-earn game on Solana is gathering dust, give it a proper send-off. Burn it in your own wallet. Its soul rides on in a new Galavant bike.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a href="#retire" className="pixel-btn pixel-btn-primary px-6 py-3 text-base">Lay a sneaker to rest</a>
              <a href="#wall" className="pixel-btn pixel-btn-secondary px-5 py-3 text-base">Visit the wall</a>
            </div>
            <p className="text-sm text-m2e-text-secondary tracking-wider">
              15 % off a Steel starter pack · a mark only a retired sneaker can give · limited spots each month · the burn is final
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-cols-[auto_auto_minmax(0,auto)] items-center justify-center gap-3 md:gap-4">
            <div className="w-full max-w-[120px] md:max-w-none md:w-[170px] justify-self-end saturate-[.7]">
              <SneakerSprite type={example.type} quality={example.quality} />
            </div>
            <PixelGlyph name="arrow" className="w-8 h-8 text-m2e-text-secondary" />
            {/* The reborn bike floats like the hero bike on the landing page; the sprite stays
                put — it is the one that is done moving. */}
            <MarkedBikeCard
              src={EXAMPLE_CARDS.reborn}
              alt={`A ${capitalize(exampleBike)} bike's trading card with the Reborn ribbon of ${capitalize(example.type)} #${example.number}`}
              className="w-full max-w-[220px] md:w-[240px] justify-self-start animate-float-y"
            />
            <p className="col-span-3 text-center text-base text-m2e-text-secondary">
              {capitalize(example.type)} #{example.number} became a {capitalize(exampleBike)} bike
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-3xl md:text-4xl uppercase tracking-wide leading-none">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {HOW.map((step, i) => (
            <div key={step.title} className="grid grid-cols-[auto_1fr] gap-4 items-start">
              <div className="w-9 h-9 grid place-items-center bg-m2e-accent text-m2e-text-on-accent text-2xl shadow-[3px_3px_0_var(--color-m2e-chrome)]">{i + 1}</div>
              <div>
                <h3 className="text-2xl leading-none mb-1.5">{step.title}</h3>
                <p className="text-base text-m2e-text-secondary leading-snug">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The flow, on a sunk band so it reads as its own chapter */}
      <section id="retire" className="band-sunk py-10 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4">
          <GraveyardFlow onSignIn={() => setShowLogin(true)} />
        </div>
      </section>

      {/* The wall */}
      <section id="wall" className="mx-auto max-w-7xl px-4 py-10 scroll-mt-20">
        <div className="flex flex-wrap justify-between items-end gap-x-6 gap-y-2 mb-5">
          <div>
            <div className="section-label">The wall</div>
            <h2 className="text-3xl md:text-4xl uppercase tracking-wide leading-none">Laid to rest</h2>
          </div>
          <p className="text-lg text-m2e-text-secondary max-w-[60ch] leading-snug">
            Every retired sneaker gets a stone. Reborn ones say where the soul went. Only the sneaker number is shown, never the owner.
          </p>
        </div>
        {wall.isPending ? (
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-4">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="pixel-card h-56 animate-pulse" />)}
          </div>
        ) : wall.isError ? (
          <div className="pixel-card p-5 text-m2e-text-secondary">The wall could not be loaded right now. The stones are still there.</div>
        ) : stones.length === 0 ? (
          <div className="pixel-card p-5 text-m2e-text-secondary">No stone yet. The first sneaker laid to rest gets the first one.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-x-4 gap-y-5 px-4 pt-6 bg-gradient-to-b from-m2e-sky-top to-m2e-bg border-b-8 border-m2e-ground items-end">
            {stones.map((stone) => <Tombstone key={stone.id} stone={stone} />)}
          </div>
        )}
      </section>

      {/* The two marks a soul gives, on the bike's own trading card */}
      <section className="pixel-card px-5 py-6 md:px-8">
        <div className="section-label">The mark</div>
        <h2 className="text-3xl md:text-4xl uppercase tracking-wide leading-none">Reborn or Inherited</h2>
        <p className="text-lg max-w-[60ch] leading-snug mt-3">
          The soul shows as a ribbon on the bike's trading card, with the sneaker's number, and the card's line becomes the soul's. Always a Steel bike. The same card shows in the app and is the bike's NFT when you export it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 max-w-[620px]">
          {MARKS.map((m) => (
            <figure key={m.key} className="m-0 grid gap-2 transition-transform motion-safe:hover:-translate-y-1">
              <MarkedBikeCard src={m.src} alt={`A bike's trading card with the ${m.title} ribbon`} />
              <figcaption className="text-base">
                <span className="text-m2e-accent-dark uppercase tracking-wide">{m.title}</span>
                <small className="block text-sm text-m2e-text-secondary">{m.text}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Questions */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-3xl md:text-4xl uppercase tracking-wide leading-none">Questions people ask</h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mt-5">
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
      </section>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
