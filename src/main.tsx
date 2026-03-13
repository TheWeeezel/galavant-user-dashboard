import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletConnectProvider } from '@btc-vision/walletconnect';
import { AuthProvider } from './contexts/AuthContext';
import { App } from './App';
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
      <WalletConnectProvider theme="dark">
        <AuthProvider>
          <App />
        </AuthProvider>
      </WalletConnectProvider>
    </QueryClientProvider>
  </StrictMode>,
);
