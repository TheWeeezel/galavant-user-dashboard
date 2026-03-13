import { useState } from 'react';
import { Cancel } from 'pixelarticons/react';
import { GoogleLogin } from '@react-oauth/google';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  walletError?: string | null;
}

export function LoginModal({ open, onClose, walletError }: LoginModalProps) {
  const { openConnectModal, connecting } = useWalletConnect();
  const { loginWithGoogle, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [needsWalletMsg, setNeedsWalletMsg] = useState(false);

  if (!open) return null;

  const walletBusy = connecting || isLoading;

  const handleWalletConnect = () => {
    setError(null);
    setNeedsWalletMsg(false);
    openConnectModal();
    // The walletconnect library opens its own modal.
    // useWalletAuth hook handles login once wallet connects.
    // Layout auto-closes this modal when isAuthenticated becomes true.
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google sign-in failed: no credential received');
      return;
    }
    setError(null);
    setNeedsWalletMsg(false);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result.status === 'authenticated') {
        onClose();
      } else {
        setNeedsWalletMsg(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Google sign-in failed');
    }
  };

  const displayError = error || walletError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="pixel-card relative z-10 w-full max-w-md p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-black uppercase tracking-widest text-m2e-accent"
            style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
          >
            Login
          </h2>
          <button
            onClick={onClose}
            className="pixel-icon-btn w-8 h-8 text-m2e-text-muted hover:text-m2e-text"
            aria-label="Close"
          >
            <Cancel className="w-6 h-6" />
          </button>
        </div>

        {/* Wallet Connect */}
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-m2e-text-secondary">
            Connect with OPNet Wallet
          </p>
          <button
            onClick={handleWalletConnect}
            disabled={walletBusy}
            className="pixel-btn pixel-btn-primary w-full px-4 py-3 text-sm"
          >
            {walletBusy ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {walletBusy && (
            <p className="text-xs text-m2e-text-muted text-center animate-pulse">
              Approve the connection in your wallet extension...
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-0.5 bg-m2e-border" />
          <span className="text-xs font-bold uppercase tracking-widest text-m2e-text-muted">or</span>
          <div className="flex-1 h-0.5 bg-m2e-border" />
        </div>

        {/* Google Sign-In */}
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-m2e-text-secondary">
            Sign in with Google
          </p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in was cancelled')}
              theme="outline"
              size="large"
              width="320"
            />
          </div>
          <p className="text-xs text-m2e-text-muted text-center">
            Only works if you've linked Google in the mobile app
          </p>
        </div>

        {/* Needs wallet message */}
        {needsWalletMsg && (
          <div className="pixel-border border-m2e-warning bg-m2e-warning/10 p-3 text-sm text-m2e-warning">
            Your Google account isn't linked to a wallet yet. Please set up your account in the Galavant mobile app first.
          </div>
        )}

        {/* Error */}
        {displayError && (
          <p className="text-sm text-m2e-danger font-bold">{displayError}</p>
        )}
      </div>
    </div>
  );
}
