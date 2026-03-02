import { prisma } from '@/lib/db';
import { calculateMonthlyExpenses } from './index';
import { FreedomMetrics } from '@/types/calculations';

export async function calculateFreedomMetrics(
  userId: string
): Promise<FreedomMetrics> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { average: avgMonthlyExpenses } = await calculateMonthlyExpenses(
    userId,
    3
  );

  const dreamLifestyleCost = Number(user.dreamLifestyleCost ?? 0);
  const currentInvestments = Number(user.currentInvestments);
  const activeIncomeMonthly = Number(user.activeIncomeMonthly);

  const fiNumber = dreamLifestyleCost > 0 ? dreamLifestyleCost * 12 * 25 : 0;

  const fiProgress =
    fiNumber > 0
      ? Math.min(100, Math.round((currentInvestments / fiNumber) * 10000) / 100)
      : 0;

  const currentRunway =
    dreamLifestyleCost > 0
      ? Math.round((currentInvestments / dreamLifestyleCost) * 100) / 100
      : 0;

  const savingsRate =
    activeIncomeMonthly > 0
      ? Math.round(
          ((activeIncomeMonthly - avgMonthlyExpenses) / activeIncomeMonthly) *
            10000
        ) / 100
      : 0;

  const monthlySavings = activeIncomeMonthly - avgMonthlyExpenses;
  const amountNeeded = fiNumber - currentInvestments;
  const monthsToFI =
    amountNeeded <= 0
      ? 0
      : monthlySavings > 0
        ? Math.ceil(amountNeeded / monthlySavings)
        : null;

  return {
    fiNumber,
    fiProgress,
    currentRunway,
    savingsRate,
    monthsToFI,
    avgMonthlyExpenses,
    dreamLifestyleCost,
  };
}
