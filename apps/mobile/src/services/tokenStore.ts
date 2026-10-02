import * as SecureStore from 'expo-secure-store';

/**
 * Mobile token storage strategy:
 *  - Access token: memory only (short-lived, re-obtained via refresh).
 *  - Refresh token: iOS Keychain / Android Keystore through expo-secure-store,
 *    readable only while the device is unlocked and never synced/backed up.
 *
 * AsyncStorage is unencrypted and must never hold credentials.
 */
const REFRESH_TOKEN_KEY = 'um.refreshToken';

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken: (): string | null => accessToken,
  setAccessToken: (token: string | null): void => {
    accessToken = token;
  },
  getRefreshToken: (): Promise<string | null> =>
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureOptions),
  setRefreshToken: (token: string): Promise<void> =>
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, secureOptions),
  clear: async (): Promise<void> => {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureOptions);
  },
};
