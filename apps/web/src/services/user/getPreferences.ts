import { prisma } from '@/lib/db';

export interface UserPreferences {
  defaultExpenseAccountId: string | null;
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultExpenseAccountId: true },
  });

  return {
    defaultExpenseAccountId: user?.defaultExpenseAccountId ?? null,
  };
}
