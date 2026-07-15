import { prisma } from '@/lib/db';

export async function deleteFinancialAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const existing = await prisma.financialAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!existing) {
    throw new Error('Account not found');
  }

  await prisma.financialAccount.delete({ where: { id: accountId } });
}
