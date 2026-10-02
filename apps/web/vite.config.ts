import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Baseline security headers for `vite preview`. Production hosting (CDN /
 * reverse proxy) must send equivalent headers — Vite does not serve production.
 */
const securityHeaders = (apiBaseUrl: string | undefined): Record<string, string> => {
  const connectSrc = ["'self'", apiBaseUrl ? new URL(apiBaseUrl).origin : '']
    .filter(Boolean)
    .join(' ');
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      `connect-src ${connectSrc}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // Only VITE_* variables are exposed to client code.
    envPrefix: 'VITE_',
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true, headers: securityHeaders(env.VITE_API_BASE_URL) },
    build: {
      // Source maps expose original source; generate them only for upload to an error tracker.
      sourcemap: false,
    },
  };
});
