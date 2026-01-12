import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import {
  NecessityLevel,
  TransactionType,
  ValueAlignment,
} from '@/types/transaction';

// 1. Mocks
// Mock da Sessão (Autenticação)
vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn(),
}));

// Mock do Service (Regra de Negócio)
// Isso garante que estamos testando a ROTA, não o Banco de Dados agora
vi.mock('@/services/transactions', () => ({
  createTransaction: vi.fn(),
}));

// Importamos os mocks para poder manipulá-los nos testes
import { getUserId } from '@/lib/auth/session';
import { createTransaction } from '@/services/transactions';
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
  const createPostRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

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
    const json = await response.json();

    expect(response.status).toBe(400);
    // Verificamos se foi erro de validação e se veio do campo date
    expect(JSON.stringify(json)).toContain('VALIDATION_ERROR');
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
    const json = await response.json();

    expect(response.status).toBe(400);
    // Verificamos se foi erro de validação e se veio do campo amount
    expect(JSON.stringify(json)).toContain('VALIDATION_ERROR');
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
    const json = await response.json();

    expect(response.status).toBe(400);
    // Verificamos se foi erro de validação e se veio do campo date
    expect(JSON.stringify(json)).toContain('VALIDATION_ERROR');
    expect(JSON.stringify(json)).toContain('Date cannot be in the future');

    // GARANTIA: O Service NÃO deve ter sido chamado
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('deve retornar 201 e chamar o service com os dados corretos se o payload for válido', async () => {
    // Setup: Usuário logado
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    // Setup: Mock do retorno do service
    const mockTransactionCreated = { id: 'trans-1', amount: 100 };

    vi.mocked(createTransaction).mockResolvedValue(
      mockTransactionCreated as any
    ); // eslint-disable-line @typescript-eslint/no-explicit-any

    const req = createPostRequest(validPayload);
    const response = await POST(req);
    const json = await response.json();

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
