import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  setAuthToken,
  googleAuth,
  completeGoogleSignup,
  fetchMe,
  type UserProfile,
  type GoogleAuthResult,
} from '../api';

const STORAGE_TOKEN = 'galavant_auth_token';

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
  console.log('[AuthReducer]', action.type, '— prev isAuthenticated:', state.isAuthenticated);
  switch (action.type) {
    case 'LOGIN':
      console.log('[AuthReducer] LOGIN — user:', action.user?.nickname, 'token length:', action.token?.length);
      return { token: action.token, user: action.user, isAuthenticated: true, isLoading: false, isRestoring: false };
    case 'LOGOUT':
      console.log('[AuthReducer] LOGOUT');
      return { token: null, user: null, isAuthenticated: false, isLoading: false, isRestoring: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_RESTORING':
      return { ...state, isRestoring: action.restoring };
  }
}

interface AuthContextValue extends AuthState {
  loginWithGoogle: (code: string) => Promise<GoogleAuthResult>;
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
    setAuthToken(null);
    queryClient.clear();
    dispatch({ type: 'LOGOUT' });
  }, [queryClient]);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_TOKEN);
    console.log('[AuthContext] restore — savedToken exists:', !!savedToken);
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

  const loginWithGoogle = useCallback(async (code: string): Promise<GoogleAuthResult> => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const result = await googleAuth(code);
      if (result.status === 'authenticated') {
        setAuthToken(result.token);
        localStorage.setItem(STORAGE_TOKEN, result.token);
        dispatch({ type: 'LOGIN', token: result.token, user: result.user });
        return result;
      }
      // First-time visitor: the server handed us a short-lived claim token instead of a
      // session. Redeeming it is what actually creates the account — dropping it here was why
      // the web could sign people in but never sign them up, and told them to use the app.
      const created = await completeGoogleSignup(result.googleClaimToken);
      setAuthToken(created.token);
      localStorage.setItem(STORAGE_TOKEN, created.token);
      dispatch({ type: 'LOGIN', token: created.token, user: created.user });
      return { status: 'authenticated' as const, token: created.token, user: created.user, walletAddress: created.walletAddress };
    } catch (err) {
      dispatch({ type: 'SET_LOADING', loading: false });
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
