import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/investments/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/v1/investments/[id]/route';
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

describe('Investments Integration Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('POST /api/v1/investments', () => {
    it('creates an investment', async () => {
      const request = createMockPostRequest('api/v1/investments', {
        name: 'Tesouro Selic',
        category: 'fixed-income',
        balance: 5000,
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.name).toBe('Tesouro Selic');
      expect(json.data.balance).toBe('5000');
    });

    it('returns 400 for a negative balance', async () => {
      const request = createMockPostRequest('api/v1/investments', {
        name: 'Tesouro Selic',
        category: 'fixed-income',
        balance: -100,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));
      const request = createMockPostRequest('api/v1/investments', {
        name: 'Tesouro Selic',
        category: 'fixed-income',
        balance: 5000,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/investments', () => {
    it('lists only the authenticated user investments', async () => {
      await prisma.investment.create({
        data: {
          userId: testUser.id,
          name: 'Ações',
          category: 'stocks',
          balance: 1000,
        },
      });

      const response = await GET();
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/investments/:id', () => {
    it('returns 404 for another user investment', async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      const investment = await prisma.investment.create({
        data: {
          userId: otherUser.id,
          name: 'Not Mine',
          category: 'stocks',
          balance: 100,
        },
      });

      const request = createMockRequest(`api/v1/investments/${investment.id}`);
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: investment.id }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/investments/:id', () => {
    it('updates the balance', async () => {
      const investment = await prisma.investment.create({
        data: {
          userId: testUser.id,
          name: 'Ações',
          category: 'stocks',
          balance: 1000,
        },
      });

      const request = createMockPatchRequest(
        `api/v1/investments/${investment.id}`,
        { balance: 1500 }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: investment.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.balance).toBe('1500');
    });
  });

  describe('DELETE /api/v1/investments/:id', () => {
    it('deletes the investment', async () => {
      const investment = await prisma.investment.create({
        data: {
          userId: testUser.id,
          name: 'Ações',
          category: 'stocks',
          balance: 1000,
        },
      });

      const request = createMockDeleteRequest(
        `api/v1/investments/${investment.id}`
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: investment.id }),
      });

      expect(response.status).toBe(204);
      const found = await prisma.investment.findUnique({
        where: { id: investment.id },
      });
      expect(found).toBeNull();
    });
  });
});
