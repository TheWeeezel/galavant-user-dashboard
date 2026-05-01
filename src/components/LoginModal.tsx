import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cancel, Gamepad, Mail } from 'pixelarticons/react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { walletAddress, publicKey, mldsaPublicKey, openConnectModal, connecting } = useWalletConnect();
  const { loginWithWallet, loginWithGoogle, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [needsWalletMsg, setNeedsWalletMsg] = useState(false);
  const [walletLoggingIn, setWalletLoggingIn] = useState(false);

  const walletRef = useRef({ walletAddress, publicKey, mldsaPublicKey });
  walletRef.current = { walletAddress, publicKey, mldsaPublicKey };
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
      setWalletLoggingIn(false);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleWalletConnect = useCallback(() => {
    setError(null);
    setNeedsWalletMsg(false);
    openConnectModal();

    if (pollRef.current) clearInterval(pollRef.current);
    const startTime = Date.now();
    pollRef.current = setInterval(() => {
      const { walletAddress: addr, publicKey: pk, mldsaPublicKey: mldsa } = walletRef.current;
      if (Date.now() - startTime > 60_000) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        return;
      }
      if (addr) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setWalletLoggingIn(true);
        console.log('[LoginModal] Wallet detected, logging in:', addr);
        loginWithWallet(addr, pk ?? undefined, mldsa ?? undefined)
          .catch((err: any) => {
            console.error('[LoginModal] Wallet login failed:', err);
            setError(err.message ?? 'Wallet login failed');
            setWalletLoggingIn(false);
          });
      }
    }, 300);
  }, [openConnectModal, loginWithWallet]);

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

  const walletBusy = connecting || isLoading || walletLoggingIn;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Overlay + scanlines over the whole screen */}
          <div className="absolute inset-0 bg-black/75 scanlines" />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pixel-corners pixel-card p-6 md:p-8 space-y-6 relative overflow-hidden">
              {/* Subtle background */}
              <div className="absolute inset-0 pixel-grid-bg opacity-30 pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="section-label">Login</div>
                  <h2 className="text-3xl md:text-4xl uppercase tracking-wide text-m2e-text text-chroma-soft leading-none">
                    Insert<br />
                    <span className="text-m2e-accent">Coin.</span>
                  </h2>
                  <p className="text-sm text-m2e-text-secondary">
                    Sign in with your OPNet wallet or your Google account.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="pixel-icon-btn w-9 h-9 text-m2e-text-muted hover:text-m2e-text hover:bg-m2e-bg-alt shrink-0"
                  aria-label="Close"
                >
                  <Cancel className="w-5 h-5" />
                </button>
              </div>

              {/* Wallet Connect — primary */}
              <div className="relative space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted flex items-center gap-2">
                  <Gamepad className="w-3.5 h-3.5 text-m2e-accent" />
                  Player 1 · Wallet
                </div>
                <button
                  onClick={handleWalletConnect}
                  disabled={walletBusy}
                  className="pixel-btn pixel-btn-primary w-full px-4 py-4 text-base animate-glow-pulse"
                >
                  {walletLoggingIn ? 'Authenticating…' : walletBusy ? 'Connecting…' : 'Connect OPNet Wallet'}
                </button>
                {walletBusy && (
                  <p className="text-xs text-m2e-text-muted text-center animate-pulse">
                    {walletLoggingIn ? '> Authenticating your wallet…' : '> Approve the connection in your wallet extension…'}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 relative">
                <div className="flex-1 h-0.5 bg-m2e-border" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted">or</span>
                <div className="flex-1 h-0.5 bg-m2e-border" />
              </div>

              {/* Google Sign-In */}
              <div className="relative space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-m2e-info" />
                  Player 2 · Google
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={walletBusy}
                  className="pixel-btn w-full px-4 py-3 text-sm flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
                <p className="text-[10px] text-m2e-text-muted text-center uppercase tracking-wider">
                  Only works if you've linked Google in the mobile app
                </p>
              </div>

              {/* Needs wallet message */}
              {needsWalletMsg && (
                <div className="relative pixel-border border-m2e-warning bg-m2e-warning/10 p-3 text-sm text-m2e-warning">
                  Your Google account isn't linked to a wallet yet. Please set up your account in the Galavant mobile app first.
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="relative pixel-border border-m2e-danger bg-m2e-danger/10 p-3 text-sm text-m2e-danger">
                  &gt; {error}
                </div>
              )}

              {/* Footer */}
              <div className="relative pt-2 text-center text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-m2e-success animate-blink" />
                Ready
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
