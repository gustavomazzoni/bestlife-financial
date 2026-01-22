import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST, GET } from './route';
import {
  createMockRequest,
  createMockPostRequest,
  parseResponse,
} from '@tests-helpers/api';

// Mock auth
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

// Mock recurring services
vi.mock('@/services/recurring', () => ({
  createRecurringTransaction: vi.fn(),
  listRecurringTransactions: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import {
  createRecurringTransaction,
  listRecurringTransactions,
} from '@/services/recurring';
import { UnauthorizedError } from '@/lib/api/response';

describe('API v1 - Recurring POST (Create)', () => {
  const mockUserId = 'user-123';

  const validPayload = {
    amount: 100,
    description: 'Monthly subscription',
    type: 'EXPENSE',
    categoryId: 'cat_123',
    frequency: 'MONTHLY',
    startDate: '2024-01-15',
  };

  const mockRecurring = {
    id: 'rec_123',
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createPostRequest = (body: unknown) =>
    createMockPostRequest('/api/v1/recurring', body);

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createPostRequest(validPayload);
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid amount (negative)', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const invalidPayload = { ...validPayload, amount: -100 };
    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(createRecurringTransaction).not.toHaveBeenCalled();
  });

  it('returns 400 for missing required fields', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const invalidPayload = { amount: 100 };
    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.details).toBeDefined();
    expect(createRecurringTransaction).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid frequency', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const invalidPayload = { ...validPayload, frequency: 'INVALID' };
    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(createRecurringTransaction).not.toHaveBeenCalled();
  });

  it('returns 400 for description too short', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const invalidPayload = { ...validPayload, description: 'ab' };
    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(createRecurringTransaction).not.toHaveBeenCalled();
  });

  it('returns 201 and calls service with valid data', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(createRecurringTransaction as Mock).mockResolvedValue(
      mockRecurring
    );

    const req = createPostRequest(validPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(json.data.id).toBe(mockRecurring.id);
    expect(json.data.amount).toBe(mockRecurring.amount);
    expect(json.data.description).toBe(mockRecurring.description);
    expect(json.data.type).toBe(mockRecurring.type);
    expect(json.data.frequency).toBe(mockRecurring.frequency);
    expect(json.data.isActive).toBe(mockRecurring.isActive);
    expect(createRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        amount: 100,
        description: 'Monthly subscription',
        type: 'EXPENSE',
        categoryId: 'cat_123',
        frequency: 'MONTHLY',
        startDate: expect.any(Date),
      })
    );
  });

  it('creates recurring with optional fields', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(createRecurringTransaction as Mock).mockResolvedValue({
      ...mockRecurring,
      necessityLevel: 'NEEDS',
      valueAlignment: 'ALIGNED',
      notificationDaysBefore: 7,
    });

    const payloadWithOptionals = {
      ...validPayload,
      endDate: '2024-12-31',
      necessityLevel: 'NEEDS',
      valueAlignment: 'ALIGNED',
      notificationDaysBefore: 7,
    };

    const req = createPostRequest(payloadWithOptionals);
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(createRecurringTransaction).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        necessityLevel: 'NEEDS',
        valueAlignment: 'ALIGNED',
        notificationDaysBefore: 7,
        endDate: expect.any(Date),
      })
    );
  });

  it('handles service errors correctly', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(createRecurringTransaction as Mock).mockRejectedValue(
      new Error('Category not found')
    );

    const req = createPostRequest(validPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(404);
    expect(json.error.code).toBe('CATEGORY_NOT_FOUND');
  });
});

describe('API v1 - Recurring GET (List)', () => {
  const mockUserId = 'user-123';

  const mockListResult = {
    data: [
      {
        id: 'rec_1',
        amount: 100,
        description: 'Subscription 1',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        isActive: true,
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockRequest('api/v1/recurring');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('returns list with default pagination', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(listRecurringTransactions as Mock).mockResolvedValue(
      mockListResult
    );

    const req = createMockRequest('api/v1/recurring');
    const response = await GET(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.meta).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(listRecurringTransactions).toHaveBeenCalledWith(mockUserId, {
      page: 1,
      limit: 20,
      isActive: true,
    });
  });

  it('applies custom pagination correctly', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(listRecurringTransactions as Mock).mockResolvedValue({
      ...mockListResult,
      page: 2,
      limit: 10,
    });

    const req = createMockRequest('api/v1/recurring?page=2&limit=10');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(listRecurringTransactions).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        page: 2,
        limit: 10,
      })
    );
  });

  it('filters by type', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(listRecurringTransactions as Mock).mockResolvedValue(
      mockListResult
    );

    const req = createMockRequest('api/v1/recurring?type=EXPENSE');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(listRecurringTransactions).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        type: 'EXPENSE',
      })
    );
  });

  it('filters by frequency', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(listRecurringTransactions as Mock).mockResolvedValue(
      mockListResult
    );

    const req = createMockRequest('api/v1/recurring?frequency=WEEKLY');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(listRecurringTransactions).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        frequency: 'WEEKLY',
      })
    );
  });

  it('filters inactive recurring transactions', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(listRecurringTransactions as Mock).mockResolvedValue({
      ...mockListResult,
      data: [],
    });

    const req = createMockRequest('api/v1/recurring?isActive=false');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(listRecurringTransactions).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        isActive: false,
      })
    );
  });

  it('combines multiple filters', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(listRecurringTransactions as Mock).mockResolvedValue(
      mockListResult
    );

    const req = createMockRequest(
      'api/v1/recurring?type=INCOME&frequency=MONTHLY&page=1&limit=5'
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(listRecurringTransactions).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        type: 'INCOME',
        frequency: 'MONTHLY',
        page: 1,
        limit: 5,
      })
    );
  });
});
