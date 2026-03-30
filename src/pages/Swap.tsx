import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redo } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSigner } from '../hooks/useWebSigner';
import { WalletRequiredGuard } from '../components/WalletRequiredGuard';
import { StepTracker } from '../components/StepTracker';
import {
  fetchMainWallet,
  getSwapLiquidity,
  getSwapQuote,
  getSwapOrders,
  reserveSwapPrepare,
  reserveSwapSubmit,
  executeSwapPrepare,
  executeSwapSubmit,
  getSellOrders,
  sellSatPrepare,
  sellSatSubmit,
  cancelSellPrepare,
  cancelSellSubmit,
  type SwapOrder,
  type SellOrder,
} from '../api';
import { formatTokens, formatSats, decimalToBaseUnits } from '../utils/format';

type Tab = 'buy' | 'sell';

export function Swap() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Redo className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Swap</h1>
      </div>
      {isAuthenticated ? (
        <WalletRequiredGuard>
          <SwapContent />
        </WalletRequiredGuard>
      ) : (
        <p className="text-m2e-text-secondary text-lg text-center py-12">Sign in to swap tokens.</p>
      )}
    </div>
  );
}

function SwapContent() {
  const [tab, setTab] = useState<Tab>('buy');

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex gap-2">
        {(['buy', 'sell'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pixel-btn py-2.5 text-sm uppercase ${tab === t ? 'pixel-btn-primary' : 'pixel-btn-secondary'}`}
          >
            {t === 'buy' ? 'Buy SAT (BTC \u2192 SAT)' : 'Sell SAT (SAT \u2192 BTC)'}
          </button>
        ))}
      </div>

      {tab === 'buy' ? <BuyTab /> : <SellTab />}
    </div>
  );
}

function BuyTab() {
  const queryClient = useQueryClient();
  const { signTransaction, walletAddress } = useWebSigner();
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const satoshisIn = amount ? decimalToBaseUnits(amount) : '0';
  const [debouncedSatoshis, setDebouncedSatoshis] = useState('0');

  // Debounce quote fetching (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSatoshis(satoshisIn), 500);
    return () => clearTimeout(timer);
  }, [satoshisIn]);

  const { data: mainWallet, isLoading: walletLoading } = useQuery({ queryKey: ['main-wallet'], queryFn: fetchMainWallet });
  const { data: liquidity } = useQuery({ queryKey: ['swap-liquidity'], queryFn: getSwapLiquidity, refetchInterval: 60000 });
  const { data: quote } = useQuery({
    queryKey: ['swap-quote', debouncedSatoshis, slippage],
    queryFn: () => getSwapQuote(debouncedSatoshis, slippage),
    enabled: Number(debouncedSatoshis) > 0,
  });
  const { data: orders } = useQuery({ queryKey: ['swap-orders'], queryFn: getSwapOrders, refetchInterval: 10000 });

  const exceedsBalance = mainWallet ? BigInt(satoshisIn) > BigInt(mainWallet.btcBalance) : false;

  const activeOrder = orders?.find((o) => ['pending_reserve', 'reserved', 'pending_swap'].includes(o.status));

  // Reserve phase
  const reserveMutation = useMutation({
    mutationFn: async () => {
      const prepare = await reserveSwapPrepare(satoshisIn, slippage);
      const signed = await signTransaction({
        offlineBuffer: prepare.offlineBuffer,
        refundAddress: prepare.refundAddress,
        maxSatToSpend: prepare.maxSatToSpend,
        feeRate: prepare.feeRate,
        extraOutputs: prepare.extraOutputs,
      });
      return reserveSwapSubmit(prepare.prepareId, signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-orders'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      setSuccess('Swap reserved! Waiting for confirmation...');
      setError(null);
      setAmount('');
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); },
  });

  // Execute phase
  const executeMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const prepare = await executeSwapPrepare(orderId);
      const signed = await signTransaction({
        offlineBuffer: prepare.offlineBuffer,
        refundAddress: prepare.refundAddress,
        maxSatToSpend: prepare.maxSatToSpend,
        feeRate: prepare.feeRate,
        extraOutputs: prepare.extraOutputs,
      });
      return executeSwapSubmit(prepare.prepareId, signed);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['swap-orders'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      setSuccess(`Swap complete! Received ${formatTokens(data.tokensReceived)} SAT`);
      setError(null);
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); },
  });

  return (
    <div className="space-y-6">
      {error && <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{error}</div>}
      {success && <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 text-m2e-success">{success}</div>}

      {/* Active Order */}
      {activeOrder && (
        <div className="pixel-card p-5 space-y-4">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Active Swap</p>
          <StepTracker steps={[
            { label: 'Reserve', status: activeOrder.status === 'pending_reserve' ? 'active' : 'completed' },
            { label: 'Confirm', status: activeOrder.status === 'reserved' ? 'active' : activeOrder.status === 'pending_swap' ? 'completed' : 'pending' },
            { label: 'Execute', status: activeOrder.status === 'pending_swap' ? 'active' : 'pending' },
          ]} />
          <div className="text-sm space-y-1">
            <p>Sending: {formatSats(activeOrder.satoshisIn)} sats</p>
            <p>Expected: {formatTokens(activeOrder.expectedTokensOut)} SAT</p>
            <p className="text-m2e-text-muted">Status: {activeOrder.status}</p>
          </div>
          {activeOrder.status === 'reserved' && (
            <button
              onClick={() => executeMutation.mutate(activeOrder.id)}
              disabled={executeMutation.isPending}
              className="pixel-btn pixel-btn-primary w-full py-3 text-sm"
            >
              {executeMutation.isPending ? 'Executing...' : 'Execute Swap'}
            </button>
          )}
        </div>
      )}

      {/* Balances & Pool */}
      <div className="grid grid-cols-2 gap-4">
        <div className="pixel-card p-4">
          <p className="text-xs uppercase text-m2e-text-muted">Your BTC</p>
          <p className="text-xl">{walletLoading ? '...' : mainWallet ? formatSats(mainWallet.btcBalance) : '0'} <span className="text-sm text-m2e-text-muted">sats</span></p>
        </div>
        <div className="pixel-card p-4">
          <p className="text-xs uppercase text-m2e-text-muted">Pool SAT</p>
          <p className="text-xl">{liquidity ? formatTokens(liquidity.satReserve) : '0'} <span className="text-sm text-m2e-text-muted">SAT</span></p>
        </div>
      </div>

      {/* Amount Input */}
      {!activeOrder && (
        <div className="pixel-card p-5 space-y-4">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">BTC Amount (in BTC)</p>
          <input
            type="number"
            step="0.00000001"
            className="w-full bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-xl text-m2e-text focus:border-m2e-accent outline-none"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* Slippage */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-m2e-text-muted uppercase">Slippage:</span>
            {[100, 300, 500].map((bps) => (
              <button
                key={bps}
                onClick={() => setSlippage(bps)}
                className={`px-2 py-1 text-xs pixel-border ${slippage === bps ? 'bg-m2e-accent text-white border-m2e-accent-dark' : 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border'}`}
              >
                {bps / 100}%
              </button>
            ))}
          </div>

          {/* Quote Preview */}
          {quote?.poolAvailable && quote.tokensOut && (
            <div className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-m2e-text-muted">You receive</span>
                <span className="text-m2e-accent font-bold">{formatTokens(quote.tokensOut)} SAT</span>
              </div>
              {quote.price && (
                <div className="flex justify-between">
                  <span className="text-m2e-text-muted">Price</span>
                  <span>{formatTokens(quote.price)} SAT/BTC</span>
                </div>
              )}
            </div>
          )}

          {exceedsBalance && (
            <p className="text-m2e-danger text-sm">Amount exceeds your BTC balance.</p>
          )}

          <button
            onClick={() => reserveMutation.mutate()}
            disabled={Number(satoshisIn) <= 0 || reserveMutation.isPending || !quote?.poolAvailable || exceedsBalance}
            className="pixel-btn pixel-btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {reserveMutation.isPending ? 'Reserving...' : 'Reserve Swap'}
          </button>
        </div>
      )}

      {/* Past Orders */}
      <OrderHistory orders={orders?.filter((o) => o.status === 'completed' || o.status === 'failed') ?? []} />
    </div>
  );
}

