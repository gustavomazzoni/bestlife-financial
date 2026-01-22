import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Only run integration tests
    include: ['tests/integration/**/*.test.ts'],

    // Use node environment (not jsdom) for API testing
    environment: 'node',

    // Global setup runs once before all tests
    globalSetup: ['./tests/integration/globalSetup.ts'],

    // Per-file setup
    setupFiles: ['./tests/integration/setup.ts'],

    // Run tests sequentially to avoid database conflicts
    // In Vitest 4, use fileParallelism instead of pool options
    fileParallelism: false,

    // Longer timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests-helpers': path.resolve(__dirname, './tests/helpers'),
    },
  },
});
