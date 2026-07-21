import { Prisma } from '@/types';

/** Throws if any of the given account ids don't belong to the user. Ignores null/undefined ids. */
export async function assertAccountsOwnedByUser(
  tx: Prisma.TransactionClient,
  userId: string,
  accountIds: (string | null | undefined)[]
): Promise<void> {
  const ids = [...new Set(accountIds.filter((id): id is string => !!id))];
  if (ids.length === 0) return;

  const count = await tx.financialAccount.count({
    where: { id: { in: ids }, userId },
  });

  if (count !== ids.length) {
    throw new Error('Account not found');
  }
}
