import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The package's "browser" field remaps to a webpack bundle whose .d.ts
      // sub-imports can't be resolved individually. Use the build/ entry instead.
      '@btc-vision/walletconnect': path.resolve(
        __dirname,
        'node_modules/@btc-vision/walletconnect/build/index.js',
      ),
    },
  },
  server: {
    port: 5174,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/art': 'http://localhost:3000',
    },
  },
});
