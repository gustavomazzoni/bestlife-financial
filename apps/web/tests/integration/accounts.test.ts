import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/accounts/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/v1/accounts/[id]/route';
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

describe('Financial Accounts Integration Tests', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('POST /api/v1/accounts', () => {
    it('creates an account with default balance 0', async () => {
      const request = createMockPostRequest('api/v1/accounts', {
        name: 'Nubank',
        type: 'CHECKING',
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.name).toBe('Nubank');
      expect(json.data.balance).toBe('0');
    });

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));
      const request = createMockPostRequest('api/v1/accounts', {
        name: 'Nubank',
        type: 'CHECKING',
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 for an invalid type', async () => {
      const request = createMockPostRequest('api/v1/accounts', {
        name: 'Nubank',
        type: 'BITCOIN',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('creates a CREDIT_CARD account with its card-only fields', async () => {
      const request = createMockPostRequest('api/v1/accounts', {
        name: 'Nubank Card',
        type: 'CREDIT_CARD',
        creditLimit: 5000,
        closingDay: 10,
        dueDay: 17,
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.type).toBe('CREDIT_CARD');
      expect(json.data.creditLimit).toBe('5000');
      expect(json.data.balance).toBe('0');
    });

    it('returns 400 for a CREDIT_CARD account missing creditLimit/closingDay/dueDay', async () => {
      const request = createMockPostRequest('api/v1/accounts', {
        name: 'Nubank Card',
        type: 'CREDIT_CARD',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/accounts', () => {
    it('lists only the authenticated user accounts', async () => {
      await prisma.financialAccount.create({
        data: { userId: testUser.id, name: 'Carteira', type: 'WALLET' },
      });
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      await prisma.financialAccount.create({
        data: { userId: otherUser.id, name: 'Other Wallet', type: 'WALLET' },
      });

      const response = await GET();
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('Carteira');
    });
  });

  describe('GET /api/v1/accounts/:id', () => {
    it('returns the account when owned by the user', async () => {
      const account = await prisma.financialAccount.create({
        data: { userId: testUser.id, name: 'Itaú', type: 'CHECKING' },
      });

      const request = createMockRequest(`api/v1/accounts/${account.id}`);
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: account.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.name).toBe('Itaú');
    });

    it('returns 404 for another user account', async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@example.com` },
      });
      const account = await prisma.financialAccount.create({
        data: { userId: otherUser.id, name: 'Not Mine', type: 'CHECKING' },
      });

      const request = createMockRequest(`api/v1/accounts/${account.id}`);
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: account.id }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/accounts/:id', () => {
    it('updates the balance', async () => {
      const account = await prisma.financialAccount.create({
        data: { userId: testUser.id, name: 'Itaú', type: 'CHECKING' },
      });

      const request = createMockPatchRequest(`api/v1/accounts/${account.id}`, {
        balance: 2500,
      });
      const response = await PATCH(request, {
        params: Promise.resolve({ id: account.id }),
      });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.balance).toBe('2500');
    });
  });

  describe('DELETE /api/v1/accounts/:id', () => {
    it('deletes the account', async () => {
      const account = await prisma.financialAccount.create({
        data: { userId: testUser.id, name: 'Itaú', type: 'CHECKING' },
      });

      const request = createMockDeleteRequest(`api/v1/accounts/${account.id}`);
      const response = await DELETE(request, {
        params: Promise.resolve({ id: account.id }),
      });

      expect(response.status).toBe(204);

      const found = await prisma.financialAccount.findUnique({
        where: { id: account.id },
      });
      expect(found).toBeNull();
    });

    it('nullifies accountId on linked transactions instead of failing', async () => {
      const account = await prisma.financialAccount.create({
        data: { userId: testUser.id, name: 'Itaú', type: 'CHECKING' },
      });
      const category = await prisma.category.findFirstOrThrow({
        where: { type: 'EXPENSE' },
        select: { id: true },
      });
      const transaction = await prisma.transaction.create({
        data: {
          userId: testUser.id,
          date: new Date(),
          amount: 100,
          description: 'Compra',
          type: 'EXPENSE',
          categoryId: category.id,
          accountId: account.id,
        },
      });

      const request = createMockDeleteRequest(`api/v1/accounts/${account.id}`);
      const response = await DELETE(request, {
        params: Promise.resolve({ id: account.id }),
      });

      expect(response.status).toBe(204);

      const updated = await prisma.transaction.findUnique({
        where: { id: transaction.id },
      });
      expect(updated?.accountId).toBeNull();
    });
  });
});
