import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from './setup';
import { TransactionType } from '@/generated/prisma/client';

describe('Test Database Setup', () => {
  it('should have seeded categories', async () => {
    const categories = await prisma.category.findMany();
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should have expense, income, and saving categories', async () => {
    const expenseCategories = await prisma.category.findMany({
      where: { type: TransactionType.EXPENSE },
    });
    const incomeCategories = await prisma.category.findMany({
      where: { type: TransactionType.INCOME },
    });
    const savingCategories = await prisma.category.findMany({
      where: { type: TransactionType.SAVING },
    });

    expect(expenseCategories.length).toBeGreaterThan(0);
    expect(incomeCategories.length).toBeGreaterThan(0);
    expect(savingCategories.length).toBeGreaterThan(0);
  });

  describe('table truncation between tests', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a user for this test
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
        },
      });
      userId = user.id;
    });

    it('should create user in first test', async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Test User');
    });

    it('should have clean slate - previous test user should not exist', async () => {
      // After truncation, only the user created in beforeEach should exist
      const users = await prisma.user.findMany();
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(userId);
    });
  });
});
