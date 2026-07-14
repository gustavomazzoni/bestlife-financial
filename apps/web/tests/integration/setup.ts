import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import {
  getTestPrisma,
  disconnectTestDb,
  seedCategories,
  truncateTables,
} from '../helpers/test-db';

// Mock @/lib/db to use test database client
// This ensures all service imports use the test database
vi.mock('@/lib/db', () => ({
  prisma: getTestPrisma(),
  default: getTestPrisma(),
}));

// Seed categories once before all tests in this file
beforeAll(async () => {
  await seedCategories();
});

// Truncate user data between each test for isolation
// Categories are kept to avoid re-seeding
afterEach(async () => {
  await truncateTables();
});

// Disconnect Prisma client after all tests complete
afterAll(async () => {
  await disconnectTestDb();
});

// Export test prisma client for direct use in tests
export const prisma = getTestPrisma();
