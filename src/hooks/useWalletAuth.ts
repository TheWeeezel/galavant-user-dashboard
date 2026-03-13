import { useEffect, useRef, useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';

/**
 * Bridges @btc-vision/walletconnect state with our AuthContext.
 * When the wallet connects, automatically logs in.
 * When the wallet disconnects, automatically logs out (only if the session
 * was started via wallet — Google-authenticated sessions are left alone).
 */
export function useWalletAuth() {
  const { walletAddress, publicKey, mldsaPublicKey } = useWalletConnect();
  const { isAuthenticated, isLoading, loginWithWallet, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const loginAttempted = useRef(false);
  const authedViaWallet = useRef(false);

  useEffect(() => {
    // Wallet just connected — attempt login
    if (walletAddress && !isAuthenticated && !isLoading && !loginAttempted.current) {
      loginAttempted.current = true;
      authedViaWallet.current = true;
      setError(null);
      console.log('[useWalletAuth] Wallet connected, logging in:', walletAddress);
      loginWithWallet(walletAddress, publicKey ?? undefined, mldsaPublicKey ?? undefined).catch(
        (err) => {
          console.error('[useWalletAuth] login failed:', err);
          setError(err.message ?? 'Login failed');
          authedViaWallet.current = false;
          loginAttempted.current = false;
        },
      );
    }

    // Wallet disconnected — only log out if the session was started via wallet connect
    if (!walletAddress) {
      loginAttempted.current = false;
      if (isAuthenticated && authedViaWallet.current) {
        authedViaWallet.current = false;
        logout();
      }
    }
  }, [walletAddress, publicKey, mldsaPublicKey, isAuthenticated, isLoading, loginWithWallet, logout]);

  return { error };
}
