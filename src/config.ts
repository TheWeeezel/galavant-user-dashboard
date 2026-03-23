export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string || 'https://m2e-server-713381761699.asia-southeast1.run.app',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB as string || '',
};

if (!config.googleClientId) {
  console.warn('[config] VITE_GOOGLE_CLIENT_ID_WEB is not set. Google Sign-In will not work. See .env.example');
}
