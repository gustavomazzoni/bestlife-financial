import { isFutureDate, isInferredComplete } from './inferredTransaction';
import { InferredTransaction } from '../types';

const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const base: InferredTransaction = {
  amount: 50,
  description: 'Almoço',
  date: YESTERDAY,
  type: 'EXPENSE',
  category: { id: 'cat_1', name: 'Food' },
  necessityLevel: null,
  valueAlignment: null,
  accountId: 'acc_1',
  toAccountId: null,
  installments: 1,
  isRecurring: false,
  frequency: null,
};

describe('isFutureDate', () => {
  it('is false for today', () => {
    expect(isFutureDate(new Date().toISOString())).toBe(false);
  });

  it('is false for a past date', () => {
    expect(isFutureDate(YESTERDAY)).toBe(false);
  });

  it('is true for a future date', () => {
    expect(isFutureDate(TOMORROW)).toBe(true);
  });
});

describe('isInferredComplete', () => {
  it('is incomplete when amount is missing', () => {
    expect(isInferredComplete({ ...base, amount: null })).toBe(false);
  });

  it('is incomplete when category is missing', () => {
    expect(isInferredComplete({ ...base, category: null })).toBe(false);
  });

  it('is complete when amount, category and account are present for a past EXPENSE', () => {
    expect(isInferredComplete(base)).toBe(true);
  });

  it.each(['EXPENSE', 'INCOME', 'SAVING', 'TRANSFER'] as const)(
    'is incomplete for a past/present %s with no account',
    type => {
      expect(isInferredComplete({ ...base, type, accountId: null })).toBe(false);
    }
  );

  it('is complete for a future transaction with no account (routed to scheduled)', () => {
    expect(isInferredComplete({ ...base, date: TOMORROW, accountId: null })).toBe(true);
  });
});
