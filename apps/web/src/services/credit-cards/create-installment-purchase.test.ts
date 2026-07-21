import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createInstallmentPurchase } from './create-installment-purchase';

vi.mock('@/lib/db', () => ({
  prisma: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn((callback: any) => callback(prisma)),
    creditCard: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  },
}));

const userId = 'user_test_123';
const creditCardId = 'card_1';

const mockCard = {
  id: creditCardId,
  userId,
  name: 'Nubank',
  creditLimit: new Prisma.Decimal(5000),
  closingDay: 10,
  dueDay: 17,
  balance: new Prisma.Decimal(0),
  color: '#6B7280',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockCategory = {
  id: 'cat_shopping',
  name: 'Shopping',
  type: 'EXPENSE' as const,
  isSystemDefault: true,
  color: '#DB2777',
  icon: '🛍️',
  createdAt: new Date(),
};

describe('createInstallmentPurchase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.creditCard.findFirst).mockResolvedValue(mockCard);
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    let counter = 0;
    vi.mocked(prisma.transaction.create).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (async (args: any) => ({
        id: `txn_${++counter}`,
        ...args.data,
      })) as typeof prisma.transaction.create
    );
  });

  it('throws when the credit card does not belong to the user', async () => {
    vi.mocked(prisma.creditCard.findFirst).mockResolvedValue(null);

    await expect(
      createInstallmentPurchase(userId, creditCardId, {
        amount: 300,
        description: 'Notebook',
        date: new Date('2026-01-10'),
        categoryId: mockCategory.id,
        installments: 3,
      })
    ).rejects.toThrow('Credit card not found');
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('throws for an invalid category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(
      createInstallmentPurchase(userId, creditCardId, {
        amount: 300,
        description: 'Notebook',
        date: new Date('2026-01-10'),
        categoryId: 'bad_cat',
        installments: 1,
      })
    ).rejects.toThrow('Invalid category');
  });

  it('creates a single transaction for a 1x (full) purchase with no installment metadata', async () => {
    const [row] = await createInstallmentPurchase(userId, creditCardId, {
      amount: 300,
      description: 'Notebook',
      date: new Date('2026-01-10'),
      categoryId: mockCategory.id,
      installments: 1,
    });

    expect(prisma.transaction.create).toHaveBeenCalledTimes(1);
    expect(row.installmentGroupId).toBeNull();
    expect(row.installmentCurrent).toBeNull();
    expect(row.installmentTotal).toBeNull();
    expect(row.description).toBe('Notebook');
  });

  it('creates N transactions dated one month apart with matching installment metadata', async () => {
    const rows = await createInstallmentPurchase(userId, creditCardId, {
      amount: 300,
      description: 'Notebook',
      date: new Date('2026-01-10'),
      categoryId: mockCategory.id,
      installments: 3,
    });

    expect(rows).toHaveLength(3);
    expect(rows[0].date).toEqual(new Date('2026-01-10'));
    expect(rows[1].date).toEqual(new Date('2026-02-10'));
    expect(rows[2].date).toEqual(new Date('2026-03-10'));
    expect(rows[0].description).toBe('Notebook (1/3)');
    expect(rows[2].description).toBe('Notebook (3/3)');
    rows.forEach((r, i) => {
      expect(r.installmentCurrent).toBe(i + 1);
      expect(r.installmentTotal).toBe(3);
      expect(r.installmentGroupId).toBe(rows[0].installmentGroupId);
    });
  });

  it('splits the amount cent-exact across installments', async () => {
    const rows = await createInstallmentPurchase(userId, creditCardId, {
      amount: 100,
      description: 'Fone de ouvido',
      date: new Date('2026-01-10'),
      categoryId: mockCategory.id,
      installments: 3,
    });

    expect(rows.map(r => r.amount)).toEqual([33.33, 33.33, 33.34]);
  });

  it('applies the full purchase amount to the card balance immediately', async () => {
    await createInstallmentPurchase(userId, creditCardId, {
      amount: 300,
      description: 'Notebook',
      date: new Date('2026-01-10'),
      categoryId: mockCategory.id,
      installments: 3,
    });

    const totalIncremented = vi
      .mocked(prisma.creditCard.update)
      .mock.calls.reduce(
        (sum, call) =>
          sum + (call[0].data.balance as { increment: number }).increment,
        0
      );
    expect(totalIncremented).toBe(300);
  });
});
