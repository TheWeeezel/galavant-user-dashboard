import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { WalletConnectProvider } from '@btc-vision/walletconnect';
import { AuthProvider } from './contexts/AuthContext';
import { App } from './App';
import { config } from './config';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={config.googleClientId}>
        <WalletConnectProvider theme="dark">
          <AuthProvider>
            <App />
          </AuthProvider>
        </WalletConnectProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
