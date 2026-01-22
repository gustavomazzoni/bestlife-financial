import { prisma } from '@/lib/db';
import { RecurringTransaction, RecurringFrequency } from '@/types';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

export interface CreateRecurringInput {
  amount: number;
  description: string;
  type: 'EXPENSE' | 'INCOME' | 'SAVING' | 'TRANSFER';
  categoryId: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
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
}

/**
 * Calculate the next due date based on frequency
 */
function calculateNextDueDate(
  startDate: Date,
  frequency: RecurringFrequency
): Date {
  switch (frequency) {
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

export async function createRecurringTransaction(
  userId: string,
  data: CreateRecurringInput
): Promise<RecurringTransaction> {
  const today = startOfDay(new Date());

  // Validate amount is positive
  if (data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Validate startDate is not in the past
  if (startOfDay(data.startDate) < today) {
    throw new Error('Start date cannot be in the past');
  }

  // Validate endDate is after startDate (if provided)
  if (data.endDate && data.endDate <= data.startDate) {
    throw new Error('End date must be after start date');
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Verify category type matches transaction type
  if (category.type !== data.type) {
    throw new Error('Category type does not match transaction type');
  }

  // Calculate next due date based on frequency
  const nextDueDate = calculateNextDueDate(data.startDate, data.frequency);

  // Create recurring transaction with defaults
  const recurringTransaction = await prisma.recurringTransaction.create({
    data: {
      userId,
      amount: data.amount,
      description: data.description,
      type: data.type,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
      nextDueDate,
      notificationDaysBefore: data.notificationDaysBefore ?? 3,
      necessityLevel: data.necessityLevel,
      valueAlignment: data.valueAlignment,
    },
  });

  return recurringTransaction;
}
