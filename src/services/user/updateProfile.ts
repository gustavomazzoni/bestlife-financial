import { prisma } from '@/lib/db';
import { UserProfileInput } from '@/lib/validations/user';
import { UserProfile } from './getProfile';

export async function updateUserProfile(
  userId: string,
  data: UserProfileInput
): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      activeIncomeMonthly: data.activeIncomeMonthly,
      dreamLifestyleCost: data.dreamLifestyleCost,
      currentInvestments: data.currentInvestments,
    },
    select: {
      activeIncomeMonthly: true,
      dreamLifestyleCost: true,
      currentInvestments: true,
    },
  });

  return {
    activeIncomeMonthly: Number(user.activeIncomeMonthly),
    dreamLifestyleCost: Number(user.dreamLifestyleCost),
    currentInvestments: Number(user.currentInvestments),
  };
}
