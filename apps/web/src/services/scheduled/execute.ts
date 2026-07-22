import { prisma } from '@/lib/db';
import { Transaction, ScheduleFrequency } from '@/types';
import { addDays, addMonths, addYears } from 'date-fns';
import { toUTCMidnight } from '@lifeos/shared';
import { assertValidFundingSource } from '../transactions/funding-source';
import { reconcileLedgerEffect } from '../transactions/ledger';
import { assertAccountsOwnedByUser } from '../transactions/validate-accounts';

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
 * An optional executionDate can override today's date. An optional
 * accountId records which account the (now-confirmed) transaction came
 * from — ScheduledTransaction itself has no account, since that's only
 * known once it's actually paid. An optional amount overrides the
 * template's own amount for this occurrence only (e.g. a utility bill
 * whose value changes every month) — the template's amount is untouched.
 */
export async function executeScheduledTransaction(
  userId: string,
  scheduledId: string,
  executionDate?: Date,
  accountId?: string,
  toAccountId?: string,
  amount?: number
): Promise<Transaction> {
  const today = toUTCMidnight(new Date());
  const transactionDate = executionDate ? toUTCMidnight(executionDate) : today;

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
      toUTCMidnight(scheduled.nextOccurrence) > today
    ) {
      throw new Error('Scheduled transaction is not due yet');
    }

    const types = await assertAccountsOwnedByUser(tx, userId, [
      accountId,
      toAccountId,
    ]);
    assertValidFundingSource({
      type: scheduled.type,
      accountId,
      toAccountId,
      accountType: accountId ? types.get(accountId) : null,
      toAccountType: toAccountId ? types.get(toAccountId) : null,
    });

    if (amount !== undefined && amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        date: transactionDate,
        amount: amount ?? scheduled.amount,
        description: scheduled.description,
        type: scheduled.type,
        categoryId: scheduled.categoryId,
        necessityLevel: scheduled.necessityLevel,
        valueAlignment: scheduled.valueAlignment,
        scheduledId,
        accountId,
        toAccountId,
        notes: scheduled.notes,
      },
    });

    await reconcileLedgerEffect(tx, null, transaction);

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
