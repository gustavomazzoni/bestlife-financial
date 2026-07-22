import { prisma } from '@/lib/db';
import { ScheduledTransaction, ScheduleFrequency } from '@/types';
import { toUTCMidnight } from '@lifeos/shared';
import { assertValidFundingSource } from '../transactions/funding-source';
import { assertAccountsOwnedByUser } from '../transactions/validate-accounts';

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
  accountId?: string;
  notes?: string;
}

export async function createScheduledTransaction(
  userId: string,
  data: CreateScheduledInput
): Promise<ScheduledTransaction> {
  const today = toUTCMidnight(new Date());

  if (data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const startDate = toUTCMidnight(data.startDate);
  const endDate = data.endDate ? toUTCMidnight(data.endDate) : undefined;

  if (startDate < today) {
    throw new Error('Start date cannot be in the past');
  }

  if (endDate && endDate <= startDate) {
    throw new Error('End date must be after start date');
  }

  // ONCE transactions cannot have an endDate
  if (data.frequency === 'ONCE' && endDate) {
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

  const types = await assertAccountsOwnedByUser(prisma, userId, [
    data.accountId,
  ]);
  assertValidFundingSource({
    type: data.type,
    accountId: data.accountId,
    accountType: data.accountId ? types.get(data.accountId) : null,
  });

  // The first occurrence of a new schedule is always startDate itself —
  // execute.ts is solely responsible for advancing nextOccurrence forward,
  // and only after that first occurrence has actually been executed.
  const nextOccurrence = startDate;

  const scheduled = await prisma.scheduledTransaction.create({
    data: {
      userId,
      amount: data.amount,
      description: data.description,
      type: data.type,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate,
      endDate,
      nextOccurrence,
      notificationDaysBefore: data.notificationDaysBefore ?? 3,
      necessityLevel: data.necessityLevel,
      valueAlignment: data.valueAlignment,
      accountId: data.accountId,
      notes: data.notes,
    },
  });

  return scheduled;
}
