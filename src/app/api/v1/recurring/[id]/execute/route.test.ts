import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from './route';
import { createMockPostRequest, parseResponse } from '@tests-helpers/api';

// Mock auth
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

// Mock recurring services
vi.mock('@/services/recurring', () => ({
  executeRecurringTransaction: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import { executeRecurringTransaction } from '@/services/recurring';
import { UnauthorizedError } from '@/lib/api/response';

describe('API v1 - Recurring Execute POST', () => {
  const mockUserId = 'user-123';
  const mockRecurringId = 'rec_123';

  const mockTransaction = {
    id: 'txn_123',
    userId: mockUserId,
    date: new Date(),
    amount: 100,
    description: 'Monthly subscription',
    type: 'EXPENSE',
    categoryId: 'cat_123',
    isRecurring: true,
    recurringId: mockRecurringId,
    necessityLevel: null,
    valueAlignment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createParams = (id: string) => Promise.resolve({ id });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockPostRequest(
      `api/v1/recurring/${mockRecurringId}/execute`,
      {}
    );
    const response = await POST(req, { params: createParams(mockRecurringId) });

    expect(response.status).toBe(401);
  });

  it('executes recurring transaction successfully', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(executeRecurringTransaction as Mock).mockResolvedValue(
      mockTransaction
    );

    const req = createMockPostRequest(
      `api/v1/recurring/${mockRecurringId}/execute`,
      {}
    );
    const response = await POST(req, { params: createParams(mockRecurringId) });
    const json = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(json.data.id).toBe('txn_123');
    expect(json.data.recurringId).toBe(mockRecurringId);
    expect(json.data.isRecurring).toBe(true);
    expect(executeRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      mockRecurringId
    );
  });

  it('returns 404 for non-existent recurring', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(executeRecurringTransaction as Mock).mockRejectedValue(
      new Error('Recurring transaction not found')
    );

    const req = createMockPostRequest(
      'api/v1/recurring/non_existent/execute',
      {}
    );
    const response = await POST(req, { params: createParams('non_existent') });
    const json = await parseResponse(response);

    expect(response.status).toBe(404);
    expect(json.error.code).toBe('RECURRING_TRANSACTION_NOT_FOUND');
  });

  it('returns 400 for inactive recurring', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(executeRecurringTransaction as Mock).mockRejectedValue(
      new Error('Recurring transaction is not active')
    );

    const req = createMockPostRequest(
      `api/v1/recurring/${mockRecurringId}/execute`,
      {}
    );
    const response = await POST(req, { params: createParams(mockRecurringId) });
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('RECURRING_TRANSACTION_IS_NOT_ACTIVE');
  });

  it('returns 400 for recurring not yet due', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(executeRecurringTransaction as Mock).mockRejectedValue(
      new Error('Recurring transaction is not due yet')
    );

    const req = createMockPostRequest(
      `api/v1/recurring/${mockRecurringId}/execute`,
      {}
    );
    const response = await POST(req, { params: createParams(mockRecurringId) });
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('RECURRING_TRANSACTION_IS_NOT_DUE_YET');
  });

  it('creates transaction with all recurring fields', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const fullTransaction = {
      ...mockTransaction,
      necessityLevel: 'NEEDS',
      valueAlignment: 'ALIGNED',
    };
    vi.mocked(executeRecurringTransaction as Mock).mockResolvedValue(
      fullTransaction
    );

    const req = createMockPostRequest(
      `api/v1/recurring/${mockRecurringId}/execute`,
      {}
    );
    const response = await POST(req, { params: createParams(mockRecurringId) });
    const json = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(json.data.necessityLevel).toBe('NEEDS');
    expect(json.data.valueAlignment).toBe('ALIGNED');
    expect(json.data.isRecurring).toBe(true);
  });
});
