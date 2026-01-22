import { prisma } from '@/lib/db';
import { Transaction, RecurringFrequency } from '@/types';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

/**
 * Calculate the next due date based on frequency
 */
function calculateNextDueDate(
  currentDueDate: Date,
  frequency: RecurringFrequency
): Date {
  switch (frequency) {
    case 'WEEKLY':
      return addDays(currentDueDate, 7);
    case 'MONTHLY':
      return addMonths(currentDueDate, 1);
    case 'YEARLY':
      return addYears(currentDueDate, 1);
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Execute a recurring transaction by creating a new transaction from it.
 *
 * Business Logic:
 * 1. Verify recurring belongs to user and is active
 * 2. Verify nextDueDate <= today (transaction is due)
 * 3. Create transaction with all recurring fields
 * 4. Set transaction.recurringId = recurringId
 * 5. Update recurring:
 *    - lastCreatedDate = today
 *    - nextDueDate = calculate next (based on frequency)
 *    - If nextDueDate > endDate: set isActive = false
 */
export async function executeRecurringTransaction(
  userId: string,
  recurringId: string
): Promise<Transaction> {
  const today = startOfDay(new Date());

  // Use a transaction to ensure atomicity
  return prisma.$transaction(async tx => {
    // 1. Verify recurring exists and belongs to user
    const recurring = await tx.recurringTransaction.findFirst({
      where: { id: recurringId, userId },
    });

    if (!recurring) {
      throw new Error('Recurring transaction not found');
    }

    // 2. Verify recurring is active
    if (!recurring.isActive) {
      throw new Error('Recurring transaction is not active');
    }

    // 3. Verify nextDueDate <= today
    if (startOfDay(recurring.nextDueDate) > today) {
      throw new Error('Recurring transaction is not due yet');
    }

    // 4. Create transaction from recurring
    const transaction = await tx.transaction.create({
      data: {
        userId,
        date: today,
        amount: recurring.amount,
        description: recurring.description,
        type: recurring.type,
        categoryId: recurring.categoryId,
        necessityLevel: recurring.necessityLevel,
        valueAlignment: recurring.valueAlignment,
        isRecurring: true,
        recurringId: recurringId,
      },
    });

    // 5. Calculate next due date
    const nextDueDate = calculateNextDueDate(
      recurring.nextDueDate,
      recurring.frequency
    );

    // 6. Determine if recurring should be deactivated
    const shouldDeactivate =
      recurring.endDate && nextDueDate > recurring.endDate;

    // 7. Update recurring transaction
    await tx.recurringTransaction.update({
      where: { id: recurringId },
      data: {
        lastCreatedDate: today,
        nextDueDate,
        isActive: shouldDeactivate ? false : recurring.isActive,
      },
    });

    return transaction;
  });
}
