import { prisma } from '@/lib/db';
import { FinancialAccount, FinancialAccountType } from '@/types';

export interface UpdateFinancialAccountInput {
  name?: string;
  type?: FinancialAccountType;
  balance?: number;
  color?: string;
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

  return prisma.financialAccount.update({
    where: { id: accountId },
    data,
  });
}
