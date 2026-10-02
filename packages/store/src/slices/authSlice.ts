import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthPrincipal, SessionStatus } from '@user-management/shared';

/**
 * Minimal client-side session state.
 *
 * Tokens are deliberately NOT stored here: Redux state is visible in devtools,
 * can be serialized/persisted, and is easy to log by accident. Tokens live in
 * a platform token store (web: memory, mobile: SecureStore).
 *
 * User profiles and lists are server state and belong in TanStack Query.
 */
export interface AuthState {
  readonly status: SessionStatus;
  /** Identity + roles/permissions used for UI decisions only. */
  readonly principal: AuthPrincipal | null;
  /** When the current session expires, epoch milliseconds. */
  readonly expiresAt: number | null;
}

export interface SessionStartedPayload {
  readonly principal: AuthPrincipal;
  readonly expiresAt: number;
}

const initialState: AuthState = {
  status: 'unknown',
  principal: null,
  expiresAt: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted: (_state, action: PayloadAction<SessionStartedPayload>): AuthState => ({
      status: 'authenticated',
      principal: action.payload.principal,
      expiresAt: action.payload.expiresAt,
    }),
    sessionEnded: (): AuthState => ({ ...initialState, status: 'unauthenticated' }),
    sessionExpired: (): AuthState => ({ ...initialState, status: 'expired' }),
  },
  selectors: {
    selectSessionStatus: (state) => state.status,
    selectPrincipal: (state) => state.principal,
    selectIsAuthenticated: (state) => state.status === 'authenticated',
    selectSessionExpiresAt: (state) => state.expiresAt,
  },
});

export const { sessionStarted, sessionEnded, sessionExpired } = authSlice.actions;
export const {
  selectSessionStatus,
  selectPrincipal,
  selectIsAuthenticated,
  selectSessionExpiresAt,
} = authSlice.selectors;
