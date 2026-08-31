import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { StoreBikeCard, type PayMethod } from '../components/StoreBikeCard';
import { fetchStoreProducts, fetchStoreStock, storeCheckout, storeCheckoutEnj, type StoreProduct } from '../api';

export default function Store() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [params] = useSearchParams();
  const status = params.get('status'); // success | cancel (from the payment redirect)

  const catalog = useQuery({ queryKey: ['store-products'], queryFn: fetchStoreProducts, retry: false });
  // Second, softer source: it carries the caps, which is the only way to tell "sold out" apart
  // from "checkout not switched on yet". The shop stays fully usable when this one fails, so a
  // failure here must never surface as an error — it only costs the card a precise sentence.
  const stock = useQuery({ queryKey: ['store-stock'], queryFn: fetchStoreStock, retry: false });

  // The browser needs a moment to follow the redirect. Without this the button would snap back to
  // "Buy with card" while the checkout page is already loading, which reads as a click that failed.
  const [leaving, setLeaving] = useState(false);

  const checkout = useMutation({
    mutationFn: async ({ type, method }: { type: string; method: PayMethod }): Promise<string> => {
      const session = method === 'enj' ? await storeCheckoutEnj(type) : await storeCheckout(type);
      if (!session.url) throw new Error('Checkout could not be opened — you have not been charged.');
      return session.url;
    },
    onSuccess: (url) => {
      setLeaving(true);
      window.location.href = url;
    },
  });

  const buy = (product: StoreProduct, method: PayMethod) => {
    if (!isAuthenticated) { setShowLogin(true); return; }
    checkout.mutate({ type: product.type, method });
  };

  const products = catalog.data?.products ?? [];
  const shopOpen = catalog.data?.enabled === true;
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
            Brand-new bikes for your card — playable immediately, exportable to your Enjin Wallet anytime.
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
            {!shopOpen && (
              <div className="pixel-card p-4 text-m2e-text-secondary">
                Checkout is being switched on — the prices below are the real ones, the buy buttons
                open shortly. Meanwhile you can earn bikes in-game and from breeding.
              </div>
            )}

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
