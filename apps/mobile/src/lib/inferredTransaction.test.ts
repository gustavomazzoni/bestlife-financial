import { isInferredComplete } from './inferredTransaction';
import { InferredTransaction } from '../types';

const base: InferredTransaction = {
  amount: 50,
  description: 'Almoço',
  date: '2026-01-15',
  type: 'EXPENSE',
  category: { id: 'cat_1', name: 'Food' },
  necessityLevel: null,
  valueAlignment: null,
  accountId: null,
  toAccountId: null,
  installments: 1,
  isRecurring: false,
  frequency: null,
};

describe('isInferredComplete', () => {
  it('is incomplete when amount is missing', () => {
    expect(isInferredComplete({ ...base, amount: null })).toBe(false);
  });

  it('is incomplete when category is missing', () => {
    expect(isInferredComplete({ ...base, category: null })).toBe(false);
  });

  it('is complete when amount and category are present', () => {
    expect(isInferredComplete(base)).toBe(true);
  });
});
