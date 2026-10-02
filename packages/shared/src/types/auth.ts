/**
 * Authentication / authorization contracts shared by every platform.
 *
 * These are deliberately transport-agnostic. How tokens are obtained and stored
 * is a platform concern (web: memory + httpOnly cookie, mobile: SecureStore).
 */

/** Role identifier issued by the backend, e.g. "admin". */
export type Role = string;

/** Permission identifier in `resource:action` form, e.g. "users:read". */
export type Permission = `${string}:${string}`;

/**
 * The minimum identity information the client needs for UI decisions.
 * Never treat this as a security boundary — the server must enforce access.
 */
export interface AuthPrincipal {
  readonly id: string;
  readonly roles: readonly Role[];
  readonly permissions: readonly Permission[];
}

/** Credentials returned by a future token endpoint. Never persisted in Redux. */
export interface AuthTokens {
  readonly accessToken: string;
  /** Absent on web, where the refresh token lives in an httpOnly cookie. */
  readonly refreshToken?: string;
  /** Absolute expiry of the access token, epoch milliseconds. */
  readonly accessTokenExpiresAt: number;
}

export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'expired';
