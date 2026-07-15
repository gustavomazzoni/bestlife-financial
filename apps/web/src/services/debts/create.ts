import { prisma } from '@/lib/db';
import { Debt } from '@/types';

export interface CreateDebtInput {
  name: string;
  balance: number;
  dueDate?: Date;
  installmentCurrent?: number;
  installmentTotal?: number;
}

export async function createDebt(
  userId: string,
  data: CreateDebtInput
): Promise<Debt> {
  if (data.balance < 0) {
    throw new Error('Balance cannot be negative');
  }

  if (
    data.installmentCurrent !== undefined &&
    data.installmentTotal !== undefined &&
    data.installmentCurrent > data.installmentTotal
  ) {
    throw new Error('installmentCurrent cannot exceed installmentTotal');
  }

  return prisma.debt.create({
    data: {
      userId,
      name: data.name,
      balance: data.balance,
      dueDate: data.dueDate,
      installmentCurrent: data.installmentCurrent,
      installmentTotal: data.installmentTotal,
    },
  });
}
