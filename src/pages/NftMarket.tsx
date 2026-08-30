import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, Repeat } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { config } from '../config';
import {
  fetchNftListings,
  fetchMyNftListings,
  nftBuyWithWatts,
  nftListForWatts,
  nftListForEnj,
  nftCancelListing,
  nftSweepToSelf,
  fetchWalletNfts,
  type NftListing,
  type ExportedPart,
} from '../api';

const wattsFmt = (n: number | null) => (n == null ? '—' : `${n.toLocaleString()} WATTS`);
const qualityClass: Record<string, string> = {
  common: 'text-m2e-text-secondary',
  uncommon: 'text-m2e-success',
  rare: 'text-sky-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

export default function NftMarket() {
  const { isAuthenticated, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<'browse' | 'sell'>('browse');

    return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10 space-y-4">
          <div className="section-label">On-Chain</div>
          <h1 className="text-5xl md:text-7xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
            The Trading<br />
            <span className="text-m2e-accent">Post.</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl">
            Real NFT bikes on Enjin Matrixchain — sell for ENJ, or bring one back into the game.
          </p>
        </div>
      </div>

    <div className="mx-auto max-w-5xl px-4 md:px-8 py-12 space-y-8">

      <p className="text-m2e-text-secondary max-w-2xl">
        Trade on-chain NFT bikes. Sell for <strong>ENJ</strong> and the bike stays an NFT for the buyer; sell for{' '}
        <strong>WATTS</strong> and the NFT is burned so the buyer gets it back as a normal in-game bike — the way back
        into the game. Every NFT always changes hands bare (parts return to your inventory first).
      </p>

      <div className="flex gap-2">
        {(['browse', 'sell'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 uppercase tracking-wide text-sm border-2 ${
              tab === t
                ? 'border-m2e-accent bg-m2e-accent/10 text-m2e-accent'
                : 'border-m2e-border text-m2e-text-secondary hover:border-m2e-text-secondary'
            }`}
          >
            {t === 'browse' ? 'Browse' : 'Sell / My NFTs'}
          </button>
        ))}
      </div>

      {tab === 'browse' ? (
        <BrowseTab isAuthenticated={isAuthenticated} onNeedLogin={() => setShowLogin(true)} />
      ) : isAuthenticated ? (
        <SellTab userId={user?.id ?? ''} />
      ) : (
        <div className="pixel-card p-6 space-y-3">
          <p className="text-m2e-text-secondary">Sign in to sell your NFT bikes.</p>
          <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-4 py-2 text-sm">
            Sign in
          </button>
        </div>
      )}

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
    </>
  );
}

function BrowseTab({ isAuthenticated, onNeedLogin }: { isAuthenticated: boolean; onNeedLogin: () => void }) {
  const qc = useQueryClient();
  const listings = useQuery({ queryKey: ['nft-listings'], queryFn: fetchNftListings, refetchInterval: 15_000 });

  const buy = useMutation({
    mutationFn: (listingId: string) => nftBuyWithWatts(listingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nft-listings'] }),
  });

  const rows = listings.data?.listings ?? [];
  if (listings.isLoading) return <GridSkeleton />;
  if (!rows.length) return <div className="pixel-card p-6 text-m2e-text-secondary">No NFTs are listed right now.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((l) => (
        <div key={l.id} className="pixel-card p-4 flex flex-col gap-3">
          <BikeThumb listing={l} />
          <div className="flex items-baseline justify-between">
            <span className={`uppercase text-sm tracking-wide ${l.itemType === 'bike' ? (qualityClass[l.quality ?? ''] ?? '') : 'text-m2e-accent'}`}>
              {l.itemType === 'bike' ? `${l.quality} ${l.bikeType}` : `${l.partType} part`}
            </span>
            <span className="text-xs text-m2e-text-secondary">Lv.{(l.itemType === 'bike' ? l.level : l.partLevel) ?? 0}</span>
          </div>
          {l.saleType === 'watts' ? (
            <>
              <div className="text-lg text-m2e-accent">{wattsFmt(l.priceWatts)}</div>
              <button
                disabled={buy.isPending}
                onClick={() => (isAuthenticated ? buy.mutate(l.id) : onNeedLogin())}
                className="px-3 py-2 border border-m2e-accent text-m2e-accent uppercase tracking-wide text-sm disabled:opacity-50"
              >
                {buy.isPending && buy.variables === l.id ? 'Buying…' : 'Buy · burns NFT'}
              </button>
              <p className="text-[11px] text-m2e-text-secondary">You receive it as a normal in-game bike.</p>
            </>
          ) : (
            <>
              <div className="text-lg text-emerald-400">{l.priceEnj} ENJ</div>
              <span className="px-3 py-2 border border-m2e-border text-m2e-text-secondary uppercase tracking-wide text-xs text-center">
                On the Enjin marketplace
              </span>
              <p className="text-[11px] text-m2e-text-secondary">Buy on-chain with your Enjin wallet; stays an NFT.</p>
            </>
          )}
        </div>
      ))}
      {buy.isError && <div className="pixel-card p-3 text-m2e-danger col-span-full">{(buy.error as Error).message}</div>}
      {buy.isSuccess && (
        <div className="pixel-card p-3 text-m2e-success col-span-full">
          Purchase is settling on-chain — the bike will appear in your Profile once the NFT is burned.
        </div>
      )}
    </div>
  );
}

function SellTab({ userId: _userId }: { userId: string }) {
  const qc = useQueryClient();
  // Owner-scoped: /wallet/nfts returns only the signed-in player's NFTs. (The public
  // gallery endpoint returns every player's, which would offer Sell on other people's items.)
  const walletNfts = useQuery({ queryKey: ['wallet-nfts'], queryFn: fetchWalletNfts });
  // Own listings incl. 'settling', so a card doesn't blank out mid-sale.
  const listings = useQuery({ queryKey: ['my-nft-listings'], queryFn: fetchMyNftListings, refetchInterval: 15_000 });

  const listingByBike = new Map<string, NftListing>();
  for (const l of listings.data?.listings ?? []) listingByBike.set(l.itemId, l);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['nft-listings'] });
    qc.invalidateQueries({ queryKey: ['my-nft-listings'] });
    qc.invalidateQueries({ queryKey: ['wallet-nfts'] });
  };

  if (walletNfts.isLoading) return <GridSkeleton />;
  const rows = walletNfts.data?.bikes ?? [];
  const partRows = walletNfts.data?.parts ?? [];
  if (!rows.length && !partRows.length) {
    return (
      <div className="pixel-card p-6 text-m2e-text-secondary">
        You have no NFTs yet. Export a bike or a part from your Profile to sell it here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((bike) => (
            <SellCard key={bike.id} bike={bike} listing={listingByBike.get(bike.id)} onChanged={invalidate} />
          ))}
        </div>
      )}
      {partRows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl uppercase tracking-wide">Part NFTs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partRows.map((part) => (
              <PartSellCard key={part.id} part={part} listing={listingByBike.get(part.id)} onChanged={invalidate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Sell / manage one part NFT. Mirrors SellCard; parts have no quality tier and no equip state. */
function PartSellCard({ part, listing, onChanged }: { part: ExportedPart; listing?: NftListing; onChanged: () => void }) {
  const [watts, setWatts] = useState('');
  const [enj, setEnj] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setErr(null);
    fn().then(onChanged).catch((e) => setErr((e as Error).message));
  };

  const listW = useMutation({ mutationFn: () => nftListForWatts('part', part.id, Math.floor(Number(watts))) });
  const listE = useMutation({ mutationFn: () => nftListForEnj('part', part.id, enj.trim()) });
  const cancel = useMutation({ mutationFn: () => nftCancelListing(listing!.id) });
  const sweep = useMutation({ mutationFn: () => nftSweepToSelf('part', part.id) });

  return (
    <div className="pixel-card p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="uppercase text-sm tracking-wide text-m2e-accent">{part.type} part</span>
        <span className="text-xs text-m2e-text-secondary">#{part.tokenId} · Lv.{part.level}</span>
      </div>

      {listing ? (
        <>
          <div className="text-sm text-m2e-text-secondary">
            Listed for {listing.saleType === 'watts' ? wattsFmt(listing.priceWatts) : `${listing.priceEnj} ENJ`}
            {listing.status === 'settling' && ' · selling…'}
          </div>
          <button
            disabled={cancel.isPending || listing.status !== 'active'}
            onClick={() => run(() => cancel.mutateAsync())}
            className="px-3 py-2 border border-m2e-border text-m2e-text-secondary uppercase tracking-wide text-sm disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel listing'}
          </button>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={watts}
              onChange={(e) => setWatts(e.target.value)}
              inputMode="numeric"
              placeholder="Price in WATTS"
              className="flex-1 min-w-0 bg-m2e-card-alt border border-m2e-border px-2 py-2 text-sm"
            />
            <button
              disabled={listW.isPending || !(Number(watts) > 0)}
              onClick={() => run(() => listW.mutateAsync())}
              className="px-3 py-2 border border-m2e-accent text-m2e-accent uppercase tracking-wide text-xs disabled:opacity-50"
            >
              Sell · burns
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={enj}
              onChange={(e) => setEnj(e.target.value)}
              inputMode="decimal"
              placeholder="Price in ENJ"
              className="flex-1 min-w-0 bg-m2e-card-alt border border-m2e-border px-2 py-2 text-sm"
            />
            <button
              disabled={listE.isPending || !(Number(enj) > 0)}
              onClick={() => run(() => listE.mutateAsync())}
              className="px-3 py-2 border border-emerald-500 text-emerald-400 uppercase tracking-wide text-xs disabled:opacity-50"
            >
              Sell · ENJ
            </button>
          </div>
          <button
            disabled={sweep.isPending}
            onClick={() => run(() => sweep.mutateAsync())}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-m2e-border text-m2e-text-secondary uppercase tracking-wide text-xs disabled:opacity-50"
          >
            <Repeat className="w-4 h-4" /> {sweep.isPending ? 'Sweeping…' : 'Sweep to my wallet'}
          </button>
        </>
      )}
      {err && <div className="text-m2e-danger text-xs">{err}</div>}
    </div>
  );
}

type SellableBike = { id: string; type: string; quality: string; level: number; tokenId: number | null };

function SellCard({ bike, listing, onChanged }: { bike: SellableBike; listing?: NftListing; onChanged: () => void }) {
  const [watts, setWatts] = useState('');
  const [enj, setEnj] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setErr(null);
    fn().then(onChanged).catch((e) => setErr((e as Error).message));
  };

  const listW = useMutation({ mutationFn: () => nftListForWatts('bike', bike.id, Math.floor(Number(watts))) });
  const listE = useMutation({ mutationFn: () => nftListForEnj('bike', bike.id, enj.trim()) });
  const cancel = useMutation({ mutationFn: () => nftCancelListing(listing!.id) });
  const sweep = useMutation({ mutationFn: () => nftSweepToSelf('bike', bike.id) });

  return (
    <div className="pixel-card p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className={`uppercase text-sm tracking-wide ${qualityClass[bike.quality] ?? ''}`}>
          {bike.quality} {bike.type}
        </span>
        <span className="text-xs text-m2e-text-secondary">#{bike.tokenId} · Lv.{bike.level}</span>
      </div>

      {listing ? (
        <>
          <div className="text-sm text-m2e-text-secondary">
            Listed for {listing.saleType === 'watts' ? wattsFmt(listing.priceWatts) : `${listing.priceEnj} ENJ`}
            {listing.status === 'settling' && ' · selling…'}
          </div>
          <button
            disabled={cancel.isPending || listing.status !== 'active'}
            onClick={() => run(() => cancel.mutateAsync())}
            className="px-3 py-2 border border-m2e-border text-m2e-text-secondary uppercase tracking-wide text-sm disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel listing'}
          </button>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={watts}
              onChange={(e) => setWatts(e.target.value)}
              inputMode="numeric"
              placeholder="Price in WATTS"
              className="flex-1 min-w-0 bg-m2e-card-alt border border-m2e-border px-2 py-2 text-sm"
            />
            <button
              disabled={listW.isPending || !(Number(watts) > 0)}
              onClick={() => run(() => listW.mutateAsync())}
              className="px-3 py-2 border border-m2e-accent text-m2e-accent uppercase tracking-wide text-xs disabled:opacity-50"
            >
              Sell · burns
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={enj}
              onChange={(e) => setEnj(e.target.value)}
              inputMode="decimal"
              placeholder="Price in ENJ"
              className="flex-1 min-w-0 bg-m2e-card-alt border border-m2e-border px-2 py-2 text-sm"
            />
            <button
              disabled={listE.isPending || !(Number(enj) > 0)}
              onClick={() => run(() => listE.mutateAsync())}
              className="px-3 py-2 border border-emerald-500 text-emerald-400 uppercase tracking-wide text-xs disabled:opacity-50"
            >
              Sell · ENJ
            </button>
          </div>
          <button
            disabled={sweep.isPending}
            onClick={() => run(() => sweep.mutateAsync())}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-m2e-border text-m2e-text-secondary uppercase tracking-wide text-xs disabled:opacity-50"
          >
            <Repeat className="w-4 h-4" /> {sweep.isPending ? 'Sweeping…' : 'Sweep to my wallet'}
          </button>
        </>
      )}
      {err && <div className="text-m2e-danger text-xs">{err}</div>}
    </div>
  );
}

/**
 * Same rule as ListingCard.tsx: the server stores SERVER-RELATIVE image paths, so an
 * unprefixed src resolves against this site's origin and 404s. And the listings feed only
 * joins bike art, so every part — and every bike without generated art — arrives with
 * imageUrl null and needs the base art the rest of the app already falls back to.
 */
function resolveThumbUrl(listing: NftListing): string | null {
  if (listing.imageUrl) {
    return listing.imageUrl.startsWith('/') ? `${config.apiUrl}${listing.imageUrl}` : listing.imageUrl;
  }
  if (listing.itemType === 'bike' && listing.bikeType) {
    return `${config.apiUrl}/art/bases/bike-${listing.bikeType.toLowerCase()}.png`;
  }
  if (listing.itemType === 'part' && listing.partType && listing.partLevel) {
    return `${config.apiUrl}/art/bases/part-${listing.partType.toLowerCase()}-lv${listing.partLevel}.png`;
  }
  return null;
}

function BikeThumb({ listing }: { listing: NftListing }) {
  const [failed, setFailed] = useState(false);
  const url = resolveThumbUrl(listing);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className="w-full aspect-video object-cover bg-m2e-card-alt"
      />
    );
  }
  return (
    <div className="w-full aspect-video bg-m2e-card-alt flex items-center justify-center">
      <Coins className="w-8 h-8 text-m2e-text-secondary" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="pixel-card h-56 animate-pulse bg-m2e-card-alt" />
      ))}
    </div>
  );
}
