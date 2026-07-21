import { prisma } from '@/lib/db';
import { NetWorth } from '@/types/calculations';

export async function calculateNetWorth(userId: string): Promise<NetWorth> {
  const [accounts, investments, debts, creditCards] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.creditCard.findMany({ where: { userId } }),
  ]);

  const accountsTotal = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const investmentsTotal = investments.reduce(
    (sum, i) => sum + Number(i.balance),
    0
  );
  const debtsTotal = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const creditCardsTotal = creditCards.reduce(
    (sum, c) => sum + Number(c.balance),
    0
  );

  return {
    accountsTotal,
    investmentsTotal,
    debtsTotal,
    creditCardsTotal,
    netWorth: accountsTotal + investmentsTotal - debtsTotal - creditCardsTotal,
  };
}
