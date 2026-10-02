import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: vi.fn<() => Promise<string | null>>(),
  setItemAsync: vi.fn<() => Promise<void>>(),
  deleteItemAsync: vi.fn<() => Promise<void>>(),
}));

vi.mock('expo-secure-store', () => secureStore);

const { tokenStore } = await import('./tokenStore');

describe('mobile tokenStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.setAccessToken(null);
  });

  it('keeps the access token in memory only', () => {
    tokenStore.setAccessToken('access');
    expect(tokenStore.getAccessToken()).toBe('access');
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('stores the refresh token in SecureStore, device-only', async () => {
    await tokenStore.setRefreshToken('refresh');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith('um.refreshToken', 'refresh', {
      keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('clears both tokens', async () => {
    tokenStore.setAccessToken('access');
    await tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledOnce();
  });
});
