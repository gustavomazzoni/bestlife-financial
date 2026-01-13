import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST, GET } from './route';
import {
  NecessityLevel,
  TransactionType,
  ValueAlignment,
} from '@/types/transaction';
import {
  createMockRequest,
  createMockPostRequest,
  parseResponse,
} from '@tests-helpers/api';

// 1. Mocks
// Mock da Sessão (Autenticação)
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

// Mock do Service (Regra de Negócio)
// Isso garante que estamos testando a ROTA, não o Banco de Dados agora
vi.mock('@/services/transactions', () => ({
  createTransaction: vi.fn(),
  listTransactions: vi.fn(),
}));

// Importamos os mocks para poder manipulá-los nos testes
import { getUserId } from '@/lib/auth/session';
import { createTransaction, listTransactions } from '@/services/transactions';
import { UnauthorizedError } from '@/lib/api/response';

describe('API v1 - Transactions POST', () => {
  const mockUserId = 'user-123';

  const validPayload = {
    description: 'Compra de Mercado',
    amount: 150.5,
    date: '2024-01-15T10:00:00Z', // String ISO
    type: TransactionType.EXPENSE,
    categoryId: '123_food',
    necessityLevel: NecessityLevel.NEEDS,
    valueAlignment: ValueAlignment.ALIGNED,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper para criar requisições POST
  const createPostRequest = (body: unknown) =>
    createMockPostRequest('/api/v1/transactions', body);

  it('deve retornar 401 se o usuário não estiver autenticado', async () => {
    // Setup: getUserId lança erro (comportamento padrão quando sem sessão)
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());

    const req = createPostRequest({ some: 'data' });
    const response = await POST(req);

    expect(response.status).toBe(401); // Ou o status que seu apiError retorna
  });

  it('deve retornar 400 (Bad Request) se o payload for inválido', async () => {
    // Setup: Usuário logado
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    // Cenário: Data Inválida (Regra Estática do Zod)
    const invalidPayload = { ...validPayload, date: '123' };

    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    // Verificamos se foi erro de validação e se veio do campo date
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(json)).toContain(
      'Date must be on or after January 1, 2023'
    );

    // GARANTIA: O Service NÃO deve ter sido chamado
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('should throw error for negative amount', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    // Cenário: Valor Negativo (Regra Estática do Zod)
    const invalidPayload = { ...validPayload, amount: -100 };
    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    // Verificamos se foi erro de validação e se veio do campo amount
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(json)).toContain('O valor deve ser positivo');

    // GARANTIA: O Service NÃO deve ter sido chamado
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('should throw error for future date', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    // Cenário: Data no Futuro (Regra Estática do Zod)
    const invalidPayload = { ...validPayload, date: '2030-01-15T10:00:00Z' };

    const req = createPostRequest(invalidPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(400);
    // Verificamos se foi erro de validação e se veio do campo date
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(json)).toContain('Date cannot be in the future');

    // GARANTIA: O Service NÃO deve ter sido chamado
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('deve retornar 201 e chamar o service com os dados corretos se o payload for válido', async () => {
    // Setup: Usuário logado
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    // Setup: Mock do retorno do service
    const mockTransactionCreated = { id: 'trans-1', amount: 100 };

    vi.mocked(createTransaction as Mock).mockResolvedValue(
      mockTransactionCreated
    );

    const req = createPostRequest(validPayload);
    const response = await POST(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockTransactionCreated);

    // GARANTIA: O Service foi chamado com os dados convertidos (Data string -> Date object)
    expect(createTransaction).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        amount: 150.5,
        description: 'Compra de Mercado',
        // O Zod coerce.date() deve ter transformado a string em Date
        date: expect.any(Date),
        type: TransactionType.EXPENSE,
      })
    );
  });
});

describe('API v1 - Transactions GET (List)', () => {
  const mockUserId = 'user-123';

  it('deve aplicar paginação e filtros corretamente e retornar formatado', async () => {
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    const mockServiceResponse = {
      data: [{ id: '1', amount: 100 }],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    };
    vi.mocked(listTransactions as Mock).mockResolvedValue(mockServiceResponse);

    const req = createMockRequest(
      'api/v1/transactions?page=2&limit=5&type=INCOME'
    );
    const response = await GET(req);
    const json = await parseResponse(response);

    expect(response.status).toBe(200);
    // Verifica se os metadados de resposta seguem o padrão apiResponse
    expect(json.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    // Garante que o service recebeu os tipos convertidos (string -> number/enum)
    expect(listTransactions).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        page: 2,
        limit: 5,
        type: 'INCOME',
      })
    );
  });
});
