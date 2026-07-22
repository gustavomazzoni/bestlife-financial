import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  ScheduleFrequency,
  FinancialAccountType,
} from '@lifeos/shared';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: string;
  description: string;
  type: TransactionType;
  categoryId: string;
  necessityLevel: NecessityLevel | null;
  valueAlignment: ValueAlignment | null;
  scheduledId: string | null;
  accountId: string | null;
  toAccountId: string | null;
  installmentGroupId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  notes: string | null;
  category: Category | null;
}

export interface ScheduledTransaction {
  id: string;
  amount: string;
  description: string;
  type: TransactionType;
  categoryId: string;
  frequency: ScheduleFrequency;
  startDate: string;
  endDate: string | null;
  nextOccurrence: string;
  isActive: boolean;
  accountId: string | null;
  category: Category | null;
}

export interface UpcomingItem {
  id: string;
  frequency: ScheduleFrequency;
  isRecurring: boolean;
  date: string;
  isToday: boolean;
  isOverdue: boolean;
  description: string;
  amount: string;
  type: TransactionType;
  categoryIcon?: string;
  categoryName?: string;
  scheduledId: string;
  accountId: string | null;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  balance: string;
  color: string;
  creditLimit?: string | null;
  closingDay?: number | null;
  dueDay?: number | null;
}

export interface Investment {
  id: string;
  name: string;
  category: string;
  balance: string;
}

export interface Debt {
  id: string;
  name: string;
  balance: string;
  dueDate: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

export interface NetWorth {
  accountsTotal: number;
  investmentsTotal: number;
  debtsTotal: number;
  creditCardsTotal: number;
  netWorth: number;
}

export interface CategoryBudgetSummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
  pct: number;
  isOverBudget: boolean;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface SpendingBreakdown {
  totalExpenses: number;
  byCategory: CategoryExpense[];
  byNecessityLevel: {
    NEEDS: number;
    IMPORTANT: number;
    WANTS: number;
    unclassified: number;
  };
  valueAlignedPercentage: number;
}

export interface InferredCategory {
  id: string;
  name: string;
}

export interface InferredTransaction {
  amount: number | null;
  description: string;
  date: string;
  type: TransactionType;
  category: InferredCategory | null;
  necessityLevel: NecessityLevel | null;
  valueAlignment: ValueAlignment | null;
  accountId: string | null;
  toAccountId: string | null;
  installments: number;
  isRecurring: boolean;
  frequency: ScheduleFrequency | null;
  notes?: string;
}

export interface InferTransactionResult {
  inferred: InferredTransaction;
  confidence: number;
  rawInput: string;
  missingFields: string[];
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

export interface UserProfile {
  activeIncomeMonthly: number;
  passiveIncomeMonthly: number;
  dreamLifestyleCost: number | null;
  currentInvestments: number;
}

export interface UserPreferences {
  defaultExpenseAccountId: string | null;
}
