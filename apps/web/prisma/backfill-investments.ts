/**
 * One-time data migration for the FinancialAccount/Investment/Debt net-worth
 * feature (Phase 3): creates one Investment row per user from their existing
 * User.currentInvestments scalar, so net worth has something to sum once
 * calculateFreedomMetrics/net-worth switch off that column.
 *
 * Idempotent: skips any user who already has at least one Investment row
 * (from a prior run of this script, or from manually adding one via the
 * Accounts screen), so it's safe to re-run.
 *
 * Run: docker compose exec app pnpm --filter @lifeos/web db:backfill-investments
 */
import prisma from '@/lib/db';

async function main() {
  const users = await prisma.user.findMany({
    where: { currentInvestments: { gt: 0 } },
    select: { id: true, email: true, currentInvestments: true },
  });

  console.log(`Found ${users.length} user(s) with currentInvestments > 0`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const existing = await prisma.investment.count({
      where: { userId: user.id },
    });
    if (existing > 0) {
      skipped++;
      continue;
    }

    await prisma.investment.create({
      data: {
        userId: user.id,
        name: 'Investimentos (migrado)',
        category: 'Geral',
        balance: user.currentInvestments,
      },
    });
    created++;
    console.log(
      `  Created Investment for ${user.email}: ${user.currentInvestments}`
    );
  }

  console.log(
    `✅ Backfill complete: ${created} created, ${skipped} skipped (already had investments)`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ Error backfilling investments:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