function SellTab() {
  const queryClient = useQueryClient();
  const { signTransaction } = useWebSigner();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: mainWallet, isLoading: walletLoading } = useQuery({ queryKey: ['main-wallet'], queryFn: fetchMainWallet });
  const { data: sellOrders } = useQuery({ queryKey: ['sell-orders'], queryFn: getSellOrders, refetchInterval: 10000 });

  const activeListing = sellOrders?.find((o) => ['pending_approve', 'approved', 'pending_list', 'listed'].includes(o.status));
  const sellBaseUnits = amount ? decimalToBaseUnits(amount) : '0';
  const exceedsBalance = mainWallet ? BigInt(sellBaseUnits) > BigInt(mainWallet.satTokenBalance) : false;

  const sellMutation = useMutation({
    mutationFn: async () => {
      const tokenAmount = decimalToBaseUnits(amount);
      const prepare = await sellSatPrepare(tokenAmount);
      const signed = await signTransaction({
        offlineBuffer: prepare.offlineBuffer,
        refundAddress: prepare.refundAddress,
        maxSatToSpend: prepare.maxSatToSpend,
        feeRate: prepare.feeRate,
      });
      return sellSatSubmit(prepare.prepareId, signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sell-orders'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      setSuccess('Sell listing created!');
      setError(null);
      setAmount('');
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); },
  });

  const cancelMutation = useMutation({
    mutationFn: async (sellOrderId: string) => {
      const prepare = await cancelSellPrepare(sellOrderId);
      const signed = await signTransaction({
        offlineBuffer: prepare.offlineBuffer,
        refundAddress: prepare.refundAddress,
        maxSatToSpend: prepare.maxSatToSpend,
        feeRate: prepare.feeRate,
      });
      return cancelSellSubmit(prepare.prepareId, signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sell-orders'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      setSuccess('Listing cancelled');
      setError(null);
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); },
  });

  return (
    <div className="space-y-6">
      {error && <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{error}</div>}
      {success && <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 text-m2e-success">{success}</div>}

      {/* Active Listing */}
      {activeListing && (
        <div className="pixel-card p-5 space-y-3">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Active Sell Listing</p>
          <p className="text-lg">{formatTokens(activeListing.tokensListed)} SAT listed</p>
          <p className="text-xs text-m2e-text-muted">Status: {activeListing.status}</p>
          <button
            onClick={() => cancelMutation.mutate(activeListing.id)}
            disabled={cancelMutation.isPending}
            className="pixel-btn pixel-btn-danger px-4 py-2 text-xs"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Listing'}
          </button>
        </div>
      )}

      {/* Sell Form */}
      {!activeListing && (
        <div className="pixel-card p-5 space-y-4">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Sell SAT Tokens</p>
          <p className="text-xs text-m2e-text-muted">
            Available: {walletLoading ? '...' : mainWallet ? formatTokens(mainWallet.satTokenBalance) : '0'} SAT
          </p>
          <input
            type="number"
            step="0.01"
            className="w-full bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-xl text-m2e-text focus:border-m2e-accent outline-none"
            placeholder="SAT amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {exceedsBalance && (
            <p className="text-m2e-danger text-sm">Amount exceeds your SAT balance.</p>
          )}
          <button
            onClick={() => sellMutation.mutate()}
            disabled={!amount || parseFloat(amount) <= 0 || sellMutation.isPending || exceedsBalance}
            className="pixel-btn pixel-btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {sellMutation.isPending ? 'Creating Listing...' : 'Sell SAT'}
          </button>
        </div>
      )}

      {/* Sell Order History */}
      <SellOrderHistory orders={sellOrders?.filter((o) => ['completed', 'cancelled', 'failed'].includes(o.status)) ?? []} />
    </div>
  );
}

