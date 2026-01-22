import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import {
  createMockRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  parseResponse,
} from '@tests-helpers/api';

// Mock auth
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

// Mock recurring services
vi.mock('@/services/recurring', () => ({
  getRecurringTransaction: vi.fn(),
  updateRecurringTransaction: vi.fn(),
  deleteRecurringTransaction: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import {
  getRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/services/recurring';
import { UnauthorizedError } from '@/lib/api/response';

describe('API v1 - Recurring GET by ID', () => {
  const mockUserId = 'user-123';
  const mockRecurringId = 'rec_123';

  const mockRecurring = {
    id: mockRecurringId,
    userId: mockUserId,
    amount: 100,
    description: 'Monthly subscription',
    type: 'EXPENSE',
    categoryId: 'cat_123',
    frequency: 'MONTHLY',
    startDate: new Date('2024-01-15'),
    endDate: null,
    nextDueDate: new Date('2024-02-15'),
    lastCreatedDate: null,
    isActive: true,
    necessityLevel: null,
    valueAlignment: null,
    notificationDaysBefore: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createParams = (id: string) => Promise.resolve({ id });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockRequest(`api/v1/recurring/${mockRecurringId}`);
    const response = await GET(req, { params: createParams(mockRecurringId) });

    expect(response.status).toBe(401);
  });

  it('returns recurring transaction by ID', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getRecurringTransaction as Mock).mockResolvedValue(mockRecurring);

    const req = createMockRequest(`api/v1/recurring/${mockRecurringId}`);
    const response = await GET(req, { params: createParams(mockRecurringId) });
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.id).toBe(mockRecurringId);
    expect(getRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      mockRecurringId
    );
  });

  it('returns 404 for non-existent recurring', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getRecurringTransaction as Mock).mockRejectedValue(
      new Error('Recurring transaction not found')
    );

    const req = createMockRequest('api/v1/recurring/non_existent');
    const response = await GET(req, { params: createParams('non_existent') });
    const json = await parseResponse(response);

    expect(response.status).toBe(404);
    expect(json.error.code).toBe('RECURRING_TRANSACTION_NOT_FOUND');
  });
});

describe('API v1 - Recurring PATCH (Update)', () => {
  const mockUserId = 'user-123';
  const mockRecurringId = 'rec_123';

  const mockRecurring = {
    id: mockRecurringId,
    userId: mockUserId,
    amount: 100,
    description: 'Monthly subscription',
    type: 'EXPENSE',
    categoryId: 'cat_123',
    frequency: 'MONTHLY',
    startDate: new Date('2024-01-15'),
    endDate: null,
    nextDueDate: new Date('2024-02-15'),
    lastCreatedDate: null,
    isActive: true,
    necessityLevel: null,
    valueAlignment: null,
    notificationDaysBefore: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createParams = (id: string) => Promise.resolve({ id });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockPatchRequest(`api/v1/recurring/${mockRecurringId}`, {
      amount: 150,
    });
    const response = await PATCH(req, {
      params: createParams(mockRecurringId),
    });

    expect(response.status).toBe(401);
  });

  it('updates recurring transaction successfully', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateRecurringTransaction as Mock).mockResolvedValue({
      ...mockRecurring,
      amount: 150,
      description: 'Updated subscription',
    });

    const updateData = { amount: 150, description: 'Updated subscription' };
    const req = createMockPatchRequest(
      `api/v1/recurring/${mockRecurringId}`,
      updateData
    );
    const response = await PATCH(req, {
      params: createParams(mockRecurringId),
    });
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.amount).toBe(150);
    expect(updateRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      mockRecurringId,
      expect.objectContaining({
        amount: 150,
        description: 'Updated subscription',
      })
    );
  });

  it('updates only frequency', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateRecurringTransaction as Mock).mockResolvedValue({
      ...mockRecurring,
      frequency: 'WEEKLY',
    });

    const req = createMockPatchRequest(`api/v1/recurring/${mockRecurringId}`, {
      frequency: 'WEEKLY',
    });
    const response = await PATCH(req, {
      params: createParams(mockRecurringId),
    });

    expect(response.status).toBe(200);
    expect(updateRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      mockRecurringId,
      { frequency: 'WEEKLY' }
    );
  });

  it('returns 400 for invalid amount', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest(`api/v1/recurring/${mockRecurringId}`, {
      amount: -50,
    });
    const response = await PATCH(req, {
      params: createParams(mockRecurringId),
    });
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(updateRecurringTransaction).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid frequency', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest(`api/v1/recurring/${mockRecurringId}`, {
      frequency: 'INVALID',
    });
    const response = await PATCH(req, {
      params: createParams(mockRecurringId),
    });
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(updateRecurringTransaction).not.toHaveBeenCalled();
  });

  it('returns 404 for non-existent recurring', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateRecurringTransaction as Mock).mockRejectedValue(
      new Error('Recurring transaction not found')
    );

    const req = createMockPatchRequest('api/v1/recurring/non_existent', {
      amount: 150,
    });
    const response = await PATCH(req, { params: createParams('non_existent') });
    const json = await parseResponse(response);

    expect(response.status).toBe(404);
    expect(json.error.code).toBe('RECURRING_TRANSACTION_NOT_FOUND');
  });

  it('handles category mismatch error', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateRecurringTransaction as Mock).mockRejectedValue(
      new Error('Category type does not match transaction type')
    );

    const req = createMockPatchRequest(`api/v1/recurring/${mockRecurringId}`, {
      categoryId: 'wrong_category',
    });
    const response = await PATCH(req, {
      params: createParams(mockRecurringId),
    });
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe(
      'CATEGORY_TYPE_DOES_NOT_MATCH_TRANSACTION_TYPE'
    );
  });
});

describe('API v1 - Recurring DELETE', () => {
  const mockUserId = 'user-123';
  const mockRecurringId = 'rec_123';

  const mockRecurring = {
    id: mockRecurringId,
    userId: mockUserId,
    amount: 100,
    description: 'Monthly subscription',
    type: 'EXPENSE',
    categoryId: 'cat_123',
    frequency: 'MONTHLY',
    startDate: new Date('2024-01-15'),
    endDate: null,
    nextDueDate: new Date('2024-02-15'),
    lastCreatedDate: null,
    isActive: false,
    necessityLevel: null,
    valueAlignment: null,
    notificationDaysBefore: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createParams = (id: string) => Promise.resolve({ id });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockDeleteRequest(`api/v1/recurring/${mockRecurringId}`);
    const response = await DELETE(req, {
      params: createParams(mockRecurringId),
    });

    expect(response.status).toBe(401);
  });

  it('deletes (deactivates) recurring transaction', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(deleteRecurringTransaction as Mock).mockResolvedValue(
      mockRecurring
    );

    const req = createMockDeleteRequest(`api/v1/recurring/${mockRecurringId}`);
    const response = await DELETE(req, {
      params: createParams(mockRecurringId),
    });

    expect(response.status).toBe(204);
    expect(deleteRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      mockRecurringId
    );
  });

  it('returns 404 for non-existent recurring', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(deleteRecurringTransaction as Mock).mockRejectedValue(
      new Error('Recurring transaction not found')
    );

    const req = createMockDeleteRequest('api/v1/recurring/non_existent');
    const response = await DELETE(req, {
      params: createParams('non_existent'),
    });
    const json = await parseResponse(response);

    expect(response.status).toBe(404);
    expect(json.error.code).toBe('RECURRING_TRANSACTION_NOT_FOUND');
  });
});
