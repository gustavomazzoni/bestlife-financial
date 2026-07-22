import { randomUUID } from 'crypto';
import { addMonths } from 'date-fns';
import { prisma } from '@/lib/db';
import { NecessityLevel, Transaction, ValueAlignment } from '@/types';
import { reconcileLedgerEffect } from '../transactions/ledger';
import { splitIntoInstallments } from './split-installments';

export interface CreateInstallmentPurchaseInput {
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  necessityLevel?: NecessityLevel;
  valueAlignment?: ValueAlignment;
  notes?: string;
  installments: number;
}

/**
 * Records an expense funded by a credit-card-type account, optionally
 * split into N installments. All N Transaction rows are created
 * immediately (dated one month apart), and the full purchase amount is
 * applied to the card's owed balance right away via the shared ledger —
 * even though later installments are dated in the future, there's no
 * "apply on due date" concept in this app, so eager creation is what
 * makes the card balance correctly reflect the whole purchase.
 */
export async function createInstallmentPurchase(
  userId: string,
  accountId: string,
  data: CreateInstallmentPurchaseInput
): Promise<Transaction[]> {
  return prisma.$transaction(async tx => {
    const card = await tx.financialAccount.findFirst({
      where: { id: accountId, userId, type: 'CREDIT_CARD' },
    });

    if (!card) {
      throw new Error('Credit card account not found');
    }

    const category = await tx.category.findUnique({
      where: { id: data.categoryId, type: 'EXPENSE' },
    });

    if (!category) {
      throw new Error('Invalid category');
    }

    const installments = data.installments;
    const amounts = splitIntoInstallments(data.amount, installments);
    const groupId = installments > 1 ? randomUUID() : null;

    const rows: Transaction[] = [];
    for (let i = 0; i < installments; i++) {
      const row = await tx.transaction.create({
        data: {
          userId,
          date: addMonths(data.date, i),
          amount: amounts[i],
          description:
            installments > 1
              ? `${data.description} (${i + 1}/${installments})`
              : data.description,
          type: 'EXPENSE',
          categoryId: data.categoryId,
          necessityLevel: data.necessityLevel,
          valueAlignment: data.valueAlignment,
          accountId,
          installmentGroupId: groupId,
          installmentCurrent: installments > 1 ? i + 1 : null,
          installmentTotal: installments > 1 ? installments : null,
          notes: data.notes,
        },
      });

      await reconcileLedgerEffect(tx, null, row);
      rows.push(row);
    }

    return rows;
  });
}
