import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { fetchStoreProducts, storeCheckout, type StoreProduct } from '../api';
import { config } from '../config';

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function Store() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [params] = useSearchParams();
  const status = params.get('status'); // success | cancel (from Stripe redirect)

  const catalog = useQuery({ queryKey: ['store-products'], queryFn: fetchStoreProducts, retry: false });

  const checkout = useMutation({
    mutationFn: (bikeType: string) => storeCheckout(bikeType),
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
  });

  const buy = (p: StoreProduct) => {
    if (!isAuthenticated) { setShowLogin(true); return; }
    checkout.mutate(p.type);
  };

  const products = catalog.data?.products ?? [];
  const shopOpen = catalog.data?.enabled === true;

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
        <div className="pixel-card p-4 border-m2e-success text-m2e-success">
          Payment received — your new bike is being minted and will appear in your Profile shortly. 🚲
        </div>
      )}
      {status === 'cancel' && (
        <div className="pixel-card p-4 text-m2e-text-secondary">Checkout cancelled — no charge was made.</div>
      )}

      <p className="text-m2e-text-secondary max-w-2xl">
        Higher grades come from breeding — the shop sells fresh Steel bikes to get you rolling.
      </p>

      {!shopOpen ? (
        <div className="pixel-card p-6 space-y-2">
          <h2 className="text-2xl uppercase tracking-wide">Shop opening soon</h2>
          <p className="text-m2e-text-secondary">
            Card checkout is being switched on. Meanwhile you can earn bikes in-game and from breeding.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.type} className="pixel-card p-5 flex flex-col gap-3">
              <img
                src={`${config.apiUrl}/art/bases/bike-${p.type}.png`}
                alt={p.displayName}
                className="w-full h-28 object-contain pixel-render"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
              />
              <div>
                <div className="text-xl uppercase tracking-wide">{p.displayName}</div>
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-m2e-common">
                  <span className="w-2 h-2 rotate-45 rounded-[1px] bg-m2e-common inline-block" />
                  Steel bike
                </div>
              </div>
              <div className="text-3xl text-m2e-accent">{usd(p.priceUsdCents)}</div>
              <button
                className="pixel-btn pixel-btn-primary px-4 py-3 mt-auto text-sm disabled:opacity-50"
                disabled={!p.available || (checkout.isPending && checkout.variables === p.type)}
                onClick={() => buy(p)}
              >
                {checkout.isPending && checkout.variables === p.type ? 'Opening checkout…' : 'Buy with card'}
              </button>
            </div>
          ))}
        </div>
      )}

      {checkout.isError && (
        <div className="pixel-card p-4 text-m2e-danger">{(checkout.error as Error).message}</div>
      )}

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
    </>
  );
}
