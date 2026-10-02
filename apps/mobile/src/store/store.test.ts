import { describe, expect, it } from 'vitest';
import { selectIsAuthenticated, selectIsBootstrapped } from '@user-management/store';
import { store } from './index';

describe('mobile store', () => {
  it('starts with no session and not bootstrapped', () => {
    const state = store.getState();
    expect(selectIsAuthenticated(state)).toBe(false);
    expect(selectIsBootstrapped(state)).toBe(false);
  });
});
