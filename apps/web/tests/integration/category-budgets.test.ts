import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/v1/categories/budgets/route';
import { PATCH } from '@/app/api/v1/categories/[id]/budget/route';
import {
  createMockRequest,
  createMockPatchRequest,
  parseResponse,
} from '@tests-helpers/api';
import { prisma } from './setup';
import { TransactionType } from '@/generated/prisma/client';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('Category Budgets Integration Tests', () => {
  let testUser: { id: string };
  let mercadoCategory: { id: string };
  let rendaCategory: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    mercadoCategory = await prisma.category.findFirstOrThrow({
      where: { name: 'Mercado', type: TransactionType.EXPENSE },
      select: { id: true },
    });

    rendaCategory = await prisma.category.findFirstOrThrow({
      where: { name: 'Renda', type: TransactionType.INCOME },
      select: { id: true },
    });

    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('PATCH /api/v1/categories/:id/budget', () => {
    it('creates a budget for a valid expense category', async () => {
      const request = createMockPatchRequest(
        `api/v1/categories/${mercadoCategory.id}/budget`,
        { monthlyAmount: 600 }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mercadoCategory.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.monthlyAmount).toBe('600');
      expect(json.data.categoryId).toBe(mercadoCategory.id);
    });

    it('updates an existing budget (upsert)', async () => {
      await prisma.categoryBudget.create({
        data: {
          userId: testUser.id,
          categoryId: mercadoCategory.id,
          monthlyAmount: 400,
        },
      });

      const request = createMockPatchRequest(
        `api/v1/categories/${mercadoCategory.id}/budget`,
        { monthlyAmount: 700 }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mercadoCategory.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.monthlyAmount).toBe('700');

      const count = await prisma.categoryBudget.count({
        where: { userId: testUser.id, categoryId: mercadoCategory.id },
      });
      expect(count).toBe(1);
    });

    it('returns 400 for a non-expense category', async () => {
      const request = createMockPatchRequest(
        `api/v1/categories/${rendaCategory.id}/budget`,
        { monthlyAmount: 500 }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: rendaCategory.id }),
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 for a non-positive monthlyAmount', async () => {
      const request = createMockPatchRequest(
        `api/v1/categories/${mercadoCategory.id}/budget`,
        { monthlyAmount: -10 }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mercadoCategory.id }),
      });

      expect(response.status).toBe(400);
    });

    it('returns 404 for a non-existent category', async () => {
      const request = createMockPatchRequest(
        'api/v1/categories/nonexistent/budget',
        { monthlyAmount: 500 }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockPatchRequest(
        `api/v1/categories/${mercadoCategory.id}/budget`,
        { monthlyAmount: 500 }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: mercadoCategory.id }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/categories/budgets', () => {
    it('returns budgets joined with actual spend for the current month', async () => {
      await prisma.categoryBudget.create({
        data: {
          userId: testUser.id,
          categoryId: mercadoCategory.id,
          monthlyAmount: 500,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: testUser.id,
          date: new Date(),
          amount: 550,
          description: 'Compras do mês',
          type: TransactionType.EXPENSE,
          categoryId: mercadoCategory.id,
        },
      });

      const request = createMockRequest('api/v1/categories/budgets');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0]).toMatchObject({
        categoryId: mercadoCategory.id,
        budget: 500,
        spent: 550,
        pct: 110,
        isOverBudget: true,
      });
    });

    it('returns an empty array when the user has no budgets', async () => {
      const request = createMockRequest('api/v1/categories/budgets');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest('api/v1/categories/budgets');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
