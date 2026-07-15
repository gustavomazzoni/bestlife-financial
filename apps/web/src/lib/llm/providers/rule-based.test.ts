import { describe, it, expect } from 'vitest';
import { RuleBasedProvider } from './rule-based';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  ScheduleFrequency,
} from '@/types';

const mockCategories = [
  // Expense categories
  { id: 'cat-food', name: 'Food', type: TransactionType.EXPENSE },
  { id: 'cat-transport', name: 'Transport', type: TransactionType.EXPENSE },
  { id: 'cat-health', name: 'Health', type: TransactionType.EXPENSE },
  {
    id: 'cat-entertainment',
    name: 'Entertainment',
    type: TransactionType.EXPENSE,
  },
  { id: 'cat-education', name: 'Education', type: TransactionType.EXPENSE },
  { id: 'cat-housing', name: 'Housing', type: TransactionType.EXPENSE },
  { id: 'cat-bills', name: 'Bills', type: TransactionType.EXPENSE },
  { id: 'cat-shopping', name: 'Shopping', type: TransactionType.EXPENSE },
  { id: 'cat-travel', name: 'Travel', type: TransactionType.EXPENSE },
  { id: 'cat-personal', name: 'Personal', type: TransactionType.EXPENSE },
  {
    id: 'cat-other-expense',
    name: 'Other Expense',
    type: TransactionType.EXPENSE,
  },
  // Income categories
  { id: 'cat-salary', name: 'Salary', type: TransactionType.INCOME },
  { id: 'cat-freelance', name: 'Freelance', type: TransactionType.INCOME },
  { id: 'cat-passive', name: 'Passive Income', type: TransactionType.INCOME },
  {
    id: 'cat-investments-income',
    name: 'Investments',
    type: TransactionType.INCOME,
  },
  {
    id: 'cat-other-income',
    name: 'Other Income',
    type: TransactionType.INCOME,
  },
  // Saving categories
  { id: 'cat-emergency', name: 'Emergency Fund', type: TransactionType.SAVING },
  {
    id: 'cat-investments-saving',
    name: 'Investments',
    type: TransactionType.SAVING,
  },
  { id: 'cat-retirement', name: 'Retirement', type: TransactionType.SAVING },
  {
    id: 'cat-other-saving',
    name: 'Other Saving',
    type: TransactionType.SAVING,
  },
];

const mockAccounts = [
  { id: 'acc-nubank', name: 'Nubank' },
  { id: 'acc-itau', name: 'Itaú' },
  { id: 'acc-carteira', name: 'Carteira' },
];

const provider = new RuleBasedProvider();

async function infer(text: string) {
  return provider.inferTransaction(text, mockCategories, mockAccounts);
}

