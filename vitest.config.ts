import { defineConfig } from 'vitest/config';

// Unit tests for the pure hero modules (no React Native runtime needed).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
