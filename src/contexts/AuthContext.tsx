import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  setAuthToken,
  connectWallet,
  googleAuth,
  fetchMe,
  type UserProfile,
  type GoogleAuthResult,
} from '../api';

const STORAGE_TOKEN = 'galavant_auth_token';
const STORAGE_WALLET = 'galavant_wallet_address';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; token: string; user: UserProfile }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_RESTORING'; restoring: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { token: action.token, user: action.user, isAuthenticated: true, isLoading: false, isRestoring: false };
    case 'LOGOUT':
      return { token: null, user: null, isAuthenticated: false, isLoading: false, isRestoring: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_RESTORING':
      return { ...state, isRestoring: action.restoring };
  }
}

interface AuthContextValue extends AuthState {
  loginWithWallet: (walletAddress: string, publicKey?: string, mldsaPublicKey?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(authReducer, {
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isRestoring: true,
  });

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_WALLET);
    setAuthToken(null);
    queryClient.clear();
    dispatch({ type: 'LOGOUT' });
  }, [queryClient]);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_TOKEN);
    if (!savedToken) {
      dispatch({ type: 'SET_RESTORING', restoring: false });
      return;
    }
    setAuthToken(savedToken);
    fetchMe()
      .then((user) => {
        dispatch({ type: 'LOGIN', token: savedToken, user });
      })
      .catch(() => {
        logout();
      });
  }, [logout]);

  const loginWithWallet = useCallback(async (walletAddress: string, publicKey?: string, mldsaPublicKey?: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await connectWallet(walletAddress, publicKey, mldsaPublicKey);
      setAuthToken(result.token);
      localStorage.setItem(STORAGE_TOKEN, result.token);
      localStorage.setItem(STORAGE_WALLET, walletAddress);
      dispatch({ type: 'LOGIN', token: result.token, user: result.user });
    } catch (err) {
      dispatch({ type: 'SET_LOADING', loading: false });
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string): Promise<GoogleAuthResult> => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await googleAuth(idToken);
      if (result.status === 'authenticated') {
        setAuthToken(result.token);
        localStorage.setItem(STORAGE_TOKEN, result.token);
        localStorage.setItem(STORAGE_WALLET, result.walletAddress);
        dispatch({ type: 'LOGIN', token: result.token, user: result.user });
      } else {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
      return result;
    } catch (err) {
      dispatch({ type: 'SET_LOADING', loading: false });
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginWithWallet, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
