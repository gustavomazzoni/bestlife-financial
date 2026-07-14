import { prisma } from '@/lib/db';
import { ScheduledTransaction, ScheduleFrequency } from '@/types';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

export interface CreateScheduledInput {
  amount: number;
  description: string;
  type: 'EXPENSE' | 'INCOME' | 'SAVING' | 'TRANSFER';
  categoryId: string;
  frequency: ScheduleFrequency;
  startDate: Date;
  endDate?: Date;
  necessityLevel?: 'IMPORTANT' | 'NEEDS' | 'WANTS';
  valueAlignment?:
    | 'ALIGNED'
    | 'DEFAULT'
    | 'EXPERIENCE'
    | 'MATERIAL'
    | 'FREEDOM_ENABLING'
    | 'FREEDOM_LIMITING';
  notificationDaysBefore?: number;
  notes?: string;
}

/**
 * Calculate the next occurrence date based on frequency.
 * For ONCE: nextOccurrence = startDate (the scheduled date itself).
 * For RECURRING: nextOccurrence = one period after startDate.
 */
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

export async function createScheduledTransaction(
  userId: string,
  data: CreateScheduledInput
): Promise<ScheduledTransaction> {
  const today = startOfDay(new Date());

  if (data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const startDate = startOfDay(data.startDate);

  if (startDate < today) {
    throw new Error('Start date cannot be in the past');
  }

  if (data.endDate && data.endDate <= data.startDate) {
    throw new Error('End date must be after start date');
  }

  // ONCE transactions cannot have an endDate
  if (data.frequency === 'ONCE' && data.endDate) {
    throw new Error('One-time scheduled transactions cannot have an end date');
  }

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (category.type !== data.type) {
    throw new Error('Category type does not match transaction type');
  }

  const nextOccurrence = calculateNextOccurrence(startDate, data.frequency);

  const scheduled = await prisma.scheduledTransaction.create({
    data: {
      userId,
      amount: data.amount,
      description: data.description,
      type: data.type,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate,
      endDate: data.endDate,
      nextOccurrence,
      notificationDaysBefore: data.notificationDaysBefore ?? 3,
      necessityLevel: data.necessityLevel,
      valueAlignment: data.valueAlignment,
      notes: data.notes,
    },
  });

  return scheduled;
}
