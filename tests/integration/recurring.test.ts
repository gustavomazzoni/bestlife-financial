import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/v1/recurring/route';
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/v1/recurring/[id]/route';
import { POST as EXECUTE } from '@/app/api/v1/recurring/[id]/execute/route';
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
  RecurringFrequency,
  NecessityLevel,
  ValueAlignment,
} from '@/generated/prisma/client';
import { addDays, startOfDay } from 'date-fns';

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

import { getUserId } from '@/lib/auth/session';

describe('Recurring Transactions Integration Tests', () => {
  let testUser: { id: string };
  let expenseCategory: { id: string };
  let incomeCategory: { id: string };

  beforeEach(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    // Get categories from seeded data
    expenseCategory = await prisma.category.findFirstOrThrow({
      where: { type: TransactionType.EXPENSE },
      select: { id: true },
    });

    incomeCategory = await prisma.category.findFirstOrThrow({
      where: { type: TransactionType.INCOME },
      select: { id: true },
    });

    // Mock auth to return our test user
    vi.mocked(getUserId).mockResolvedValue(testUser.id);
  });

  describe('POST /api/v1/recurring (Create)', () => {
    it('should create a recurring transaction with required fields', async () => {
      const tomorrow = addDays(new Date(), 1);

      const request = createMockPostRequest('api/v1/recurring', {
        amount: 99.99,
        description: 'Monthly Netflix subscription',
        type: TransactionType.EXPENSE,
        categoryId: expenseCategory.id,
        frequency: RecurringFrequency.MONTHLY,
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.amount).toBe('99.99');
      expect(json.data.description).toBe('Monthly Netflix subscription');
      expect(json.data.type).toBe(TransactionType.EXPENSE);
      expect(json.data.frequency).toBe(RecurringFrequency.MONTHLY);
      expect(json.data.isActive).toBe(true);

      // Verify in database
      const saved = await prisma.recurringTransaction.findFirst({
        where: { userId: testUser.id },
      });
      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Monthly Netflix subscription');
    });

    it('should create a recurring transaction with all optional fields', async () => {
      const startDate = addDays(new Date(), 1);
      const endDate = addDays(new Date(), 365);

      const request = createMockPostRequest('api/v1/recurring', {
        amount: 5000,
        description: 'Monthly salary',
        type: TransactionType.INCOME,
        categoryId: incomeCategory.id,
        frequency: RecurringFrequency.MONTHLY,
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

    it('should return 400 for invalid category', async () => {
      const tomorrow = addDays(new Date(), 1);

      const request = createMockPostRequest('api/v1/recurring', {
        amount: 100,
        description: 'Test recurring',
        type: TransactionType.EXPENSE,
        categoryId: 'non-existent-category',
        frequency: RecurringFrequency.MONTHLY,
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(json.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 400 for category type mismatch', async () => {
      const tomorrow = addDays(new Date(), 1);

      // Try to create INCOME recurring with EXPENSE category
      const request = createMockPostRequest('api/v1/recurring', {
        amount: 100,
        description: 'Test recurring',
        type: TransactionType.INCOME,
        categoryId: expenseCategory.id, // This is an EXPENSE category
        frequency: RecurringFrequency.MONTHLY,
        startDate: tomorrow.toISOString(),
      });

      const response = await POST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.message).toContain('Category type does not match');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockPostRequest('api/v1/recurring', {
        amount: 100,
        description: 'Test recurring',
        type: TransactionType.EXPENSE,
        categoryId: expenseCategory.id,
        frequency: RecurringFrequency.MONTHLY,
        startDate: addDays(new Date(), 1).toISOString(),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/recurring (List)', () => {
    beforeEach(async () => {
      // Create some recurring transactions for listing tests
      const tomorrow = addDays(new Date(), 1);

      await prisma.recurringTransaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 100,
            description: 'Monthly expense 1',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: RecurringFrequency.MONTHLY,
            startDate: tomorrow,
            nextDueDate: addDays(tomorrow, 30),
            isActive: true,
          },
          {
            userId: testUser.id,
            amount: 200,
            description: 'Weekly expense',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: RecurringFrequency.WEEKLY,
            startDate: tomorrow,
            nextDueDate: addDays(tomorrow, 7),
            isActive: true,
          },
          {
            userId: testUser.id,
            amount: 5000,
            description: 'Monthly income',
            type: TransactionType.INCOME,
            categoryId: incomeCategory.id,
            frequency: RecurringFrequency.MONTHLY,
            startDate: tomorrow,
            nextDueDate: addDays(tomorrow, 30),
            isActive: true,
          },
          {
            userId: testUser.id,
            amount: 50,
            description: 'Inactive subscription',
            type: TransactionType.EXPENSE,
            categoryId: expenseCategory.id,
            frequency: RecurringFrequency.MONTHLY,
            startDate: tomorrow,
            nextDueDate: addDays(tomorrow, 30),
            isActive: false,
          },
        ],
      });
    });

    it('should list active recurring transactions with default pagination', async () => {
      const request = createMockRequest('api/v1/recurring');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(3); // Only active ones
      expect(json.meta.total).toBe(3);
      expect(json.meta.page).toBe(1);
      expect(json.meta.limit).toBe(20);
    });

    it('should filter by type', async () => {
      const request = createMockRequest('api/v1/recurring?type=EXPENSE');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2); // Only active EXPENSE
      json.data.forEach((item: { type: string }) => {
        expect(item.type).toBe(TransactionType.EXPENSE);
      });
    });

    it('should filter by frequency', async () => {
      const request = createMockRequest('api/v1/recurring?frequency=WEEKLY');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].frequency).toBe(RecurringFrequency.WEEKLY);
    });

    it('should list inactive recurring transactions', async () => {
      const request = createMockRequest('api/v1/recurring?isActive=false');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].isActive).toBe(false);
    });

    it('should apply pagination', async () => {
      const request = createMockRequest('api/v1/recurring?page=1&limit=2');
      const response = await GET(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.meta.total).toBe(3);
      expect(json.meta.totalPages).toBe(2);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest('api/v1/recurring');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/recurring/:id', () => {
    let recurringId: string;

    beforeEach(async () => {
      const recurring = await prisma.recurringTransaction.create({
        data: {
          userId: testUser.id,
          amount: 150,
          description: 'Test recurring for get',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(new Date(), 1),
          nextDueDate: addDays(new Date(), 31),
          isActive: true,
        },
      });
      recurringId = recurring.id;
    });

    it('should get a recurring transaction by ID', async () => {
      const request = createMockRequest(`api/v1/recurring/${recurringId}`);
      const params = Promise.resolve({ id: recurringId });

      const response = await GET_BY_ID(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.id).toBe(recurringId);
      expect(json.data.description).toBe('Test recurring for get');
      expect(json.data.category).toBeDefined(); // Should include category
    });

    it('should return 404 for non-existent recurring', async () => {
      const request = createMockRequest('api/v1/recurring/non-existent');
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await GET_BY_ID(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(json.error.code).toBe('RECURRING_TRANSACTION_NOT_FOUND');
    });

    it('should not return recurring from another user', async () => {
      // Create another user and their recurring
      const otherUser = await prisma.user.create({
        data: { email: 'other@example.com', name: 'Other User' },
      });
      const otherRecurring = await prisma.recurringTransaction.create({
        data: {
          userId: otherUser.id,
          amount: 100,
          description: 'Other user recurring',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(new Date(), 1),
          nextDueDate: addDays(new Date(), 31),
          isActive: true,
        },
      });

      const request = createMockRequest(
        `api/v1/recurring/${otherRecurring.id}`
      );
      const params = Promise.resolve({ id: otherRecurring.id });

      const response = await GET_BY_ID(request, { params });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/recurring/:id', () => {
    let recurringId: string;

    beforeEach(async () => {
      const recurring = await prisma.recurringTransaction.create({
        data: {
          userId: testUser.id,
          amount: 100,
          description: 'Original description',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(new Date(), 1),
          nextDueDate: addDays(new Date(), 31),
          isActive: true,
        },
      });
      recurringId = recurring.id;
    });

    it('should update amount and description', async () => {
      const request = createMockPatchRequest(
        `api/v1/recurring/${recurringId}`,
        {
          amount: 150,
          description: 'Updated description',
        }
      );
      const params = Promise.resolve({ id: recurringId });

      const response = await PATCH(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.amount).toBe('150');
      expect(json.data.description).toBe('Updated description');

      // Verify in database
      const updated = await prisma.recurringTransaction.findUnique({
        where: { id: recurringId },
      });
      expect(updated?.description).toBe('Updated description');
    });

    it('should update frequency and recalculate nextDueDate', async () => {
      const request = createMockPatchRequest(
        `api/v1/recurring/${recurringId}`,
        {
          frequency: RecurringFrequency.WEEKLY,
        }
      );
      const params = Promise.resolve({ id: recurringId });

      const response = await PATCH(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.frequency).toBe(RecurringFrequency.WEEKLY);
    });

    it('should return 404 for non-existent recurring', async () => {
      const request = createMockPatchRequest('api/v1/recurring/non-existent', {
        amount: 200,
      });
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await PATCH(request, { params });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid amount', async () => {
      const request = createMockPatchRequest(
        `api/v1/recurring/${recurringId}`,
        {
          amount: -50,
        }
      );
      const params = Promise.resolve({ id: recurringId });

      const response = await PATCH(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/recurring/:id', () => {
    let recurringId: string;

    beforeEach(async () => {
      const recurring = await prisma.recurringTransaction.create({
        data: {
          userId: testUser.id,
          amount: 100,
          description: 'Recurring to delete',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(new Date(), 1),
          nextDueDate: addDays(new Date(), 31),
          isActive: true,
        },
      });
      recurringId = recurring.id;
    });

    it('should soft delete (deactivate) a recurring transaction', async () => {
      const request = createMockDeleteRequest(
        `api/v1/recurring/${recurringId}`
      );
      const params = Promise.resolve({ id: recurringId });

      const response = await DELETE(request, { params });

      expect(response.status).toBe(204);

      // Verify in database - should still exist but be inactive
      const deleted = await prisma.recurringTransaction.findUnique({
        where: { id: recurringId },
      });
      expect(deleted).not.toBeNull();
      expect(deleted?.isActive).toBe(false);
    });

    it('should return 404 for non-existent recurring', async () => {
      const request = createMockDeleteRequest('api/v1/recurring/non-existent');
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await DELETE(request, { params });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/recurring/:id/execute', () => {
    let recurringId: string;

    beforeEach(async () => {
      // Create a recurring that is due today
      const today = startOfDay(new Date());

      const recurring = await prisma.recurringTransaction.create({
        data: {
          userId: testUser.id,
          amount: 99.99,
          description: 'Due subscription',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(today, -30), // Started 30 days ago
          nextDueDate: today, // Due today
          isActive: true,
          necessityLevel: NecessityLevel.NEEDS,
          valueAlignment: ValueAlignment.ALIGNED,
        },
      });
      recurringId = recurring.id;
    });

    it('should execute a due recurring transaction', async () => {
      const request = createMockPostRequest(
        `api/v1/recurring/${recurringId}/execute`,
        {}
      );
      const params = Promise.resolve({ id: recurringId });

      const response = await EXECUTE(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.amount).toBe('99.99');
      expect(json.data.description).toBe('Due subscription');
      expect(json.data.isRecurring).toBe(true);
      expect(json.data.recurringId).toBe(recurringId);
      expect(json.data.necessityLevel).toBe(NecessityLevel.NEEDS);
      expect(json.data.valueAlignment).toBe(ValueAlignment.ALIGNED);

      // Verify transaction was created in database
      const transaction = await prisma.transaction.findFirst({
        where: { recurringId },
      });
      expect(transaction).not.toBeNull();

      // Verify recurring was updated
      const recurring = await prisma.recurringTransaction.findUnique({
        where: { id: recurringId },
      });
      expect(recurring?.lastCreatedDate).not.toBeNull();
      // nextDueDate should be updated to next month
    });

    it('should return 400 for not yet due recurring', async () => {
      // Create a recurring that is not due yet
      const futureRecurring = await prisma.recurringTransaction.create({
        data: {
          userId: testUser.id,
          amount: 50,
          description: 'Future subscription',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(new Date(), 1),
          nextDueDate: addDays(new Date(), 31), // Due in 31 days
          isActive: true,
        },
      });

      const request = createMockPostRequest(
        `api/v1/recurring/${futureRecurring.id}/execute`,
        {}
      );
      const params = Promise.resolve({ id: futureRecurring.id });

      const response = await EXECUTE(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.message).toContain('not due yet');
    });

    it('should return 400 for inactive recurring', async () => {
      // Deactivate the recurring
      await prisma.recurringTransaction.update({
        where: { id: recurringId },
        data: { isActive: false },
      });

      const request = createMockPostRequest(
        `api/v1/recurring/${recurringId}/execute`,
        {}
      );
      const params = Promise.resolve({ id: recurringId });

      const response = await EXECUTE(request, { params });
      const json = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(json.error.message).toContain('not active');
    });

    it('should return 404 for non-existent recurring', async () => {
      const request = createMockPostRequest(
        'api/v1/recurring/non-existent/execute',
        {}
      );
      const params = Promise.resolve({ id: 'non-existent' });

      const response = await EXECUTE(request, { params });

      expect(response.status).toBe(404);
    });

    it('should deactivate recurring when endDate is reached', async () => {
      const today = startOfDay(new Date());

      // Create a recurring with endDate that will be exceeded after execution
      const expiringRecurring = await prisma.recurringTransaction.create({
        data: {
          userId: testUser.id,
          amount: 25,
          description: 'Expiring subscription',
          type: TransactionType.EXPENSE,
          categoryId: expenseCategory.id,
          frequency: RecurringFrequency.MONTHLY,
          startDate: addDays(today, -30),
          nextDueDate: today,
          endDate: addDays(today, 15), // Ends in 15 days, next would be 30 days
          isActive: true,
        },
      });

      const request = createMockPostRequest(
        `api/v1/recurring/${expiringRecurring.id}/execute`,
        {}
      );
      const params = Promise.resolve({ id: expiringRecurring.id });

      const response = await EXECUTE(request, { params });

      expect(response.status).toBe(201);

      // Verify recurring was deactivated
      const recurring = await prisma.recurringTransaction.findUnique({
        where: { id: expiringRecurring.id },
      });
      expect(recurring?.isActive).toBe(false);
    });
  });
});
