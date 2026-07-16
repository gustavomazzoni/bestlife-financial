import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/categories/route';
import { PATCH, DELETE } from '@/app/api/v1/categories/[id]/route';
import {
  createMockRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  parseResponse,
} from '@tests-helpers/api';
import { prisma } from './setup';
import { TransactionType } from '@/generated/prisma/client';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('Categories Integration Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  // ─── POST /api/v1/categories ───────────────────────────────────────────

  describe('POST /api/v1/categories (Create)', () => {
    it('creates a non-system category', async () => {
      const name = `Assinaturas ${Date.now()}`;
      const request = createMockPostRequest('api/v1/categories', {
        name,
        type: TransactionType.EXPENSE,
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.name).toBe(name);
      expect(json.data.isSystemDefault).toBe(false);

      const saved = await prisma.category.findUnique({
        where: { id: json.data.id },
      });
      expect(saved).not.toBeNull();
    });

    it('returns 409 for a duplicate name + type', async () => {
      const name = `Assinaturas Dup ${Date.now()}`;
      await POST(
        createMockPostRequest('api/v1/categories', {
          name,
          type: TransactionType.EXPENSE,
        })
      );

      const response = await POST(
        createMockPostRequest('api/v1/categories', {
          name,
          type: TransactionType.EXPENSE,
        })
      );

      expect(response.status).toBe(409);
    });

    it('returns 400 for missing required fields', async () => {
      const request = createMockPostRequest('api/v1/categories', { name: '' });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));
      const request = createMockPostRequest('api/v1/categories', {
        name: `Unauth ${Date.now()}`,
        type: TransactionType.EXPENSE,
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  // ─── GET /api/v1/categories ─────────────────────────────────────────────

  describe('GET /api/v1/categories', () => {
    it('lists categories', async () => {
      const request = createMockRequest('api/v1/categories');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });
  });

  // ─── PATCH /api/v1/categories/:id ───────────────────────────────────────

  describe('PATCH /api/v1/categories/:id', () => {
    it('updates a non-system category', async () => {
      const createRes = await POST(
        createMockPostRequest('api/v1/categories', {
          name: `Original ${Date.now()}`,
          type: TransactionType.EXPENSE,
        })
      );
      const created = await parseResponse(createRes);

      const request = createMockPatchRequest(
        `api/v1/categories/${created.data.id}`,
        {
          name: 'Renomeada',
        }
      );
      const params = Promise.resolve({ id: created.data.id });
      const response = await PATCH(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.name).toBe('Renomeada');
    });

    it('returns 403 when attempting to modify a system default category', async () => {
      const systemCategory = await prisma.category.findFirstOrThrow({
        where: { isSystemDefault: true },
      });

      const request = createMockPatchRequest(
        `api/v1/categories/${systemCategory.id}`,
        {
          name: 'Hacked',
        }
      );
      const params = Promise.resolve({ id: systemCategory.id });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(403);
    });

    it('returns 404 for a non-existent category', async () => {
      const request = createMockPatchRequest(
        'api/v1/categories/does-not-exist',
        {
          name: 'X',
        }
      );
      const params = Promise.resolve({ id: 'does-not-exist' });
      const response = await PATCH(request, { params });
      expect(response.status).toBe(404);
    });
  });

  // ─── DELETE /api/v1/categories/:id ──────────────────────────────────────

  describe('DELETE /api/v1/categories/:id', () => {
    it('deletes a non-system category with no references', async () => {
      const createRes = await POST(
        createMockPostRequest('api/v1/categories', {
          name: `Deletable ${Date.now()}`,
          type: TransactionType.EXPENSE,
        })
      );
      const created = await parseResponse(createRes);

      const request = createMockDeleteRequest(
        `api/v1/categories/${created.data.id}`
      );
      const params = Promise.resolve({ id: created.data.id });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(204);

      const stillExists = await prisma.category.findUnique({
        where: { id: created.data.id },
      });
      expect(stillExists).toBeNull();
    });

    it('returns 409 when the category is still referenced by a transaction', async () => {
      const createRes = await POST(
        createMockPostRequest('api/v1/categories', {
          name: `In Use ${Date.now()}`,
          type: TransactionType.EXPENSE,
        })
      );
      const created = await parseResponse(createRes);

      await prisma.transaction.create({
        data: {
          userId: testUser.id,
          date: new Date(),
          amount: 50,
          description: 'Uses this category',
          type: TransactionType.EXPENSE,
          categoryId: created.data.id,
        },
      });

      const request = createMockDeleteRequest(
        `api/v1/categories/${created.data.id}`
      );
      const params = Promise.resolve({ id: created.data.id });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(409);

      const stillExists = await prisma.category.findUnique({
        where: { id: created.data.id },
      });
      expect(stillExists).not.toBeNull();
    });

    it('returns 403 when attempting to delete a system default category', async () => {
      const systemCategory = await prisma.category.findFirstOrThrow({
        where: { isSystemDefault: true },
      });

      const request = createMockDeleteRequest(
        `api/v1/categories/${systemCategory.id}`
      );
      const params = Promise.resolve({ id: systemCategory.id });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(403);
    });
  });
});
