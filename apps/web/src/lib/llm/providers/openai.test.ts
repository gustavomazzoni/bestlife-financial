import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  ScheduleFrequency,
} from '@/types';
import { OpenAIProvider } from './openai';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  // Must be a regular function, not an arrow function — arrow functions
  // can't be used as constructors, and OpenAIProvider calls `new OpenAI()`.
  default: vi.fn().mockImplementation(function MockOpenAI() {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

const mockCategories = [
  { id: 'cat-food', name: 'Food', type: TransactionType.EXPENSE },
  { id: 'cat-salary', name: 'Salary', type: TransactionType.INCOME },
];

const mockAccounts = [{ id: 'acc-itau', name: 'Itaú' }];

function mockOpenAIResponse(content: object) {
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(content) } }],
  });
}

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps a well-formed response to InferTransactionResult', async () => {
    mockOpenAIResponse({
      amount: 25,
      description: 'Café na padaria',
      date: '2026-06-25',
      type: 'EXPENSE',
      categoryId: 'cat-food',
      necessityLevel: 'NEEDS',
      valueAlignment: 'DEFAULT',
      accountId: 'acc-itau',
      isRecurring: false,
      frequency: null,
      confidence: 0.95,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction(
      'Café na padaria R$ 25',
      mockCategories,
      mockAccounts
    );

    expect(result.inferred.amount).toBe(25);
    expect(result.inferred.description).toBe('Café na padaria');
    expect(result.inferred.type).toBe(TransactionType.EXPENSE);
    expect(result.inferred.category).toEqual({ id: 'cat-food', name: 'Food' });
    expect(result.inferred.necessityLevel).toBe(NecessityLevel.NEEDS);
    expect(result.inferred.valueAlignment).toBe(ValueAlignment.DEFAULT);
    expect(result.inferred.accountId).toBe('acc-itau');
    expect(result.inferred.date.getFullYear()).toBe(2026);
    expect(result.inferred.date.getMonth()).toBe(5); // June
    expect(result.inferred.date.getDate()).toBe(25);
    expect(result.confidence).toBe(0.95);
    expect(result.rawInput).toBe('Café na padaria R$ 25');
  });

  it("passes today's date, categories, and accounts in the system prompt", async () => {
    mockOpenAIResponse({
      amount: null,
      description: '',
      date: '2026-06-25',
      type: 'EXPENSE',
      categoryId: null,
      necessityLevel: null,
      valueAlignment: null,
      accountId: null,
      isRecurring: false,
      frequency: null,
      confidence: 0.1,
    });

    const provider = new OpenAIProvider('test-key');
    await provider.inferTransaction('algo', mockCategories, mockAccounts);

    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('gpt-4o-mini');
    expect(call.response_format).toEqual({ type: 'json_object' });
    const systemMessage = call.messages[0].content as string;
    expect(systemMessage).toContain('cat-food');
    expect(systemMessage).toContain('Food');
    expect(systemMessage).toContain('acc-itau');
    expect(systemMessage).toContain('Itaú');
  });

  it('returns amount: null when the response omits it', async () => {
    mockOpenAIResponse({
      amount: null,
      description: 'Algo',
      date: '2026-06-25',
      type: 'EXPENSE',
      categoryId: null,
      necessityLevel: null,
      valueAlignment: null,
      accountId: null,
      isRecurring: false,
      frequency: null,
      confidence: 0.2,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction('algo', mockCategories, []);
    expect(result.inferred.amount).toBeNull();
  });

  it('maps isRecurring/frequency from the response', async () => {
    mockOpenAIResponse({
      amount: 120,
      description: 'Conta de luz',
      date: '2026-06-28',
      type: 'EXPENSE',
      categoryId: null,
      necessityLevel: 'IMPORTANT',
      valueAlignment: 'ALIGNED',
      accountId: null,
      isRecurring: true,
      frequency: 'MONTHLY',
      confidence: 0.9,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction(
      'Pagar 120 de luz, vence dia 28 todo mês',
      mockCategories,
      []
    );

    expect(result.inferred.isRecurring).toBe(true);
    expect(result.inferred.frequency).toBe(ScheduleFrequency.MONTHLY);
  });

  it('falls back to null category when categoryId does not match any known category', async () => {
    mockOpenAIResponse({
      amount: 10,
      description: 'Algo',
      date: '2026-06-25',
      type: 'EXPENSE',
      categoryId: 'cat-unknown',
      necessityLevel: null,
      valueAlignment: null,
      accountId: null,
      isRecurring: false,
      frequency: null,
      confidence: 0.5,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction('algo', mockCategories, []);
    expect(result.inferred.category).toBeNull();
  });

  it('defaults an invalid type/enum value to safe fallbacks instead of throwing', async () => {
    mockOpenAIResponse({
      amount: 10,
      description: 'Algo',
      date: '2026-06-25',
      type: 'NOT_A_REAL_TYPE',
      categoryId: null,
      necessityLevel: 'NOT_REAL',
      valueAlignment: 'NOT_REAL',
      accountId: null,
      isRecurring: false,
      frequency: 'NOT_REAL',
      confidence: 0.5,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction('algo', mockCategories, []);
    expect(result.inferred.type).toBe(TransactionType.EXPENSE);
    expect(result.inferred.necessityLevel).toBeNull();
    expect(result.inferred.valueAlignment).toBeNull();
    expect(result.inferred.frequency).toBeNull();
  });

  it('clamps out-of-range confidence into [0, 1]', async () => {
    mockOpenAIResponse({
      amount: 10,
      description: 'Algo',
      date: '2026-06-25',
      type: 'EXPENSE',
      categoryId: null,
      necessityLevel: null,
      valueAlignment: null,
      accountId: null,
      isRecurring: false,
      frequency: null,
      confidence: 1.5,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction('algo', mockCategories, []);
    expect(result.confidence).toBe(1);
  });

  it('defaults confidence to 0.5 when missing/non-numeric', async () => {
    mockOpenAIResponse({
      amount: 10,
      description: 'Algo',
      date: '2026-06-25',
      type: 'EXPENSE',
      categoryId: null,
      necessityLevel: null,
      valueAlignment: null,
      accountId: null,
      isRecurring: false,
      frequency: null,
      confidence: 'high',
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction('algo', mockCategories, []);
    expect(result.confidence).toBe(0.5);
  });

  it('falls back to today when the date is missing or malformed', async () => {
    mockOpenAIResponse({
      amount: 10,
      description: 'Algo',
      date: 'not-a-date',
      type: 'EXPENSE',
      categoryId: null,
      necessityLevel: null,
      valueAlignment: null,
      accountId: null,
      isRecurring: false,
      frequency: null,
      confidence: 0.5,
    });

    const provider = new OpenAIProvider('test-key');
    const result = await provider.inferTransaction('algo', mockCategories, []);
    const today = new Date();
    expect(result.inferred.date.toDateString()).toBe(today.toDateString());
  });

  it('throws when the API call rejects', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'));

    const provider = new OpenAIProvider('test-key');
    await expect(
      provider.inferTransaction('algo', mockCategories, [])
    ).rejects.toThrow('Network error');
  });

  it('throws when the response has no content', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: {} }] });

    const provider = new OpenAIProvider('test-key');
    await expect(
      provider.inferTransaction('algo', mockCategories, [])
    ).rejects.toThrow('OpenAI returned an empty response');
  });
});
