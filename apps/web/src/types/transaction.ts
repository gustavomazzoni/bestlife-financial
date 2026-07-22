import {
  Transaction,
  Category,
  FinancialAccount,
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/generated/prisma/client';

export type { Transaction };
export { TransactionType, NecessityLevel, ValueAlignment };

/** Transaction as returned by listTransactions (always includes category + account relations). */
export type TransactionRow = Transaction & {
  category: Category | null;
  account: FinancialAccount | null;
};

export interface TransactionListResult {
  data: TransactionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netCashFlow: number;
  transactionCount: number;
}
