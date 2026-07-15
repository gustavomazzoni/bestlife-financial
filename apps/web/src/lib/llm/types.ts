import { InferTransactionResult } from '@/types/infer';

export interface DBCategory {
  id: string;
  name: string;
  type: string;
}

export interface DBAccount {
  id: string;
  name: string;
}

export interface LLMInferenceProvider {
  inferTransaction(
    text: string,
    categories: DBCategory[],
    accounts: DBAccount[]
  ): Promise<InferTransactionResult>;
}
