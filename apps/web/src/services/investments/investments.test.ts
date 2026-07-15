import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  createInvestment,
  getInvestment,
  listInvestments,
  updateInvestment,
  deleteInvestment,
} from './index';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    investment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const userId = 'user_test_123';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createInvestment', () => {
  it('creates an investment', async () => {
    vi.mocked(prisma.investment.create as Mock).mockResolvedValue({
      id: 'inv_1',
      userId,
      name: 'Tesouro Selic',
      category: 'fixed-income',
      balance: 5000,
    });

    const result = await createInvestment(userId, {
      name: 'Tesouro Selic',
      category: 'fixed-income',
      balance: 5000,
    });

    expect(result.balance).toBe(5000);
  });

  it('throws for a negative balance', async () => {
    await expect(
      createInvestment(userId, {
        name: 'Tesouro Selic',
        category: 'fixed-income',
        balance: -1,
      })
    ).rejects.toThrow('Balance cannot be negative');
    expect(prisma.investment.create).not.toHaveBeenCalled();
  });
});

describe('getInvestment', () => {
  it('returns the investment when owned by the user', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue({
      id: 'inv_1',
      userId,
    });

    const result = await getInvestment(userId, 'inv_1');
    expect(result.id).toBe('inv_1');
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue(null);

    await expect(getInvestment(userId, 'inv_missing')).rejects.toThrow(
      'Investment not found'
    );
  });
});

describe('listInvestments', () => {
  it('lists investments', async () => {
    vi.mocked(prisma.investment.findMany as Mock).mockResolvedValue([
      { id: 'inv_1', userId },
    ]);

    const result = await listInvestments(userId);
    expect(result).toHaveLength(1);
  });
});

describe('updateInvestment', () => {
  it('updates the investment when owned by the user', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue({
      id: 'inv_1',
      userId,
    });
    vi.mocked(prisma.investment.update as Mock).mockResolvedValue({
      id: 'inv_1',
      userId,
      balance: 6000,
    });

    const result = await updateInvestment(userId, 'inv_1', { balance: 6000 });
    expect(result.balance).toBe(6000);
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue(null);

    await expect(
      updateInvestment(userId, 'inv_missing', { balance: 6000 })
    ).rejects.toThrow('Investment not found');
  });

  it('throws for a negative balance', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue({
      id: 'inv_1',
      userId,
    });

    await expect(
      updateInvestment(userId, 'inv_1', { balance: -1 })
    ).rejects.toThrow('Balance cannot be negative');
  });
});

describe('deleteInvestment', () => {
  it('deletes the investment when owned by the user', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue({
      id: 'inv_1',
      userId,
    });

    await deleteInvestment(userId, 'inv_1');
    expect(prisma.investment.delete).toHaveBeenCalledWith({
      where: { id: 'inv_1' },
    });
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.investment.findFirst as Mock).mockResolvedValue(null);

    await expect(deleteInvestment(userId, 'inv_missing')).rejects.toThrow(
      'Investment not found'
    );
  });
});
