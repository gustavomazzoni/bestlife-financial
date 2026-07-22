import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
} from './transaction';

describe('Transaction Validation', () => {
  describe('CreateTransactionSchema', () => {
    it('should validate correct data', () => {
      const validData = {
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Test transaction',
        type: 'EXPENSE',
        categoryId: 'cat_123',
        accountId: 'acc_123',
      };

      const result = CreateTransactionSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject a missing accountId', () => {
      const invalidData = {
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Test transaction',
        type: 'EXPENSE',
        categoryId: 'cat_123',
      };

      expect(() => CreateTransactionSchema.parse(invalidData)).toThrow();
    });

    it('should reject an empty-string accountId', () => {
      const invalidData = {
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Test transaction',
        type: 'EXPENSE',
        categoryId: 'cat_123',
        accountId: '',
      };

      expect(() => CreateTransactionSchema.parse(invalidData)).toThrow(
        /Conta é obrigatória/
      );
    });

    it('should reject negative amount', () => {
      const invalidData = {
        date: new Date(),
        amount: -100,
        description: 'Test',
        type: 'EXPENSE',
        categoryId: 'cat_123',
      };

      expect(() => CreateTransactionSchema.parse(invalidData)).toThrow(
        /O valor deve ser positivo/
      );
    });

    it('should reject zero amount', () => {
      const invalidData = {
        date: new Date(),
        amount: 0,
        description: 'Test',
        type: 'EXPENSE',
        categoryId: 'cat_123',
      };

      expect(() => CreateTransactionSchema.parse(invalidData)).toThrow(
        /O valor deve ser positivo/
      );
    });

    it('should reject empty description', () => {
      const invalidData = {
        date: new Date(),
        amount: 100,
        description: '',
        type: 'EXPENSE',
        categoryId: 'cat_123',
      };

      expect(() => CreateTransactionSchema.parse(invalidData)).toThrow(
        /Descrição muito curta/
      );
    });

    it('should reject invalid type', () => {
      const invalidData = {
        date: new Date(),
        amount: 100,
        description: 'Test',
        type: 'INVALID',
        categoryId: 'cat_123',
      };

      expect(() => CreateTransactionSchema.parse(invalidData)).toThrow(
        /Invalid option: expected one of/
      );
    });

    it('should accept future dates (scheduled/PENDING transactions)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Set to tomorrow
      const futureData = {
        date: futureDate,
        amount: 100,
        description: 'Test transaction',
        type: 'EXPENSE',
        categoryId: 'cat_123',
        accountId: 'acc_123',
      };

      expect(() => CreateTransactionSchema.parse(futureData)).not.toThrow();
    });

    describe('CreateTransactionSchema', () => {
      const mockDate = new Date('2025-01-01T10:00:00.000Z');

      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should accept optional fields', () => {
        const validData = {
          date: new Date(),
          amount: 100,
          description: 'Test',
          type: 'EXPENSE',
          categoryId: 'cat_123',
          accountId: 'acc_123',
          necessityLevel: 'NEEDS',
          valueAlignment: 'ALIGNED',
          notes: 'Some notes',
        };

        const result = CreateTransactionSchema.parse(validData);
        expect(result.necessityLevel).toBe('NEEDS');
        expect(result.valueAlignment).toBe('ALIGNED');
      });
    });
  });

  describe('UpdateTransactionSchema', () => {
    it('should allow partial updates', () => {
      const partialData = { amount: '150' };
      const result = UpdateTransactionSchema.parse(partialData);
      expect(result.amount).toBe(150);
    });

    it('should validate updated fields', () => {
      const invalidData = { amount: -100 };
      expect(() => UpdateTransactionSchema.parse(invalidData)).toThrow(
        /O valor deve ser positivo/
      );
    });

    it('should reject clearing accountId to null', () => {
      const invalidData = { accountId: null };
      expect(() => UpdateTransactionSchema.parse(invalidData)).toThrow();
    });

    it('should allow reassigning accountId to another account', () => {
      const result = UpdateTransactionSchema.parse({ accountId: 'acc_456' });
      expect(result.accountId).toBe('acc_456');
    });

    it('should allow omitting accountId entirely (leaves it unchanged)', () => {
      const result = UpdateTransactionSchema.parse({ amount: '150' });
      expect(result.accountId).toBeUndefined();
    });

    it('should still allow clearing toAccountId to null', () => {
      const result = UpdateTransactionSchema.parse({ toAccountId: null });
      expect(result.toAccountId).toBeNull();
    });
  });
});
