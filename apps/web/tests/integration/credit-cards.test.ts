import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/credit-cards/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/v1/credit-cards/[id]/route';
import { POST as POST_INSTALLMENT_PURCHASE } from '@/app/api/v1/credit-cards/[id]/installment-purchases/route';
import {
  createMockRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  parseResponse,
} from '@tests-helpers/api';
import { prisma } from './setup';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('Credit Cards Integration Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('POST /api/v1/credit-cards', () => {
    it('creates a credit card with default balance 0', async () => {
      const request = createMockPostRequest('api/v1/credit-cards', {
        name: 'Nubank',
        creditLimit: 5000,
        closingDay: 10,
        dueDay: 17,
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.name).toBe('Nubank');
      expect(json.data.balance).toBe('0');
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));
      const request = createMockPostRequest('api/v1/credit-cards', {
        name: 'Nubank',
        creditLimit: 5000,
        closingDay: 10,
        dueDay: 17,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 for an invalid closingDay', async () => {
      const request = createMockPostRequest('api/v1/credit-cards', {
        name: 'Nubank',
        creditLimit: 5000,
        closingDay: 40,
        dueDay: 17,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/credit-cards', () => {
    it('lists only the authenticated user credit cards', async () => {
      await prisma.creditCard.create({
        data: {
          userId: testUser.id,
          name: 'Nubank',
          creditLimit: 5000,
          closingDay: 10,
          dueDay: 17,
        },
      });
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      await prisma.creditCard.create({
        data: {
          userId: otherUser.id,
          name: 'Other Card',
          creditLimit: 1000,
          closingDay: 5,
          dueDay: 12,
        },
      });

      const response = await GET();
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('Nubank');
    });
  });

  describe('GET /api/v1/credit-cards/:id', () => {
    it('returns 404 for another user card', async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      const card = await prisma.creditCard.create({
        data: {
          userId: otherUser.id,
          name: 'Not Mine',
          creditLimit: 1000,
          closingDay: 5,
          dueDay: 12,
        },
      });

      const request = createMockRequest(`api/v1/credit-cards/${card.id}`);
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: card.id }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/credit-cards/:id', () => {
    it('updates the credit limit', async () => {
      const card = await prisma.creditCard.create({
        data: {
          userId: testUser.id,
          name: 'Nubank',
          creditLimit: 5000,
          closingDay: 10,
          dueDay: 17,
        },
      });

      const request = createMockPatchRequest(`api/v1/credit-cards/${card.id}`, {
        creditLimit: 8000,
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: card.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.creditLimit).toBe('8000');
    });
  });

  describe('DELETE /api/v1/credit-cards/:id', () => {
    it('deletes the credit card', async () => {
      const card = await prisma.creditCard.create({
        data: {
          userId: testUser.id,
          name: 'Nubank',
          creditLimit: 5000,
          closingDay: 10,
          dueDay: 17,
        },
      });

      const request = createMockDeleteRequest(`api/v1/credit-cards/${card.id}`);
      const response = await DELETE(request, {
        params: Promise.resolve({ id: card.id }),
      });

      expect(response.status).toBe(204);

      const found = await prisma.creditCard.findUnique({
        where: { id: card.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('POST /api/v1/credit-cards/:id/installment-purchases', () => {
    it('creates N transactions and applies the full amount to the card balance', async () => {
      const card = await prisma.creditCard.create({
        data: {
          userId: testUser.id,
          name: 'Nubank',
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

      const updatedCard = await prisma.creditCard.findUniqueOrThrow({
        where: { id: card.id },
      });
      expect(Number(updatedCard.balance)).toBe(300);
    });

    it('returns 404 for a credit card belonging to another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      const card = await prisma.creditCard.create({
        data: {
          userId: otherUser.id,
          name: 'Not Mine',
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
  });
});
