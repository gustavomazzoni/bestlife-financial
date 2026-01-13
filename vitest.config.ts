// vitest.config.ts
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      // Excluding from testings
      ...configDefaults.exclude,
      'node_modules/**',
      'tests/**', // Excludes the entire 'tests' directory and its subdirectories
      '**/*.config.*',
      '**/.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        // Excluding from Code Coverage Reports
        ...configDefaults.exclude,
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        '**/.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests-helpers': path.resolve(__dirname, './tests/helpers'),
    },
  },
});
