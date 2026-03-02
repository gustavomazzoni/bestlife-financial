import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { getUserId } from '@/lib/auth/session';
import {
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions';
import {
  createMockRequest,
  createMockPatchRequest,
  createMockDeleteRequest,
  parseResponse,
} from '@tests-helpers/api';
import { UnauthorizedError } from '@/lib/api/response';

vi.mock('@/lib/auth/session', () => ({ getUserId: vi.fn() }));
vi.mock('@/services/transactions', () => ({
  getTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

describe('API v1 - Transactions [id] Operations', () => {
  const mockUserId = 'user-123';
  const transactionId = 'uuid-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('deve retornar 404 se a transação não existir', async () => {
      vi.mocked(getTransaction as Mock).mockRejectedValue(
        new Error('Transaction not found')
      );

      const response = await GET(
        createMockRequest('/api/v1/transactions/:id'),
        { params: Promise.resolve({ id: transactionId }) }
      );
      expect(response.status).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

      const response = await GET(
        createMockRequest('/api/v1/transactions/:id'),
        { params: Promise.resolve({ id: transactionId }) }
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 200 se a transação for encontrada', async () => {
      vi.mocked(getTransaction as Mock).mockResolvedValue({
        id: transactionId,
        userId: mockUserId,
      });

      const response = await GET(
        createMockRequest('/api/v1/transactions/:id'),
        { params: Promise.resolve({ id: transactionId }) }
      );
      expect(response.status).toBe(200);
      expect(getTransaction).toHaveBeenCalledWith(mockUserId, transactionId);

      const json = await parseResponse(response);
      expect(json.data.id).toBe(transactionId);
    });
  });

  describe('PATCH /api/v1/transactions/:id', () => {
    it('deve validar erro de validação antes do service', async () => {
      const req = createMockPatchRequest(
        '/api/v1/transactions/:id',
        { amount: -50 } // Inválido
      );
      const response = await PATCH(req, {
        params: Promise.resolve({ id: transactionId }),
      });
      const json = await parseResponse(response);
      expect(response.status).toBe(400);
      expect(updateTransaction).not.toHaveBeenCalled();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve chamar o update com sucesso', async () => {
      const updateData = { description: 'Updated Name' };
      vi.mocked(updateTransaction as Mock).mockResolvedValue({
        id: transactionId,
        ...updateData,
      });

      const req = createMockPatchRequest(
        '/api/v1/transactions/:id',
        updateData
      );

      const response = await PATCH(req, {
        params: Promise.resolve({ id: transactionId }),
      });
      const json = await parseResponse(response);
      expect(response.status).toBe(200);
      expect(updateTransaction).toHaveBeenCalledWith(
        mockUserId,
        transactionId,
        updateData
      );
      expect(json.data.id).toBe(transactionId);
      expect(json.data.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('deve retornar 404 se a transação não existir', async () => {
      vi.mocked(deleteTransaction).mockRejectedValue(
        new Error('Transaction not found')
      );

      const response = await DELETE(
        createMockDeleteRequest('/api/v1/transactions/:id'),
        { params: Promise.resolve({ id: transactionId }) }
      );
      expect(response.status).toBe(404);
    });

    it('deve retornar 204 após deletar com sucesso', async () => {
      vi.mocked(deleteTransaction).mockResolvedValue();

      const response = await DELETE(
        createMockDeleteRequest('/api/v1/transactions/:id'),
        { params: Promise.resolve({ id: transactionId }) }
      );
      expect(response.status).toBe(204);
      expect(deleteTransaction).toHaveBeenCalledWith(mockUserId, transactionId);
    });
  });
});
