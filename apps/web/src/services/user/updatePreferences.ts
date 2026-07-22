import { prisma } from '@/lib/db';
import { UserPreferencesInput } from '@/lib/validations/user';
import { UserPreferences } from './getPreferences';

export async function updateUserPreferences(
  userId: string,
  data: UserPreferencesInput
): Promise<UserPreferences> {
  if (data.defaultExpenseAccountId) {
    const account = await prisma.financialAccount.findFirst({
      where: { id: data.defaultExpenseAccountId, userId },
    });
    if (!account) throw new Error('Account not found');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { defaultExpenseAccountId: data.defaultExpenseAccountId },
    select: { defaultExpenseAccountId: true },
  });

  return {
    defaultExpenseAccountId: user.defaultExpenseAccountId ?? null,
  };
}
