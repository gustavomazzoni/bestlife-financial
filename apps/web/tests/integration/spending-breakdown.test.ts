import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/v1/calculations/spending-breakdown/route';
import { createMockRequest, parseResponse } from '@tests-helpers/api';
import { prisma } from './setup';
import { TransactionType } from '@/generated/prisma/client';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('GET /api/v1/calculations/spending-breakdown', () => {
  let testUser: { id: string };
  let mercadoCategory: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    mercadoCategory = await prisma.category.findFirstOrThrow({
      where: { name: 'Mercado', type: TransactionType.EXPENSE },
      select: { id: true },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  it('returns the spending breakdown for the current month', async () => {
    await prisma.transaction.create({
      data: {
        userId: testUser.id,
        date: new Date(),
        amount: 250,
        description: 'Compras',
        type: TransactionType.EXPENSE,
        categoryId: mercadoCategory.id,
      },
    });

    const request = createMockRequest('api/v1/calculations/spending-breakdown');
    const response = await GET(request);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.totalExpenses).toBe(250);
    expect(json.data.byCategory).toHaveLength(1);
    expect(json.data.byCategory[0].categoryName).toBe('Mercado');
  });

  it('accepts a month query param', async () => {
    const request = createMockRequest(
      'api/v1/calculations/spending-breakdown?month=2026-01'
    );
    const response = await GET(request);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.totalExpenses).toBe(0);
  });

  it('returns 400 for a malformed month param', async () => {
    const request = createMockRequest(
      'api/v1/calculations/spending-breakdown?month=not-a-month'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

    const request = createMockRequest('api/v1/calculations/spending-breakdown');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
