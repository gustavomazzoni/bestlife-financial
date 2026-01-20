import { CreateTransactionInput } from '@/lib/validations/transaction';
import { TransactionType, NecessityLevel, ValueAlignment } from './transaction';

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
}

export interface InferTransactionResult {
  inferred: Partial<CreateTransactionInput>;
  confidence: number;
  rawInput: string;
  missingFields: string[];
}
