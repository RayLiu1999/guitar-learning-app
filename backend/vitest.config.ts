import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // 允許直接使用 describe, it, expect
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 20000,
  },
});
