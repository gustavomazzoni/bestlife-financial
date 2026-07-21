import { Prisma, TransactionType } from '@/types';

export interface LedgerFields {
  type: TransactionType;
  amount: Prisma.Decimal | number | string;
  accountId: string | null;
  toAccountId: string | null;
  creditCardId?: string | null;
}

/**
 * Applies (sign=1) or reverses (sign=-1) the balance effect implied by a
 * transaction's type/amount/accountId/toAccountId/creditCardId.
 * EXPENSE debits the account (or increments the card's owed balance, if
 * funded by a credit card instead). INCOME/SAVING credit the account.
 * TRANSFER debits the source account and credits the destination — which
 * may be a second account or a credit card (a card payoff, which reduces
 * what's owed).
 */
export async function applyLedgerEffect(
  tx: Prisma.TransactionClient,
  fields: LedgerFields,
  sign: 1 | -1
): Promise<void> {
  const amount = Number(fields.amount) * sign;

  if (fields.type === 'TRANSFER') {
    if (fields.accountId) {
      await tx.financialAccount.update({
        where: { id: fields.accountId },
        data: { balance: { decrement: amount } },
      });
    }
    if (fields.toAccountId) {
      await tx.financialAccount.update({
        where: { id: fields.toAccountId },
        data: { balance: { increment: amount } },
      });
    }
    if (fields.creditCardId) {
      await tx.creditCard.update({
        where: { id: fields.creditCardId },
        data: { balance: { decrement: amount } },
      });
    }
    return;
  }

  if (fields.creditCardId) {
    await tx.creditCard.update({
      where: { id: fields.creditCardId },
      data: { balance: { increment: amount } },
    });
    return;
  }

  if (fields.accountId) {
    const delta = fields.type === 'EXPENSE' ? -amount : amount;
    await tx.financialAccount.update({
      where: { id: fields.accountId },
      data: { balance: { increment: delta } },
    });
  }
}

/**
 * Reverses `before`'s ledger effect (if any) then applies `after`'s (if
 * any). This single helper is the only thing create/update/delete/execute
 * need: it correctly handles every permutation (account added, removed,
 * swapped, amount changed, type flipped to/from TRANSFER) because it's
 * always "undo the old effect, apply the new one" rather than a diff.
 */
export async function reconcileLedgerEffect(
  tx: Prisma.TransactionClient,
  before: LedgerFields | null,
  after: LedgerFields | null
): Promise<void> {
  if (before) await applyLedgerEffect(tx, before, -1);
  if (after) await applyLedgerEffect(tx, after, 1);
}
