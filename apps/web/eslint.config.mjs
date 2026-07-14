import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // matches all files ending with {ts,tsx,mts,cts}
  {
    files: ['**/*.{ts,tsx,mts,cts,mjs}'],
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.claude/**',
    '.husky/**',
    '.pnpm-store/**',
    'node_modules/**',
    'playwright-report/**',
    'public/**',
    'scripts/**',
    'test-results/**',
  ]),
]);

export default eslintConfig;
