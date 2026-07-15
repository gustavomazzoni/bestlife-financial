import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inferTransaction } from './infer';
import prisma from '@/lib/db';
import { TransactionType } from '@/types';

vi.mock('@/lib/db', () => ({
  default: {
    category: { findMany: vi.fn() },
    financialAccount: { findMany: vi.fn() },
  },
}));

const mockInferTransaction = vi.fn();

vi.mock('@/lib/llm/factory', () => ({
  createInferenceProvider: () => ({
    inferTransaction: mockInferTransaction,
  }),
}));

const mockCategories = [
  { id: 'cat-food', name: 'Food', type: TransactionType.EXPENSE },
];

const mockAccounts = [{ id: 'acc-itau', name: 'Itaú' }];

const mockResult = {
  inferred: {
    amount: 25,
    description: 'Café',
    date: new Date('2026-06-25'),
    type: TransactionType.EXPENSE,
    category: { id: 'cat-food', name: 'Food' },
    necessityLevel: null,
    valueAlignment: null,
    accountId: null,
    isRecurring: false,
    frequency: null,
  },
  confidence: 0.9,
  rawInput: 'Café R$ 25',
  missingFields: [],
};

describe('inferTransaction (thin wrapper)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.category.findMany).mockResolvedValue(
      mockCategories as never
    );
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue(
      mockAccounts as never
    );
    mockInferTransaction.mockResolvedValue(mockResult);
  });

  it("fetches categories and the user's accounts, then delegates to the configured provider", async () => {
    const result = await inferTransaction('Café R$ 25', 'user_123');

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, type: true },
    });
    expect(prisma.financialAccount.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      select: { id: true, name: true },
    });
    expect(mockInferTransaction).toHaveBeenCalledWith(
      'Café R$ 25',
      mockCategories,
      mockAccounts
    );
    expect(result).toEqual(mockResult);
  });

  it('scopes the account lookup to the given userId', async () => {
    await inferTransaction('Café R$ 25', 'another_user');
    expect(prisma.financialAccount.findMany).toHaveBeenCalledWith({
      where: { userId: 'another_user' },
      select: { id: true, name: true },
    });
  });
});