/** Normalize createdAt (handles both seconds and milliseconds timestamps) */
function normalizeTimestamp(ts: number): number {
  return ts < 1e12 ? ts * 1000 : ts;
}

function OrderHistory({ orders }: { orders: SwapOrder[] }) {
  if (!orders.length) return null;
  return (
    <div className="pixel-card p-5 space-y-3">
      <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Swap History</p>
      <div className="space-y-2">
        {orders.slice(0, 10).map((o) => (
          <div key={o.id} className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3 flex justify-between items-center">
            <div>
              <p className="text-sm">
                {formatSats(o.satoshisIn)} sats {'\u2192'} {formatTokens(o.expectedTokensOut)} SAT
              </p>
              <p className={`text-xs ${o.status === 'completed' ? 'text-m2e-success' : 'text-m2e-danger'}`}>
                {o.status}
              </p>
              {o.error && <p className="text-xs text-m2e-danger">{o.error}</p>}
            </div>
            <p className="text-[11px] text-m2e-text-muted">{new Date(normalizeTimestamp(o.createdAt)).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellOrderHistory({ orders }: { orders: SellOrder[] }) {
  if (!orders.length) return null;
  return (
    <div className="pixel-card p-5 space-y-3">
      <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Sell History</p>
      <div className="space-y-2">
        {orders.slice(0, 10).map((o) => (
          <div key={o.id} className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3 flex justify-between items-center">
            <div>
              <p className="text-sm">{formatTokens(o.tokensListed)} SAT</p>
              <p className={`text-xs ${o.status === 'completed' ? 'text-m2e-success' : o.status === 'cancelled' ? 'text-m2e-text-muted' : 'text-m2e-danger'}`}>
                {o.status}
              </p>
              {o.error && <p className="text-xs text-m2e-danger">{o.error}</p>}
            </div>
            <p className="text-[11px] text-m2e-text-muted">{new Date(normalizeTimestamp(o.createdAt)).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
