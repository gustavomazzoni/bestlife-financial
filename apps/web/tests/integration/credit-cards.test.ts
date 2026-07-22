import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as POST_INSTALLMENT_PURCHASE } from '@/app/api/v1/credit-cards/[id]/installment-purchases/route';
import { createMockPostRequest, parseResponse } from '@tests-helpers/api';
import { prisma } from './setup';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('Credit Card Installment Purchases Integration Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('POST /api/v1/credit-cards/:id/installment-purchases', () => {
    it('creates N transactions and applies the full amount to the card balance', async () => {
      const card = await prisma.financialAccount.create({
        data: {
          userId: testUser.id,
          name: 'Nubank',
          type: 'CREDIT_CARD',
          creditLimit: 5000,
          closingDay: 10,
          dueDay: 17,
        },
      });
      const category = await prisma.category.findFirstOrThrow({
        where: { type: 'EXPENSE' },
        select: { id: true },
      });

      const request = createMockPostRequest(
        `api/v1/credit-cards/${card.id}/installment-purchases`,
        {
          amount: 300,
          description: 'Notebook',
          date: '2026-01-10',
          categoryId: category.id,
          installments: 3,
        }
      );
      const response = await POST_INSTALLMENT_PURCHASE(request, {
        params: Promise.resolve({ id: card.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data).toHaveLength(3);
      expect(json.data[0].description).toBe('Notebook (1/3)');

      const updatedCard = await prisma.financialAccount.findUniqueOrThrow({
        where: { id: card.id },
      });
      expect(Number(updatedCard.balance)).toBe(300);
    });

    it('returns 404 for a credit card belonging to another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      const card = await prisma.financialAccount.create({
        data: {
          userId: otherUser.id,
          name: 'Not Mine',
          type: 'CREDIT_CARD',
          creditLimit: 1000,
          closingDay: 5,
          dueDay: 12,
        },
      });
      const category = await prisma.category.findFirstOrThrow({
        where: { type: 'EXPENSE' },
        select: { id: true },
      });

      const request = createMockPostRequest(
        `api/v1/credit-cards/${card.id}/installment-purchases`,
        {
          amount: 100,
          description: 'Compra',
          date: '2026-01-10',
          categoryId: category.id,
          installments: 1,
        }
      );
      const response = await POST_INSTALLMENT_PURCHASE(request, {
        params: Promise.resolve({ id: card.id }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 404 when the account exists but is not a credit card', async () => {
      const checking = await prisma.financialAccount.create({
        data: { userId: testUser.id, name: 'Itaú', type: 'CHECKING' },
      });
      const category = await prisma.category.findFirstOrThrow({
        where: { type: 'EXPENSE' },
        select: { id: true },
      });

      const request = createMockPostRequest(
        `api/v1/credit-cards/${checking.id}/installment-purchases`,
        {
          amount: 100,
          description: 'Compra',
          date: '2026-01-10',
          categoryId: category.id,
          installments: 1,
        }
      );
      const response = await POST_INSTALLMENT_PURCHASE(request, {
        params: Promise.resolve({ id: checking.id }),
      });

      expect(response.status).toBe(404);
    });
  });
});
