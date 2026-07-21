import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  createCreditCard,
  getCreditCard,
  listCreditCards,
  updateCreditCard,
  deleteCreditCard,
} from './index';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    creditCard: {
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

describe('createCreditCard', () => {
  it('creates a credit card defaulting balance to 0', async () => {
    vi.mocked(prisma.creditCard.create as Mock).mockResolvedValue({
      id: 'card_1',
      userId,
      name: 'Nubank',
      creditLimit: 5000,
      closingDay: 10,
      dueDay: 17,
      balance: 0,
    });

    const result = await createCreditCard(userId, {
      name: 'Nubank',
      creditLimit: 5000,
      closingDay: 10,
      dueDay: 17,
    });

    expect(prisma.creditCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ balance: 0 }),
    });
    expect(result.name).toBe('Nubank');
  });
});

describe('getCreditCard', () => {
  it('returns the card when owned by the user', async () => {
    vi.mocked(prisma.creditCard.findFirst as Mock).mockResolvedValue({
      id: 'card_1',
      userId,
    });

    const result = await getCreditCard(userId, 'card_1');
    expect(result.id).toBe('card_1');
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.creditCard.findFirst as Mock).mockResolvedValue(null);

    await expect(getCreditCard(userId, 'card_missing')).rejects.toThrow(
      'Credit card not found'
    );
  });
});

describe('listCreditCards', () => {
  it('lists credit cards', async () => {
    vi.mocked(prisma.creditCard.findMany as Mock).mockResolvedValue([
      { id: 'card_1', userId },
    ]);

    const result = await listCreditCards(userId);
    expect(result).toHaveLength(1);
  });
});

describe('updateCreditCard', () => {
  it('updates the card when owned by the user', async () => {
    vi.mocked(prisma.creditCard.findFirst as Mock).mockResolvedValue({
      id: 'card_1',
      userId,
    });
    vi.mocked(prisma.creditCard.update as Mock).mockResolvedValue({
      id: 'card_1',
      userId,
      creditLimit: 8000,
    });

    const result = await updateCreditCard(userId, 'card_1', {
      creditLimit: 8000,
    });
    expect(result.creditLimit).toBe(8000);
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.creditCard.findFirst as Mock).mockResolvedValue(null);

    await expect(
      updateCreditCard(userId, 'card_missing', { creditLimit: 8000 })
    ).rejects.toThrow('Credit card not found');
  });
});

describe('deleteCreditCard', () => {
  it('deletes the card when owned by the user', async () => {
    vi.mocked(prisma.creditCard.findFirst as Mock).mockResolvedValue({
      id: 'card_1',
      userId,
    });

    await deleteCreditCard(userId, 'card_1');
    expect(prisma.creditCard.delete).toHaveBeenCalledWith({
      where: { id: 'card_1' },
    });
  });

  it('throws when not found', async () => {
    vi.mocked(prisma.creditCard.findFirst as Mock).mockResolvedValue(null);

    await expect(deleteCreditCard(userId, 'card_missing')).rejects.toThrow(
      'Credit card not found'
    );
  });
});
