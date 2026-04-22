import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSigner } from '../hooks/useWebSigner';
import { WalletRequiredGuard } from '../components/WalletRequiredGuard';
import { StepTracker } from '../components/StepTracker';
import {
  fetchMainWallet,
  depositTokensPrepare,
  depositTokensSubmit,
  fetchPendingDeposits,
  type PendingDeposit,
} from '../api';
import { formatTokens, decimalToBaseUnits, txExplorerUrl } from '../utils/format';

export function Deposit() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <ExternalLink className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Deposit SAT to SAP</h1>
      </div>
      {isAuthenticated ? (
        <WalletRequiredGuard>
          <DepositContent />
        </WalletRequiredGuard>
      ) : (
        <p className="text-m2e-text-secondary text-lg text-center py-12">Sign in to deposit tokens.</p>
      )}
    </div>
  );
}

function DepositContent() {
  const queryClient = useQueryClient();
  const { signTransaction } = useWebSigner();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: mainWallet, isLoading: walletLoading } = useQuery({ queryKey: ['main-wallet'], queryFn: fetchMainWallet });
  const { data: pendingDeposits } = useQuery({
    queryKey: ['pending-deposits'],
    queryFn: fetchPendingDeposits,
    refetchInterval: 10_000,
  });

  const activeDeposit = pendingDeposits?.find((d) => d.status === 'pending') ?? null;
  const recentlyConfirmed = pendingDeposits?.find((d) => d.status === 'confirmed') ?? null;
  const recentlyFailed = pendingDeposits?.find((d) => d.status === 'failed') ?? null;

  const depositBaseUnits = amount ? decimalToBaseUnits(amount) : '0';
  const exceedsBalance = mainWallet ? BigInt(depositBaseUnits) > BigInt(mainWallet.satTokenBalance) : false;
  const formDisabled = !!activeDeposit;

  const depositMutation = useMutation({
    mutationFn: async () => {
      const tokenAmount = decimalToBaseUnits(amount);
      const prepare = await depositTokensPrepare(tokenAmount);
      const signed = await signTransaction({
        offlineBuffer: prepare.offlineBuffer,
        refundAddress: prepare.refundAddress,
        maxSatToSpend: prepare.maxSatToSpend,
        feeRate: prepare.feeRate,
        extraOutputs: prepare.extraOutputs,
      });
      return depositTokensSubmit(prepare.prepareId, signed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      setError(null);
      setAmount('');
    },
    onError: (err: Error) => { setError(err.message); },
  });

  return (
    <div className="space-y-6">
      {error && <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{error}</div>}

      {activeDeposit && <ActiveDepositCard deposit={activeDeposit} />}
      {!activeDeposit && recentlyConfirmed && <ConfirmedDepositCard deposit={recentlyConfirmed} />}
      {!activeDeposit && !recentlyConfirmed && recentlyFailed && <FailedDepositCard deposit={recentlyFailed} />}

      {/* Balance */}
      <div className="pixel-card p-5">
        <p className="text-xs uppercase tracking-widest text-m2e-text-muted mb-1">Available SAT Tokens</p>
        <p className="text-3xl text-m2e-accent">{walletLoading ? '...' : mainWallet ? formatTokens(mainWallet.satTokenBalance) : '0'}</p>
      </div>

      {/* Deposit Form */}
      <div className="pixel-card p-5 space-y-4">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">SAT to Deposit (in SAT)</p>
        <input
          type="number"
          step="0.01"
          className="w-full bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-xl text-m2e-text focus:border-m2e-accent outline-none disabled:opacity-60"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={formDisabled}
        />
        <p className="text-xs text-m2e-text-muted">
          Your SAT tokens will be converted back to SAP points at the current difficulty rate.
          SAP is credited only after the on-chain transaction is mined.
        </p>

        {exceedsBalance && !formDisabled && (
          <p className="text-m2e-danger text-sm">Amount exceeds your SAT balance.</p>
        )}

        <button
          onClick={() => depositMutation.mutate()}
          disabled={formDisabled || !amount || parseFloat(amount) <= 0 || depositMutation.isPending || exceedsBalance}
          className="pixel-btn pixel-btn-primary w-full py-4 text-lg disabled:opacity-50"
        >
          {formDisabled
            ? 'Deposit in progress — please wait'
            : depositMutation.isPending
              ? 'Submitting...'
              : 'Deposit'}
        </button>
      </div>

      {/* How it works */}
      <div className="pixel-card p-5 space-y-3">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">How Deposits Work</p>
        <ul className="space-y-2 text-sm text-m2e-text-secondary list-disc list-inside">
          <li>Send SAT tokens from your on-chain wallet back to the game</li>
          <li>Receive SAP points at the current conversion difficulty rate</li>
          <li>Your wallet extension will prompt you to sign the transaction</li>
          <li>SAP is credited after the transaction is mined (usually 1-2 minutes)</li>
        </ul>
      </div>
    </div>
  );
}

function ActiveDepositCard({ deposit }: { deposit: PendingDeposit }) {
  return (
    <div className="pixel-card p-5 space-y-4">
      <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Active Deposit</p>
      <StepTracker
        steps={[
          { label: 'Signed', status: 'completed' },
          { label: 'Broadcast', status: 'completed' },
          { label: 'Mining', status: 'active' },
          { label: 'Credited', status: 'pending' },
        ]}
      />
      <div className="text-sm space-y-1">
        <p>Depositing: <span className="text-m2e-accent">{formatTokens(deposit.amount.toString())} SAT</span></p>
      </div>
      <div className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-m2e-accent animate-pulse" />
          <p className="text-sm text-m2e-accent font-bold uppercase">Waiting for confirmation</p>
        </div>
        <p className="text-xs text-m2e-text-muted">
          Your deposit transaction has been broadcast. SAP will be credited once the network confirms it —
          usually 1-2 minutes. You can safely leave this page and come back.
        </p>
        <a
          href={txExplorerUrl(deposit.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-m2e-accent hover:text-m2e-accent-dark"
        >
          View on explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function ConfirmedDepositCard({ deposit }: { deposit: PendingDeposit }) {
  return (
    <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-m2e-success mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-m2e-success font-bold uppercase tracking-wide">Deposit confirmed</p>
        <p className="text-xs text-m2e-text-secondary mt-1">
          {formatTokens(deposit.amount.toString())} SAT credited as SAP.
        </p>
        <a
          href={txExplorerUrl(deposit.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-m2e-accent hover:text-m2e-accent-dark mt-1"
        >
          View on explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function FailedDepositCard({ deposit }: { deposit: PendingDeposit }) {
  return (
    <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-m2e-danger mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-m2e-danger font-bold uppercase tracking-wide">Deposit failed</p>
        <p className="text-xs text-m2e-text-secondary mt-1">
          {deposit.error ?? 'Transaction did not confirm. No SAP was credited.'}
        </p>
        <a
          href={txExplorerUrl(deposit.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-m2e-accent hover:text-m2e-accent-dark mt-1"
        >
          View on explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
