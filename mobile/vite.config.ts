import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built app can be served from any static host / subpath.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5174 },
});
