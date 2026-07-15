import { prisma } from '@/lib/db';
import { Debt } from '@/types';

export interface UpdateDebtInput {
  name?: string;
  balance?: number;
  dueDate?: Date | null;
  installmentCurrent?: number;
  installmentTotal?: number;
}

export async function updateDebt(
  userId: string,
  debtId: string,
  data: UpdateDebtInput
): Promise<Debt> {
  const existing = await prisma.debt.findFirst({
    where: { id: debtId, userId },
  });

  if (!existing) {
    throw new Error('Debt not found');
  }

  if (data.balance !== undefined && data.balance < 0) {
    throw new Error('Balance cannot be negative');
  }

  const effectiveCurrent =
    data.installmentCurrent ?? existing.installmentCurrent;
  const effectiveTotal = data.installmentTotal ?? existing.installmentTotal;
  if (
    effectiveCurrent !== null &&
    effectiveCurrent !== undefined &&
    effectiveTotal !== null &&
    effectiveTotal !== undefined &&
    effectiveCurrent > effectiveTotal
  ) {
    throw new Error('installmentCurrent cannot exceed installmentTotal');
  }

  return prisma.debt.update({
    where: { id: debtId },
    data,
  });
}
