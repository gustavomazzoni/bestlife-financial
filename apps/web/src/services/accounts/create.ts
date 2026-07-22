import { prisma } from '@/lib/db';
import { FinancialAccount, FinancialAccountType } from '@/types';

export interface CreateFinancialAccountInput {
  name: string;
  type: FinancialAccountType;
  balance?: number;
  color?: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export async function createFinancialAccount(
  userId: string,
  data: CreateFinancialAccountInput
): Promise<FinancialAccount> {
  const account = await prisma.financialAccount.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      balance: data.balance ?? 0,
      color: data.color,
      creditLimit: data.creditLimit,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
    },
  });

  const accountCount = await prisma.financialAccount.count({
    where: { userId },
  });
  if (accountCount === 1) {
    await prisma.user.update({
      where: { id: userId },
      data: { defaultExpenseAccountId: account.id },
    });
  }

  return account;
}
