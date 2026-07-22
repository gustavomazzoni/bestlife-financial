import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { createMockPatchRequest, parseResponse } from '@tests-helpers/api';
import { UnauthorizedError } from '@/lib/api/response';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

vi.mock('@/services/user', () => ({
  getUserPreferences: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import { getUserPreferences, updateUserPreferences } from '@/services/user';

const mockUserId = 'user-test-123';

describe('GET /api/v1/user/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the default expense account id', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getUserPreferences).mockResolvedValue({
      defaultExpenseAccountId: 'acc_1',
    });

    const response = await GET();
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.defaultExpenseAccountId).toBe('acc_1');
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const response = await GET();

    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/v1/user/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the default expense account', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateUserPreferences).mockResolvedValue({
      defaultExpenseAccountId: 'acc_1',
    });

    const req = createMockPatchRequest('/api/v1/user/preferences', {
      defaultExpenseAccountId: 'acc_1',
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.defaultExpenseAccountId).toBe('acc_1');
    expect(updateUserPreferences).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ defaultExpenseAccountId: 'acc_1' })
    );
  });

  it('allows clearing the default expense account with null', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateUserPreferences).mockResolvedValue({
      defaultExpenseAccountId: null,
    });

    const req = createMockPatchRequest('/api/v1/user/preferences', {
      defaultExpenseAccountId: null,
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.defaultExpenseAccountId).toBeNull();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockPatchRequest('/api/v1/user/preferences', {
      defaultExpenseAccountId: 'acc_1',
    });
    const response = await PATCH(req);

    expect(response.status).toBe(401);
  });

  it('returns 400 for a non-string defaultExpenseAccountId', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest('/api/v1/user/preferences', {
      defaultExpenseAccountId: 42,
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when the service rejects an unowned account', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateUserPreferences).mockRejectedValue(
      new Error('Account not found')
    );

    const req = createMockPatchRequest('/api/v1/user/preferences', {
      defaultExpenseAccountId: 'acc_other',
    });
    const response = await PATCH(req);

    expect(response.status).toBe(404);
  });
});
