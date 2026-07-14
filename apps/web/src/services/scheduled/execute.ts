import { prisma } from '@/lib/db';
import { Transaction, ScheduleFrequency } from '@/types';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

/**
 * Calculate the next occurrence based on frequency.
 * Used for recurring scheduled transactions after execution.
 */
function calculateNextOccurrence(
  currentOccurrence: Date,
  frequency: ScheduleFrequency
): Date {
  switch (frequency) {
    case 'WEEKLY':
      return addDays(currentOccurrence, 7);
    case 'MONTHLY':
      return addMonths(currentOccurrence, 1);
    case 'YEARLY':
      return addYears(currentOccurrence, 1);
    default:
      throw new Error(`Cannot advance occurrence for frequency: ${frequency}`);
  }
}

/**
 * Execute a scheduled transaction.
 *
 * Business logic by frequency:
 * - ONCE: Create Transaction, set ScheduledTransaction.isActive = false
 * - RECURRING (WEEKLY/MONTHLY/YEARLY):
 *   Create Transaction, advance nextOccurrence.
 *   If nextOccurrence > endDate: set isActive = false.
 *
 * An optional executionDate can override today's date.
 */
export async function executeScheduledTransaction(
  userId: string,
  scheduledId: string,
  executionDate?: Date
): Promise<Transaction> {
  const today = startOfDay(new Date());
  const transactionDate = executionDate ? startOfDay(executionDate) : today;

  return prisma.$transaction(async tx => {
    const scheduled = await tx.scheduledTransaction.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!scheduled) {
      throw new Error('Scheduled transaction not found');
    }

    if (!scheduled.isActive) {
      throw new Error('Scheduled transaction is not active');
    }

    // For recurring: check if due (skip check when executionDate explicitly provided)
    if (
      scheduled.frequency !== 'ONCE' &&
      !executionDate &&
      startOfDay(scheduled.nextOccurrence) > today
    ) {
      throw new Error('Scheduled transaction is not due yet');
    }

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        date: transactionDate,
        amount: scheduled.amount,
        description: scheduled.description,
        type: scheduled.type,
        categoryId: scheduled.categoryId,
        necessityLevel: scheduled.necessityLevel,
        valueAlignment: scheduled.valueAlignment,
        scheduledId,
        notes: scheduled.notes,
      },
    });

    if (scheduled.frequency === 'ONCE') {
      // One-time: mark as executed (inactive)
      await tx.scheduledTransaction.update({
        where: { id: scheduledId },
        data: {
          isActive: false,
          lastExecutedDate: transactionDate,
        },
      });
    } else {
      // Recurring: advance nextOccurrence
      const nextOccurrence = calculateNextOccurrence(
        scheduled.nextOccurrence,
        scheduled.frequency
      );

      const shouldDeactivate =
        scheduled.endDate && nextOccurrence > scheduled.endDate;

      await tx.scheduledTransaction.update({
        where: { id: scheduledId },
        data: {
          lastExecutedDate: transactionDate,
          nextOccurrence,
          isActive: shouldDeactivate ? false : scheduled.isActive,
        },
      });
    }

    return transaction;
  });
}
