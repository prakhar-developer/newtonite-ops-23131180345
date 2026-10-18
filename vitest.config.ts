import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    include: ['tests/**/*.test.ts'],
    exclude: ['**/sample-repo/**', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@instos/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
    },
  },
});
