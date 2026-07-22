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

    const types = await assertAccountsOwnedByUser(tx, userId, [
      data.accountId,
      data.toAccountId,
    ]);
    assertValidFundingSource({
      ...data,
      accountType: data.accountId ? types.get(data.accountId) : null,
      toAccountType: data.toAccountId ? types.get(data.toAccountId) : null,
    });

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
