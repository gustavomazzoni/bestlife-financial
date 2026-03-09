import { prisma } from '@/lib/db';
import {
  ScheduledTransaction,
  ScheduleFrequency,
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/types';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

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

function calculateNextOccurrence(
  startDate: Date,
  frequency: ScheduleFrequency
): Date {
  switch (frequency) {
    case 'ONCE':
      return startDate;
    case 'WEEKLY':
      return addDays(startDate, 7);
    case 'MONTHLY':
      return addMonths(startDate, 1);
    case 'YEARLY':
      return addYears(startDate, 1);
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

export async function updateScheduledTransaction(
  userId: string,
  scheduledId: string,
  data: UpdateScheduledInput
): Promise<ScheduledTransaction> {
  const today = startOfDay(new Date());

  const existing = await prisma.scheduledTransaction.findFirst({
    where: { id: scheduledId, userId },
  });

  if (!existing) {
    throw new Error('Scheduled transaction not found');
  }

  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (data.startDate && startOfDay(data.startDate) < today) {
    throw new Error('Start date cannot be in the past');
  }

  const effectiveStartDate = data.startDate || existing.startDate;
  const effectiveEndDate =
    data.endDate !== undefined ? data.endDate : existing.endDate;

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

  // Recalculate nextOccurrence if frequency or startDate changed
  if (data.frequency || data.startDate) {
    const effectiveFrequency = data.frequency || existing.frequency;
    updateData.nextOccurrence = calculateNextOccurrence(
      effectiveStartDate,
      effectiveFrequency
    );
  }

  const scheduled = await prisma.scheduledTransaction.update({
    where: { id: scheduledId },
    data: updateData,
  });

  return scheduled;
}
