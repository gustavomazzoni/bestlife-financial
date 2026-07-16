import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { updateCategory } from './update';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}));

describe('updateCategory', () => {
  const mockCustom = {
    id: 'cat_1',
    name: 'Assinaturas',
    type: 'EXPENSE' as const,
    isSystemDefault: false,
    color: '#6B7280',
    icon: '📊',
    createdAt: new Date(),
  };

  const mockSystem = { ...mockCustom, id: 'cat_sys', isSystemDefault: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a non-system category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCustom);
    vi.mocked(prisma.category.update).mockResolvedValue({
      ...mockCustom,
      name: 'Streaming',
    });

    const result = await updateCategory('cat_1', { name: 'Streaming' });

    expect(result.name).toBe('Streaming');
  });

  it('throws when the category does not exist', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(updateCategory('missing', { name: 'X' })).rejects.toThrow(
      'Category not found'
    );
  });

  it('throws when attempting to modify a system default category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockSystem);

    await expect(updateCategory('cat_sys', { name: 'X' })).rejects.toThrow(
      'Forbidden: system default categories cannot be modified'
    );
  });

  it('throws when renaming to a name that already exists for the same type', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCustom);
    vi.mocked(prisma.category.findFirst).mockResolvedValue({
      ...mockCustom,
      id: 'cat_other',
      name: 'Streaming',
    });

    await expect(
      updateCategory('cat_1', { name: 'Streaming' })
    ).rejects.toThrow(
      'Conflict: a category with this name and type already exists'
    );
  });

  it('allows updating color/icon without touching name', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCustom);
    vi.mocked(prisma.category.update).mockResolvedValue({
      ...mockCustom,
      color: '#FF0000',
    });

    const result = await updateCategory('cat_1', { color: '#FF0000' });

    expect(result.color).toBe('#FF0000');
    expect(prisma.category.findFirst).not.toHaveBeenCalled();
  });
});
