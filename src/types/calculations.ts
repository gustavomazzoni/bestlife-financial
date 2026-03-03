export interface MonthlyExpenses {
  total: number;
  average: number;
  byCategory: CategoryExpense[];
  period: {
    startDate: Date;
    endDate: Date;
    months: number;
  };
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface SavingsRate {
  rate: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netSavings: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface CategoryBreakdown {
  income: CategoryExpense[];
  expenses: CategoryExpense[];
  savings: CategoryExpense[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
}

export interface FreedomMetrics {
  fiNumber: number;
  fiProgress: number;
  currentRunway: number;
  savingsRate: number;
  monthsToFI: number | null;
  avgMonthlyExpenses: number;
  dreamLifestyleCost: number;
}

export interface NecessityBreakdown {
  NEEDS: number;
  IMPORTANT: number;
  WANTS: number;
  unclassified: number;
}

export interface SpendingBreakdown {
  totalExpenses: number;
  byCategory: CategoryExpense[];
  byNecessityLevel: NecessityBreakdown;
  valueAlignedPercentage: number;
  period: { startDate: Date; endDate: Date };
}

export interface MonthlySummary {
  month: string; // 'YYYY-MM' format e.g. '2026-03'
  income: number;
  expenses: number;
}
