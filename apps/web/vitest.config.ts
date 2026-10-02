import { defineProject, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig({ mode: 'test', command: 'serve' }),
  defineProject({
    test: {
      name: 'web',
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
);
