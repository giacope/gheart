import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // changeOrigin must stay false (vite's string shorthand enables it):
      // the API builds OAuth/setup callback URLs from the Host header, which
      // must remain the browser-facing origin (:5173), not the API port.
      '/api': { target: 'http://localhost:8788', changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
  },
});
