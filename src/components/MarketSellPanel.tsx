import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserBikes,
  fetchUserParts,
  fetchMyMarketListings,
  fetchMarketPolicy,
  marketList,
  marketCancel,
  type MarketListing,
  type MarketPolicy,
  type UserBike,
  type UserPart,
} from '../api';

/**
 * THE listing surface (task 7dc61fc3). One place a player lists an item, whichever kind it is:
 * an ordinary in-game bike/part, or a frozen NFT. The currency is a choice made here — WATTS
 * always, ENJ when the item is an NFT — and the only thing that differs between them is our
 * cut, which is printed before the player commits.
 *
 * A frozen NFT is NOT a worthless one: it cannot be ridden, levelled, repaired or socketed, but
 * listing and selling it are exactly the things its owner CAN do.
 */

const qualityClass: Record<string, string> = {
  common: 'text-m2e-text-secondary',
  uncommon: 'text-m2e-success',
  rare: 'text-sky-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;

type SellableItem = {
  id: string;
  itemType: 'bike' | 'part';
  label: string;
  sublabel: string;
  quality?: string;
  isNft: boolean;
  /** Off-chain bikes must be fully repaired first; an NFT's condition is frozen at mint. */
  blockedReason: string | null;
};

function bikeToItem(b: UserBike): SellableItem {
  const isNft = b.tokenId != null;
  return {
    id: b.id,
    itemType: 'bike',
    label: `${b.quality} ${b.type}`,
    sublabel: isNft ? `NFT #${b.tokenId} · Lv.${b.level}` : `Lv.${b.level}`,
    quality: b.quality,
    isNft,
    blockedReason: !isNft && b.durability < 100
      ? 'Repair this bike to 100% durability before listing it.'
      : b.isEquipped
        ? 'Unequip this bike before listing it.'
        : null,
  };
}

function partToItem(p: UserPart): SellableItem {
  const isNft = p.tokenId != null;
  return {
    id: p.id,
    itemType: 'part',
    label: `${p.type} part`,
    sublabel: isNft ? `NFT #${p.tokenId} · Lv.${p.level}` : `Lv.${p.level}`,
    isNft,
    blockedReason: null,
  };
}

export function MarketSellPanel() {
  const qc = useQueryClient();
  const bikes = useQuery({ queryKey: ['userBikes'], queryFn: fetchUserBikes });
  // Listed parts included: a seller has to be able to CANCEL from the same surface they
  // listed on. (Listed bikes already come back from /bikes.)
  const parts = useQuery({ queryKey: ['userParts', 'include-listed'], queryFn: () => fetchUserParts(true) });
  const listings = useQuery({ queryKey: ['my-market-listings'], queryFn: fetchMyMarketListings, refetchInterval: 15_000 });
  const policy = useQuery({ queryKey: ['market-policy'], queryFn: fetchMarketPolicy });

  const invalidate = () => {
    // The keys the rest of the dashboard already uses ('userBikes' / 'userParts' / 'walletNfts'
    // on Profile, NftDetailModal, PartNftModal). A near-miss like 'user-parts' prefix-matches
    // nothing, so a just-listed part sat there looking free until an unrelated refetch.
    for (const key of ['market', 'my-market-listings', 'userBikes', 'userParts', 'walletNfts']) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };

  const listingByItemId = new Map<string, MarketListing>();
  for (const l of listings.data?.listings ?? []) {
    if (l.status === 'active' || l.status === 'settling') listingByItemId.set(l.itemId, l);
  }

  if (bikes.isLoading || parts.isLoading) return <GridSkeleton />;

  const items: SellableItem[] = [
    ...(bikes.data ?? []).map(bikeToItem),
    ...(parts.data ?? []).filter((p) => !p.socketedInBike).map(partToItem),
  ];
  const hasNft = items.some((i) => i.isNft);

  if (!items.length) {
    return (
      <div className="pixel-card p-6 text-m2e-text-secondary">
        You have nothing to sell yet. Earn or buy a bike, then come back.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Said BEFORE a currency is picked: a seller who chooses ENJ with an empty wallet hits a
          failure they cannot diagnose. */}
      {hasNft && policy.data && (
        <div className="pixel-card p-4 border-amber-500/60 text-sm text-m2e-text-secondary">
          {policy.data.enj.listingDepositWarning}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <SellCard
            key={item.id}
            item={item}
            listing={listingByItemId.get(item.id)}
            policy={policy.data}
            onChanged={invalidate}
          />
        ))}
      </div>
    </div>
  );
}

