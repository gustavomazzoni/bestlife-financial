import { prisma } from '@/lib/db';
import {
  ScheduledTransaction,
  ScheduleFrequency,
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/types';
import { toUTCMidnight } from '@lifeos/shared';

export interface UpdateScheduledInput {
  amount?: number;
  description?: string;
  type?: TransactionType;
  categoryId?: string;
  frequency?: ScheduleFrequency;
  startDate?: Date;
  endDate?: Date | null;
  necessityLevel?: NecessityLevel | null;
  valueAlignment?: ValueAlignment | null;
  notificationDaysBefore?: number;
  notes?: string | null;
}

export async function updateScheduledTransaction(
  userId: string,
  scheduledId: string,
  data: UpdateScheduledInput
): Promise<ScheduledTransaction> {
  const today = toUTCMidnight(new Date());

  const existing = await prisma.scheduledTransaction.findFirst({
    where: { id: scheduledId, userId },
  });

  if (!existing) {
    throw new Error('Scheduled transaction not found');
  }

  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const startDate = data.startDate ? toUTCMidnight(data.startDate) : undefined;
  const endDate =
    data.endDate !== undefined
      ? data.endDate === null
        ? null
        : toUTCMidnight(data.endDate)
      : undefined;

  if (startDate && startDate < today) {
    throw new Error('Start date cannot be in the past');
  }

  const effectiveStartDate = startDate || existing.startDate;
  const effectiveEndDate = endDate !== undefined ? endDate : existing.endDate;

  if (effectiveEndDate && effectiveEndDate <= effectiveStartDate) {
    throw new Error('End date must be after start date');
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const effectiveType = data.type || existing.type;
    if (category.type !== effectiveType) {
      throw new Error('Category type does not match transaction type');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...data };
  if (startDate) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;

  // Recalculate nextOccurrence if frequency or startDate changed. The first
  // occurrence of a schedule is always its startDate — execute.ts is solely
  // responsible for advancing nextOccurrence forward, after execution.
  if (data.frequency || startDate) {
    updateData.nextOccurrence = effectiveStartDate;
  }

  const scheduled = await prisma.scheduledTransaction.update({
    where: { id: scheduledId },
    data: updateData,
  });

  return scheduled;
}
