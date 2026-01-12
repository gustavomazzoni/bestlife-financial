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
