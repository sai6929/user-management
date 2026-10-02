import { describe, expect, it } from 'vitest';
import { createAppStore } from '../createAppStore';
import {
  selectIsAuthenticated,
  selectPrincipal,
  selectSessionStatus,
  sessionEnded,
  sessionExpired,
  sessionStarted,
} from './authSlice';

const principal = { id: '1', roles: ['admin'], permissions: ['users:read'] } as const;

describe('authSlice', () => {
  it('starts in the unknown state', () => {
    const store = createAppStore({ devTools: false });
    expect(selectSessionStatus(store.getState())).toBe('unknown');
  });

  it('tracks the session lifecycle without storing tokens', () => {
    const store = createAppStore({ devTools: false });
    store.dispatch(sessionStarted({ principal, expiresAt: 1 }));
    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(JSON.stringify(store.getState())).not.toMatch(/token/i);

    store.dispatch(sessionExpired());
    expect(selectSessionStatus(store.getState())).toBe('expired');
    expect(selectPrincipal(store.getState())).toBeNull();

    store.dispatch(sessionEnded());
    expect(selectSessionStatus(store.getState())).toBe('unauthenticated');
  });
});
