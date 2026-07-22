import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { deleteTransaction } from './delete';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn((callback: any) => callback(prisma)),
    transaction: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    financialAccount: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('deleteTransaction', () => {
  const userId = 'user_test_123';
  const transactionId = 'txn_123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(
      prisma.financialAccount.findUniqueOrThrow as Mock
    ).mockResolvedValue({
      type: 'CHECKING',
    });
  });

  it('should delete transaction successfully', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue({
      id: transactionId,
      userId,
      type: 'EXPENSE',
      amount: 100,
      accountId: null,
      toAccountId: null,
    });
    vi.mocked(prisma.transaction.delete as Mock).mockResolvedValue({});

    await deleteTransaction(userId, transactionId);

    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: transactionId },
    });
  });

  it('should throw error when transaction not found', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(deleteTransaction(userId, transactionId)).rejects.toThrow(
      'Transaction not found'
    );
  });

  it('should not delete transaction from different user', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(deleteTransaction(userId, 'other_txn')).rejects.toThrow(
      'Transaction not found'
    );

    expect(prisma.transaction.delete).not.toHaveBeenCalled();
  });

  it('should reverse the account balance effect when deleting an EXPENSE', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue({
      id: transactionId,
      userId,
      type: 'EXPENSE',
      amount: 100,
      accountId: 'acc_1',
      toAccountId: null,
    });
    vi.mocked(prisma.transaction.delete as Mock).mockResolvedValue({});

    await deleteTransaction(userId, transactionId);

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: 100 } },
    });
  });

  it('should reverse both accounts when deleting a TRANSFER', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue({
      id: transactionId,
      userId,
      type: 'TRANSFER',
      amount: 100,
      accountId: 'acc_1',
      toAccountId: 'acc_2',
    });
    vi.mocked(prisma.transaction.delete as Mock).mockResolvedValue({});

    await deleteTransaction(userId, transactionId);

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { decrement: -100 } },
    });
    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_2' },
      data: { balance: { increment: -100 } },
    });
  });
});
