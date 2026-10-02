import { fileURLToPath, URL } from 'node:url';
import { defineProject } from 'vitest/config';

/**
 * Vitest covers mobile logic that doesn't render native views (services, store,
 * config). React Native components can't run in Node; when screen tests are
 * needed, add jest-expo + @testing-library/react-native for those files.
 */
export default defineProject({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __DEV__: 'true',
  },
  test: {
    name: 'mobile',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
