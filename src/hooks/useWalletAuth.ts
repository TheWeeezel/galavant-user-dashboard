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

  // Auto-login: when wallet is connected but user isn't authenticated.
  // Fires when session restore completes AND when wallet address appears.
  // This covers both initial page load (wallet auto-reconnects) and fresh
  // connects where the wallet extension reports the address after isRestoring
  // has already settled.
  // Excludes isAuthenticated from deps to prevent re-login after manual logout.
  useEffect(() => {
    if (walletAddress && !isAuthenticated && !isLoading && !isRestoring) {
      console.log('[useWalletAuth] Auto-login:', walletAddress);
      loginWithWallet(walletAddress, publicKey ?? undefined, mldsaPublicKey ?? undefined).catch(
        (err) => console.error('[useWalletAuth] Auto-login failed:', err),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestoring, walletAddress]);

  // Auto-logout when wallet disconnects (only for wallet-based sessions)
  useEffect(() => {
    if (!walletAddress && isAuthenticated && user?.authProvider === 'wallet') {
      logout();
    }
  }, [walletAddress, isAuthenticated, user, logout]);
}
