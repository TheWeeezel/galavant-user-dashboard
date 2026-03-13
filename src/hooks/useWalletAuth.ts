import { useEffect, useRef, useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useAuth } from '../contexts/AuthContext';

/**
 * Bridges @btc-vision/walletconnect state with our AuthContext.
 * When the wallet connects, automatically logs in.
 * When the wallet disconnects, automatically logs out — but only if the
 * current session was authenticated via wallet (authProvider === 'wallet').
 * Google-authenticated sessions are never affected by wallet state.
 */
export function useWalletAuth() {
  const { walletAddress, publicKey, mldsaPublicKey } = useWalletConnect();
  const { isAuthenticated, isLoading, user, loginWithWallet, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const loginAttempted = useRef(false);

  useEffect(() => {
    // Wallet just connected — attempt login
    if (walletAddress && !isAuthenticated && !isLoading && !loginAttempted.current) {
      loginAttempted.current = true;
      setError(null);
      loginWithWallet(walletAddress, publicKey ?? undefined, mldsaPublicKey ?? undefined).catch(
        (err) => {
          console.error('[useWalletAuth] login failed:', err);
          setError(err.message ?? 'Login failed');
          loginAttempted.current = false;
        },
      );
    }

    // Wallet disconnected — only log out if the current session is wallet-based
    if (!walletAddress) {
      loginAttempted.current = false;
      if (isAuthenticated && user?.authProvider === 'wallet') {
        logout();
      }
    }
  }, [walletAddress, publicKey, mldsaPublicKey, isAuthenticated, isLoading, user, loginWithWallet, logout]);

  return { error };
}
