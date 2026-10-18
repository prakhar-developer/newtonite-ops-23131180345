import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    include: ['tests/**/*.test.ts'],
    exclude: ['**/sample-repo/**', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@instos/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
    },
  },
});
