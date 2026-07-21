import { Prisma } from '@/types';

/** Throws if any of the given credit card ids don't belong to the user. Ignores null/undefined ids. */
export async function assertCreditCardsOwnedByUser(
  tx: Prisma.TransactionClient,
  userId: string,
  creditCardIds: (string | null | undefined)[]
): Promise<void> {
  const ids = [...new Set(creditCardIds.filter((id): id is string => !!id))];
  if (ids.length === 0) return;

  const count = await tx.creditCard.count({
    where: { id: { in: ids }, userId },
  });

  if (count !== ids.length) {
    throw new Error('Credit card not found');
  }
}
