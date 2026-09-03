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
import { config } from '../config';

/**
 * THE listing surface (task 7dc61fc3). One place a player lists an item, whichever kind it is:
 * an ordinary in-game bike/part, or a frozen NFT. The currency is a choice made here — WATTS
 * always, ENJ when the item is an NFT — and the only thing that differs between them is our
 * cut, which is printed before the player commits.
 *
 * A frozen NFT is NOT a worthless one: it cannot be ridden, levelled, repaired or socketed, but
 * listing and selling it are exactly the things its owner CAN do.
 */

// Rarity as materials — the same gem tag the app's RarityTag renders.
const RARITY_MATERIALS: Record<string, { label: string; color: string }> = {
  common: { label: 'Steel', color: 'var(--color-m2e-common)' },
  uncommon: { label: 'Moss', color: 'var(--color-m2e-uncommon)' },
  rare: { label: 'Blue Hour', color: 'var(--color-m2e-rare)' },
  epic: { label: 'Orchid', color: 'var(--color-m2e-epic)' },
  legendary: { label: 'Brass', color: 'var(--color-m2e-legendary)' },
};

const PART_COLORS: Record<string, string> = {
  earning: 'var(--color-m2e-earning)',
  luck: 'var(--color-m2e-luck)',
  recovery: 'var(--color-m2e-recovery)',
  durability: 'var(--color-m2e-durability)',
};

const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;

type SellableItem = {
  id: string;
  itemType: 'bike' | 'part';
  /** The item's identity line (bike type / part type). */
  name: string;
  /** Material (bikes) or attribute (parts) — rendered as the gem tag. */
  gemLabel: string;
  gemColor: string;
    /** Item art, baked on white — shown on a white plate like everywhere else. */
  art: string;
  sublabel: string;
  /** Corner badge on the art plate (the app's EQUIPPED ribbon). */
  badge?: string;
  hp?: number;
  durability?: number;
  isNft: boolean;
  /** Off-chain bikes must be fully repaired first; an NFT's condition is frozen at mint. */
  blockedReason: string | null;
};

