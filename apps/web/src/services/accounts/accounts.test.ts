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
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      count: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

const userId = 'user_test_123';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.transaction.count as Mock).mockResolvedValue(0);
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

  it('persists the credit-card-only fields for a CREDIT_CARD account', async () => {
    vi.mocked(prisma.financialAccount.create as Mock).mockResolvedValue({
      id: 'card_1',
      userId,
      name: 'Nubank Card',
      type: 'CREDIT_CARD',
      balance: 0,
      creditLimit: 5000,
      closingDay: 10,
      dueDay: 17,
    });

    await createFinancialAccount(userId, {
      name: 'Nubank Card',
      type: 'CREDIT_CARD',
      creditLimit: 5000,
      closingDay: 10,
      dueDay: 17,
    });

    expect(prisma.financialAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creditLimit: 5000,
          closingDay: 10,
          dueDay: 17,
        }),
      })
    );
  });

  it("sets the new account as the default expense account when it is the user's first", async () => {
    vi.mocked(prisma.financialAccount.create as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      name: 'Nubank',
      type: 'CHECKING',
      balance: 0,
    });
    vi.mocked(prisma.financialAccount.count as Mock).mockResolvedValue(1);

    await createFinancialAccount(userId, { name: 'Nubank', type: 'CHECKING' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { defaultExpenseAccountId: 'acc_1' },
    });
  });

  it('does not change the default expense account for a second account', async () => {
    vi.mocked(prisma.financialAccount.create as Mock).mockResolvedValue({
      id: 'acc_2',
      userId,
      name: 'Itau',
      type: 'CHECKING',
      balance: 0,
    });
    vi.mocked(prisma.financialAccount.count as Mock).mockResolvedValue(2);

    await createFinancialAccount(userId, { name: 'Itau', type: 'CHECKING' });

    expect(prisma.user.update).not.toHaveBeenCalled();
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
      type: 'CHECKING',
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

  it('allows changing type within the asset bucket even with transactions', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      type: 'CHECKING',
    });
    vi.mocked(prisma.transaction.count as Mock).mockResolvedValue(5);
    vi.mocked(prisma.financialAccount.update as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      type: 'SAVINGS',
    });

    const result = await updateFinancialAccount(userId, 'acc_1', {
      type: 'SAVINGS',
    });
    expect(result.type).toBe('SAVINGS');
    expect(prisma.transaction.count).not.toHaveBeenCalled();
  });

  it('rejects flipping between asset and CREDIT_CARD once the account has transactions', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      type: 'CHECKING',
    });
    vi.mocked(prisma.transaction.count as Mock).mockResolvedValue(3);

    await expect(
      updateFinancialAccount(userId, 'acc_1', { type: 'CREDIT_CARD' })
    ).rejects.toThrow(
      'Cannot change an account between asset and credit-card type once it has transactions'
    );
    expect(prisma.financialAccount.update).not.toHaveBeenCalled();
  });

  it('allows flipping between asset and CREDIT_CARD when the account has no transactions', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      type: 'CHECKING',
    });
    vi.mocked(prisma.transaction.count as Mock).mockResolvedValue(0);
    vi.mocked(prisma.financialAccount.update as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
      type: 'CREDIT_CARD',
    });

    const result = await updateFinancialAccount(userId, 'acc_1', {
      type: 'CREDIT_CARD',
    });
    expect(result.type).toBe('CREDIT_CARD');
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
