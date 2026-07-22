import { FinancialAccountType, TransactionType } from '@/types';

export interface FundingSourceFields {
  type: TransactionType;
  accountId?: string | null;
  toAccountId?: string | null;
  /** Resolved type of the account at accountId, if any is set. */
  accountType?: FinancialAccountType | null;
  /** Resolved type of the account at toAccountId, if any is set (TRANSFER only). */
  toAccountType?: FinancialAccountType | null;
}

/**
 * Encodes the legal accountId/toAccountId combinations for a transaction,
 * now that a "credit card" is just a FinancialAccount of type CREDIT_CARD
 * rather than a separate id field. TRANSFER needs a source that isn't a
 * card (a card can't fund a transfer out) and exactly one destination,
 * which may resolve as a liability account (a card payoff). Every other
 * type must not carry a toAccountId, and a card-type account can only
 * fund an EXPENSE — never INCOME/SAVING.
 */
export function assertValidFundingSource(fields: FundingSourceFields): void {
  if (fields.type === 'TRANSFER') {
    if (!fields.accountId) {
      throw new Error('Transfer requires a source accountId');
    }
    if (fields.accountType === 'CREDIT_CARD') {
      throw new Error('A credit card cannot be a transfer source');
    }
    if (!fields.toAccountId) {
      throw new Error('Transfer requires a destination toAccountId');
    }
    if (fields.accountId === fields.toAccountId) {
      throw new Error('Transfer accounts must differ');
    }
    return;
  }

  if (fields.toAccountId) {
    throw new Error('toAccountId is only valid for TRANSFER');
  }

  if (fields.accountType === 'CREDIT_CARD' && fields.type !== 'EXPENSE') {
    throw new Error('A credit card can only fund an EXPENSE');
  }
}