function bikeToItem(b: UserBike): SellableItem {
    const isNft = b.tokenId != null;
  const mat = RARITY_MATERIALS[b.quality] ?? RARITY_MATERIALS.common;
  return {
    id: b.id,
    itemType: 'bike',
    name: b.type,
    gemLabel: mat.label,
    gemColor: mat.color,
    art: b.imageUrl
      ? (b.imageUrl.startsWith('/') ? `${config.apiUrl}${b.imageUrl}` : b.imageUrl)
      : `${config.apiUrl}/art/bases/bike-${b.type.toLowerCase()}.png`,
        sublabel: isNft ? `Lv.${b.level} · NFT #${b.tokenId}` : `Lv.${b.level}`,
    badge: b.isEquipped ? 'Equipped' : undefined,
    hp: b.hp,
    durability: b.durability,
    isNft,
    // An NFT lists for ENJ, signed from the wallet that holds it (2026-09-03); its condition is
    // frozen at mint, so the repair and equip gates are for in-game bikes only.
    blockedReason: isNft
      ? null
      : b.durability < 100
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
    name: `${p.type} part`,
    gemLabel: p.type,
    gemColor: PART_COLORS[p.type] ?? 'var(--color-m2e-text-muted)',
    art: `/parts/part-${p.type.toLowerCase()}-lv${p.level}.png`,
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
  // The item decides the currency: an in-game item is a WATTS sale, an NFT an ENJ one.
  const [currency, setCurrency] = useState<'watts' | 'enj'>(item.isNft ? 'enj' : 'watts');
  const [price, setPrice] = useState('');
  const [err, setErr] = useState<string | null>(null);
  /** What the seller still has to do in their wallet after list / cancel of an ENJ listing. */
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(null);

  const run = (fn: () => Promise<unknown>) => {
    setErr(null);
    setNotice(null);
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
    ? Number(price) >= 1
    : /^\d+(\.\d+)?$/.test(price.trim()) && Number(price) > 0;

  return (
    <div className="pixel-card p-4 flex flex-col gap-3">
                  {/* The app's BikeCard anatomy: art plate (scanlines + ground strip, corner
          badge), Jersey name, LV/gem row, HP+DUR meters. */}
      <div className="pixel-border overflow-hidden relative bg-white">
        {item.badge && (
          <span className="absolute top-0 left-0 z-10 bg-m2e-accent text-white text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1">
            {item.badge}
          </span>
        )}
        <div
          className="h-36 flex items-center justify-center"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(60, 40, 70, 0.05) 0 2px, transparent 2px 4px)' }}
        >
          <img
            src={item.art}
            alt={item.name}
            className="h-full w-full object-contain pixel-render p-2"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        </div>
        <div
          className="h-2.5"
          style={{ background: 'repeating-linear-gradient(90deg, #D7C2B2 0 14px, #C9B2A0 14px 22px, #D7C2B2 22px 40px, #A57F93 40px 46px, #C9B2A0 46px 60px)' }}
        />
      </div>
      <div>
        <div className="text-2xl uppercase tracking-wide text-m2e-text leading-none truncate">{item.name}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-m2e-text-secondary uppercase tabular-nums">{item.sublabel}</span>
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider" style={{ color: item.gemColor }}>
            <span className="w-2 h-2 rotate-45 rounded-[1px] inline-block" style={{ backgroundColor: item.gemColor }} />
            {item.gemLabel}
          </span>
        </div>
        {item.hp != null && item.durability != null && (
          <div className="flex items-center gap-4 mt-2 text-[10px] font-bold tracking-wider">
            <Meter label="HP" value={item.hp} color="var(--color-m2e-success)" />
            <Meter label="DUR" value={item.durability} color="var(--color-m2e-info)" />
          </div>
        )}
      </div>

      {listing ? (
        <>
          <div className="text-sm text-m2e-text-secondary">
            Listed for {listing.currency === 'watts' ? `${(listing.priceWatts ?? 0).toLocaleString()} WATTS` : `${listing.priceEnj} ENJ`}
            {listing.status === 'settling' && ' · selling…'}
          </div>
          <div className="text-[11px] text-m2e-text-secondary">Buyer gets: {listing.buyerNote}</div>
          {listing.chainPending && policy && (
            <div className="text-[11px] text-amber-600">{policy.enj.listingSubmittedTitle} — {policy.enj.listingSubmittedNote}</div>
          )}
          <button
            disabled={cancel.isPending || listing.status !== 'active'}
            onClick={() => run(() => cancel.mutateAsync().then((r) => {
              if (r.pending && policy) setNotice({ title: policy.enj.cancelSubmittedTitle, text: policy.enj.cancelSubmittedNote });
            }))}
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
              // An in-game item is priced in WATTS; an NFT in ENJ (the buyer receives the token).
              const allowed = item.isNft ? c === 'enj' : c === 'watts';
              return (
                <button
                  key={c}
                  disabled={!allowed}
                  title={allowed ? undefined : item.isNft ? policy?.nftWattsRefusal : policy?.offChainEnjRefusal}
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
              onClick={() => run(() => list.mutateAsync().then(() => {
                if (currency === 'enj' && policy) setNotice({ title: policy.enj.listingSubmittedTitle, text: policy.enj.listingSubmittedNote });
              }))}
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
      {notice && (
        <div className="text-[11px] text-amber-600">
          <span className="uppercase tracking-wide">{notice.title}</span> — {notice.text}
        </div>
      )}
      {err && <div className="text-m2e-danger text-xs">{err}</div>}
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span style={{ color }}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-m2e-bg-alt border border-m2e-border overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-m2e-text tabular-nums">{Math.round(value)}%</span>
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
