import { prisma } from '@/lib/db';
import {
  RecurringTransaction,
  RecurringFrequency,
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/types';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

export interface UpdateRecurringInput {
  amount?: number;
  description?: string;
  type?: TransactionType;
  categoryId?: string;
  frequency?: RecurringFrequency;
  startDate?: Date;
  endDate?: Date | null;
  necessityLevel?: NecessityLevel | null;
  valueAlignment?: ValueAlignment | null;
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

export async function updateRecurringTransaction(
  userId: string,
  recurringId: string,
  data: UpdateRecurringInput
): Promise<RecurringTransaction> {
  const today = startOfDay(new Date());

  // Verify exists and belongs to user
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: recurringId, userId },
  });

  if (!existing) {
    throw new Error('Recurring transaction not found');
  }

  // Validate amount if provided
  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Validate startDate if provided
  if (data.startDate && startOfDay(data.startDate) < today) {
    throw new Error('Start date cannot be in the past');
  }

  // Determine the effective startDate and endDate for validation
  const effectiveStartDate = data.startDate || existing.startDate;
  const effectiveEndDate =
    data.endDate !== undefined ? data.endDate : existing.endDate;

  // Validate endDate is after startDate
  if (effectiveEndDate && effectiveEndDate <= effectiveStartDate) {
    throw new Error('End date must be after start date');
  }

  // Validate category if categoryId is changed
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

  // Build update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...data };

  // Recalculate nextDueDate if frequency or startDate changed
  if (data.frequency || data.startDate) {
    const effectiveFrequency = data.frequency || existing.frequency;
    updateData.nextDueDate = calculateNextDueDate(
      effectiveStartDate,
      effectiveFrequency
    );
  }

  const recurring = await prisma.recurringTransaction.update({
    where: { id: recurringId },
    data: updateData,
  });

  return recurring;
}
