import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/scheduled/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/v1/scheduled/[id]/route';
import { POST as EXECUTE } from '@/app/api/v1/scheduled/[id]/execute/route';
import {
  createMockRequest,
  createMockPostRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  parseResponse,
} from '@tests-helpers/api';
import { prisma } from './setup';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/generated/prisma/client';
import { addDays, startOfDay } from 'date-fns';

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('Scheduled Transactions Integration Tests', () => {
  let testUser: { id: string };
  let expenseCategory: { id: string };
  let incomeCategory: { id: string };

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    expenseCategory = await prisma.category.findFirstOrThrow({
      where: { type: TransactionType.EXPENSE },
      select: { id: true },
    });

    incomeCategory = await prisma.category.findFirstOrThrow({
      where: { type: TransactionType.INCOME },
      select: { id: true },
    });

    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  // ─── POST /api/v1/scheduled ───────────────────────────────────────────────

  describe('POST /api/v1/scheduled (Create)', () => {
    it('should create a ONCE scheduled transaction', async () => {
      const tomorrow = addDays(new Date(), 1);

      const request = createMockPostRequest('api/v1/scheduled', {
        amount: 500,
        description: 'Pagamento consultor',
        type: TransactionType.EXPENSE,
        categoryId: expenseCategory.id,
        frequency: 'ONCE',
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.amount).toBe('500');
      expect(json.data.description).toBe('Pagamento consultor');
      expect(json.data.frequency).toBe('ONCE');
      expect(json.data.isActive).toBe(true);

      const saved = await prisma.scheduledTransaction.findFirst({
        where: { userId: testUser.id },
      });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Pagamento consultor');
    });

    it('should create a MONTHLY recurring scheduled transaction', async () => {
      const tomorrow = addDays(new Date(), 1);

      const request = createMockPostRequest('api/v1/scheduled', {
        amount: 99.99,
        description: 'Monthly Netflix subscription',
        type: TransactionType.EXPENSE,
        categoryId: expenseCategory.id,
        frequency: 'MONTHLY',
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.frequency).toBe('MONTHLY');
      expect(json.data.isActive).toBe(true);
    });

    it('should create with all optional fields', async () => {
      const startDate = addDays(new Date(), 1);
      const endDate = addDays(new Date(), 365);

      const request = createMockPostRequest('api/v1/scheduled', {
        amount: 5000,
        description: 'Monthly salary',
        type: TransactionType.INCOME,
        categoryId: incomeCategory.id,
        frequency: 'MONTHLY',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        necessityLevel: NecessityLevel.IMPORTANT,
        valueAlignment: ValueAlignment.FREEDOM_ENABLING,
        notificationDaysBefore: 5,
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.necessityLevel).toBe(NecessityLevel.IMPORTANT);
      expect(json.data.valueAlignment).toBe(ValueAlignment.FREEDOM_ENABLING);
      expect(json.data.notificationDaysBefore).toBe(5);
    });

    it('should return 404 for invalid category', async () => {
      const tomorrow = addDays(new Date(), 1);

      const request = createMockPostRequest('api/v1/scheduled', {
        amount: 100,
        description: 'Test',
        type: TransactionType.EXPENSE,
        categoryId: 'non-existent-category',
        frequency: 'MONTHLY',
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(json.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 400 for category type mismatch', async () => {
      const tomorrow = addDays(new Date(), 1);

      const request = createMockPostRequest('api/v1/scheduled', {
        amount: 100,
        description: 'Test',
        type: TransactionType.INCOME,
        categoryId: expenseCategory.id, // wrong type
        frequency: 'MONTHLY',
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.message).toContain('Category type does not match');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockPostRequest('api/v1/scheduled', {
        amount: 100,
        description: 'Test',
        type: TransactionType.EXPENSE,
        categoryId: expenseCategory.id,
        frequency: 'MONTHLY',
        startDate: addDays(new Date(), 1).toISOString(),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  // ─── GET /api/v1/scheduled ────────────────────────────────────────────────

  describe('GET /api/v1/scheduled (List)', () => {
    beforeEach(async () => {
      const tomorrow = addDays(new Date(), 1);

      await prisma.scheduledTransaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 100,
            description: 'Monthly expense 1',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: 'MONTHLY',
            startDate: tomorrow,
            nextOccurrence: addDays(tomorrow, 30),
            isActive: true,
          },
          {
            userId: testUser.id,
            amount: 200,
            description: 'Weekly expense',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: 'WEEKLY',
            startDate: tomorrow,
            nextOccurrence: addDays(tomorrow, 7),
            isActive: true,
          },
          {
            userId: testUser.id,
            amount: 5000,
            description: 'Monthly income',
            type: TransactionType.INCOME,
            categoryId: incomeCategory.id,
            frequency: 'MONTHLY',
            startDate: tomorrow,
            nextOccurrence: addDays(tomorrow, 30),
            isActive: true,
          },
          {
            userId: testUser.id,
            amount: 50,
            description: 'Inactive subscription',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: 'MONTHLY',
            startDate: tomorrow,
            nextOccurrence: addDays(tomorrow, 30),
            isActive: false,
          },
          {
            userId: testUser.id,
            amount: 500,
            description: 'Once payment',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: 'ONCE',
            startDate: tomorrow,
            nextOccurrence: tomorrow,
            isActive: true,
          },
        ],
      });
    });

    it('should list active scheduled transactions by default', async () => {
      const request = createMockRequest('api/v1/scheduled');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(4); // 3 active recurring + 1 active ONCE
      expect(json.meta.total).toBe(4);
      expect(json.meta.page).toBe(1);
      expect(json.meta.limit).toBe(20);
    });

    it('should filter by type', async () => {
      const request = createMockRequest('api/v1/scheduled?type=EXPENSE');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      json.data.forEach((item: { type: string }) => {
        expect(item.type).toBe(TransactionType.EXPENSE);
      });
    });

    it('should filter by frequency', async () => {
      const request = createMockRequest('api/v1/scheduled?frequency=WEEKLY');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].frequency).toBe('WEEKLY');
    });

    it('should list inactive scheduled transactions', async () => {
      const request = createMockRequest('api/v1/scheduled?isActive=false');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].isActive).toBe(false);
    });

    it('should apply pagination', async () => {
      const request = createMockRequest('api/v1/scheduled?page=1&limit=2');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.meta.total).toBe(4);
      expect(json.meta.totalPages).toBe(2);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest('api/v1/scheduled');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  // ─── GET /api/v1/scheduled/:id ────────────────────────────────────────────

  describe('GET /api/v1/scheduled/:id', () => {
    let scheduledId: string;

    beforeEach(async () => {
      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 150,
          description: 'Test scheduled for get',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(new Date(), 1),
          nextOccurrence: addDays(new Date(), 31),
          isActive: true,
        },
      });
      scheduledId = scheduled.id;
    });

    it('should get a scheduled transaction by ID', async () => {
      const request = createMockRequest(`api/v1/scheduled/${scheduledId}`);
      const params = Promise.resolve({ id: scheduledId });

      const response = await GET_BY_ID(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.id).toBe(scheduledId);
      expect(json.data.description).toBe('Test scheduled for get');
      expect(json.data.category).toBeDefined();
    });

    it('should return 404 for non-existent scheduled', async () => {
      const request = createMockRequest('api/v1/scheduled/non-existent');
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await GET_BY_ID(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(json.error.code).toBe('SCHEDULED_TRANSACTION_NOT_FOUND');
    });

    it('should not return scheduled from another user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other@example.com', name: 'Other User' },
      });
      const otherScheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: otherUser.id,
          amount: 100,
          description: 'Other user scheduled',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(new Date(), 1),
          nextOccurrence: addDays(new Date(), 31),
          isActive: true,
        },
      });

      const request = createMockRequest(
        `api/v1/scheduled/${otherScheduled.id}`
      );
      const params = Promise.resolve({ id: otherScheduled.id });

      const response = await GET_BY_ID(request, { params });

      expect(response.status).toBe(404);
    });
  });

  // ─── PATCH /api/v1/scheduled/:id ─────────────────────────────────────────

  describe('PATCH /api/v1/scheduled/:id', () => {
    let scheduledId: string;

    beforeEach(async () => {
      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 100,
          description: 'Original description',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(new Date(), 1),
          nextOccurrence: addDays(new Date(), 31),
          isActive: true,
        },
      });
      scheduledId = scheduled.id;
    });

    it('should update amount and description', async () => {
      const request = createMockPatchRequest(
        `api/v1/scheduled/${scheduledId}`,
        {
          amount: 150,
          description: 'Updated description',
        }
      );
      const params = Promise.resolve({ id: scheduledId });

      const response = await PATCH(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.amount).toBe('150');
      expect(json.data.description).toBe('Updated description');

      const updated = await prisma.scheduledTransaction.findUnique({
        where: { id: scheduledId },
      });
      expect(updated?.description).toBe('Updated description');
    });

    it('should return 404 for non-existent scheduled', async () => {
      const request = createMockPatchRequest('api/v1/scheduled/non-existent', {
        amount: 200,
      });
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await PATCH(request, { params });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid amount', async () => {
      const request = createMockPatchRequest(
        `api/v1/scheduled/${scheduledId}`,
        {
          amount: -50,
        }
      );
      const params = Promise.resolve({ id: scheduledId });

      const response = await PATCH(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── DELETE /api/v1/scheduled/:id ────────────────────────────────────────

  describe('DELETE /api/v1/scheduled/:id', () => {
    it('should soft delete (deactivate) a MONTHLY scheduled transaction', async () => {
      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 100,
          description: 'Recurring to deactivate',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(new Date(), 1),
          nextOccurrence: addDays(new Date(), 31),
          isActive: true,
        },
      });

      const request = createMockDeleteRequest(
        `api/v1/scheduled/${scheduled.id}`
      );
      const params = Promise.resolve({ id: scheduled.id });

      const response = await DELETE(request, { params });

      expect(response.status).toBe(204);

      const deactivated = await prisma.scheduledTransaction.findUnique({
        where: { id: scheduled.id },
      });
      expect(deactivated).not.toBeNull();
      expect(deactivated?.isActive).toBe(false);
    });

    it('should hard delete a ONCE scheduled transaction', async () => {
      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 500,
          description: 'Once payment to delete',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'ONCE',
          startDate: addDays(new Date(), 1),
          nextOccurrence: addDays(new Date(), 1),
          isActive: true,
        },
      });

      const request = createMockDeleteRequest(
        `api/v1/scheduled/${scheduled.id}`
      );
      const params = Promise.resolve({ id: scheduled.id });

      const response = await DELETE(request, { params });

      expect(response.status).toBe(204);

      const deleted = await prisma.scheduledTransaction.findUnique({
        where: { id: scheduled.id },
      });
      expect(deleted).toBeNull(); // hard deleted
    });

    it('should return 404 for non-existent scheduled', async () => {
      const request = createMockDeleteRequest('api/v1/scheduled/non-existent');
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await DELETE(request, { params });

      expect(response.status).toBe(404);
    });
  });

  // ─── POST /api/v1/scheduled/:id/execute ──────────────────────────────────

  describe('POST /api/v1/scheduled/:id/execute', () => {
    it('should execute a MONTHLY recurring transaction (creates Transaction, advances nextOccurrence)', async () => {
      const today = startOfDay(new Date());

      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 99.99,
          description: 'Due subscription',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(today, -30),
          nextOccurrence: today,
          isActive: true,
          necessityLevel: NecessityLevel.NEEDS,
          valueAlignment: ValueAlignment.ALIGNED,
        },
      });

      const request = createMockPostRequest(
        `api/v1/scheduled/${scheduled.id}/execute`,
        {}
      );
      const params = Promise.resolve({ id: scheduled.id });

      const response = await EXECUTE(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.amount).toBe('99.99');
      expect(json.data.description).toBe('Due subscription');
      expect(json.data.scheduledId).toBe(scheduled.id);
      expect(json.data.necessityLevel).toBe(NecessityLevel.NEEDS);

      // Transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: { scheduledId: scheduled.id },
      });
      expect(transaction).not.toBeNull();

      // nextOccurrence was advanced (still active)
      const updated = await prisma.scheduledTransaction.findUnique({
        where: { id: scheduled.id },
      });
      expect(updated?.isActive).toBe(true);
      expect(updated?.lastExecutedDate).not.toBeNull();
    });

    it('should execute a ONCE scheduled transaction (creates Transaction, deactivates scheduled)', async () => {
      const tomorrow = addDays(new Date(), 1);

      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 500,
          description: 'One-time payment',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'ONCE',
          startDate: tomorrow,
          nextOccurrence: tomorrow,
          isActive: true,
        },
      });

      const request = createMockPostRequest(
        `api/v1/scheduled/${scheduled.id}/execute`,
        { date: tomorrow.toISOString().split('T')[0] }
      );
      const params = Promise.resolve({ id: scheduled.id });

      const response = await EXECUTE(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data.amount).toBe('500');

      // Transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: { scheduledId: scheduled.id },
      });
      expect(transaction).not.toBeNull();

      // Scheduled is now inactive
      const updated = await prisma.scheduledTransaction.findUnique({
        where: { id: scheduled.id },
      });
      expect(updated?.isActive).toBe(false);
    });

    it('should return 400 for inactive scheduled', async () => {
      const today = startOfDay(new Date());

      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 50,
          description: 'Inactive scheduled',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(today, -30),
          nextOccurrence: today,
          isActive: false,
        },
      });

      const request = createMockPostRequest(
        `api/v1/scheduled/${scheduled.id}/execute`,
        {}
      );
      const params = Promise.resolve({ id: scheduled.id });

      const response = await EXECUTE(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.message).toContain('not active');
    });

    it('should return 404 for non-existent scheduled', async () => {
      const request = createMockPostRequest(
        'api/v1/scheduled/non-existent/execute',
        {}
      );
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await EXECUTE(request, { params });

      expect(response.status).toBe(404);
    });

    it('should deactivate recurring when endDate is reached after execution', async () => {
      const today = startOfDay(new Date());

      const scheduled = await prisma.scheduledTransaction.create({
        data: {
          userId: testUser.id,
          amount: 25,
          description: 'Expiring subscription',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: 'MONTHLY',
          startDate: addDays(today, -30),
          nextOccurrence: today,
          endDate: addDays(today, 15), // ends in 15 days; next monthly would be ~30 days
          isActive: true,
        },
      });

      const request = createMockPostRequest(
        `api/v1/scheduled/${scheduled.id}/execute`,
        {}
      );
      const params = Promise.resolve({ id: scheduled.id });

      const response = await EXECUTE(request, { params });

      expect(response.status).toBe(201);

      const updated = await prisma.scheduledTransaction.findUnique({
        where: { id: scheduled.id },
      });
      expect(updated?.isActive).toBe(false);
    });
  });
});
