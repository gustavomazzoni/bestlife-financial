## Test Database Setup for Integration Testing

### Overview

 Set up a separate lifeos_financial_test database in the existing PostgreSQL Docker container for real integration testing with Vitest and Prisma.

 User Requirements:
 - Reset strategy: Truncate tables between tests (fast, keeps schema)
 - DB approach: Same postgres container, separate database
 - Seeding: Seed default categories before tests

 ---
 Files to Create/Modify

 | Action | File                                      |
 |--------|-------------------------------------------|
 | CREATE | docker/init-scripts/01-create-test-db.sql |
 | MODIFY | docker-compose.yml                        |
 | CREATE | .env.test                                 |
 | CREATE | tests/helpers/test-db.ts                  |
 | CREATE | tests/integration/globalSetup.ts          |
 | CREATE | tests/integration/setup.ts                |
 | CREATE | vitest.config.integration.ts              |
 | MODIFY | package.json                              |

 ---
 Implementation Steps

 1. Create Docker Init Script

 File: docker/init-scripts/01-create-test-db.sql

 -- Create test database
 CREATE DATABASE lifeos_financial_test;
 GRANT ALL PRIVILEGES ON DATABASE lifeos_financial_test TO lifeos;

 2. Update Docker Compose

 File: docker-compose.yml

 Add init scripts volume to postgres service:
```
 postgres:
   # ... existing config ...
   volumes:
     - postgres_data:/var/lib/postgresql/data
     - ./docker/init-scripts:/docker-entrypoint-initdb.d:ro  # ADD
```
 Note: Existing volumes must be removed for init script to run: docker compose down -v && docker compose up -d

 3. Create Test Environment File

 File: .env.test

 DATABASE_URL="postgresql://lifeos:lifeos_dev_password@postgres:5432/lifeos_financial_test?schema=public"
 NEXTAUTH_URL="http://localhost:3000"
 NEXTAUTH_SECRET="test_secret_minimum_32_characters_long_here"
 NEXT_PUBLIC_APP_URL="http://localhost:3000"
 NODE_ENV="test"

 Uses postgres (not localhost) because tests also run on docker container.

 4. Create Test Database Helper

 File: tests/helpers/test-db.ts

 Provides:
 - getTestPrisma() - Singleton Prisma client for test DB
 - disconnectTestDb() - Cleanup connection
 - runMigrations() - Deploy migrations to test DB
 - seedCategories() - Seed default categories
 - truncateTables() - Fast table truncation (keeps categories)
 - resetDatabase() - Full reset with re-seed

 Key implementation details:
 - Safety check: DATABASE_URL must contain _test
 - Uses TRUNCATE ... CASCADE for fast cleanup
 - Preserves categories between tests (only truncates user data)

 5. Create Vitest Integration Config

 File: vitest.config.integration.ts
```typescript
 export default defineConfig({
   test: {
     include: ['tests/integration/**/*.test.ts'],
     environment: 'node',  // Not jsdom - testing API routes
     globalSetup: ['./tests/integration/globalSetup.ts'],
     setupFiles: ['./tests/integration/setup.ts'],
     pool: 'forks',
     poolOptions: { forks: { singleFork: true } },  // Sequential for DB
     testTimeout: 30000,
   },
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@tests-helpers': path.resolve(__dirname, './tests/helpers'),
     },
   },
 });
```

 6. Create Global Setup (Runs Once)

 File: tests/integration/globalSetup.ts

 - Runs migrations on test database before all tests
 - One-time setup per test run

 7. Create Per-File Setup

 File: tests/integration/setup.ts
```typescript
 import { vi } from 'vitest';
 import { beforeAll, afterAll, afterEach } from 'vitest';
 import { getTestPrisma, seedCategories, truncateTables, disconnectTestDb } from '../helpers/test-db';

 // Mock @/lib/db to use test database
 vi.mock('@/lib/db', () => ({
   prisma: getTestPrisma(),
 }));

 beforeAll(async () => {
   await seedCategories();  // Seed once per file
 });

 afterEach(async () => {
   await truncateTables();  // Clear user data between tests
 });

 afterAll(async () => {
   await disconnectTestDb();
 });

 export const prisma = getTestPrisma();
 ```

 8. Update Package.json

 Install: docker compose exec app pnpm add -D dotenv-cli

 Add scripts:
 {
   "scripts": {
     "test:integration": "dotenv -e .env.test -- vitest run --config vitest.config.integration.ts",
     "test:integration:watch": "dotenv -e .env.test -- vitest --config vitest.config.integration.ts",
     "test:db:setup": "dotenv -e .env.test -- prisma migrate deploy",
     "test:db:reset": "dotenv -e .env.test -- prisma migrate reset --force",
     "test:all": "pnpm test && pnpm test:integration"
   }
 }

 ---
 Usage

 First-time setup:

 # Recreate Docker volumes to run init script
 docker compose down -v && docker compose up -d

 # Or manually create and setup test DB (if Docker volume exists)
 docker exec lifeos-db psql -U lifeos -d lifeos_financial -c "CREATE DATABASE lifeos_financial_test;"
 docker compose exec app pnpm test:db:setup

 Running tests:

 docker compose exec app pnpm test:integration        # Run all integration tests
 docker compose exec app pnpm test:integration:watch  # Watch mode
 docker compose exec app pnpm test:all                # Unit + integration tests

 ---
 Example Integration Test Pattern

```typescript
 // tests/integration/recurring.test.ts
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { prisma } from './setup';  // Test DB client
 import { createMockPostRequest } from '@tests-helpers/api';
 import { POST } from '@/app/api/v1/recurring/route';

 // Only mock auth - NOT the database
 vi.mock('@/lib/auth/session', () => ({
   getUserId: vi.fn(),
 }));

 describe('POST /api/v1/recurring', () => {
   let testUser: { id: string };
   let category: { id: string };

   beforeEach(async () => {
     // Create real test data
     testUser = await prisma.user.create({
       data: { email: 'test@example.com', name: 'Test' },
     });
     category = await prisma.category.findFirstOrThrow({
       where: { type: 'EXPENSE' },
     });

     vi.mocked(getUserId).mockResolvedValue(testUser.id);
   });

   it('creates recurring transaction', async () => {
     const request = createMockPostRequest('api/v1/recurring', {
         amount: 100,
         description: 'Test subscription',
         type: 'EXPENSE',
         categoryId: category.id,
         frequency: 'MONTHLY',
         startDate: new Date().toISOString(),
     });

     const response = await POST(request);
     expect(response.status).toBe(201);

     // Verify in real database
     const saved = await prisma.recurringTransaction.findFirst({
       where: { userId: testUser.id },
     });
     expect(saved).not.toBeNull();
   });
 });
 ```

 ---
 Key Design Decisions

 1. Same container, different database - Simpler than separate container, sufficient isolation
 2. Truncate tables (not drop/recreate) - Fast reset while keeping schema
 3. Keep categories between tests - Seed once, avoids repetitive seeding
 4. Sequential test execution - Prevents DB race conditions
 5. Mock only auth, not Prisma - Real database testing with mocked authentication
