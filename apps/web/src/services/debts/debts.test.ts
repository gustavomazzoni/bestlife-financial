import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  createDebt,
  getDebt,
  listDebts,
  updateDebt,
  deleteDebt,
} from './index';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    debt: {
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

describe('createDebt', () => {
  it('creates a debt', async () => {
    vi.mocked(prisma.debt.create as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
      name: 'Cartão de crédito',
      balance: 1200,
    });

    const result = await createDebt(userId, {
      name: 'Cartão de crédito',
      balance: 1200,
    });

    expect(result.balance).toBe(1200);
  });

  it('throws for a negative balance', async () => {
    await expect(
      createDebt(userId, { name: 'Cartão', balance: -1 })
    ).rejects.toThrow('Balance cannot be negative');
  });

  it('throws when installmentCurrent exceeds installmentTotal', async () => {
    await expect(
      createDebt(userId, {
        name: 'Financiamento',
        balance: 1000,
        installmentCurrent: 5,
        installmentTotal: 3,
      })
    ).rejects.toThrow('installmentCurrent cannot exceed installmentTotal');
  });
});

describe('getDebt', () => {
  it('returns the debt when owned by the user', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
    });

    const result = await getDebt(userId, 'debt_1');
    expect(result.id).toBe('debt_1');
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue(null);

    await expect(getDebt(userId, 'debt_missing')).rejects.toThrow(
      'Debt not found'
    );
  });
});

describe('listDebts', () => {
  it('lists debts', async () => {
    vi.mocked(prisma.debt.findMany as Mock).mockResolvedValue([
      { id: 'debt_1', userId },
    ]);

    const result = await listDebts(userId);
    expect(result).toHaveLength(1);
  });
});

describe('updateDebt', () => {
  it('updates the debt when owned by the user', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
      installmentCurrent: null,
      installmentTotal: null,
    });
    vi.mocked(prisma.debt.update as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
      balance: 800,
    });

    const result = await updateDebt(userId, 'debt_1', { balance: 800 });
    expect(result.balance).toBe(800);
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue(null);

    await expect(
      updateDebt(userId, 'debt_missing', { balance: 800 })
    ).rejects.toThrow('Debt not found');
  });

  it('throws for a negative balance', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
      installmentCurrent: null,
      installmentTotal: null,
    });

    await expect(updateDebt(userId, 'debt_1', { balance: -1 })).rejects.toThrow(
      'Balance cannot be negative'
    );
  });

  it('throws when the merged installmentCurrent exceeds installmentTotal', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
      installmentCurrent: 2,
      installmentTotal: 10,
    });

    await expect(
      updateDebt(userId, 'debt_1', { installmentCurrent: 12 })
    ).rejects.toThrow('installmentCurrent cannot exceed installmentTotal');
  });
});

describe('deleteDebt', () => {
  it('deletes the debt when owned by the user', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue({
      id: 'debt_1',
      userId,
    });

    await deleteDebt(userId, 'debt_1');
    expect(prisma.debt.delete).toHaveBeenCalledWith({
      where: { id: 'debt_1' },
    });
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.debt.findFirst as Mock).mockResolvedValue(null);

    await expect(deleteDebt(userId, 'debt_missing')).rejects.toThrow(
      'Debt not found'
    );
  });
});
