import { PrismaClient, TransactionType } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import path from 'path';
import * as dotenv from 'dotenv';

// Load .env.test explicitly and OVERRIDE existing env vars
// This is needed because Docker may have already loaded the main .env
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.resolve(projectRoot, '.env.test'), override: true });

// Ensure we're using test database URL
const TEST_DATABASE_URL = process.env.DATABASE_URL;

if (!TEST_DATABASE_URL?.includes('_test')) {
  throw new Error(
    'DATABASE_URL must point to test database (should contain "_test"). ' +
      `Got: ${TEST_DATABASE_URL}. ` +
      'Make sure you are running tests with: pnpm test:integration'
  );
}

const adapter = new PrismaPg({ connectionString: TEST_DATABASE_URL });

// Singleton test Prisma client
let testPrisma: PrismaClient | null = null;

/**
 * Get singleton Prisma client for test database
 */
export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      adapter,
      log: ['error'],
    });
  }
  return testPrisma;
}

/**
 * Disconnect test Prisma client
 */
export async function disconnectTestDb(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

/**
 * Run Prisma migrations on test database
 */
export function runMigrations(): void {
  const projectRoot = path.resolve(__dirname, '../..');
  execSync('npx prisma migrate deploy', {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}

/**
 * Seed default categories (required for transactions)
 * Uses same categories as the main seed.ts file
 */
export async function seedCategories(): Promise<void> {
  const prisma = getTestPrisma();

  const categories = [
    // Income Categories
    {
      name: 'Salary',
      type: TransactionType.INCOME,
      icon: '💼',
      color: '#10B981',
    },
    {
      name: 'Passive Income',
      type: TransactionType.INCOME,
      icon: '💰',
      color: '#34D399',
    },
    {
      name: 'Business',
      type: TransactionType.INCOME,
      icon: '🏢',
      color: '#059669',
    },
    {
      name: 'Investments',
      type: TransactionType.INCOME,
      icon: '📈',
      color: '#047857',
    },
    {
      name: 'Freelance',
      type: TransactionType.INCOME,
      icon: '💻',
      color: '#6EE7B7',
    },
    {
      name: 'Other Income',
      type: TransactionType.INCOME,
      icon: '💵',
      color: '#A7F3D0',
    },

    // Expense Categories
    {
      name: 'Housing',
      type: TransactionType.EXPENSE,
      icon: '🏠',
      color: '#EF4444',
    },
    {
      name: 'Food',
      type: TransactionType.EXPENSE,
      icon: '🍔',
      color: '#F97316',
    },
    {
      name: 'Transport',
      type: TransactionType.EXPENSE,
      icon: '🚗',
      color: '#F59E0B',
    },
    {
      name: 'Health',
      type: TransactionType.EXPENSE,
      icon: '⚕️',
      color: '#EC4899',
    },
    {
      name: 'Entertainment',
      type: TransactionType.EXPENSE,
      icon: '🎬',
      color: '#8B5CF6',
    },
    {
      name: 'Education',
      type: TransactionType.EXPENSE,
      icon: '📚',
      color: '#6366F1',
    },
    {
      name: 'Personal',
      type: TransactionType.EXPENSE,
      icon: '👤',
      color: '#06B6D4',
    },
    {
      name: 'Bills',
      type: TransactionType.EXPENSE,
      icon: '📄',
      color: '#DC2626',
    },
    {
      name: 'Shopping',
      type: TransactionType.EXPENSE,
      icon: '🛍️',
      color: '#DB2777',
    },
    {
      name: 'Travel',
      type: TransactionType.EXPENSE,
      icon: '✈️',
      color: '#0EA5E9',
    },
    {
      name: 'Other Expense',
      type: TransactionType.EXPENSE,
      icon: '💸',
      color: '#64748B',
    },

    // Saving Categories
    {
      name: 'Emergency Fund',
      type: TransactionType.SAVING,
      icon: '🛡️',
      color: '#3B82F6',
    },
    {
      name: 'Investments',
      type: TransactionType.SAVING,
      icon: '📊',
      color: '#2563EB',
    },
    {
      name: 'Retirement',
      type: TransactionType.SAVING,
      icon: '🏖️',
      color: '#1D4ED8',
    },
    {
      name: 'Other Saving',
      type: TransactionType.SAVING,
      icon: '💎',
      color: '#60A5FA',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {
        icon: category.icon,
        color: category.color,
      },
      create: category,
    });
  }
}

/**
 * Truncate all tables except categories (fast reset between tests)
 * Uses TRUNCATE CASCADE for referential integrity
 * Keeps categories seeded to avoid re-seeding on every test
 */
export async function truncateTables(): Promise<void> {
  const prisma = getTestPrisma();

  // Order matters due to foreign keys - truncate in dependency order
  // Using raw SQL for efficiency with CASCADE
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Transaction",
      "RecurringTransaction",
      "PurchaseConsideration",
      "Badge",
      "Session",
      "Account",
      "VerificationToken",
      "User"
    CASCADE;
  `);
}

/**
 * Full reset: truncate everything including categories, then reseed
 * Use this when you need a completely fresh database state
 */
export async function resetDatabase(): Promise<void> {
  const prisma = getTestPrisma();

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Transaction",
      "RecurringTransaction",
      "PurchaseConsideration",
      "Badge",
      "Session",
      "Account",
      "VerificationToken",
      "User",
      "Category"
    CASCADE;
  `);

  await seedCategories();
}
