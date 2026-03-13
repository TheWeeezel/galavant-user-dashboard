import { useEffect, useRef, useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';

/**
 * Bridges @btc-vision/walletconnect state with our AuthContext.
 * When the wallet connects, automatically logs in.
 * When the wallet disconnects, automatically logs out.
 */
export function useWalletAuth() {
  const { walletAddress, publicKey, mldsaPublicKey } = useWalletConnect();
  const { isAuthenticated, isLoading, loginWithWallet, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const loginAttempted = useRef(false);

  useEffect(() => {
    // Wallet just connected — attempt login
    if (walletAddress && !isAuthenticated && !isLoading && !loginAttempted.current) {
      loginAttempted.current = true;
      setError(null);
      console.log('[useWalletAuth] Wallet connected, logging in:', walletAddress);
      loginWithWallet(walletAddress, publicKey ?? undefined, mldsaPublicKey ?? undefined).catch(
        (err) => {
          console.error('[useWalletAuth] login failed:', err);
          setError(err.message ?? 'Login failed');
          // Reset so user can retry
          loginAttempted.current = false;
        },
      );
    }

    // Wallet disconnected
    if (!walletAddress) {
      loginAttempted.current = false;
      if (isAuthenticated) {
        logout();
      }
    }
  }, [walletAddress, publicKey, mldsaPublicKey, isAuthenticated, isLoading, loginWithWallet, logout]);

  return { error };
}
