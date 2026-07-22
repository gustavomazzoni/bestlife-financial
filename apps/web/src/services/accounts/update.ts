import { prisma } from '@/lib/db';
import { FinancialAccount, FinancialAccountType } from '@/types';

export interface UpdateFinancialAccountInput {
  name?: string;
  type?: FinancialAccountType;
  balance?: number;
  color?: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

function isLiabilityType(type: FinancialAccountType): boolean {
  return type === 'CREDIT_CARD';
}

export async function updateFinancialAccount(
  userId: string,
  accountId: string,
  data: UpdateFinancialAccountInput
): Promise<FinancialAccount> {
  const existing = await prisma.financialAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!existing) {
    throw new Error('Account not found');
  }

  if (
    data.type &&
    isLiabilityType(data.type) !== isLiabilityType(existing.type)
  ) {
    // Ledger reversal always reads an account's CURRENT type (see ledger.ts),
    // so flipping between asset and liability after transactions exist would
    // silently misinterpret past balance math the next time one of those
    // transactions is edited or deleted.
    const transactionCount = await prisma.transaction.count({
      where: { OR: [{ accountId }, { toAccountId: accountId }] },
    });
    if (transactionCount > 0) {
      throw new Error(
        'Cannot change an account between asset and credit-card type once it has transactions'
      );
    }
  }

  return prisma.financialAccount.update({
    where: { id: accountId },
    data,
  });
}
