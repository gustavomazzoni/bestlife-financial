/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Scoped to pure-function helpers in src/lib — no component/E2E testing.
  testMatch: ['<rootDir>/src/lib/**/*.test.ts'],
};
