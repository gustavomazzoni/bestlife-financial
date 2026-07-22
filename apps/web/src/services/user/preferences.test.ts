import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { getUserPreferences, updateUserPreferences } from './index';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    financialAccount: {
      findFirst: vi.fn(),
    },
  },
}));

const userId = 'user_test_123';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserPreferences', () => {
  it('returns the default expense account id when set', async () => {
    vi.mocked(prisma.user.findUnique as Mock).mockResolvedValue({
      defaultExpenseAccountId: 'acc_1',
    });

    const result = await getUserPreferences(userId);
    expect(result.defaultExpenseAccountId).toBe('acc_1');
  });

  it('returns null when no default is set', async () => {
    vi.mocked(prisma.user.findUnique as Mock).mockResolvedValue({
      defaultExpenseAccountId: null,
    });

    const result = await getUserPreferences(userId);
    expect(result.defaultExpenseAccountId).toBeNull();
  });
});

describe('updateUserPreferences', () => {
  it('sets the default expense account when owned by the user', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue({
      id: 'acc_1',
      userId,
    });
    vi.mocked(prisma.user.update as Mock).mockResolvedValue({
      defaultExpenseAccountId: 'acc_1',
    });

    const result = await updateUserPreferences(userId, {
      defaultExpenseAccountId: 'acc_1',
    });

    expect(result.defaultExpenseAccountId).toBe('acc_1');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId },
        data: expect.objectContaining({ defaultExpenseAccountId: 'acc_1' }),
      })
    );
  });

  it('clears the default expense account when set to null', async () => {
    vi.mocked(prisma.user.update as Mock).mockResolvedValue({
      defaultExpenseAccountId: null,
    });

    const result = await updateUserPreferences(userId, {
      defaultExpenseAccountId: null,
    });

    expect(result.defaultExpenseAccountId).toBeNull();
    expect(prisma.financialAccount.findFirst).not.toHaveBeenCalled();
  });

  it('throws when the account does not belong to the user', async () => {
    vi.mocked(prisma.financialAccount.findFirst as Mock).mockResolvedValue(
      null
    );

    await expect(
      updateUserPreferences(userId, { defaultExpenseAccountId: 'acc_other' })
    ).rejects.toThrow('Account not found');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
