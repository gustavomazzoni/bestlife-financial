import { prisma } from '@/lib/db';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';
import { CreateTransactionInput } from '@/lib/validations/transaction';

export interface InferenceResult {
  inferred: Partial<CreateTransactionInput>;
  confidence: number;
  missingFields: string[];
}

/**
 * Rule-based natural language inference for transaction entry
 * MVP: Simple keyword matching and pattern recognition
 * Future: Can be replaced with LLM integration
 */
export async function inferTransactionFromText(
  text: string,
  userId: string
): Promise<InferenceResult> {
  const normalizedText = text.toLowerCase().trim();
  let confidence = 0.8; // Start with high confidence, reduce if uncertain
  const inferred: Partial<CreateTransactionInput> = {};
  const missingFields: string[] = [];

  // Extract amount (BRL format: R$ 25, R$25, 25 reais, etc.)
  const amountMatch =
    normalizedText.match(/r\$\s*(\d+(?:[.,]\d{2})?)/i) ||
    normalizedText.match(/(\d+(?:[.,]\d{2})?)\s*(?:reais|rs|r\$)/i) ||
    normalizedText.match(/(\d+(?:[.,]\d{2})?)/);

  if (amountMatch) {
    const amountStr = amountMatch[1].replace(',', '.');
    inferred.amount = parseFloat(amountStr);
    confidence += 0.1;
  } else {
    missingFields.push('amount');
    confidence -= 0.3;
  }

  // Extract date (if mentioned: hoje, today, yesterday, specific date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalizedText.includes('hoje') || normalizedText.includes('today')) {
    inferred.date = today;
  } else if (
    normalizedText.includes('ontem') ||
    normalizedText.includes('yesterday')
  ) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    inferred.date = yesterday;
  } else {
    inferred.date = today; // Default to today
  }

  // Infer transaction type from keywords
  const incomeKeywords = [
    'salário',
    'salary',
    'receita',
    'income',
    'pagamento',
    'payment',
    'freelance',
    'venda',
    'sale',
  ];
  const expenseKeywords = [
    'compra',
    'buy',
    'bought',
    'gastei',
    'spent',
    'paguei',
    'paid',
    'despesa',
    'expense',
    'almoço',
    'lunch',
    'jantar',
    'dinner',
    'café',
    'coffee',
  ];
  const savingKeywords = [
    'poupança',
    'saving',
    'investimento',
    'investment',
    'reserva',
    'reserve',
  ];

  if (incomeKeywords.some(kw => normalizedText.includes(kw))) {
    inferred.type = TransactionType.INCOME;
  } else if (savingKeywords.some(kw => normalizedText.includes(kw))) {
    inferred.type = TransactionType.SAVING;
  } else if (
    expenseKeywords.some(kw => normalizedText.includes(kw)) ||
    !inferred.type
  ) {
    inferred.type = TransactionType.EXPENSE; // Default to expense
  }

  // Extract description (remove amount and common words, keep meaningful parts)
  let description = text;
  if (amountMatch) {
    description = description.replace(amountMatch[0], '').trim();
  }
  // Remove common filler words
  description = description
    .replace(
      /\b(compra|buy|bought|gastei|spent|paguei|paid|de|at|em|com|for|the|a|an)\b/gi,
      ''
    )
    .trim();

  if (description.length > 3) {
    inferred.description = description.substring(0, 500);
  } else {
    inferred.description = text.substring(0, 500); // Fallback to original text
  }

  // Infer category based on keywords and transaction type
  const categoryKeywords: Record<string, string[]> = {
    Food: [
      'comida',
      'food',
      'almoço',
      'lunch',
      'jantar',
      'dinner',
      'café',
      'coffee',
      'restaurante',
      'restaurant',
      'lanche',
      'snack',
      'breakfast',
      'café da manhã',
      'smoothie',
      'oatmeal',
      'healthy café',
    ],
    Housing: [
      'aluguel',
      'rent',
      'moradia',
      'housing',
      'casa',
      'house',
      'apartamento',
      'apartment',
    ],
    Transport: [
      'uber',
      'taxi',
      'transporte',
      'transport',
      'gasolina',
      'gas',
      'combustível',
      'fuel',
      'ônibus',
      'bus',
      'metrô',
      'metro',
    ],
    Health: [
      'saúde',
      'health',
      'médico',
      'doctor',
      'farmacia',
      'pharmacy',
      'gym',
      'academia',
      'healthy',
    ],
    Entertainment: [
      'cinema',
      'cinema',
      'filme',
      'movie',
      'entretenimento',
      'entertainment',
      'show',
      'show',
    ],
    Shopping: [
      'compras',
      'shopping',
      'loja',
      'store',
      'mall',
      'shopping center',
      'headphones',
      'fones',
      'wireless',
    ],
    Personal: ['pessoal', 'personal', 'cabelo', 'hair', 'beleza', 'beauty'],
    Bills: [
      'conta',
      'bill',
      'luz',
      'light',
      'água',
      'water',
      'internet',
      'internet',
    ],
    Travel: [
      'viagem',
      'travel',
      'viagem',
      'trip',
      'hotel',
      'hotel',
      'passagem',
      'ticket',
    ],
  };

  let matchedCategory: string | null = null;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => normalizedText.includes(kw))) {
      matchedCategory = category;
      break;
    }
  }

  // If no category matched, use "Other Expense" or "Other Income" based on type
  if (!matchedCategory) {
    matchedCategory =
      inferred.type === TransactionType.INCOME
        ? 'Other Income'
        : 'Other Expense';
    confidence -= 0.1;
  }

  // Find category in database
  const category = await prisma.category.findFirst({
    where: {
      name: matchedCategory,
      type: inferred.type || TransactionType.EXPENSE,
    },
  });

  if (category) {
    inferred.categoryId = category.id;
  } else {
    missingFields.push('categoryId');
    confidence -= 0.2;
  }

  // Infer necessity level
  const importantKeywords = [
    'importante',
    'important',
    'essencial',
    'essential',
    'necessário',
    'necessary',
  ];
  const wantKeywords = [
    'querer',
    'want',
    'desejo',
    'desire',
    'impulso',
    'impulse',
    'luxo',
    'luxury',
  ];

  if (importantKeywords.some(kw => normalizedText.includes(kw))) {
    inferred.necessityLevel = NecessityLevel.IMPORTANT;
  } else if (
    wantKeywords.some(kw => normalizedText.includes(kw)) ||
    normalizedText.includes('impulse')
  ) {
    inferred.necessityLevel = NecessityLevel.WANTS;
  } else if (
    matchedCategory === 'Food' ||
    matchedCategory === 'Housing' ||
    matchedCategory === 'Health'
  ) {
    inferred.necessityLevel = NecessityLevel.NEEDS;
  } else if (
    matchedCategory === 'Shopping' ||
    matchedCategory === 'Entertainment'
  ) {
    inferred.necessityLevel = NecessityLevel.WANTS;
  }

  // Infer value alignment based on category and keywords
  const alignedKeywords = [
    'alinhado',
    'aligned',
    'valores',
    'values',
    'importante',
    'important',
  ];
  const freedomEnablingKeywords = [
    'liberdade',
    'freedom',
    'investimento',
    'investment',
    'saúde',
    'health',
    'healthy',
    'energia',
    'energy',
  ];
  const freedomLimitingKeywords = [
    'limita',
    'limit',
    'dívida',
    'debt',
    'desperdício',
    'waste',
  ];
  const experienceKeywords = [
    'experiência',
    'experience',
    'viagem',
    'travel',
    'memória',
    'memory',
  ];
  const materialKeywords = [
    'material',
    'coisa',
    'thing',
    'objeto',
    'object',
    'produto',
    'product',
  ];

  if (
    freedomEnablingKeywords.some(kw => normalizedText.includes(kw)) ||
    matchedCategory === 'Health'
  ) {
    inferred.valueAlignment = ValueAlignment.FREEDOM_ENABLING;
  } else if (
    freedomLimitingKeywords.some(kw => normalizedText.includes(kw)) ||
    (matchedCategory === 'Shopping' &&
      inferred.necessityLevel === NecessityLevel.WANTS)
  ) {
    inferred.valueAlignment = ValueAlignment.FREEDOM_LIMITING;
  } else if (
    experienceKeywords.some(kw => normalizedText.includes(kw)) ||
    matchedCategory === 'Travel' ||
    matchedCategory === 'Entertainment'
  ) {
    inferred.valueAlignment = ValueAlignment.EXPERIENCE;
  } else if (
    materialKeywords.some(kw => normalizedText.includes(kw)) ||
    matchedCategory === 'Shopping'
  ) {
    inferred.valueAlignment = ValueAlignment.MATERIAL;
  } else if (alignedKeywords.some(kw => normalizedText.includes(kw))) {
    inferred.valueAlignment = ValueAlignment.ALIGNED;
  } else {
    inferred.valueAlignment = ValueAlignment.DEFAULT;
  }

  // Ensure confidence is between 0 and 1
  confidence = Math.max(0, Math.min(1, confidence));

  console.log('Inference complete', inferred, confidence, missingFields);

  return {
    inferred,
    confidence,
    missingFields,
  };
}
