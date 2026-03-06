import {
  Transaction,
  Category,
  TransactionType,
  TransactionStatus,
  NecessityLevel,
  ValueAlignment,
} from '@/generated/prisma/client';

export type { Transaction };
export { TransactionType, TransactionStatus, NecessityLevel, ValueAlignment };

/** Transaction as returned by listTransactions (always includes category relation). */
export type TransactionRow = Transaction & {
  category: Category | null;
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
