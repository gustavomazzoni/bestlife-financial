import { execSync } from 'child_process';
import path from 'path';
import * as dotenv from 'dotenv';

/**
 * Global setup for integration tests
 * Runs ONCE before all tests - handles migrations
 */
export default async function globalSetup() {
  console.log('\n🔧 Setting up test database...');

  const projectRoot = path.resolve(__dirname, '../..');

  // Load .env.test and OVERRIDE existing env vars
  // This is needed because Docker may have already loaded the main .env
  const envTestPath = path.resolve(projectRoot, '.env.test');
  const envConfig = dotenv.config({ path: envTestPath, override: true });

  const testDatabaseUrl =
    envConfig.parsed?.DATABASE_URL || process.env.DATABASE_URL;

  if (!testDatabaseUrl?.includes('_test')) {
    throw new Error(
      `DATABASE_URL must point to test database. Got: ${testDatabaseUrl}`
    );
  }

  console.log(`📦 Running migrations on test database...`);
  console.log(`   Using: ${testDatabaseUrl.replace(/:[^:@]+@/, ':***@')}`);

  try {
    execSync('npx prisma migrate deploy', {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
      stdio: 'inherit',
    });
    console.log('✅ Migrations completed successfully\n');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}
