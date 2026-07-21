import { prisma } from '@/lib/db';
import { UpdateTransactionInput } from '@/lib/validations/transaction';
import { Transaction } from '@/types/transaction';
import { assertValidFundingSource } from './funding-source';
import { reconcileLedgerEffect } from './ledger';
import { assertAccountsOwnedByUser } from './validate-accounts';

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: UpdateTransactionInput
): Promise<Transaction> {
  return prisma.$transaction(async tx => {
    // Verify exists and belongs to user
    const existing = await tx.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    const merged = { ...existing, ...data };
    assertValidFundingSource(merged);
    await assertAccountsOwnedByUser(tx, userId, [
      data.accountId,
      data.toAccountId,
    ]);

    await reconcileLedgerEffect(tx, existing, null);

    const transaction = await tx.transaction.update({
      where: { id: transactionId },
      data,
    });

    await reconcileLedgerEffect(tx, null, transaction);

    return transaction;
  });
}
