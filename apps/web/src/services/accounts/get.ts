import { prisma } from '@/lib/db';
import { FinancialAccount } from '@/types';

export async function getFinancialAccount(
  userId: string,
  accountId: string
): Promise<FinancialAccount> {
  const account = await prisma.financialAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new Error('Account not found');
  }

  return account;
}
