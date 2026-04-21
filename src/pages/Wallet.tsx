import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Coins, Redo, Lock, Zap, ExternalLink } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSpendingWallet, fetchMainWallet, fetchWalletTransactions, type WalletTransaction } from '../api';
import { formatTokens, formatSats, formatTxAmount, txExplorerUrl } from '../utils/format';
import { BalanceCard } from '../components/BalanceCard';

const RECENT_SWAP_WINDOW_MS = 30 * 60 * 1000;
const BALANCE_PROPAGATION_WINDOW_MS = 5 * 60 * 1000;

function parseTxTime(createdAt: string): number {
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function findRecentSatSwap(txs: WalletTransaction[] | undefined, windowMs: number): WalletTransaction | null {
  if (!txs?.length) return null;
  const cutoff = Date.now() - windowMs;
  for (const tx of txs) {
    if (tx.type === 'swap' && tx.currency === 'sat_token' && tx.direction === 'in' && parseTxTime(tx.createdAt) >= cutoff) {
      return tx;
    }
  }
  return null;
}

export function Wallet() {
  const { isAuthenticated } = useAuth();

  const { data: spending, isLoading: spendingLoading } = useQuery({
    queryKey: ['spending-wallet'],
    queryFn: fetchSpendingWallet,
    enabled: isAuthenticated,
  });

  const { data: transactions } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: fetchWalletTransactions,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const recentSwapNotice = findRecentSatSwap(transactions, RECENT_SWAP_WINDOW_MS);
  const balanceUpdating = findRecentSatSwap(transactions, BALANCE_PROPAGATION_WINDOW_MS) !== null;

  const { data: mainWallet, isLoading: mainLoading } = useQuery({
    queryKey: ['main-wallet'],
    queryFn: fetchMainWallet,
    enabled: isAuthenticated,
    refetchInterval: balanceUpdating ? 15_000 : false,
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-m2e-text-secondary text-lg">Sign in to view your wallet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Coins className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Wallet</h1>
      </div>

      {/* Recent swap reassurance */}
      {recentSwapNotice && <RecentSwapBanner tx={recentSwapNotice} />}

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          label="SAP (In-Game)"
          amount={spendingLoading ? '...' : spending?.sap?.toLocaleString() ?? '0'}
          unit="SAP"
          icon={<img src="/assets/token-silver.png" alt="SAP" className="w-8 h-8" />}
          accent
        />
        <BalanceCard
          label="SAT Tokens"
          amount={mainLoading ? '...' : mainWallet ? formatTokens(mainWallet.satTokenBalance) : '0'}
          unit="SAT"
          note={balanceUpdating ? 'updating…' : undefined}
        />
        <BalanceCard
          label="BTC Balance"
          amount={mainLoading ? '...' : mainWallet ? formatSats(mainWallet.btcBalance) : '0'}
          unit="sats"
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ActionCard
          to="/swap"
          icon={<Redo className="w-6 h-6" />}
          title="Swap"
          description="Trade BTC for SAT tokens and back"
        />
        <ActionCard
          to="/convert"
          icon={<Coins className="w-6 h-6" />}
          title="Convert"
          description="Convert SAP points to SAT tokens"
        />
        <ActionCard
          to="/deposit"
          icon={<ExternalLink className="w-6 h-6" />}
          title="Deposit"
          description="Deposit SAT tokens back to SAP"
        />
        <ActionCard
          to="/staking"
          icon={<Lock className="w-6 h-6" />}
          title="Staking"
          description="Stake tokens for earning boosts"
        />
      </div>

      {/* Wallet Address */}
      {mainWallet?.address && (
        <div className="pixel-card p-4">
          <p className="text-xs uppercase tracking-widest text-m2e-text-muted mb-1">Wallet Address</p>
          <p className="text-sm font-mono text-m2e-text-secondary break-all">{mainWallet.address}</p>
        </div>
      )}

      {/* Transaction History */}
      <div className="pixel-card p-5 space-y-3">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Recent Transactions</p>
        {!transactions?.length ? (
          <p className="text-sm text-m2e-text-muted">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 20).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const { value, unit } = formatTxAmount(tx.amount, tx.currency);
  const sign = tx.direction === 'in' ? '+' : '-';
  const color = tx.direction === 'in' ? 'text-m2e-success' : 'text-m2e-danger';
  return (
    <div className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3 flex justify-between items-center gap-3">
      <div className="min-w-0">
        <p className="text-sm">
          <span className={color}>{sign}{value}</span>
          {' '}<span className="text-m2e-text-muted uppercase text-xs">{unit}</span>
        </p>
        <p className="text-[11px] text-m2e-text-muted">{tx.type.replace(/_/g, ' ')}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {tx.onChainTxId && (
          <a
            href={txExplorerUrl(tx.onChainTxId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-m2e-accent hover:text-m2e-accent-dark"
            title="View on explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <p className="text-[11px] text-m2e-text-muted">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function RecentSwapBanner({ tx }: { tx: WalletTransaction }) {
  const { value, unit } = formatTxAmount(tx.amount, tx.currency);
  return (
    <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-m2e-success mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-m2e-success font-bold uppercase tracking-wide">Swap complete</p>
        <p className="text-xs text-m2e-text-secondary mt-1">
          {value} {unit} credited on-chain. Your wallet balance can take a few minutes to catch up.
        </p>
        {tx.onChainTxId && (
          <a
            href={txExplorerUrl(tx.onChainTxId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-m2e-accent hover:text-m2e-accent-dark mt-1"
          >
            View on explorer <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function ActionCard({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link to={to} className="pixel-card p-4 flex items-center gap-3 hover:border-m2e-accent transition-colors group">
      <div className="w-10 h-10 flex items-center justify-center bg-m2e-accent/10 rounded text-m2e-accent group-hover:bg-m2e-accent/20 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-lg uppercase tracking-wide">{title}</p>
        <p className="text-xs text-m2e-text-muted">{description}</p>
      </div>
    </Link>
  );
}
