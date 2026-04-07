import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useWebSigner } from '../hooks/useWebSigner';
import {
  fetchStoreStatus,
  fetchMainWallet,
  storeBuyPrepare,
  storeBuySubmit,
} from '../api';
import { formatSats } from '../utils/format';
import { ListingCard } from '../components/ListingCard';

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {store.listings.map((listing) => {
          const FEE_BUFFER = 100_000;
          const btcBalance = mainWallet?.btcBalance;
          const canAfford =
            !isAuthenticated ||
            !btcBalance ||
            BigInt(btcBalance) >= BigInt(listing.priceSats + FEE_BUFFER);
          return (
            <ListingCard
              key={listing.type}
              storeListing={listing}
              onBuy={() => handleBuy(listing.type)}
              isBuying={buyingType === listing.type}
              disabled={purchaseMutation.isPending || (!isReady && isAuthenticated)}
              canAfford={canAfford}
              isAuthenticated={isAuthenticated}
            />
          );
        })}
      </div>
    </div>
  );
}