function SellCard({
  item,
  listing,
  policy,
  onChanged,
}: {
  item: SellableItem;
  listing?: MarketListing;
  policy?: MarketPolicy;
  onChanged: () => void;
}) {
  const [currency, setCurrency] = useState<'watts' | 'enj'>('watts');
  const [price, setPrice] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setErr(null);
    fn().then(onChanged).catch((e) => setErr((e as Error).message));
  };

  const list = useMutation({
    mutationFn: () => marketList({
      itemType: item.itemType,
      itemId: item.id,
      currency,
      ...(currency === 'watts' ? { priceWatts: Math.floor(Number(price)) } : { priceEnj: price.trim() }),
    }),
  });
  const cancel = useMutation({ mutationFn: () => marketCancel(listing!.id) });

  const cut = policy && (item.isNft
    ? (currency === 'enj' ? policy.cuts.nft_enj : policy.cuts.nft_watts)
    : policy.cuts.item_watts);

  const cutLabel = cut && (cut.taxRate > 0 && cut.royaltyRate > 0
    ? `Our cut ${pct(cut.totalRate)} — ${pct(cut.taxRate)} platform + ${pct(cut.royaltyRate)} royalty`
    : cut.royaltyRate > 0
      ? `Our cut ${pct(cut.royaltyRate)} — royalty only, no platform fee`
      : `Our cut ${pct(cut.taxRate)} — platform fee`);

  const priceValid = currency === 'watts'
    ? Number(price) >= 100
    : /^\d+(\.\d+)?$/.test(price.trim()) && Number(price) > 0;

  return (
    <div className="pixel-card p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className={`uppercase text-sm tracking-wide ${item.quality ? (qualityClass[item.quality] ?? '') : 'text-m2e-accent'}`}>
          {item.label}
        </span>
        <span className="text-xs text-m2e-text-secondary">{item.sublabel}</span>
      </div>

      {listing ? (
        <>
          <div className="text-sm text-m2e-text-secondary">
            Listed for {listing.currency === 'watts' ? `${(listing.priceWatts ?? 0).toLocaleString()} WATTS` : `${listing.priceEnj} ENJ`}
            {listing.status === 'settling' && ' · selling…'}
          </div>
          <div className="text-[11px] text-m2e-text-secondary">Buyer gets: {listing.buyerNote}</div>
          <button
            disabled={cancel.isPending || listing.status !== 'active'}
            onClick={() => run(() => cancel.mutateAsync())}
            className="px-3 py-2 border border-m2e-border text-m2e-text-secondary uppercase tracking-wide text-sm disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel listing'}
          </button>
        </>
      ) : item.blockedReason ? (
        <div className="text-[11px] text-m2e-text-secondary">{item.blockedReason}</div>
      ) : (
        <>
          {/* The item is the item; the currency is the decision. */}
          <div className="flex gap-2">
            {(['watts', 'enj'] as const).map((c) => {
              const allowed = item.isNft || c === 'watts';
              return (
                <button
                  key={c}
                  disabled={!allowed}
                  title={allowed ? undefined : policy?.offChainEnjRefusal}
                  onClick={() => { setCurrency(c); setPrice(''); }}
                  className={`flex-1 px-3 py-1.5 uppercase tracking-wide text-xs border-2 disabled:opacity-40 ${
                    currency === c
                      ? 'border-m2e-accent bg-m2e-accent/10 text-m2e-accent'
                      : 'border-m2e-border text-m2e-text-secondary'
                  }`}
                >
                  {c === 'watts' ? 'WATTS' : 'ENJ'}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode={currency === 'watts' ? 'numeric' : 'decimal'}
              placeholder={currency === 'watts' ? 'Price in WATTS' : 'Price in ENJ'}
              className="flex-1 min-w-0 bg-m2e-card-alt border border-m2e-border px-2 py-2 text-sm"
            />
            <button
              disabled={list.isPending || !priceValid}
              onClick={() => run(() => list.mutateAsync())}
              className="px-3 py-2 border border-m2e-accent text-m2e-accent uppercase tracking-wide text-xs disabled:opacity-50"
            >
              {list.isPending ? 'Listing…' : 'List'}
            </button>
          </div>

          {cutLabel && <div className="text-[11px] text-m2e-text-secondary">{cutLabel}</div>}
          {policy && (
            <div className="text-[11px] text-m2e-text-secondary">
              {policy.currencyCopy[currency]}
            </div>
          )}
        </>
      )}
      {err && <div className="text-m2e-danger text-xs">{err}</div>}
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
