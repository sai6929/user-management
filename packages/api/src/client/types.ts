import type { Logger } from '@user-management/shared';

/**
 * Platform-provided hooks for authentication. The API package never knows
 * where tokens live — web keeps the access token in memory and the refresh token
 * in an httpOnly cookie; mobile uses SecureStore. This is the seam where a future
 * auth feature plugs in (dependency inversion).
 */
export interface AuthAdapter {
  /** Current access token, or null when signed out. */
  getAccessToken(): string | null | Promise<string | null>;
  /**
   * Obtain a fresh access token. Called at most once concurrently; parallel 401s
   * wait for the same refresh. Return null if the session can't be renewed.
   * Must NOT use the client this adapter is attached to (use a bare axios call),
   * otherwise a 401 from the refresh endpoint would wait on itself.
   */
  refreshAccessToken?(): Promise<string | null>;
  /** Called when the session can't be recovered (refresh failed or not possible). */
  onSessionExpired?(): void;
}

export interface CsrfOptions {
  /** Returns the CSRF token (e.g. from a double-submit cookie) for unsafe methods. */
  getToken(): string | null;
  headerName?: string;
}

export interface ApiClientOptions {
  readonly baseURL: string;
  readonly timeoutMs: number;
  readonly logger: Logger;
  /** Generates unique ids for X-Request-ID (crypto.randomUUID / expo-crypto). */
  readonly generateId: () => string;
  /** Stable id for the app session, sent as X-Correlation-ID. */
  readonly correlationId?: string;
  /** Web: true so httpOnly session/refresh cookies are sent. Mobile: false. */
  readonly withCredentials?: boolean;
  readonly auth?: AuthAdapter;
  /** Web only, when cookie-based auth is used. */
  readonly csrf?: CsrfOptions;
}
