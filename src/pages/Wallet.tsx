import { Link } from 'react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Coins, Redo, Lock, ExternalLink, ChevronLeft, Copy, Check,
  Download, Notes,
} from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSpendingWallet, fetchMainWallet, fetchWalletTransactions, type WalletTransaction } from '../api';
import { formatTokens, formatSats, formatTxAmount, txExplorerUrl } from '../utils/format';

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

function formatTxTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <Lock className="w-16 h-16 text-m2e-text-muted mx-auto" />
        <h2 className="text-3xl uppercase tracking-wide">Signed Out</h2>
        <p className="text-m2e-text-secondary text-lg">Sign in to view your wallet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero strip — terminal style */}
      <div className="border-b-2 border-m2e-border bg-m2e-text text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10">
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
              <div className="section-label">10 · Terminal</div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
              Your<br />
              <span className="text-m2e-accent">Wallet.</span>
            </h1>
            <div className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-[0.25em] text-white/60">
              <span className="w-2 h-2 rounded-full bg-m2e-success animate-pulse-ring" />
              Live · Synced {balanceUpdating ? 'every 15s' : 'on demand'}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 space-y-10">
        {/* Recent swap reassurance */}
        {recentSwapNotice && <RecentSwapBanner tx={recentSwapNotice} />}

        {/* Balances — oversized */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="section-label">Balances</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BigBalance
              label="SAP · In-Game"
              amount={spendingLoading ? '…' : spending?.sap?.toLocaleString() ?? '0'}
              unit="SAP"
              accent
              icon={<img src="/assets/token-silver.png" alt="SAP" className="w-10 h-10 pixel-render" />}
            />
            <BigBalance
              label="SAT Tokens"
              amount={mainLoading ? '…' : mainWallet ? formatTokens(mainWallet.satTokenBalance) : '0'}
              unit="SAT"
              note={balanceUpdating ? 'syncing' : undefined}
              icon={<img src="/assets/token-gold.png" alt="SAT" className="w-10 h-10 pixel-render" />}
            />
            <BigBalance
              label="BTC"
              amount={mainLoading ? '…' : mainWallet ? formatSats(mainWallet.btcBalance) : '0'}
              unit="sats"
              icon={<img src="/assets/token-btc.png" alt="BTC" className="w-10 h-10 pixel-render" />}
            />
          </div>
        </motion.section>

        {/* Action cards */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label">Actions</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionCard to="/swap" Icon={Redo} title="Swap" description="BTC ↔ SAT" />
            <ActionCard to="/convert" Icon={Coins} title="Convert" description="SAP → SAT" />
            <ActionCard to="/deposit" Icon={Download} title="Deposit" description="SAT → SAP" />
            <ActionCard to="/staking" Icon={Lock} title="Staking" description="Earn boosts" />
          </div>
        </motion.section>

        {/* Address */}
        {mainWallet?.address && (
          <motion.section
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-label">Wallet Address</div>
            <AddressBar address={mainWallet.address} />
          </motion.section>
        )}

        {/* Transaction log */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="section-label">Tx Log</div>
            {transactions?.length ? (
              <span className="text-xs uppercase tracking-[0.25em] text-m2e-text-muted">
                Last {Math.min(20, transactions.length)} events
              </span>
            ) : null}
          </div>

          <div className="pixel-card p-0 overflow-hidden">
            {/* Title bar */}
            <div className="bg-m2e-text text-m2e-accent px-5 py-3 border-b-2 border-m2e-border flex items-center justify-between">
              <span className="text-xs md:text-sm tracking-[0.3em] uppercase flex items-center gap-2">
                <Notes className="w-4 h-4" />
                &gt; Transaction Log
              </span>
              <span className="text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-m2e-success animate-pulse-ring" />
                Live
              </span>
            </div>

            <div className="scanlines-light">
              {!transactions?.length ? (
                <div className="p-10 text-center text-m2e-text-muted text-sm">
                  No transactions yet. Start walking, swapping or converting.
                </div>
              ) : (
                <div>
                  {transactions.slice(0, 20).map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function BigBalance({ label, amount, unit, icon, accent, note }: {
  label: string;
  amount: string;
  unit: string;
  icon?: React.ReactNode;
  accent?: boolean;
  note?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="pixel-card p-5 md:p-6 flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-m2e-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
            {label}
            {note && (
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-m2e-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-m2e-accent animate-pulse" />
                {note}
              </span>
            )}
          </div>
        </div>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl md:text-5xl leading-none truncate tracking-wide ${accent ? 'text-m2e-accent text-chroma-soft' : 'text-m2e-text'}`}>
          {amount}
        </span>
        <span className="text-sm text-m2e-text-muted uppercase tracking-[0.2em]">{unit}</span>
      </div>
    </motion.div>
  );
}

function ActionCard({ to, Icon, title, description }: {
  to: string;
  Icon: React.ComponentType<any>;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="group">
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="pixel-card p-4 md:p-5 flex flex-col items-start gap-3 h-full hover:border-m2e-accent-dark transition-colors relative overflow-hidden"
      >
        <div className="w-12 h-12 rounded-lg bg-m2e-accent/15 border border-m2e-accent/30 flex items-center justify-center text-m2e-accent group-hover:bg-m2e-accent group-hover:text-white transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-lg md:text-xl uppercase tracking-wide text-m2e-text leading-none mb-1">{title}</div>
          <div className="text-xs text-m2e-text-muted uppercase tracking-widest">{description}</div>
        </div>
      </motion.div>
    </Link>
  );
}

function AddressBar({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <div className="pixel-card p-4 md:p-5 flex items-center gap-3">
      <span className="text-m2e-accent text-xs md:text-sm tracking-[0.3em] uppercase shrink-0">ADDR&gt;</span>
      <code className="flex-1 text-xs md:text-sm font-mono text-m2e-text break-all leading-tight">
        {address}
      </code>
      <button
        onClick={copy}
        className={`inline-flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-widest pixel-border border-m2e-border bg-m2e-card-alt text-m2e-text-muted hover:text-m2e-accent hover:border-m2e-accent transition-colors shrink-0 ${copied ? 'text-m2e-success border-m2e-success' : ''}`}
        title="Copy address"
      >
        {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
      </button>
    </div>
  );
}

function TxRow({ tx, index }: { tx: WalletTransaction; index: number }) {
  const { value, unit } = formatTxAmount(tx.amount, tx.currency);
  const isIn = tx.direction === 'in';
  const sign = isIn ? '+' : '-';
  const color = isIn ? 'text-m2e-success' : 'text-m2e-danger';
  const typeLabel = tx.type.replace(/_/g, ' ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6) }}
      className="flex items-center gap-4 px-5 py-3 border-b border-m2e-border/40 last:border-0 hover:bg-m2e-accent/5 transition-colors font-mono text-sm"
    >
      <span className="text-[10px] text-m2e-text-muted tracking-widest w-14 shrink-0">
        {String(index + 1).padStart(3, '0')}
      </span>
      <span className={`shrink-0 text-lg leading-none ${color}`}>
        {isIn ? '←' : '→'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-base md:text-lg tracking-wide ${color}`}>{sign}{value}</span>
          <span className="text-m2e-text-muted uppercase text-xs tracking-widest">{unit}</span>
        </div>
        <div className="text-[10px] text-m2e-text-muted uppercase tracking-[0.25em] truncate">
          {typeLabel}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-[10px] uppercase tracking-[0.2em] text-m2e-text-muted">
        {tx.onChainTxId && (
          <a
            href={txExplorerUrl(tx.onChainTxId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-m2e-accent hover:text-m2e-accent-dark inline-flex items-center gap-1"
            title="View on explorer"
          >
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <span>{formatTxTime(tx.createdAt)}</span>
      </div>
    </motion.div>
  );
}

function RecentSwapBanner({ tx }: { tx: WalletTransaction }) {
  const { value, unit } = formatTxAmount(tx.amount, tx.currency);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pixel-card p-4 border-m2e-success bg-m2e-success/10 flex items-start gap-3"
    >
      <div className="w-2 h-2 rounded-full bg-m2e-success mt-2 flex-shrink-0 animate-pulse-ring" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-m2e-success uppercase tracking-wider">Swap complete</p>
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
    </motion.div>
  );
}
