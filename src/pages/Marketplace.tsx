import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, ChevronLeft, Cancel } from 'pixelarticons/react';
import { fetchMarketplace } from '../api';
import { ListingCard } from '../components/ListingCard';
import { NftDetailModal } from '../components/NftDetailModal';

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
      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider pixel-btn ${
        active ? 'pixel-btn-primary' : 'pixel-btn-secondary'
      }`}
    >
      {label}
    </button>
  );
}

export function Marketplace() {
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
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

  // Clear irrelevant sub-filters when item type changes
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

  // Reset page on any filter change
  useEffect(() => { setPage(1); }, [sortBy, quality, bikeType, partType, partLevel, debouncedMin, debouncedMax]);

  const hasActiveFilters = quality || bikeType || partType || partLevel || debouncedMin || debouncedMax;

  const clearAll = useCallback(() => {
    setQuality('');
    setBikeType('');
    setPartType('');
    setPartLevel('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setPage(1);
  }, []);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <Link to="/" className="p-3 pixel-btn pixel-btn-secondary">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
          <ShoppingCart className="w-10 h-10 text-m2e-accent" />
          MARKETPLACE
        </h1>
      </div>

      {/* Item type chips */}
      <div className="flex flex-wrap gap-2">
        {ITEM_TYPES.map((t) => (
          <Chip key={t.value} label={t.label} active={itemType === t.value} onClick={() => handleItemTypeChange(t.value)} />
        ))}
      </div>

      {/* Sort chips */}
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((s) => (
          <Chip key={s.value} label={s.label} active={sortBy === s.value} onClick={() => setSortBy(s.value)} />
        ))}
      </div>

      {/* Collapsible filters */}
      <div className="pixel-card overflow-hidden">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-wider text-m2e-text-secondary hover:bg-m2e-card-alt transition-colors"
        >
          <span>Filters {hasActiveFilters ? '(active)' : ''}</span>
          <span className="text-xs">{filtersOpen ? '▲' : '▼'}</span>
        </button>

        {filtersOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-m2e-border">
            {/* Quality */}
            {(itemType === '' || itemType === 'bike') && (
              <div className="space-y-2 pt-3">
                <div className="text-xs font-black uppercase tracking-widest text-m2e-text-muted">Quality</div>
                <div className="flex flex-wrap gap-2">
                  {QUALITIES.map((q) => (
                    <Chip key={q} label={q} active={quality === q} onClick={() => setQuality(quality === q ? '' : q)} />
                  ))}
                </div>
              </div>
            )}

            {/* Bike type */}
            {(itemType === '' || itemType === 'bike') && (
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-m2e-text-muted">Bike Type</div>
                <div className="flex flex-wrap gap-2">
                  {BIKE_TYPES.map((bt) => (
                    <Chip key={bt} label={bt} active={bikeType === bt} onClick={() => setBikeType(bikeType === bt ? '' : bt)} />
                  ))}
                </div>
              </div>
            )}

            {/* Part type */}
            {(itemType === '' || itemType === 'part') && (
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-m2e-text-muted">Part Type</div>
                <div className="flex flex-wrap gap-2">
                  {PART_TYPES.map((pt) => (
                    <Chip key={pt} label={pt} active={partType === pt} onClick={() => setPartType(partType === pt ? '' : pt)} />
                  ))}
                </div>
              </div>
            )}

            {/* Part level */}
            {(itemType === '' || itemType === 'part') && (
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-m2e-text-muted">Part Level</div>
                <div className="flex flex-wrap gap-2">
                  {PART_LEVELS.map((lv) => (
                    <Chip key={lv} label={`Lv.${lv}`} active={partLevel === String(lv)} onClick={() => setPartLevel(partLevel === String(lv) ? '' : String(lv))} />
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-m2e-text-muted">Price Range (SAT)</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-28 px-3 py-2 text-sm font-bold bg-m2e-bg-alt text-m2e-text pixel-border outline-none focus:border-m2e-accent"
                />
                <span className="text-m2e-text-muted font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-28 px-3 py-2 text-sm font-bold bg-m2e-bg-alt text-m2e-text pixel-border outline-none focus:border-m2e-accent"
                />
              </div>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase tracking-wider pixel-btn pixel-btn-secondary text-m2e-danger"
              >
                <Cancel className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-m2e-text-muted text-sm py-8 text-center">Loading marketplace...</div>
      ) : error ? (
        <div className="text-red-400 text-sm py-8 text-center">Failed to load marketplace</div>
      ) : data && data.listings.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={listing.itemType === 'bike' ? () => setSelectedNftId(listing.itemId) : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 pixel-btn pixel-btn-secondary disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm font-black text-m2e-text-secondary uppercase tracking-wider">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-4 py-2 pixel-btn pixel-btn-secondary disabled:opacity-40"
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
              className="mt-3 px-4 py-2 text-xs font-black uppercase tracking-wider pixel-btn pixel-btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNftId && (
        <NftDetailModal nftId={selectedNftId} onClose={() => setSelectedNftId(null)} />
      )}
    </div>
  );
}
