import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { createMockPatchRequest, parseResponse } from '@tests-helpers/api';
import { UnauthorizedError } from '@/lib/api/response';

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

// Mock auth config to prevent next-auth from loading next/server
vi.mock('@/lib/auth/config', () => ({
  unstable_update: vi.fn(),
}));

// Mock user services
vi.mock('@/services/user', () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import { getUserProfile, updateUserProfile } from '@/services/user';

const mockUserId = 'user-test-123';

const mockProfile = {
  activeIncomeMonthly: 8000,
  dreamLifestyleCost: 15000,
  currentInvestments: 50000,
};

describe('GET /api/v1/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns profile with all three fields', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

    const response = await GET();
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.activeIncomeMonthly).toBe(8000);
    expect(json.data.dreamLifestyleCost).toBe(15000);
    expect(json.data.currentInvestments).toBe(50000);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns null dreamLifestyleCost when not set', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getUserProfile).mockResolvedValue({
      activeIncomeMonthly: 0,
      dreamLifestyleCost: null,
      currentInvestments: 0,
    });

    const response = await GET();
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.dreamLifestyleCost).toBeNull();
  });
});

describe('PATCH /api/v1/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    activeIncomeMonthly: 8000,
    dreamLifestyleCost: 15000,
    currentInvestments: 50000,
  };

  it('saves all three fields and returns updated profile', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateUserProfile).mockResolvedValue(mockProfile);

    const req = createMockPatchRequest('/api/v1/user/profile', validPayload);
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.activeIncomeMonthly).toBe(8000);
    expect(json.data.dreamLifestyleCost).toBe(15000);
    expect(json.data.currentInvestments).toBe(50000);

    expect(updateUserProfile).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        activeIncomeMonthly: 8000,
        dreamLifestyleCost: 15000,
        currentInvestments: 50000,
      })
    );
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createMockPatchRequest('/api/v1/user/profile', validPayload);
    const response = await PATCH(req);

    expect(response.status).toBe(401);
  });

  it('returns 400 for negative activeIncomeMonthly', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest('/api/v1/user/profile', {
      ...validPayload,
      activeIncomeMonthly: -100,
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for zero dreamLifestyleCost', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest('/api/v1/user/profile', {
      ...validPayload,
      dreamLifestyleCost: 0,
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for negative dreamLifestyleCost', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest('/api/v1/user/profile', {
      ...validPayload,
      dreamLifestyleCost: -1,
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for negative currentInvestments', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest('/api/v1/user/profile', {
      ...validPayload,
      currentInvestments: -500,
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for non-numeric values', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const req = createMockPatchRequest('/api/v1/user/profile', {
      ...validPayload,
      activeIncomeMonthly: 'abc',
    });
    const response = await PATCH(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('allows activeIncomeMonthly = 0 (passive-income-only users)', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(updateUserProfile).mockResolvedValue({
      ...mockProfile,
      activeIncomeMonthly: 0,
    });

    const req = createMockPatchRequest('/api/v1/user/profile', {
      ...validPayload,
      activeIncomeMonthly: 0,
    });
    const response = await PATCH(req);

    expect(response.status).toBe(200);
  });
});
