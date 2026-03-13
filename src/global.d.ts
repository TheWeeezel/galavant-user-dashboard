interface GoogleCodeClient {
  requestCode(): void;
}

interface GoogleOAuth2 {
  initCodeClient(config: {
    client_id: string;
    scope: string;
    ux_mode: 'popup' | 'redirect';
    callback: (response: { code?: string; error?: string }) => void;
  }): GoogleCodeClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface Window {
  google?: {
    accounts: GoogleAccounts;
  };
}
