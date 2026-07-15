import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  createFinancialAccount,
  getFinancialAccount,
  listFinancialAccounts,
  updateFinancialAccount,
  deleteFinancialAccount,
} from './index';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    financialAccount: {
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

describe('createFinancialAccount', () => {
  it('creates an account with a default balance of 0', async () => {
    vi.mocked(prisma.financialAccount.create as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      name: 'Nubank',
      type: 'CHECKING',
      balance: 0,
    });

    const result = await createFinancialAccount(userId, {
      name: 'Nubank',
      type: 'CHECKING',
    });

    expect(result.balance).toBe(0);
    expect(prisma.financialAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId, name: 'Nubank', balance: 0 }),
      })
    );
  });
});

describe('getFinancialAccount', () => {
  it('returns the account when owned by the user', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
    });

    const result = await getFinancialAccount(userId, 'acc_1');
    expect(result.id).toBe('acc_1');
  });

  it('throws when the account does not exist or belongs to another user', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue(
      null
    );

    await expect(getFinancialAccount(userId, 'acc_missing')).rejects.toThrow(
      'Account not found'
    );
  });
});

describe('listFinancialAccounts', () => {
  it('lists accounts ordered by creation date', async () => {
    vi.mocked(prisma.financialAccount.findMany as Mock).mockResolvedValue([
      { id: 'acc_1', userId },
    ]);

    const result = await listFinancialAccounts(userId);
    expect(result).toHaveLength(1);
  });
});

describe('updateFinancialAccount', () => {
  it('updates the account when owned by the user', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
    });
    vi.mocked(prisma.financialAccount.update as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      balance: 1000,
    });

    const result = await updateFinancialAccount(userId, 'acc_1', {
      balance: 1000,
    });
    expect(result.balance).toBe(1000);
  });

  it('throws when the account does not exist', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue(
      null
    );

    await expect(
      updateFinancialAccount(userId, 'acc_missing', { balance: 1000 })
    ).rejects.toThrow('Account not found');
  });
});

describe('deleteFinancialAccount', () => {
  it('deletes the account when owned by the user', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
    });

    await deleteFinancialAccount(userId, 'acc_1');
    expect(prisma.financialAccount.delete).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
    });
  });

  it('throws when the account does not exist', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue(
      null
    );

    await expect(deleteFinancialAccount(userId, 'acc_missing')).rejects.toThrow(
      'Account not found'
    );
  });
});
