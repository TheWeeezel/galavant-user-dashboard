import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShoppingCart, ChevronLeft, Cancel, Coins,
  Settings2, SortVertical, Check, Search,
} from 'pixelarticons/react';
import { fetchMarketplace, fetchStats } from '../api';
import { ListingCard } from '../components/ListingCard';
import { NftDetailModal } from '../components/NftDetailModal';
import { StoreContent } from './Store';
import { LoginModal } from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';

type ItemType = '' | 'bike' | 'part' | 'tool';
type SortBy = 'newest' | 'price_asc' | 'price_desc' | 'level_desc' | 'level_asc';

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'bike', label: 'Bike' },
  { value: 'part', label: 'Part' },
  { value: 'tool', label: 'Tool' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'level_desc', label: 'Level ↓' },
  { value: 'level_asc', label: 'Level ↑' },
];

const QUALITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const BIKE_TYPES = ['commuter', 'touring', 'racing', 'electric'];
const PART_TYPES = ['earning', 'luck', 'recovery', 'durability'];
const PART_LEVELS = [1, 2, 3, 4, 5];

function formatSat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs uppercase tracking-wider pixel-btn ${
        active ? 'pixel-btn-primary' : 'pixel-btn-secondary'
      }`}
    >
      {active && <Check className="w-3 h-3 mr-1" />}
      {label}
    </button>
  );
}

export function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [itemType, setItemType] = useState<ItemType>('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [quality, setQuality] = useState('');
  const [bikeType, setBikeType] = useState('');
  const [partType, setPartType] = useState('');
  const [partLevel, setPartLevel] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedMin = useDebounce(minPriceInput, 500);
  const debouncedMax = useDebounce(maxPriceInput, 500);

  const handleItemTypeChange = useCallback((type: ItemType) => {
    setItemType(type);
    if (type !== 'bike') {
      setBikeType('');
      setQuality('');
    }
    if (type !== 'part') {
      setPartType('');
      setPartLevel('');
    }
    setPage(1);
  }, []);

  useEffect(() => { setPage(1); }, [sortBy, quality, bikeType, partType, partLevel, debouncedMin, debouncedMax]);

  const hasActiveFilters = Boolean(quality || bikeType || partType || partLevel || debouncedMin || debouncedMax);
  const activeFilterCount = [quality, bikeType, partType, partLevel, debouncedMin, debouncedMax].filter(Boolean).length;

  const clearAll = useCallback(() => {
    setQuality('');
    setBikeType('');
    setPartType('');
    setPartLevel('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setPage(1);
  }, []);

  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  const { data, isLoading, error } = useQuery({
    queryKey: ['marketplace-page', itemType, sortBy, quality, bikeType, partType, partLevel, debouncedMin, debouncedMax, page],
    queryFn: () => fetchMarketplace({
      page,
      limit: 24,
      sortBy,
      itemType: itemType || undefined,
      quality: quality || undefined,
      bikeType: bikeType || undefined,
      partType: partType || undefined,
      partLevel: partLevel ? Number(partLevel) : undefined,
      minPrice: debouncedMin ? Number(debouncedMin) : undefined,
      maxPrice: debouncedMax ? Number(debouncedMax) : undefined,
    }),
    retry: false,
  });

  const tickerItems = useMemo(() => {
    if (!stats.data) return null;
    const s = stats.data;
    return [
      `LIVE · ${s.activeListings ?? 0} LISTINGS`,
      `FLOOR · ${(s.floorPrice ?? 0) > 0 ? formatSat(s.floorPrice) + ' SAP' : '—'}`,
      `AVG · ${(s.avgListingPrice ?? 0) > 0 ? formatSat(s.avgListingPrice) + ' SAP' : '—'}`,
      `VOLUME · ${(s.totalVolume ?? 0) > 0 ? formatSat(s.totalVolume) + ' SAP' : '—'}`,
      `SOLD · ${(s.totalSold ?? 0).toLocaleString()}`,
    ];
  }, [stats.data]);

  return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-text text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-m2e-accent text-xs uppercase tracking-[0.25em]">
                  <ChevronLeft className="w-4 h-4" />
                  Home
                </Link>
                <span className="text-white/30">/</span>
                <div className="section-label">09 · Shop Floor</div>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
                The<br />
                <span className="text-m2e-accent">Marketplace.</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl">
                Buy your first bike from the store. Trade player-owned bikes and parts below.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Live ticker */}
      {tickerItems && (
        <div className="bg-m2e-card-alt text-m2e-text border-b-2 border-m2e-border overflow-hidden py-2.5">
          <div className="flex gap-10 whitespace-nowrap animate-marquee-fast will-change-transform">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="flex items-center gap-10 text-xs md:text-sm uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 bg-m2e-accent inline-block" />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14 space-y-16">
        {/* ── Bike Store (BTC) ──────────────────────────────────────── */}
        <motion.section
          className="space-y-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="section-label">Storefront</div>
              <h2 className="text-3xl md:text-5xl uppercase tracking-wide text-m2e-text leading-none flex items-center gap-3">
                Bike Store
                <span className="px-3 py-1 text-sm md:text-base tracking-[0.25em] pixel-border bg-m2e-accent text-m2e-text-on-accent border-m2e-accent-dark">
                  BTC
                </span>
              </h2>
            </div>
            <p className="text-base text-m2e-text-secondary max-w-md">
              New to Galavant? Start here. Buy a bike with BTC and start earning today.
            </p>
          </div>
          <StoreContent onLoginRequest={() => setShowLogin(true)} />
        </motion.section>

        {/* ── Player Marketplace (SAP) ─────────────────────────────── */}
        <motion.section
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="section-label">Player Trades</div>
              <h2 className="text-3xl md:text-5xl uppercase tracking-wide text-m2e-text leading-none flex items-center gap-3">
                Player Market
                <span className="px-3 py-1 text-sm md:text-base tracking-[0.25em] pixel-border bg-m2e-card border-m2e-border text-m2e-text-secondary">
                  SAP
                </span>
              </h2>
            </div>
            {data && (
              <div className="text-sm text-m2e-text-secondary">
                <span className="text-m2e-accent text-xl">{data.total.toLocaleString()}</span> listings found
              </div>
            )}
          </div>

          {/* Filter bay */}
          <div className="pixel-card p-0 overflow-hidden">
            {/* Item type row */}
            <div className="p-4 space-y-4 border-b border-m2e-border/50">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted mr-2">
                  <Search className="w-3.5 h-3.5" />
                  Type
                </div>
                {ITEM_TYPES.map((t) => (
                  <Chip key={t.value} label={t.label} active={itemType === t.value} onClick={() => handleItemTypeChange(t.value)} />
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted mr-2">
                  <SortVertical className="w-3.5 h-3.5" />
                  Sort
                </div>
                {SORT_OPTIONS.map((s) => (
                  <Chip key={s.value} label={s.label} active={sortBy === s.value} onClick={() => setSortBy(s.value)} />
                ))}
              </div>
            </div>

            {/* Collapsible filters */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs uppercase tracking-widest text-m2e-text-secondary hover:bg-m2e-card-alt transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Advanced Filters
                {hasActiveFilters && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] bg-m2e-accent text-m2e-text-on-accent rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span className="text-xs">{filtersOpen ? '▲' : '▼'}</span>
            </button>

            {filtersOpen && (
              <div className="px-4 pb-4 space-y-5 border-t border-m2e-border/50 bg-m2e-card-alt/40">
                {(itemType === '' || itemType === 'bike') && (
                  <FilterGroup label="Quality">
                    {QUALITIES.map((q) => (
                      <Chip key={q} label={q} active={quality === q} onClick={() => setQuality(quality === q ? '' : q)} />
                    ))}
                  </FilterGroup>
                )}

                {(itemType === '' || itemType === 'bike') && (
                  <FilterGroup label="Bike Type">
                    {BIKE_TYPES.map((bt) => (
                      <Chip key={bt} label={bt} active={bikeType === bt} onClick={() => setBikeType(bikeType === bt ? '' : bt)} />
                    ))}
                  </FilterGroup>
                )}

                {(itemType === '' || itemType === 'part') && (
                  <FilterGroup label="Part Type">
                    {PART_TYPES.map((pt) => (
                      <Chip key={pt} label={pt} active={partType === pt} onClick={() => setPartType(partType === pt ? '' : pt)} />
                    ))}
                  </FilterGroup>
                )}

                {(itemType === '' || itemType === 'part') && (
                  <FilterGroup label="Part Level">
                    {PART_LEVELS.map((lv) => (
                      <Chip key={lv} label={`Lv.${lv}`} active={partLevel === String(lv)} onClick={() => setPartLevel(partLevel === String(lv) ? '' : String(lv))} />
                    ))}
                  </FilterGroup>
                )}

                <div className="space-y-2 pt-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    Price Range (SAP)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-32 px-3 py-2 text-sm bg-m2e-card text-m2e-text pixel-border border-m2e-border outline-none focus:border-m2e-accent font-mono"
                    />
                    <span className="text-m2e-text-muted">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-32 px-3 py-2 text-sm bg-m2e-card text-m2e-text pixel-border border-m2e-border outline-none focus:border-m2e-accent font-mono"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider pixel-btn pixel-btn-secondary text-m2e-danger"
                  >
                    <Cancel className="w-4 h-4" />
                    Clear {activeFilterCount} Filter{activeFilterCount !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="pixel-card aspect-[3/4] animate-pulse bg-m2e-card-alt" />
              ))}
            </div>
          ) : error ? (
            <div className="text-m2e-danger text-sm py-8 text-center">Failed to load marketplace</div>
          ) : data && data.listings.length > 0 ? (
            <>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {data.listings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <ListingCard
                      listing={listing}
                      onClick={listing.itemType === 'bike' ? () => setSelectedNftId(listing.itemId) : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-5 py-3 pixel-btn pixel-btn-secondary disabled:opacity-40 inline-flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <div className="px-4 py-2 pixel-border bg-m2e-card-alt border-m2e-border text-sm uppercase tracking-widest text-m2e-text-secondary">
                    <span className="text-m2e-accent">{data.page}</span>
                    <span className="text-m2e-border mx-1">/</span>
                    {data.totalPages}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="px-5 py-3 pixel-btn pixel-btn-secondary disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="pixel-card p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-m2e-text-muted mx-auto mb-3" />
              <div className="text-m2e-text-muted text-sm">No listings found</div>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="mt-3 px-4 py-2 text-xs uppercase tracking-wider pixel-btn pixel-btn-secondary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </motion.section>

        {selectedNftId && (
          <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
        )}

        {!isAuthenticated && (
          <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
        )}
      </div>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pt-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-m2e-text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
