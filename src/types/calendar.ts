import { TransactionType } from '@/types';

export type CalendarEventKind = 'recurring_projection' | 'actual';

export interface CalendarEvent {
  date: string; // 'YYYY-MM-DD' (no timezone shift)
  description: string;
  amount: string; // decimal string, pass to formatCurrency()
  type: TransactionType;
  kind: CalendarEventKind;
  sourceId: string; // recurringId for projections, transactionId for actuals
  categoryIcon?: string;
  categoryName?: string;
}
