import {
  Transaction,
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/generated/prisma/client';

export type { Transaction };
export { TransactionType, NecessityLevel, ValueAlignment };

export interface TransactionListResult {
  data: Transaction[];
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
