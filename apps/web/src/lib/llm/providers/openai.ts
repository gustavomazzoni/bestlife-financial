import OpenAI from 'openai';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  ScheduleFrequency,
  InferTransactionResult,
} from '@/types';
import { LLMInferenceProvider, DBCategory, DBAccount } from '../types';

interface OpenAIInferenceResponse {
  amount: number | null;
  description: string;
  date: string; // YYYY-MM-DD
  type: 'EXPENSE' | 'INCOME' | 'SAVING' | 'TRANSFER';
  categoryId: string | null;
  necessityLevel: 'IMPORTANT' | 'NEEDS' | 'WANTS' | null;
  valueAlignment:
    | 'ALIGNED'
    | 'DEFAULT'
    | 'EXPERIENCE'
    | 'MATERIAL'
    | 'FREEDOM_ENABLING'
    | 'FREEDOM_LIMITING'
    | null;
  accountId: string | null;
  isRecurring: boolean;
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  confidence: number;
}

export class OpenAIProvider implements LLMInferenceProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async inferTransaction(
    text: string,
    categories: DBCategory[],
    accounts: DBAccount[]
  ): Promise<InferTransactionResult> {
    const today = new Date().toISOString().slice(0, 10);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(today, categories, accounts),
        },
        { role: 'user', content: text },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('OpenAI returned an empty response');
    }

    const parsed: OpenAIInferenceResponse = JSON.parse(raw);

    const matchedCategory = parsed.categoryId
      ? categories.find(c => c.id === parsed.categoryId)
      : undefined;

    return {
      inferred: {
        amount: typeof parsed.amount === 'number' ? parsed.amount : null,
        description: parsed.description ?? '',
        date: parseResponseDate(parsed.date),
        type: isTransactionType(parsed.type)
          ? parsed.type
          : TransactionType.EXPENSE,
        category: matchedCategory
          ? { id: matchedCategory.id, name: matchedCategory.name }
          : null,
        necessityLevel: isNecessityLevel(parsed.necessityLevel)
          ? parsed.necessityLevel
          : null,
        valueAlignment: isValueAlignment(parsed.valueAlignment)
          ? parsed.valueAlignment
          : null,
        accountId: parsed.accountId ?? null,
        isRecurring: !!parsed.isRecurring,
        frequency: isScheduleFrequency(parsed.frequency)
          ? parsed.frequency
          : null,
      },
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
      rawInput: text,
      missingFields: [],
    };
  }
}

function parseResponseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const parsed = new Date(`${dateStr}T12:00:00`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isTransactionType(value: unknown): value is TransactionType {
  return (
    typeof value === 'string' &&
    (Object.values(TransactionType) as string[]).includes(value)
  );
}

function isNecessityLevel(value: unknown): value is NecessityLevel {
  return (
    typeof value === 'string' &&
    (Object.values(NecessityLevel) as string[]).includes(value)
  );
}

function isValueAlignment(value: unknown): value is ValueAlignment {
  return (
    typeof value === 'string' &&
    (Object.values(ValueAlignment) as string[]).includes(value)
  );
}

function isScheduleFrequency(value: unknown): value is ScheduleFrequency {
  return (
    typeof value === 'string' &&
    (Object.values(ScheduleFrequency) as string[]).includes(value)
  );
}

function buildSystemPrompt(
  today: string,
  categories: DBCategory[],
  accounts: DBAccount[]
): string {
  const categoryLines = categories
    .map(c => `${c.id}: "${c.name}" (${c.type})`)
    .join('\n');
  const accountLines = accounts.length
    ? accounts.map(a => `${a.id}: "${a.name}"`).join('\n')
    : '(none — leave accountId null)';

  return `You are a financial transaction parser for a Brazilian personal finance app.
Parse the natural language input into a structured transaction.

Today's date: ${today}

Available categories:
${categoryLines}

Available accounts:
${accountLines}

Return ONLY a JSON object:
{
  "amount": number | null,
  "description": string,
  "date": "YYYY-MM-DD",
  "type": "EXPENSE" | "INCOME" | "SAVING" | "TRANSFER",
  "categoryId": string | null,
  "necessityLevel": "IMPORTANT" | "NEEDS" | "WANTS" | null,
  "valueAlignment": "ALIGNED" | "DEFAULT" | "EXPERIENCE" | "MATERIAL" | "FREEDOM_ENABLING" | "FREEDOM_LIMITING" | null,
  "accountId": string | null,
  "isRecurring": boolean,
  "frequency": "WEEKLY" | "MONTHLY" | "YEARLY" | null,
  "confidence": number
}

Rules:
- amount: positive number, null if not found
- date: extract relative ("ontem"=yesterday, "amanhã"=tomorrow, "anteontem"=day before), exact (DD/MM or DD/MM/YYYY), "dia N" as the Nth of the current month (rolling to next month if already passed), or default to today
- type: infer from context, default EXPENSE
- categoryId: must match exactly one of the provided IDs; null if none fits
- necessityLevel: IMPORTANT for essentials (rent, bills, health, income, savings); NEEDS for regular (food, transport, education); WANTS for discretionary
- valueAlignment: FREEDOM_ENABLING for income/savings; ALIGNED for bills/health/housing; DEFAULT for food/transport; EXPERIENCE for entertainment/travel; MATERIAL for shopping
- accountId: match if the text names an account (e.g. "no Itaú", "na carteira"); null if not mentioned or no accounts are listed above
- isRecurring/frequency: true + WEEKLY/MONTHLY/YEARLY if the text implies a repeating or future bill ("todo mês", "recorrente", "toda semana", "vence dia 28 todo mês"); otherwise false/null
- confidence: 0.9+ if all fields clear; 0.5–0.8 if amount or category uncertain; <0.5 if input is very ambiguous`;
}
