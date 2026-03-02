import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { parseResponse } from '@tests-helpers/api';
import { UnauthorizedError } from '@/lib/api/response';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

vi.mock('@/services/calculations/freedom-metrics', () => ({
  calculateFreedomMetrics: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import { calculateFreedomMetrics } from '@/services/calculations/freedom-metrics';

const mockUserId = 'user-test-123';

const mockMetrics = {
  fiNumber: 3_000_000,
  fiProgress: 16.67,
  currentRunway: 50,
  savingsRate: 73.33,
  monthsToFI: 200,
  avgMonthlyExpenses: 4000,
};

describe('GET /api/v1/calculations/freedom-metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with all metric fields when authenticated', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(calculateFreedomMetrics).mockResolvedValue(mockMetrics);

    const response = await GET();
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data.fiNumber).toBe(3_000_000);
    expect(json.data.fiProgress).toBe(16.67);
    expect(json.data.currentRunway).toBe(50);
    expect(json.data.savingsRate).toBe(73.33);
    expect(json.data.monthsToFI).toBe(200);
    expect(json.data.avgMonthlyExpenses).toBe(4000);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
