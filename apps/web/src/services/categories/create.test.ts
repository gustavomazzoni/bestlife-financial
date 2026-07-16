import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { createCategory } from './create';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

describe('createCategory', () => {
  const mockCreated = {
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
  });

  it('creates a non-system category', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.category.create).mockResolvedValue(mockCreated);

    const result = await createCategory({
      name: 'Assinaturas',
      type: 'EXPENSE',
    });

    expect(result.isSystemDefault).toBe(false);
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Assinaturas',
          type: 'EXPENSE',
          isSystemDefault: false,
        }),
      })
    );
  });

  it('throws when a category with the same name and type already exists', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCreated);

    await expect(
      createCategory({ name: 'Assinaturas', type: 'EXPENSE' })
    ).rejects.toThrow(
      'Conflict: a category with this name and type already exists'
    );
  });
});
