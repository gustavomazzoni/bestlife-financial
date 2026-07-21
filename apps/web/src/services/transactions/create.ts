import { prisma } from '@/lib/db';
import { CreateTransactionInput } from '@/lib/validations/transaction';
import { Transaction } from '@/types/transaction';
import { assertValidFundingSource } from './funding-source';
import { reconcileLedgerEffect } from './ledger';
import { assertAccountsOwnedByUser } from './validate-accounts';

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput
): Promise<Transaction> {
  return prisma.$transaction(async tx => {
    // Verify category exists and matches type
    const category = await tx.category.findUnique({
      where: { id: data.categoryId, type: data.type },
    });

    if (!category) {
      throw new Error('Invalid category');
    }

    assertValidFundingSource(data);
    await assertAccountsOwnedByUser(tx, userId, [
      data.accountId,
      data.toAccountId,
    ]);

    const transaction = await tx.transaction.create({
      data: {
        ...data,
        userId,
      },
    });

    await reconcileLedgerEffect(tx, null, transaction);

    return transaction;
  });
}
