import { Prisma, TransactionType } from '@/types';

export interface LedgerFields {
  type: TransactionType;
  amount: Prisma.Decimal | number | string;
  accountId: string | null;
  toAccountId: string | null;
}

async function isLiabilityAccount(
  tx: Prisma.TransactionClient,
  accountId: string
): Promise<boolean> {
  const account = await tx.financialAccount.findUniqueOrThrow({
    where: { id: accountId },
    select: { type: true },
  });
  return account.type === 'CREDIT_CARD';
}

/**
 * Applies (sign=1) or reverses (sign=-1) the balance effect implied by a
 * transaction's type/amount/accountId/toAccountId. Every FinancialAccount
 * is either asset-style (CHECKING/SAVINGS/WALLET — a positive balance is
 * money the user has) or liability-style (CREDIT_CARD — a positive
 * balance is money the user owes), resolved here per touched account.
 * EXPENSE debits an asset account, or increments what's owed on a
 * liability account. INCOME/SAVING credit an asset account (never legal
 * against a liability one — enforced by funding-source.ts, not here).
 * TRANSFER debits the source (always asset-side) and credits the
 * destination — decrementing it if liability (a card payoff, reducing
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
      const payoff = await isLiabilityAccount(tx, fields.toAccountId);
      await tx.financialAccount.update({
        where: { id: fields.toAccountId },
        data: payoff
          ? { balance: { decrement: amount } }
          : { balance: { increment: amount } },
      });
    }
    return;
  }

  if (fields.accountId) {
    const liability = await isLiabilityAccount(tx, fields.accountId);
    const delta = liability
      ? fields.type === 'EXPENSE'
        ? amount
        : -amount
      : fields.type === 'EXPENSE'
        ? -amount
        : amount;
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
