import { useEffect } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';

/**
 * Bridges @btc-vision/walletconnect state with our AuthContext.
 *
 * - Auto-login on page load when wallet auto-connects (handled by effect)
 * - Auto-logout when wallet disconnects (only for wallet-based sessions)
 * - Manual connect from LoginModal is handled imperatively there (not here)
 */
export function useWalletAuth() {
  const { walletAddress, publicKey, mldsaPublicKey } = useWalletConnect();
  const { isAuthenticated, isLoading, isRestoring, user, loginWithWallet, logout } = useAuth();

  // Auto-login on page load: if wallet is already connected when the page
  // loads (auto-reconnect) and there's no existing session, log in.
  // This fires once on mount — the isRestoring guard waits for session restore.
  useEffect(() => {
    if (walletAddress && !isAuthenticated && !isLoading && !isRestoring) {
      console.log('[useWalletAuth] Auto-login on page load:', walletAddress);
      loginWithWallet(walletAddress, publicKey ?? undefined, mldsaPublicKey ?? undefined).catch(
        (err) => console.error('[useWalletAuth] Auto-login failed:', err),
      );
    }
    // Only run when restoring completes — intentionally limited deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestoring]);

  // Auto-logout when wallet disconnects (only for wallet-based sessions)
  useEffect(() => {
    if (!walletAddress && isAuthenticated && user?.authProvider === 'wallet') {
      logout();
    }
  }, [walletAddress, isAuthenticated, user, logout]);
}
