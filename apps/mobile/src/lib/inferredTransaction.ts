import { InferredTransaction } from '../types';

/**
 * Whether a chat-inferred transaction has the two fields the backend
 * actually requires (CreateTransactionSchema: positive amount, non-empty
 * categoryId) — used to gate the Confirmar action so a low-information
 * message (e.g. "Bla") can't be posted straight to the API only to fail
 * validation there.
 */
export function isInferredComplete(t: InferredTransaction): boolean {
  return t.amount != null && t.category != null;
}
