import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { calculateNetWorth } from './net-worth';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    financialAccount: { findMany: vi.fn() },
    investment: { findMany: vi.fn() },
    debt: { findMany: vi.fn() },
    creditCard: { findMany: vi.fn() },
  },
}));

const userId = 'user_test_123';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.creditCard.findMany as Mock).mockResolvedValue([]);
});

describe('calculateNetWorth', () => {
  it('computes netWorth = accountsTotal + investmentsTotal - debtsTotal - creditCardsTotal', async () => {
    vi.mocked(prisma.financialAccount.findMany as Mock).mockResolvedValue([
      { balance: 1000 },
      { balance: 500 },
    ]);
    vi.mocked(prisma.investment.findMany as Mock).mockResolvedValue([
      { balance: 5000 },
    ]);
    vi.mocked(prisma.debt.findMany as Mock).mockResolvedValue([
      { balance: 800 },
    ]);

    const result = await calculateNetWorth(userId);

    expect(result).toEqual({
      accountsTotal: 1500,
      investmentsTotal: 5000,
      debtsTotal: 800,
      creditCardsTotal: 0,
      netWorth: 5700,
    });
  });

  it('returns all zeros when the user has no accounts, investments, debts, or cards', async () => {
    vi.mocked(prisma.financialAccount.findMany as Mock).mockResolvedValue([]);
    vi.mocked(prisma.investment.findMany as Mock).mockResolvedValue([]);
    vi.mocked(prisma.debt.findMany as Mock).mockResolvedValue([]);

    const result = await calculateNetWorth(userId);

    expect(result).toEqual({
      accountsTotal: 0,
      investmentsTotal: 0,
      debtsTotal: 0,
      creditCardsTotal: 0,
      netWorth: 0,
    });
  });

  it('allows a negative netWorth when debts exceed assets', async () => {
    vi.mocked(prisma.financialAccount.findMany as Mock).mockResolvedValue([
      { balance: 100 },
    ]);
    vi.mocked(prisma.investment.findMany as Mock).mockResolvedValue([]);
    vi.mocked(prisma.debt.findMany as Mock).mockResolvedValue([
      { balance: 5000 },
    ]);

    const result = await calculateNetWorth(userId);

    expect(result.netWorth).toBe(-4900);
  });

  it('subtracts credit card balances from net worth', async () => {
    vi.mocked(prisma.financialAccount.findMany as Mock).mockResolvedValue([
      { balance: 1000 },
    ]);
    vi.mocked(prisma.investment.findMany as Mock).mockResolvedValue([]);
    vi.mocked(prisma.debt.findMany as Mock).mockResolvedValue([]);
    vi.mocked(prisma.creditCard.findMany as Mock).mockResolvedValue([
      { balance: 300 },
      { balance: 150 },
    ]);

    const result = await calculateNetWorth(userId);

    expect(result.creditCardsTotal).toBe(450);
    expect(result.netWorth).toBe(550);
  });
});
