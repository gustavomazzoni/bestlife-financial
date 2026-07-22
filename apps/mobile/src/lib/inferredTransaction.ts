import { startOfDay } from 'date-fns';
import { InferredTransaction } from '../types';

/** Future-dated transactions are routed to /api/v1/scheduled instead of
 * /api/v1/transactions, so their validation rules (e.g. account required)
 * differ from past/present ones. */
export function isFutureDate(dateStr: string): boolean {
  return startOfDay(new Date(dateStr)) > startOfDay(new Date());
}

/**
 * Whether a chat-inferred transaction has the fields the backend actually
 * requires — used to gate the Confirmar action so a low-information
 * message (e.g. "Bla") can't be posted straight to the API only to fail
 * validation there. Past/present transactions also require an account
 * (CreateTransactionSchema); future ones don't, since they're created as
 * a ScheduledTransaction instead, where accountId stays optional.
 */
export function isInferredComplete(t: InferredTransaction): boolean {
  if (t.amount == null || t.category == null) return false;
  if (isFutureDate(t.date)) return true;
  return t.accountId != null;
}
