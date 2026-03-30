import type { ReactNode } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { Lock } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';

interface WalletRequiredGuardProps {
  children: ReactNode;
}

export function WalletRequiredGuard({ children }: WalletRequiredGuardProps) {
  const { isAuthenticated } = useAuth();
  const { signer, walletAddress, openConnectModal } = useWalletConnect();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <Lock className="w-12 h-12 text-m2e-text-muted mx-auto" />
        <h2 className="text-2xl uppercase tracking-wide">Login Required</h2>
        <p className="text-m2e-text-secondary text-lg">Sign in to access this feature.</p>
      </div>
    );
  }

  if (!signer || !walletAddress) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <Lock className="w-12 h-12 text-m2e-accent mx-auto" />
        <h2 className="text-2xl uppercase tracking-wide">Wallet Required</h2>
        <p className="text-m2e-text-secondary text-lg">
          Connect your OPNet wallet extension to use this feature. Your wallet handles all transaction signing securely.
        </p>
        <button onClick={openConnectModal} className="pixel-btn pixel-btn-primary px-6 py-3 text-base">
          Connect Wallet
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
