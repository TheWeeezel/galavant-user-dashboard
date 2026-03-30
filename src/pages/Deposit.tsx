import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSigner } from '../hooks/useWebSigner';
import { WalletRequiredGuard } from '../components/WalletRequiredGuard';
import { fetchMainWallet, depositTokensPrepare, depositTokensSubmit } from '../api';
import { formatTokens, decimalToBaseUnits } from '../utils/format';

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
  const [success, setSuccess] = useState<string | null>(null);

  const { data: mainWallet, isLoading: walletLoading } = useQuery({ queryKey: ['main-wallet'], queryFn: fetchMainWallet });
  const depositBaseUnits = amount ? decimalToBaseUnits(amount) : '0';
  const exceedsBalance = mainWallet ? BigInt(depositBaseUnits) > BigInt(mainWallet.satTokenBalance) : false;

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['main-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['spending-wallet'] });
      setSuccess(`Deposited ${formatTokens(data.tokensDeposited)} SAT. Credited ${data.pointsCredited.toLocaleString()} SAP.`);
      setError(null);
      setAmount('');
    },
    onError: (err: Error) => { setError(err.message); setSuccess(null); },
  });

  return (
    <div className="space-y-6">
      {error && <div className="pixel-card p-4 border-m2e-danger bg-m2e-danger/10 text-m2e-danger">{error}</div>}
      {success && <div className="pixel-card p-4 border-m2e-success bg-m2e-success/10 text-m2e-success">{success}</div>}

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
          className="w-full bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-xl text-m2e-text focus:border-m2e-accent outline-none"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-m2e-text-muted">
          Your SAT tokens will be converted back to SAP points at the current difficulty rate.
        </p>

        {exceedsBalance && (
          <p className="text-m2e-danger text-sm">Amount exceeds your SAT balance.</p>
        )}

        <button
          onClick={() => depositMutation.mutate()}
          disabled={!amount || parseFloat(amount) <= 0 || depositMutation.isPending || exceedsBalance}
          className="pixel-btn pixel-btn-primary w-full py-4 text-lg disabled:opacity-50"
        >
          {depositMutation.isPending ? 'Depositing...' : 'Deposit'}
        </button>
      </div>

      {/* How it works */}
      <div className="pixel-card p-5 space-y-3">
        <p className="text-sm uppercase tracking-widest text-m2e-text-secondary">How Deposits Work</p>
        <ul className="space-y-2 text-sm text-m2e-text-secondary list-disc list-inside">
          <li>Send SAT tokens from your on-chain wallet back to the game</li>
          <li>Receive SAP points at the current conversion difficulty rate</li>
          <li>Your wallet extension will prompt you to sign the transaction</li>
          <li>SAP points are credited immediately after confirmation</li>
        </ul>
      </div>
    </div>
  );
}
