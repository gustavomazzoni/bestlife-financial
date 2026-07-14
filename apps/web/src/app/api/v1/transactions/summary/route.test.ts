import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { parseResponse } from '@tests-helpers/api';
import { UnauthorizedError } from '@/lib/api/response';

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

vi.mock('@/services/calculations/monthly-summary', () => ({
  getMonthlySummary: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';
import { getMonthlySummary } from '@/services/calculations/monthly-summary';

const mockUserId = 'user-test-123';

const mockSummary = [
  { month: '2026-01', income: 5000, expenses: 3200 },
  { month: '2026-02', income: 5500, expenses: 2800 },
  { month: '2026-03', income: 6000, expenses: 3000 },
];

describe('GET /api/v1/transactions/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with monthly summaries when authenticated', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getMonthlySummary).mockResolvedValue(mockSummary);

    const request = new NextRequest(
      'http://localhost/api/v1/transactions/summary?period=month&months=3'
    );
    const response = await GET(request);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(3);
    expect(json.data[0]).toMatchObject({
      month: '2026-01',
      income: 5000,
      expenses: 3200,
    });
  });

  it('uses default months=3 when not specified', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getMonthlySummary).mockResolvedValue(mockSummary);

    const request = new NextRequest(
      'http://localhost/api/v1/transactions/summary'
    );
    await GET(request);

    expect(getMonthlySummary).toHaveBeenCalledWith(mockUserId, 3);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const request = new NextRequest(
      'http://localhost/api/v1/transactions/summary'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when months is a negative number', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const request = new NextRequest(
      'http://localhost/api/v1/transactions/summary?months=-1'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns last N months when months param is provided', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
    vi.mocked(getMonthlySummary).mockResolvedValue(mockSummary.slice(0, 2));

    const request = new NextRequest(
      'http://localhost/api/v1/transactions/summary?months=2'
    );
    await GET(request);

    expect(getMonthlySummary).toHaveBeenCalledWith(mockUserId, 2);
  });
});
