import { TransactionType } from '@/types';

export interface FundingSourceFields {
  type: TransactionType;
  accountId?: string | null;
  toAccountId?: string | null;
  creditCardId?: string | null;
}

/**
 * Encodes the legal accountId/toAccountId/creditCardId combinations for a
 * transaction. TRANSFER needs exactly one destination (a second account or
 * a credit card being paid off); every other type must not carry a
 * toAccountId, and a creditCardId (funding an EXPENSE via a card) is
 * mutually exclusive with accountId. Credit cards can't fund
 * INCOME/SAVING — only spending accrues card debt.
 */
export function assertValidFundingSource(fields: FundingSourceFields): void {
  if (fields.type === 'TRANSFER') {
    if (!fields.accountId) {
      throw new Error('Transfer requires a source accountId');
    }
    const hasAccountDest = !!fields.toAccountId;
    const hasCardDest = !!fields.creditCardId;
    if (hasAccountDest === hasCardDest) {
      throw new Error(
        'Transfer requires exactly one destination: toAccountId or creditCardId'
      );
    }
    if (fields.accountId === fields.toAccountId) {
      throw new Error('Transfer accounts must differ');
    }
    return;
  }

  if (fields.toAccountId) {
    throw new Error('toAccountId is only valid for TRANSFER');
  }

  if (fields.creditCardId) {
    if (fields.accountId) {
      throw new Error(
        'A transaction cannot be funded by both an account and a credit card'
      );
    }
    if (fields.type !== 'EXPENSE') {
      throw new Error('A credit card can only fund an EXPENSE');
    }
  }
}
