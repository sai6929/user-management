/** Typed client env vars. Only VITE_* variables reach the browser bundle. */
interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_LOG_LEVEL?: string;
}
