import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redo, Coins } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchSpendingWallet,
  fetchConversionPool,
  fetchConversionHistory,
  previewConversion,
  executeConversion,
  type ConversionTransaction,
} from '../api';
import { formatTokens } from '../utils/format';

function groupConversions(txs: ConversionTransaction[]) {
  const tokenIns = txs.filter((tx) => tx.currency === 'sat_token' && tx.direction === 'in');
  const pointOuts = txs.filter((tx) => tx.currency === 'sap' && tx.direction === 'out');
  return tokenIns.map((tokenTx) => {
    const match = pointOuts.find(
      (ptx) => Math.abs(new Date(ptx.createdAt).getTime() - new Date(tokenTx.createdAt).getTime()) < 5000,
    );
    return {
      id: tokenTx.id,
      tokensReceived: tokenTx.amount.toString(),
      pointsSpent: match?.amount ?? 0,
      txHash: tokenTx.onChainTxId,
      createdAt: tokenTx.createdAt,
    };
  });
}

export function Convert() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const parsedAmount = parseInt(amount, 10) || 0;

  const { data: wallet } = useQuery({
    queryKey: ['spending-wallet'],
    queryFn: fetchSpendingWallet,
    enabled: isAuthenticated,
  });

  const { data: pool } = useQuery({
    queryKey: ['conversion-pool'],
    queryFn: fetchConversionPool,
    enabled: isAuthenticated,
  });

  const { data: history } = useQuery({
    queryKey: ['conversion-history'],
    queryFn: fetchConversionHistory,
    enabled: isAuthenticated,
  });

  const { data: preview } = useQuery({
    queryKey: ['conversion-preview', parsedAmount],
    queryFn: () => previewConversion(parsedAmount),
    enabled: isAuthenticated && parsedAmount >= 100,
  });

  const convertMutation = useMutation({
    mutationFn: (pts: number) => executeConversion(pts),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['spending-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-pool'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-history'] });
      setSuccessMsg(`Converted ${data.pointsDebited} SAP to ${formatTokens(data.tokensReceived)} SAT`);
      setErrorMsg(null);
      setAmount('');
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg(null);
    },
  });

  const handleMax = useCallback(() => {
    if (wallet?.sap) setAmount(wallet.sap.toString());
  }, [wallet]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-m2e-text-secondary text-lg">Sign in to convert SAP to SAT tokens.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Redo className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Convert SAP to SAT</h1>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 text-m2e-success">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{errorMsg}</div>
      )}

      {/* Balance */}
      <div className="pixel-card p-5">
        <p className="text-xs uppercase tracking-widest text-m2e-text-muted mb-1">Available SAP</p>
        <p className="text-3xl text-m2e-accent">{wallet?.sap?.toLocaleString() ?? '0'}</p>
      </div>

      {/* Amount Input */}
      <div className="pixel-card p-5 space-y-3">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">SAP to Convert</p>
        <div className="flex gap-3">
          <input
            type="number"
            className="flex-1 bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-xl text-m2e-text focus:border-m2e-accent outline-none"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={100}
          />
          <button onClick={handleMax} className="pixel-btn pixel-btn-outline px-4 py-2 text-sm">
            Max
          </button>
        </div>
        <p className="text-xs text-m2e-text-muted">Minimum: 100 SAP</p>
      </div>

      {/* Preview */}
      {parsedAmount >= 100 && preview && (
        <div className="pixel-card p-5 space-y-3">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Conversion Preview</p>
          <div className="space-y-2">
            <Row label="You send" value={`${parsedAmount.toLocaleString()} SAP`} />
            <Row label="You receive" value={`${formatTokens(preview.expectedTokens)} SAT`} accent />
            <Row label="Rate" value={`${preview.conversionRate.toFixed(1)} SAP / 1 SAT`} />
            <Row label="Difficulty" value={`${preview.difficultyMultiplier.toFixed(2)}x`} />
            <Row label="Pool used" value={`${preview.poolUsedPercent.toFixed(1)}%`} />
          </div>
        </div>
      )}

      {wallet && parsedAmount > wallet.sap && (
        <p className="text-m2e-danger text-sm">Amount exceeds your SAP balance.</p>
      )}

      <button
        onClick={() => convertMutation.mutate(parsedAmount)}
        disabled={parsedAmount < 100 || convertMutation.isPending || (wallet ? parsedAmount > wallet.sap : false)}
        className="pixel-btn pixel-btn-primary w-full py-4 text-lg disabled:opacity-50"
      >
        {convertMutation.isPending ? 'Converting...' : 'Convert'}
      </button>

      {/* Pool Status */}
      {pool && (
        <div className="pixel-card p-5 space-y-3">
          <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Conversion Pool</p>
          <div className="bg-m2e-bg-alt border border-m2e-border-light rounded-sm h-3 overflow-hidden">
            <div className="bg-m2e-accent h-full transition-all" style={{ width: `${Math.min(pool.usedPercent, 100)}%` }} />
          </div>
          <p className="text-xs text-m2e-text-muted">
            {formatTokens(pool.totalConverted)} of 84M SAT converted ({pool.usedPercent < 0.01 ? '<0.01' : pool.usedPercent.toFixed(2)}%)
          </p>
        </div>
      )}

      {/* History */}
      <div className="pixel-card p-5 space-y-3">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">Conversion History</p>
        {!history?.length ? (
          <p className="text-sm text-m2e-text-muted">No conversions yet.</p>
        ) : (
          <div className="space-y-2">
            {groupConversions(history).map((entry) => (
              <div key={entry.id} className="bg-m2e-bg-alt border border-m2e-border-light rounded p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-m2e-accent">+{formatTokens(entry.tokensReceived)} SAT</span>
                  <span className="text-m2e-danger">-{entry.pointsSpent.toLocaleString()} SAP</span>
                </div>
                {entry.txHash && (
                  <p className="text-[11px] text-m2e-text-muted font-mono truncate">TX: {entry.txHash}</p>
                )}
                <p className="text-[11px] text-m2e-text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-lg">
      <span className="text-m2e-text-secondary">{label}</span>
      <span className={accent ? 'text-m2e-accent font-bold' : 'text-m2e-text'}>{value}</span>
    </div>
  );
}
