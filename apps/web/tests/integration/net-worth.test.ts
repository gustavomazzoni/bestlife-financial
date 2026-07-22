import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/v1/calculations/net-worth/route';
import { parseResponse } from '@tests-helpers/api';
import { prisma } from './setup';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('GET /api/v1/calculations/net-worth', () => {
  let testUser: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' },
    });
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  it('sums accounts + investments - debts across the user data', async () => {
    await prisma.financialAccount.create({
      data: {
        userId: testUser.id,
        name: 'Nubank',
        type: 'CHECKING',
        balance: 2000,
      },
    });
    await prisma.investment.create({
      data: {
        userId: testUser.id,
        name: 'Ações',
        category: 'stocks',
        balance: 10000,
      },
    });
    await prisma.debt.create({
      data: { userId: testUser.id, name: 'Cartão', balance: 1500 },
    });

    const response = await GET();
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data).toEqual({
      accountsTotal: 2000,
      investmentsTotal: 10000,
      debtsTotal: 1500,
      creditCardsTotal: 0,
      netWorth: 10500,
    });
  });

  it('separates a CREDIT_CARD-type account into creditCardsTotal, not accountsTotal', async () => {
    await prisma.financialAccount.create({
      data: {
        userId: testUser.id,
        name: 'Nubank',
        type: 'CHECKING',
        balance: 2000,
      },
    });
    await prisma.financialAccount.create({
      data: {
        userId: testUser.id,
        name: 'Nubank Card',
        type: 'CREDIT_CARD',
        balance: 300,
        creditLimit: 5000,
        closingDay: 10,
        dueDay: 17,
      },
    });

    const response = await GET();
    const json = await parseResponse(response);

    expect(json.data.accountsTotal).toBe(2000);
    expect(json.data.creditCardsTotal).toBe(300);
    expect(json.data.netWorth).toBe(1700);
  });

  it('returns all zeros for a user with no financial data', async () => {
    const response = await GET();
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data).toEqual({
      accountsTotal: 0,
      investmentsTotal: 0,
      debtsTotal: 0,
      creditCardsTotal: 0,
      netWorth: 0,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

    const response = await GET();
    expect(response.status).toBe(401);
  });
});
