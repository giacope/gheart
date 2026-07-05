import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.GHEART_WEB_PORT || 5173),
    proxy: {
      // changeOrigin must stay false (vite's string shorthand enables it):
      // the API builds OAuth/setup callback URLs from the Host header, which
      // must remain the browser-facing origin, not the API port.
      // PORT is shared with the API server so `PORT=8801 npm run dev` moves both.
      '/api': { target: `http://localhost:${process.env.PORT || 8788}`, changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
  },
});
