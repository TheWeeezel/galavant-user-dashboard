import { useEffect, useRef } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';
import { syncWalletKeys } from '../api';

/**
 * Bridges @btc-vision/walletconnect state with our AuthContext.
 *
 * - Auto-login on page load when wallet auto-connects (handled by effect)
 * - Auto-logout when wallet disconnects (only for wallet-based sessions)
 * - Manual connect from LoginModal is handled imperatively there (not here)
 * - Syncs wallet public keys to the server when the extension provides them
 *   (handles timing: keys may arrive after login, or on session restore)
 */
export function useWalletAuth() {
  const { walletAddress, publicKey, mldsaPublicKey } = useWalletConnect();
  const { isAuthenticated, isLoading, isRestoring, user, loginWithWallet, logout } = useAuth();
  const keysSyncedRef = useRef(false);

  // Reset sync flag when wallet changes (different wallet = new sync needed)
  useEffect(() => {
    keysSyncedRef.current = false;
  }, [walletAddress]);

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

  // Sync wallet public keys to the server once they become available.
  // This covers two scenarios:
  // 1. Keys arrive from the extension AFTER loginWithWallet already fired
  // 2. Session was restored from JWT (no connectWallet call), then wallet auto-connects
  useEffect(() => {
    if (isAuthenticated && publicKey && mldsaPublicKey && !keysSyncedRef.current) {
      keysSyncedRef.current = true;
      syncWalletKeys(publicKey, mldsaPublicKey).catch((err) =>
        console.error('[useWalletAuth] Key sync failed:', err),
      );
    }
  }, [isAuthenticated, publicKey, mldsaPublicKey]);

  // Auto-logout when wallet disconnects (only for wallet-based sessions)
  useEffect(() => {
    if (!walletAddress && isAuthenticated && user?.authProvider === 'wallet') {
      logout();
    }
  }, [walletAddress, isAuthenticated, user, logout]);
}