describe('RuleBasedProvider', () => {
  describe('Amount Parsing', () => {
    it('should parse amount with R$ prefix', async () => {
      const result = await infer('Comprei café R$ 25');
      expect(result.inferred.amount).toBe(25);
    });

    it('should parse amount with R$ prefix and cents', async () => {
      const result = await infer('Almoço R$ 45,90');
      expect(result.inferred.amount).toBe(45.9);
    });

    it('should parse amount with "reais" suffix', async () => {
      const result = await infer('Comprei pão 15 reais');
      expect(result.inferred.amount).toBe(15);
    });

    it('should parse amount with "reais" suffix and cents', async () => {
      const result = await infer('Café 12,50 reais');
      expect(result.inferred.amount).toBe(12.5);
    });

    it('should parse amount with dot as decimal separator', async () => {
      const result = await infer('Uber R$ 23.50');
      expect(result.inferred.amount).toBe(23.5);
    });

    it('should parse amount with thousand separator', async () => {
      const result = await infer('Aluguel R$ 2.500,00');
      expect(result.inferred.amount).toBe(2500);
    });

    it('should parse standalone number as amount', async () => {
      const result = await infer('Comprei café 25');
      expect(result.inferred.amount).toBe(25);
    });

    it('should return null amount when no number found', async () => {
      const result = await infer('Comprei café');
      expect(result.inferred.amount).toBeNull();
    });

    it('should parse large amounts correctly', async () => {
      const result = await infer('Recebi salário R$ 8.500,00');
      expect(result.inferred.amount).toBe(8500);
    });

    it('should not mistake a "dia N" due-date for the amount', async () => {
      const result = await infer('Pagar 120 de luz, vence dia 28 todo mês');
      expect(result.inferred.amount).toBe(120);
      expect(result.inferred.date.getDate()).toBe(28);
    });
  });

  describe('Transaction Type Detection', () => {
    it('should detect EXPENSE for purchase keywords (comprei, paguei)', async () => {
      const result = await infer('Comprei café R$ 25');
      expect(result.inferred.type).toBe(TransactionType.EXPENSE);
    });

    it('should detect EXPENSE for "gastei"', async () => {
      const result = await infer('Gastei 100 reais no mercado');
      expect(result.inferred.type).toBe(TransactionType.EXPENSE);
    });

    it('should detect INCOME for "recebi"', async () => {
      const result = await infer('Recebi salário 5000');
      expect(result.inferred.type).toBe(TransactionType.INCOME);
    });

    it('should detect INCOME for "ganhei"', async () => {
      const result = await infer('Ganhei 500 reais de freelance');
      expect(result.inferred.type).toBe(TransactionType.INCOME);
    });

    it('should detect INCOME for salary-related words', async () => {
      const result = await infer('Salário do mês R$ 8500');
      expect(result.inferred.type).toBe(TransactionType.INCOME);
    });

    it('should detect SAVING for "guardei"', async () => {
      const result = await infer('Guardei 1000 reais na poupança');
      expect(result.inferred.type).toBe(TransactionType.SAVING);
    });

    it('should detect SAVING for "investi"', async () => {
      const result = await infer('Investi R$ 500 em ações');
      expect(result.inferred.type).toBe(TransactionType.SAVING);
    });

    it('should detect SAVING for "poupar/poupança" keywords', async () => {
      const result = await infer('Coloquei 200 na poupança');
      expect(result.inferred.type).toBe(TransactionType.SAVING);
    });

    it('should default to EXPENSE when type is ambiguous', async () => {
      const result = await infer('Café 25 reais');
      expect(result.inferred.type).toBe(TransactionType.EXPENSE);
    });
  });

  describe('Category Detection - Portuguese Keywords', () => {
    it('should detect Food category for food-related words', async () => {
      const result = await infer('Comprei café e pão na padaria R$ 25');
      expect(result.inferred.category?.name).toBe('Food');
    });

    it('should detect Food for restaurant keywords', async () => {
      const result = await infer('Almoço no restaurante 45 reais');
      expect(result.inferred.category?.name).toBe('Food');
    });

    it('should detect Food for supermarket keywords', async () => {
      const result = await infer('Mercado semanal R$ 350');
      expect(result.inferred.category?.name).toBe('Food');
    });

    it('should detect Transport for uber/taxi/bus keywords', async () => {
      const result = await infer('Uber para o trabalho R$ 23');
      expect(result.inferred.category?.name).toBe('Transport');
    });

    it('should detect Transport for gas/fuel keywords', async () => {
      const result = await infer('Gasolina R$ 200');
      expect(result.inferred.category?.name).toBe('Transport');
    });

    it('should detect Health for pharmacy/medicine keywords', async () => {
      const result = await infer('Remédio na farmácia 85 reais');
      expect(result.inferred.category?.name).toBe('Health');
    });

    it('should detect Health for doctor/hospital keywords', async () => {
      const result = await infer('Consulta médica R$ 250');
      expect(result.inferred.category?.name).toBe('Health');
    });

    it('should detect Entertainment for cinema/movie keywords', async () => {
      const result = await infer('Cinema com a família R$ 120');
      expect(result.inferred.category?.name).toBe('Entertainment');
    });

    it('should detect Entertainment for streaming keywords', async () => {
      const result = await infer('Netflix mensal 55 reais');
      expect(result.inferred.category?.name).toBe('Entertainment');
    });

    it('should detect Education for course/book keywords', async () => {
      const result = await infer('Curso de inglês R$ 300');
      expect(result.inferred.category?.name).toBe('Education');
    });

    it('should detect Housing for rent keywords', async () => {
      const result = await infer('Aluguel do apartamento R$ 2500');
      expect(result.inferred.category?.name).toBe('Housing');
    });

    it('should detect Bills for utility keywords', async () => {
      const result = await infer('Conta de luz R$ 180');
      expect(result.inferred.category?.name).toBe('Bills');
    });

    it('should detect Bills for internet keywords', async () => {
      const result = await infer('Internet mensal 120 reais');
      expect(result.inferred.category?.name).toBe('Bills');
    });

    it('should detect Shopping for clothing keywords', async () => {
      const result = await infer('Comprei roupa nova R$ 200');
      expect(result.inferred.category?.name).toBe('Shopping');
    });

    it('should detect Travel for travel-related keywords', async () => {
      const result = await infer('Passagem de avião R$ 800');
      expect(result.inferred.category?.name).toBe('Travel');
    });

    it('should detect Salary category for income', async () => {
      const result = await infer('Recebi salário R$ 8500');
      expect(result.inferred.category?.name).toBe('Salary');
    });

    it('should detect Freelance category for freelance income', async () => {
      const result = await infer('Recebi do cliente freelance R$ 2000');
      expect(result.inferred.category?.name).toBe('Freelance');
    });

    it('should detect Emergency Fund for saving to emergency', async () => {
      const result = await infer('Guardei na reserva de emergência R$ 500');
      expect(result.inferred.category?.name).toBe('Emergency Fund');
    });

    it('should fallback to Other Expense when category unclear', async () => {
      const result = await infer('Comprei algo 50 reais');
      expect(result.inferred.category?.name).toBe('Other Expense');
    });
  });

  describe('Necessity Level Inference', () => {
    it('should infer IMPORTANT for housing expenses', async () => {
      const result = await infer('Aluguel R$ 2500');
      expect(result.inferred.necessityLevel).toBe(NecessityLevel.IMPORTANT);
    });

    it('should infer NEEDS for food/groceries', async () => {
      const result = await infer('Mercado semanal R$ 350');
      expect(result.inferred.necessityLevel).toBe(NecessityLevel.NEEDS);
    });

    it('should infer WANTS for entertainment', async () => {
      const result = await infer('Cinema R$ 50');
      expect(result.inferred.necessityLevel).toBe(NecessityLevel.WANTS);
    });

    it('should infer WANTS for shopping/clothing', async () => {
      const result = await infer('Roupa nova R$ 200');
      expect(result.inferred.necessityLevel).toBe(NecessityLevel.WANTS);
    });

    it('should infer IMPORTANT for health expenses', async () => {
      const result = await infer('Remédio R$ 100');
      expect(result.inferred.necessityLevel).toBe(NecessityLevel.IMPORTANT);
    });

    it('should infer IMPORTANT for income', async () => {
      const result = await infer('Recebi salário R$ 8500');
      expect(result.inferred.necessityLevel).toBe(NecessityLevel.IMPORTANT);
    });
  });

  describe('Value Alignment Inference', () => {
    it('should infer FREEDOM_ENABLING for income', async () => {
      const result = await infer('Recebi salário R$ 8500');
      expect(result.inferred.valueAlignment).toBe(
        ValueAlignment.FREEDOM_ENABLING
      );
    });

    it('should infer FREEDOM_ENABLING for savings', async () => {
      const result = await infer('Investi R$ 1000');
      expect(result.inferred.valueAlignment).toBe(
        ValueAlignment.FREEDOM_ENABLING
      );
    });

    it('should infer ALIGNED for essential expenses', async () => {
      const result = await infer('Aluguel R$ 2500');
      expect(result.inferred.valueAlignment).toBe(ValueAlignment.ALIGNED);
    });

    it('should infer DEFAULT for regular expenses', async () => {
      const result = await infer('Mercado R$ 350');
      expect(result.inferred.valueAlignment).toBe(ValueAlignment.DEFAULT);
    });

    it('should infer EXPERIENCE for entertainment/travel', async () => {
      const result = await infer('Cinema R$ 50');
      expect(result.inferred.valueAlignment).toBe(ValueAlignment.EXPERIENCE);
    });

    it('should infer MATERIAL for shopping', async () => {
      const result = await infer('Comprei roupa R$ 200');
      expect(result.inferred.valueAlignment).toBe(ValueAlignment.MATERIAL);
    });
  });

  describe('Date Parsing', () => {
    it('should default to today when no date mentioned', async () => {
      const result = await infer('Café R$ 10');
      const today = new Date();
      expect(result.inferred.date.toDateString()).toBe(today.toDateString());
    });

    it('should parse "hoje" as today', async () => {
      const result = await infer('Comprei café hoje R$ 10');
      const today = new Date();
      expect(result.inferred.date.toDateString()).toBe(today.toDateString());
    });

    it('should parse "ontem" as yesterday', async () => {
      const result = await infer('Ontem gastei 50 reais no mercado');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(result.inferred.date.toDateString()).toBe(
        yesterday.toDateString()
      );
    });

    it('should parse "anteontem" as day before yesterday', async () => {
      const result = await infer('Anteontem comprei R$ 30');
      const dayBeforeYesterday = new Date();
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
      expect(result.inferred.date.toDateString()).toBe(
        dayBeforeYesterday.toDateString()
      );
    });

    it('should parse "amanhã" as tomorrow', async () => {
      const result = await infer('Pagar 120 de luz amanhã');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.inferred.date.toDateString()).toBe(tomorrow.toDateString());
    });

    it('should parse date in DD/MM format', async () => {
      const result = await infer('Comprei café 15/01 R$ 10');
      expect(result.inferred.date.getDate()).toBe(15);
      expect(result.inferred.date.getMonth()).toBe(0); // January
    });

    it('should parse date in DD/MM/YYYY format', async () => {
      const result = await infer('Comprei café 15/01/2025 R$ 10');
      expect(result.inferred.date.getDate()).toBe(15);
      expect(result.inferred.date.getMonth()).toBe(0);
      expect(result.inferred.date.getFullYear()).toBe(2025);
    });

    it('should parse "dia N" as that day of the current month', async () => {
      const result = await infer('Pagar 120 de luz, vence dia 1');
      expect(result.inferred.date.getDate()).toBe(1);
    });
  });

  describe('Description Generation', () => {
    it('should generate clean description from input', async () => {
      const result = await infer('Comprei café e pão na padaria R$ 25');
      expect(result.inferred.description).toBe('Café e pão na padaria');
    });

    it('should capitalize first letter of description', async () => {
      const result = await infer('almoço no restaurante 45 reais');
      expect(result.inferred.description.charAt(0)).toBe(
        result.inferred.description.charAt(0).toUpperCase()
      );
    });

    it('should remove amount from description', async () => {
      const result = await infer('Uber R$ 23,50');
      expect(result.inferred.description).not.toContain('23');
      expect(result.inferred.description).not.toContain('R$');
    });
  });

  describe('Confidence Score', () => {
    it('should return high confidence when all fields detected', async () => {
      const result = await infer('Comprei café na padaria R$ 25');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should return lower confidence when amount missing', async () => {
      const result = await infer('Comprei café na padaria');
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should return lower confidence for ambiguous input', async () => {
      const result = await infer('algo 50');
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should return confidence between 0 and 1', async () => {
      const result = await infer('Café R$ 10');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Account Detection', () => {
    it('should match an account mentioned by name', async () => {
      const result = await infer('Almoço no Itaú R$ 45');
      expect(result.inferred.accountId).toBe('acc-itau');
    });

    it('should match "carteira" (cash wallet)', async () => {
      const result = await infer('Comprei pão na carteira 15 reais');
      expect(result.inferred.accountId).toBe('acc-carteira');
    });

    it('should return null when no account is mentioned', async () => {
      const result = await infer('Café R$ 10');
      expect(result.inferred.accountId).toBeNull();
    });

    it('should return null when there are no accounts to match against', async () => {
      const result = await provider.inferTransaction(
        'Almoço no Itaú R$ 45',
        mockCategories,
        []
      );
      expect(result.inferred.accountId).toBeNull();
    });
  });

  describe('Recurrence Detection', () => {
    it('should detect MONTHLY for "todo mês"', async () => {
      const result = await infer('Pagar 120 de luz, vence dia 28 todo mês');
      expect(result.inferred.isRecurring).toBe(true);
      expect(result.inferred.frequency).toBe(ScheduleFrequency.MONTHLY);
    });

    it('should detect WEEKLY for "toda semana"', async () => {
      const result = await infer('Feira toda semana R$ 80');
      expect(result.inferred.isRecurring).toBe(true);
      expect(result.inferred.frequency).toBe(ScheduleFrequency.WEEKLY);
    });

    it('should detect YEARLY for "todo ano"', async () => {
      const result = await infer('IPTU todo ano R$ 1200');
      expect(result.inferred.isRecurring).toBe(true);
      expect(result.inferred.frequency).toBe(ScheduleFrequency.YEARLY);
    });

    it('should default generic "recorrente" to MONTHLY', async () => {
      const result = await infer('Assinatura recorrente R$ 30');
      expect(result.inferred.isRecurring).toBe(true);
      expect(result.inferred.frequency).toBe(ScheduleFrequency.MONTHLY);
    });

    it('should not mark a one-off transaction as recurring', async () => {
      const result = await infer('Café R$ 10');
      expect(result.inferred.isRecurring).toBe(false);
      expect(result.inferred.frequency).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', async () => {
      const result = await infer('');
      expect(result.inferred.amount).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle string with only spaces', async () => {
      const result = await infer('   ');
      expect(result.inferred.amount).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle very long input', async () => {
      const longText =
        'Comprei café e pão e leite e queijo e presunto e manteiga na padaria perto de casa R$ 150';
      const result = await infer(longText);
      expect(result.inferred.amount).toBe(150);
      expect(result.inferred.category?.name).toBe('Food');
    });

    it('should handle input with special characters', async () => {
      const result = await infer('Café ☕ R$ 10,00');
      expect(result.inferred.amount).toBe(10);
    });

    it('should handle mixed case input', async () => {
      const result = await infer('COMPREI CAFÉ R$ 25');
      expect(result.inferred.type).toBe(TransactionType.EXPENSE);
      expect(result.inferred.amount).toBe(25);
    });
  });

  describe('English Support (Basic)', () => {
    it('should parse English amount format', async () => {
      const result = await infer('Bought coffee R$ 25');
      expect(result.inferred.amount).toBe(25);
    });

    it('should detect expense for "bought"', async () => {
      const result = await infer('Bought groceries R$ 200');
      expect(result.inferred.type).toBe(TransactionType.EXPENSE);
    });

    it('should detect income for "received"', async () => {
      const result = await infer('Received salary R$ 5000');
      expect(result.inferred.type).toBe(TransactionType.INCOME);
    });

    it('should detect food category for English keywords', async () => {
      const result = await infer('Lunch at restaurant R$ 45');
      expect(result.inferred.category?.name).toBe('Food');
    });
  });
});
