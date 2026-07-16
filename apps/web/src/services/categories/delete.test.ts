import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { deleteCategory } from './delete';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn(), delete: vi.fn() },
    transaction: { count: vi.fn() },
    scheduledTransaction: { count: vi.fn() },
    purchaseConsideration: { count: vi.fn() },
  },
}));

describe('deleteCategory', () => {
  const mockCustom = {
    id: 'cat_1',
    name: 'Assinaturas',
    type: 'EXPENSE' as const,
    isSystemDefault: false,
    color: '#6B7280',
    icon: '📊',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.transaction.count).mockResolvedValue(0);
    vi.mocked(prisma.scheduledTransaction.count).mockResolvedValue(0);
    vi.mocked(prisma.purchaseConsideration.count).mockResolvedValue(0);
  });

  it('deletes a non-system category with no references', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCustom);

    await deleteCategory('cat_1');

    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 'cat_1' },
    });
  });

  it('throws when the category does not exist', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(deleteCategory('missing')).rejects.toThrow(
      'Category not found'
    );
  });

  it('throws when attempting to delete a system default category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCustom,
      isSystemDefault: true,
    });

    await expect(deleteCategory('cat_1')).rejects.toThrow(
      'Forbidden: system default categories cannot be modified'
    );
  });

  it.each([
    [
      'transaction',
      () => vi.mocked(prisma.transaction.count).mockResolvedValue(1),
    ],
    [
      'scheduledTransaction',
      () => vi.mocked(prisma.scheduledTransaction.count).mockResolvedValue(1),
    ],
    [
      'purchaseConsideration',
      () => vi.mocked(prisma.purchaseConsideration.count).mockResolvedValue(1),
    ],
  ])(
    'throws when the category is still referenced by a %s',
    async (_label, setup) => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCustom);
      setup();

      await expect(deleteCategory('cat_1')).rejects.toThrow(
        'Conflict: category is in use and cannot be deleted'
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    }
  );
});
