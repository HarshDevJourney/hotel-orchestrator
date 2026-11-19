import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// During `npm run dev` / `npm run preview` the API is proxied, so the browser only talks to one origin
// (the same way nginx does it in Docker). Override with VITE_BACKEND_URL.
const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const proxy = { '^/(api|health|supplier[A-Za-z0-9]+)(/|$)': { target: backend, changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
