import { TransactionType, NecessityLevel, ValueAlignment } from './transaction';
import { ScheduleFrequency } from './scheduled';

export interface InferredCategory {
  id: string;
  name: string;
}

export interface InferredTransaction {
  amount: number | null;
  description: string;
  date: Date;
  type: TransactionType;
  category: InferredCategory | null;
  necessityLevel: NecessityLevel | null;
  valueAlignment: ValueAlignment | null;
  /** Matched FinancialAccount.id, if the text mentions an account by name. */
  accountId: string | null;
  /** True when the text implies a repeating/future bill ("todo mês", "recorrente"). */
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
