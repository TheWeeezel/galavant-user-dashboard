import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { StoreBikeCard, type PayMethod } from '../components/StoreBikeCard';
import { EnjPaymentPanel } from '../components/EnjPaymentPanel';
import { StoreBatchStrip } from '../components/StoreBatchStrip';
import { byBikeTypeOrder } from '../config/bikeTypes';
import { fetchStoreProducts, fetchStoreStock, storeCheckout, storeCheckoutEnj, type EnjPayment, type StoreProduct } from '../api';

/** The opening day, read in UTC — the same calendar day the server means, in every timezone. */
function formatOpensAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

export default function Store() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const status = params.get('status'); // success | cancel (from the payment redirect)

  // Refetched on a timer because the price MOVES: it steps every fifty bikes sold, and a page left
  // open across a step would send the buyer to a till asking more than the card under their finger
  // says. Thirty seconds is well inside the quote's own fifteen-minute window.
  const catalog = useQuery({
    queryKey: ['store-products'],
    queryFn: fetchStoreProducts,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  // Second, softer source: it carries the caps, which is the only way to tell "sold out" apart
  // from "checkout not switched on yet". The shop stays fully usable when this one fails, so a
  // failure here must never surface as an error — it only costs the card a precise sentence.
  const stock = useQuery({ queryKey: ['store-stock'], queryFn: fetchStoreStock, retry: false, refetchInterval: 30_000 });

  // The browser needs a moment to follow the redirect. Without this the button would snap back to
  // "Buy with card" while the checkout page is already loading, which reads as a click that failed.
  const [leaving, setLeaving] = useState(false);

  // The ENJ payment currently on screen, if any. The card path leaves the site; this one does not,
  // because the buyer pays from their own wallet and there is nowhere to send them.
  const [enjPayment, setEnjPayment] = useState<EnjPayment | null>(null);

  /**
   * The till opens ABOVE the shelf, and on a phone the shelf is one column — the Electric card sits
   * two or three screens down, so pressing "Pay with ENJ" there rendered the payment off-screen and
   * the tap read as a button that does nothing (owner, 2026-10-01: "tried to buy it and it didnt do
   * anything"). The panel is not moved: it belongs at the top, where it stays visible while the
   * buyer pays. The view follows it instead.
   */
  const tillRef = useRef<HTMLDivElement>(null);
  // FROM AN EFFECT, not from the mutation callback: the panel — and with it the ref — exists only
  // after React has committed the state update, and a rAF scheduled in the same tick can run
  // BEFORE that commit. The ref would be null, the early return would swallow it, and the bug
  // would be back on exactly the phones it was written for, intermittently. Same pattern the
  // music player already uses for its scroll.
  useEffect(() => {
    const el = tillRef.current;
    if (!enjPayment || !el) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  }, [enjPayment?.quoteId]);

  const checkout = useMutation({
    mutationFn: async ({ type, method }: { type: string; method: PayMethod }) => {
      if (method === 'enj') return { method, payment: await storeCheckoutEnj(type) } as const;
      const session = await storeCheckout(type);
      if (!session.url) throw new Error('Checkout could not be opened — you have not been charged.');
      return { method, url: session.url } as const;
    },
    onSettled: () => {
      // A sale — ours or anyone's — moves the shop toward the next band. Re-read the shelf rather
      // than leave a stale price under a bike somebody is about to buy again.
      for (const key of ['store-products', 'store-stock']) queryClient.invalidateQueries({ queryKey: [key] });
    },
    onSuccess: (result) => {
      if (result.method === 'enj') {
        setEnjPayment(result.payment);
        return;
      }
      setLeaving(true);
      window.location.href = result.url;
    },
  });

  const buy = (product: StoreProduct, method: PayMethod) => {
    if (!isAuthenticated) { setShowLogin(true); return; }
    checkout.mutate({ type: product.type, method });
  };

  // The shelf reads slowest band first, Electric last — the same order the landing page's garage
  // uses. The catalog sends whatever order the database happens to return, so the sequence is
  // imposed here rather than hoped for.
  const products = byBikeTypeOrder(catalog.data?.products ?? []);
  const shopOpen = catalog.data?.enabled === true;
  // Set while the server refuses ENJ on purpose. The prices stay on the shelf and the ENJ buttons
  // are already gone (no `priceEnj`), so all that is missing is the reason — and a date is a
  // better reason than a silence.
  const enjOpensAt = catalog.data?.enjOpensAt ?? null;
  // One order at a time, and it stays "running" across the redirect rather than until the request
  // returns — the click is not finished while the browser is still on its way to the till.
  const running = (checkout.isPending || leaving) ? checkout.variables ?? null : null;

  return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10 space-y-4">
          <div className="section-label">Fresh Stock</div>
          <h1 className="text-5xl md:text-7xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
            The Bike<br />
            <span className="text-m2e-accent">Shop.</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl">
            Brand-new bikes, paid by card or in ENJ from your own wallet — playable immediately,
            exportable to your Enjin Wallet anytime.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-12 space-y-8">

        {status === 'success' && (
          <div className="pixel-card p-4 border-m2e-success text-m2e-success-deep">
            Payment received — your new bike is being minted and will appear in your Profile shortly. 🚲
          </div>
        )}
        {status === 'cancel' && (
          <div className="pixel-card p-4 text-m2e-text-secondary">Checkout cancelled — no charge was made.</div>
        )}

        {enjPayment && (
          <div ref={tillRef} style={{ scrollMarginTop: '12px' }}>
            <EnjPaymentPanel
              payment={enjPayment}
              displayName={products.find((p) => p.type === enjPayment.product)?.displayName ?? enjPayment.product}
              onClose={() => setEnjPayment(null)}
            />
          </div>
        )}

        {catalog.isPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="pixel-card h-80 animate-pulse" />)}
          </div>
        ) : catalog.isError ? (
          <div className="pixel-card p-6 space-y-3">
            <h2 className="text-2xl uppercase tracking-wide">Shop unreachable</h2>
            <p className="text-m2e-text-secondary">The bike list could not be loaded — nothing was charged.</p>
            <button className="pixel-btn pixel-btn-secondary px-4 py-3 text-sm" onClick={() => catalog.refetch()}>
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="pixel-card p-6 space-y-2">
            <h2 className="text-2xl uppercase tracking-wide">No bikes listed</h2>
            <p className="text-m2e-text-secondary">The shop has nothing on the shelf right now — check back soon.</p>
          </div>
        ) : (
          <>
            {/* The bikes stay on the shelf even while the till is shut. A closed checkout is a
                reason to explain the wait, not a reason to hide what the shop sells and what it
                costs — hiding it was the old behaviour, and it made the shop look empty. */}
            {catalog.data?.priceBand && (
              <StoreBatchStrip band={catalog.data.priceBand} products={products} />
            )}

            {enjOpensAt ? (
              <div className="pixel-card p-4 text-m2e-text-secondary space-y-1">
                <div className="section-label text-m2e-accent">Paying in ENJ opens {formatOpensAt(enjOpensAt)}</div>
                <p>
                  The prices below are the real ones. Everything the shop sells before the relaunch
                  is wiped on that day, so the ENJ till stays shut until it counts — no bike here is
                  worth real ENJ yet. Meanwhile you can earn bikes in-game and from breeding.
                </p>
                <p className="text-xs">
                  This is the shop only. NFTs you buy from other players on the marketplace are
                  bought wallet to wallet on the chain, and they survive the wipe.
                </p>
              </div>
            ) : !shopOpen ? (
              <div className="pixel-card p-4 text-m2e-text-secondary">
                Checkout is being switched on — the prices below are the real ones, the buy buttons
                open shortly. Meanwhile you can earn bikes in-game and from breeding.
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <StoreBikeCard
                  key={p.type}
                  product={p}
                  catalogEnabled={shopOpen}
                  stock={stock.data}
                  signedIn={isAuthenticated}
                  busy={running?.type === p.type ? running.method : null}
                  locked={running !== null}
                  error={checkout.isError && checkout.variables?.type === p.type ? (checkout.error as Error).message : null}
                  priceBand={catalog.data?.priceBand ?? null}
                  onBuy={(method) => buy(p, method)}
                />
              ))}
            </div>
          </>
        )}

        <p className="text-m2e-text-secondary max-w-2xl">
          Higher grades come from breeding — the shop sells fresh Steel bikes to get you rolling.
        </p>

        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    </>
  );
}
