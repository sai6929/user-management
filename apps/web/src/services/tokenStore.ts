/**
 * Web token storage strategy:
 *  - Access token: kept in memory only (this module). Not in localStorage or
 *    sessionStorage, where any XSS payload could read it.
 *  - Refresh token: an httpOnly, Secure, SameSite cookie set by the server.
 *    JavaScript can never read it; the browser sends it to the refresh endpoint.
 *
 * A page reload clears the access token; the future auth feature restores the
 * session by calling the refresh endpoint on startup.
 */
let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken: (): string | null => accessToken,
  setAccessToken: (token: string | null): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
};
