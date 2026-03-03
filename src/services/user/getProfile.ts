import { prisma } from '@/lib/db';

export interface UserProfile {
  activeIncomeMonthly: number;
  passiveIncomeMonthly: number;
  dreamLifestyleCost: number | null;
  currentInvestments: number;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeIncomeMonthly: true,
      passiveIncomeMonthly: true,
      dreamLifestyleCost: true,
      currentInvestments: true,
    },
  });

  return {
    activeIncomeMonthly: Number(user?.activeIncomeMonthly ?? 0),
    passiveIncomeMonthly: Number(user?.passiveIncomeMonthly ?? 0),
    dreamLifestyleCost: user?.dreamLifestyleCost
      ? Number(user.dreamLifestyleCost)
      : null,
    currentInvestments: Number(user?.currentInvestments ?? 0),
  };
}
