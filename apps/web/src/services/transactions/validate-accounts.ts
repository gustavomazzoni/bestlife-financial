import { FinancialAccountType, Prisma } from '@/types';

/**
 * Throws if any of the given account ids don't belong to the user.
 * Ignores null/undefined ids. Returns the resolved type of each owned
 * account, since ownership-checking and type-resolution (needed by
 * assertValidFundingSource to know asset-vs-liability) are the same query.
 */
export async function assertAccountsOwnedByUser(
  tx: Prisma.TransactionClient,
  userId: string,
  accountIds: (string | null | undefined)[]
): Promise<Map<string, FinancialAccountType>> {
  const ids = [...new Set(accountIds.filter((id): id is string => !!id))];
  if (ids.length === 0) return new Map();

  const accounts = await tx.financialAccount.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true, type: true },
  });

  if (accounts.length !== ids.length) {
    throw new Error('Account not found');
  }

  return new Map(accounts.map(a => [a.id, a.type]));
}
