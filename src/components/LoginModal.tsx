import { useState, useCallback } from 'react';
import { Cancel } from 'pixelarticons/react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

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

  const handleGoogleLogin = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      setError('Google sign-in is loading, please try again');
      return;
    }

    setError(null);
    setNeedsWalletMsg(false);

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: config.googleClientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response: { code?: string; error?: string }) => {
        if (response.error || !response.code) {
          setError('Google sign-in was cancelled');
          return;
        }
        try {
          const result = await loginWithGoogle(response.code);
          if (result.status === 'authenticated') {
            onClose();
          } else {
            setNeedsWalletMsg(true);
          }
        } catch (err: any) {
          setError(err.message ?? 'Google sign-in failed');
        }
      },
    });

    client.requestCode();
  }, [loginWithGoogle, onClose]);

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
          <button
            onClick={handleGoogleLogin}
            disabled={walletBusy}
            className="pixel-btn w-full px-4 py-3 text-sm flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
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
