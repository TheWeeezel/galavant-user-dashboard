import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useWebSigner } from '../hooks/useWebSigner';
import {
  fetchStoreStatus,
  fetchMainWallet,
  storeBuyPrepare,
  storeBuySubmit,
  type StoreListingInfo,
} from '../api';
import { formatSats } from '../utils/format';
import { config } from '../config';

const BIKE_TYPE_DESCRIPTIONS: Record<string, string> = {
  commuter: 'A reliable daily rider. Balanced stats for casual walks.',
  touring: 'Built for distance. Higher recovery and durability.',
  racing: 'Speed-focused. Best earning potential per minute.',
  electric: 'Premium all-rounder. Strong base stats across the board.',
};

function bikeImageUrl(bikeType: string): string {
  return `${config.apiUrl}/art/bases/bike-${bikeType.toLowerCase()}.png`;
}

export function StoreContent({ onLoginRequest }: { onLoginRequest?: () => void }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { signTransaction, isReady } = useWebSigner();
  const [buyingType, setBuyingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: store, isLoading } = useQuery({
    queryKey: ['store-status'],
    queryFn: fetchStoreStatus,
    refetchInterval: 30000,
  });

  const { data: mainWallet } = useQuery({
    queryKey: ['main-wallet'],
    queryFn: fetchMainWallet,
    enabled: isAuthenticated,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (bikeType: string) => {
      const prepare = await storeBuyPrepare(bikeType);
      const signed = await signTransaction({
        offlineBuffer: prepare.offlineBuffer,
        refundAddress: prepare.refundAddress,
        maxSatToSpend: prepare.maxSatToSpend,
        feeRate: prepare.feeRate,
        extraOutputs: prepare.extraOutputs,
      });
      return storeBuySubmit(prepare.prepareId, signed);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['store-status'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      const displayName = store?.listings.find((l) => l.type === data.type)?.displayName ?? data.type;
      setSuccess(`You purchased a ${displayName} bike! Check your profile to see it.`);
      setError(null);
      setBuyingType(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess(null);
      setBuyingType(null);
    },
  });

  const handleBuy = (bikeType: string) => {
    if (!isAuthenticated) {
      onLoginRequest?.();
      return;
    }
    setError(null);
    setSuccess(null);
    setBuyingType(bikeType);
    purchaseMutation.mutate(bikeType);
  };

  if (isLoading) {
    return <p className="text-m2e-text-muted text-center py-12 animate-pulse">Loading store...</p>;
  }

  if (!store) {
    return <p className="text-m2e-text-secondary text-center py-12">Could not load store.</p>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{error}</div>}
      {success && <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 text-m2e-success">{success}</div>}

      {!store.enabled && (
        <div className="pixel-card p-4 border-m2e-warning bg-m2e-warning/10 text-m2e-warning text-center">
          The bike store is currently closed. Check back later!
        </div>
      )}

      {/* BTC Balance (when authenticated) */}
      {isAuthenticated && (
        <div className="pixel-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-m2e-text-muted mb-1">Your BTC Balance</p>
            <p className="text-2xl text-m2e-accent">
              {mainWallet ? `${formatSats(mainWallet.btcBalance)} sats` : '...'}
            </p>
          </div>
          <div className="text-right text-xs text-m2e-text-muted uppercase tracking-wide">
            <p>Sold today: {store.soldToday}{store.dailyCap > 0 ? ` / ${store.dailyCap}` : ''}</p>
            <p>Total sold: {store.totalSold}{store.totalCap > 0 ? ` / ${store.totalCap}` : ''}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {store.listings.map((listing) => (
          <StoreBikeCard
            key={listing.type}
            listing={listing}
            onBuy={() => handleBuy(listing.type)}
            isBuying={buyingType === listing.type}
            disabled={purchaseMutation.isPending || (!isReady && isAuthenticated)}
            btcBalance={mainWallet?.btcBalance}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
}

function StoreBikeCard({
  listing,
  onBuy,
  isBuying,
  disabled,
  btcBalance,
  isAuthenticated,
}: {
  listing: StoreListingInfo;
  onBuy: () => void;
  isBuying: boolean;
  disabled?: boolean;
  btcBalance?: string;
  isAuthenticated: boolean;
}) {
  const FEE_BUFFER = 100_000;
  const canAfford = !isAuthenticated || !btcBalance || BigInt(btcBalance) >= BigInt(listing.priceSats + FEE_BUFFER);
  const isDisabled = disabled || !listing.available || (isAuthenticated && !canAfford);

  return (
    <div className="pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center p-4">
        <img
          src={bikeImageUrl(listing.type)}
          alt={listing.displayName}
          className="w-full h-full object-contain pixel-render"
          loading="lazy"
        />
        {/* Price tag */}
        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-m2e-accent text-m2e-text-on-accent pixel-border shadow-sm tracking-wide border-m2e-accent-dark">
          {formatSats(String(listing.priceSats))} BTC
        </span>
        {/* Quality badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide pixel-badge-common">
          {listing.quality}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wide text-m2e-text">{listing.displayName}</span>
        </div>
        <p className="text-xs text-m2e-text-muted flex-1">
          {BIKE_TYPE_DESCRIPTIONS[listing.type] ?? 'A balance bike for your adventures.'}
        </p>

        {isAuthenticated && btcBalance && !canAfford && (
          <p className="text-[10px] text-m2e-danger">Insufficient BTC</p>
        )}

        <button
          onClick={onBuy}
          disabled={isDisabled}
          className="pixel-btn pixel-btn-primary w-full py-2 text-xs disabled:opacity-50"
        >
          {isBuying ? 'Purchasing...' : !listing.available ? 'Sold Out' : !isAuthenticated ? 'Login to Buy' : 'Buy with BTC'}
        </button>
      </div>
    </div>
  );
}
