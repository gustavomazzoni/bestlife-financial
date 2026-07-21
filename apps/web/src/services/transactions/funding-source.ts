import { TransactionType } from '@/types';

export interface FundingSourceFields {
  type: TransactionType;
  accountId?: string | null;
  toAccountId?: string | null;
}

/**
 * Encodes the legal accountId/toAccountId combinations for a transaction.
 * TRANSFER needs exactly one destination account; every other type must
 * not carry a toAccountId at all.
 */
export function assertValidFundingSource(fields: FundingSourceFields): void {
  if (fields.type === 'TRANSFER') {
    if (!fields.accountId) {
      throw new Error('Transfer requires a source accountId');
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
}
