import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/v1/transactions/route';
import { createMockPostRequest, parseResponse } from '@tests-helpers/api';
import { prisma } from './setup';
import { TransactionType } from '@/generated/prisma/client';

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('POST /api/v1/transactions', () => {
  let testUser: { id: string };
  let expenseCategory: { id: string };

  beforeEach(async () => {
    // Create a test user in the database
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    // Get an expense category from seeded data
    expenseCategory = await prisma.category.findFirstOrThrow({
      where: { type: TransactionType.EXPENSE },
      select: { id: true },
    });

    // Mock auth to return our test user
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  it('should create transaction when authenticated', async () => {
    // Use a date in the past to avoid validation race condition
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const request = createMockPostRequest('api/v1/transactions', {
      date: yesterday.toISOString(),
      amount: 150.5,
      description: 'Test grocery shopping',
      type: TransactionType.EXPENSE,
      categoryId: expenseCategory.id,
    });

    const response = await POST(request);
    const json = await parseResponse(response);

    // Log error details if not 201
    if (response.status !== 201) {
      console.log('Error response:', JSON.stringify(json, null, 2));
    }

    expect(response.status).toBe(201);
    expect(json.data).toBeDefined();
    expect(json.data.description).toBe('Test grocery shopping');

    // Verify in database
    const savedTransaction = await prisma.transaction.findFirst({
      where: { userId: testUser.id },
    });
    expect(savedTransaction).not.toBeNull();
    expect(savedTransaction?.description).toBe('Test grocery shopping');
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const request = createMockPostRequest('api/v1/transactions', {
      date: yesterday.toISOString(),
      amount: 100,
      description: 'Test transaction',
      type: TransactionType.EXPENSE,
      categoryId: expenseCategory.id,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
