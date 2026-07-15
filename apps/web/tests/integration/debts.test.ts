import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/debts/route';
import { GET as GET_BY_ID, PATCH, DELETE } from '@/app/api/v1/debts/[id]/route';
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

describe('Debts Integration Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('POST /api/v1/debts', () => {
    it('creates a debt', async () => {
      const request = createMockPostRequest('api/v1/debts', {
        name: 'Cartão de crédito',
        balance: 1200,
        installmentCurrent: 2,
        installmentTotal: 10,
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.name).toBe('Cartão de crédito');
      expect(json.data.balance).toBe('1200');
    });

    it('returns 400 when installmentCurrent exceeds installmentTotal', async () => {
      const request = createMockPostRequest('api/v1/debts', {
        name: 'Financiamento',
        balance: 1000,
        installmentCurrent: 12,
        installmentTotal: 10,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));
      const request = createMockPostRequest('api/v1/debts', {
        name: 'Cartão',
        balance: 100,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/debts', () => {
    it('lists only the authenticated user debts', async () => {
      await prisma.debt.create({
        data: { userId: testUser.id, name: 'Cartão', balance: 500 },
      });

      const response = await GET();
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/debts/:id', () => {
    it('returns 404 for another user debt', async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      const debt = await prisma.debt.create({
        data: { userId: otherUser.id, name: 'Not Mine', balance: 500 },
      });

      const request = createMockRequest(`api/v1/debts/${debt.id}`);
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: debt.id }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/debts/:id', () => {
    it('updates the balance', async () => {
      const debt = await prisma.debt.create({
        data: { userId: testUser.id, name: 'Cartão', balance: 500 },
      });

      const request = createMockPatchRequest(`api/v1/debts/${debt.id}`, {
        balance: 300,
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: debt.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.balance).toBe('300');
    });
  });

  describe('DELETE /api/v1/debts/:id', () => {
    it('deletes the debt', async () => {
      const debt = await prisma.debt.create({
        data: { userId: testUser.id, name: 'Cartão', balance: 500 },
      });

      const request = createMockDeleteRequest(`api/v1/debts/${debt.id}`);
      const response = await DELETE(request, {
        params: Promise.resolve({ id: debt.id }),
      });

      expect(response.status).toBe(204);
      const found = await prisma.debt.findUnique({ where: { id: debt.id } });
      expect(found).toBeNull();
    });
  });
});
