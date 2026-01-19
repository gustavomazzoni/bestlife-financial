import prisma from '@/lib/db';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  InferredTransaction,
  InferTransactionResult,
  InferredCategory,
} from '@/types';

// Keywords for transaction type detection (Portuguese primary, English secondary)
const EXPENSE_KEYWORDS = [
  // Portuguese
  'comprei',
  'compra',
  'paguei',
  'pagamento',
  'gastei',
  'gasto',
  'despesa',
  // English
  'bought',
  'paid',
  'spent',
  'purchased',
];

const INCOME_KEYWORDS = [
  // Portuguese
  'recebi',
  'recebimento',
  'ganhei',
  'ganho',
  'salário',
  'salario',
  'renda',
  'entrada',
  // English
  'received',
  'earned',
  'salary',
  'income',
];

const SAVING_KEYWORDS = [
  // Portuguese
  'guardei',
  'poupar',
  'poupança',
  'poupanca',
  'investi',
  'investimento',
  'reserva',
  'aposentadoria',
  // English
  'saved',
  'invested',
  'savings',
];

// Category keyword mappings
interface CategoryKeywords {
  categoryName: string;
  keywords: string[];
  type: TransactionType;
}

const CATEGORY_KEYWORDS: CategoryKeywords[] = [
  // EXPENSE categories
  {
    categoryName: 'Food',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'café',
      'cafe',
      'pão',
      'pao',
      'padaria',
      'almoço',
      'almoco',
      'jantar',
      'lanche',
      'restaurante',
      'mercado',
      'supermercado',
      'comida',
      'ifood',
      'delivery',
      'pizza',
      'hamburguer',
      'açougue',
      'acougue',
      'feira',
      'hortifruti',
      // English
      'coffee',
      'bread',
      'lunch',
      'dinner',
      'restaurant',
      'groceries',
      'food',
      'supermarket',
      'breakfast',
    ],
  },
  {
    categoryName: 'Transport',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'uber',
      '99',
      'taxi',
      'táxi',
      'ônibus',
      'onibus',
      'metrô',
      'metro',
      'gasolina',
      'combustível',
      'combustivel',
      'estacionamento',
      'pedágio',
      'pedagio',
      'carro',
      'moto',
      'passagem',
      'transporte',
      // English
      'gas',
      'fuel',
      'parking',
      'toll',
      'car',
      'bus',
      'subway',
      'transport',
      'ride',
    ],
  },
  {
    categoryName: 'Health',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'remédio',
      'remedio',
      'farmácia',
      'farmacia',
      'médico',
      'medico',
      'consulta',
      'hospital',
      'exame',
      'dentista',
      'saúde',
      'saude',
      'plano de saúde',
      'academia',
      'gym',
      // English
      'medicine',
      'pharmacy',
      'doctor',
      'hospital',
      'health',
      'clinic',
      'dentist',
    ],
  },
  {
    categoryName: 'Entertainment',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'cinema',
      'filme',
      'netflix',
      'spotify',
      'streaming',
      'show',
      'teatro',
      'museu',
      'parque',
      'jogo',
      'game',
      'bar',
      'balada',
      'festa',
      'diversão',
      'diversao',
      'lazer',
      // English
      'movie',
      'concert',
      'entertainment',
      'party',
      'fun',
      'leisure',
    ],
  },
  {
    categoryName: 'Education',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'curso',
      'escola',
      'faculdade',
      'universidade',
      'livro',
      'material escolar',
      'mensalidade',
      'aula',
      'inglês',
      'ingles',
      'espanhol',
      'estudos',
      'educação',
      'educacao',
      // English
      'course',
      'school',
      'university',
      'book',
      'class',
      'education',
      'learning',
      'tuition',
    ],
  },
  {
    categoryName: 'Housing',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'aluguel',
      'condomínio',
      'condominio',
      'iptu',
      'apartamento',
      'casa',
      'moradia',
      'móveis',
      'moveis',
      'decoração',
      'decoracao',
      'reforma',
      // English
      'rent',
      'mortgage',
      'apartment',
      'house',
      'furniture',
      'home',
    ],
  },
  {
    categoryName: 'Bills',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'conta de luz',
      'luz',
      'energia',
      'conta de água',
      'agua',
      'conta de gás',
      'gas',
      'internet',
      'telefone',
      'celular',
      'conta',
      'boleto',
      'fatura',
      // English
      'electricity',
      'water',
      'utility',
      'bill',
      'phone',
      'mobile',
    ],
  },
  {
    categoryName: 'Shopping',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'roupa',
      'roupas',
      'sapato',
      'tênis',
      'tenis',
      'bolsa',
      'acessório',
      'acessorio',
      'shopping',
      'loja',
      'presente',
      'eletrônico',
      'eletronico',
      'celular',
      'computador',
      // English
      'clothes',
      'shoes',
      'bag',
      'store',
      'gift',
      'electronics',
    ],
  },
  {
    categoryName: 'Travel',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'viagem',
      'passagem de avião',
      'avião',
      'aviao',
      'hotel',
      'hospedagem',
      'airbnb',
      'férias',
      'ferias',
      'turismo',
      'mala',
      // English
      'travel',
      'flight',
      'hotel',
      'vacation',
      'trip',
      'tourism',
      'airfare',
    ],
  },
  {
    categoryName: 'Personal',
    type: TransactionType.EXPENSE,
    keywords: [
      // Portuguese
      'cabelo',
      'salão',
      'salao',
      'barbearia',
      'manicure',
      'estética',
      'estetica',
      'perfume',
      'maquiagem',
      'pessoal',
      // English
      'haircut',
      'salon',
      'personal',
      'beauty',
      'cosmetics',
    ],
  },
  // INCOME categories
  {
    categoryName: 'Salary',
    type: TransactionType.INCOME,
    keywords: [
      // Portuguese
      'salário',
      'salario',
      'holerite',
      'pagamento',
      'trabalho',
      'emprego',
      // English
      'salary',
      'wage',
      'paycheck',
      'job',
    ],
  },
  {
    categoryName: 'Freelance',
    type: TransactionType.INCOME,
    keywords: [
      // Portuguese
      'freelance',
      'freela',
      'cliente',
      'projeto',
      'serviço',
      'servico',
      'consultoria',
      // English
      'freelance',
      'client',
      'project',
      'consulting',
      'gig',
    ],
  },
  {
    categoryName: 'Passive Income',
    type: TransactionType.INCOME,
    keywords: [
      // Portuguese
      'dividendo',
      'aluguel recebido',
      'renda passiva',
      'royalties',
      'juros',
      // English
      'dividend',
      'passive',
      'royalty',
      'interest',
    ],
  },
  {
    categoryName: 'Investments',
    type: TransactionType.INCOME,
    keywords: [
      // Portuguese - for income from investments
      'rendimento',
      'lucro',
      'ganho de capital',
      // English
      'return',
      'profit',
      'capital gain',
    ],
  },
  // SAVING categories
  {
    categoryName: 'Emergency Fund',
    type: TransactionType.SAVING,
    keywords: [
      // Portuguese
      'emergência',
      'emergencia',
      'reserva de emergência',
      'reserva',
      // English
      'emergency',
      'emergency fund',
      'rainy day',
    ],
  },
  {
    categoryName: 'Investments',
    type: TransactionType.SAVING,
    keywords: [
      // Portuguese
      'investimento',
      'ações',
      'acoes',
      'fundo',
      'cdb',
      'tesouro',
      'renda fixa',
      'bolsa',
      'cripto',
      'bitcoin',
      // English
      'investment',
      'stocks',
      'bonds',
      'fund',
      'crypto',
    ],
  },
  {
    categoryName: 'Retirement',
    type: TransactionType.SAVING,
    keywords: [
      // Portuguese
      'aposentadoria',
      'previdência',
      'previdencia',
      'pgbl',
      'vgbl',
      // English
      'retirement',
      'pension',
      '401k',
    ],
  },
];

// Necessity level mappings by category
const NECESSITY_BY_CATEGORY: Record<string, NecessityLevel> = {
  // IMPORTANT - Essential for survival/work
  Housing: NecessityLevel.IMPORTANT,
  Bills: NecessityLevel.IMPORTANT,
  Health: NecessityLevel.IMPORTANT,
  Salary: NecessityLevel.IMPORTANT,
  Freelance: NecessityLevel.IMPORTANT,
  'Passive Income': NecessityLevel.IMPORTANT,
  Investments: NecessityLevel.IMPORTANT,
  'Emergency Fund': NecessityLevel.IMPORTANT,
  Retirement: NecessityLevel.IMPORTANT,

  // NEEDS - Important but not critical
  Food: NecessityLevel.NEEDS,
  Transport: NecessityLevel.NEEDS,
  Education: NecessityLevel.NEEDS,
  Personal: NecessityLevel.NEEDS,

  // WANTS - Nice to have
  Entertainment: NecessityLevel.WANTS,
  Shopping: NecessityLevel.WANTS,
  Travel: NecessityLevel.WANTS,
  'Other Expense': NecessityLevel.WANTS,
  'Other Income': NecessityLevel.NEEDS,
  'Other Saving': NecessityLevel.IMPORTANT,
};

// Value alignment mappings by category and type
const VALUE_ALIGNMENT_BY_CATEGORY: Record<string, ValueAlignment> = {
  // FREEDOM_ENABLING - Generates freedom
  Salary: ValueAlignment.FREEDOM_ENABLING,
  Freelance: ValueAlignment.FREEDOM_ENABLING,
  'Passive Income': ValueAlignment.FREEDOM_ENABLING,
  'Other Income': ValueAlignment.FREEDOM_ENABLING,
  'Emergency Fund': ValueAlignment.FREEDOM_ENABLING,
  Investments: ValueAlignment.FREEDOM_ENABLING,
  Retirement: ValueAlignment.FREEDOM_ENABLING,
  'Other Saving': ValueAlignment.FREEDOM_ENABLING,

  // ALIGNED - Essential expenses
  Housing: ValueAlignment.ALIGNED,
  Bills: ValueAlignment.ALIGNED,
  Health: ValueAlignment.ALIGNED,

  // DEFAULT - Regular expenses
  Food: ValueAlignment.DEFAULT,
  Transport: ValueAlignment.DEFAULT,
  Education: ValueAlignment.DEFAULT,
  Personal: ValueAlignment.DEFAULT,
  'Other Expense': ValueAlignment.DEFAULT,

  // EXPERIENCE - Entertainment and travel
  Entertainment: ValueAlignment.EXPERIENCE,
  Travel: ValueAlignment.EXPERIENCE,

  // MATERIAL - Shopping
  Shopping: ValueAlignment.MATERIAL,
};

/**
 * Parse amount from natural language text
 * Supports formats: R$ 25, R$ 25,50, R$ 2.500,00, 25 reais, 25
 */
function parseAmount(text: string): number | null {
  const normalizedText = text.toLowerCase();

  // Pattern 1: R$ followed by number (R$ 25, R$ 25,50, R$ 2.500,00)
  const rsPatternsWithCommaDecimal = /r\$\s*([\d.]+),(\d{1,2})/i;
  const rsPatternWithDotDecimal = /r\$\s*([\d,]+)\.(\d{1,2})/i;
  const rsPatternWholeNumber = /r\$\s*([\d.,]+)/i;

  // Pattern 2: Number followed by "reais" (25 reais, 25,50 reais)
  const reaisPatternWithComma = /([\d.]+),(\d{1,2})\s*reais/i;
  const reaisPatternWhole = /([\d.]+)\s*reais/i;

  // Try R$ with comma as decimal separator (Brazilian standard)
  let match = normalizedText.match(rsPatternsWithCommaDecimal);
  if (match) {
    const integerPart = match[1].replace(/\./g, ''); // Remove thousand separators
    const decimalPart = match[2];
    return parseFloat(`${integerPart}.${decimalPart}`);
  }

  // Try R$ with dot as decimal separator
  match = normalizedText.match(rsPatternWithDotDecimal);
  if (match) {
    const integerPart = match[1].replace(/,/g, ''); // Remove thousand separators
    const decimalPart = match[2];
    return parseFloat(`${integerPart}.${decimalPart}`);
  }

  // Try R$ with whole number
  match = normalizedText.match(rsPatternWholeNumber);
  if (match) {
    // Check if it's a Brazilian format number (2.500 = 2500)
    const numStr = match[1];
    if (numStr.includes('.') && !numStr.includes(',')) {
      // Could be thousand separator or decimal
      const parts = numStr.split('.');
      if (parts[parts.length - 1].length === 3) {
        // It's a thousand separator
        return parseFloat(numStr.replace(/\./g, ''));
      }
    }
    return parseFloat(numStr.replace(/\./g, '').replace(/,/g, '.'));
  }

  // Try "reais" with comma decimal
  match = normalizedText.match(reaisPatternWithComma);
  if (match) {
    const integerPart = match[1].replace(/\./g, '');
    const decimalPart = match[2];
    return parseFloat(`${integerPart}.${decimalPart}`);
  }

  // Try "reais" whole number
  match = normalizedText.match(reaisPatternWhole);
  if (match) {
    return parseFloat(match[1].replace(/\./g, ''));
  }

  // Fallback: find standalone number at the end or after certain keywords
  const standaloneNumberPattern = /\b(\d+(?:[.,]\d{1,2})?)\b(?![\d/])/g;
  const matches = [...normalizedText.matchAll(standaloneNumberPattern)];

  if (matches.length > 0) {
    // Take the last number found (usually the amount is at the end)
    const lastMatch = matches[matches.length - 1][1];
    return parseFloat(lastMatch.replace(',', '.'));
  }

  return null;
}

/**
 * Detect transaction type from text
 */
function detectTransactionType(text: string): TransactionType {
  const lowerText = text.toLowerCase();

  // Check for saving keywords first (more specific)
  for (const keyword of SAVING_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return TransactionType.SAVING;
    }
  }

  // Check for income keywords
  for (const keyword of INCOME_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return TransactionType.INCOME;
    }
  }

  // Check for expense keywords
  for (const keyword of EXPENSE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return TransactionType.EXPENSE;
    }
  }

  // Default to expense (most common transaction type)
  return TransactionType.EXPENSE;
}

/**
 * Match category based on keywords
 */
async function matchCategory(
  text: string,
  transactionType: TransactionType
): Promise<InferredCategory | null> {
  const lowerText = text.toLowerCase();

  // Get all categories from database
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, type: true },
  });

  // Find matching category keywords
  let bestMatch: { categoryName: string; matchCount: number } | null = null;

  for (const categoryKeyword of CATEGORY_KEYWORDS) {
    // Only consider categories that match the transaction type
    if (categoryKeyword.type !== transactionType) {
      continue;
    }

    let matchCount = 0;
    for (const keyword of categoryKeyword.keywords) {
      if (lowerText.includes(keyword)) {
        matchCount++;
      }
    }

    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
      bestMatch = { categoryName: categoryKeyword.categoryName, matchCount };
    }
  }

  if (bestMatch) {
    // Find the category in the database
    const dbCategory = categories.find(
      cat =>
        cat.name === bestMatch!.categoryName && cat.type === transactionType
    );

    if (dbCategory) {
      return { id: dbCategory.id, name: dbCategory.name };
    }
  }

  // Fallback to "Other" category for the transaction type
  const fallbackName =
    transactionType === TransactionType.INCOME
      ? 'Other Income'
      : transactionType === TransactionType.SAVING
        ? 'Other Saving'
        : 'Other Expense';

  const fallbackCategory = categories.find(
    cat => cat.name === fallbackName && cat.type === transactionType
  );

  if (fallbackCategory) {
    return { id: fallbackCategory.id, name: fallbackCategory.name };
  }

  return null;
}

/**
 * Infer necessity level from category
 */
function inferNecessityLevel(
  categoryName: string | null
): NecessityLevel | null {
  if (!categoryName) return null;
  return NECESSITY_BY_CATEGORY[categoryName] || NecessityLevel.WANTS;
}

/**
 * Infer value alignment from category
 */
function inferValueAlignment(
  categoryName: string | null
): ValueAlignment | null {
  if (!categoryName) return null;
  return VALUE_ALIGNMENT_BY_CATEGORY[categoryName] || ValueAlignment.DEFAULT;
}

/**
 * Parse date from text
 */
function parseDate(text: string): Date {
  const lowerText = text.toLowerCase();
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  // Check for relative date keywords (check more specific ones first)
  if (
    lowerText.includes('anteontem') ||
    lowerText.includes('day before yesterday')
  ) {
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    return dayBeforeYesterday;
  }

  if (lowerText.includes('ontem') || lowerText.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  if (lowerText.includes('hoje') || lowerText.includes('today')) {
    return today;
  }

  // Try to parse DD/MM/YYYY or DD/MM format
  const datePatternFull = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  const datePatternShort = /(\d{1,2})\/(\d{1,2})(?!\/\d)/;

  let match = lowerText.match(datePatternFull);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(match[3], 10);
    const parsedDate = new Date(year, month, day, 12, 0, 0, 0);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  match = lowerText.match(datePatternShort);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = today.getFullYear();
    const parsedDate = new Date(year, month, day, 12, 0, 0, 0);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Default to today
  return today;
}

/**
 * Generate clean description from input text
 */
function generateDescription(text: string): string {
  if (!text || !text.trim()) {
    return '';
  }

  let description = text.trim();

  // Remove amount patterns
  description = description
    .replace(/r\$\s*[\d.,]+/gi, '')
    .replace(/[\d.,]+\s*reais/gi, '')
    .replace(/\b\d+(?:[.,]\d{1,2})?\b(?=\s*$)/g, ''); // Remove trailing numbers

  // Remove date patterns
  description = description.replace(/\d{1,2}\/\d{1,2}(?:\/\d{4})?/g, '');

  // Remove common action verbs at the start
  const actionVerbs =
    /^(comprei|compra|paguei|pagamento|gastei|gasto|recebi|ganhei|guardei|investi|bought|paid|spent|received|earned|saved|invested)\s+/i;
  description = description.replace(actionVerbs, '');

  // Remove date keywords
  description = description.replace(
    /\b(hoje|ontem|anteontem|today|yesterday)\b/gi,
    ''
  );

  // Clean up multiple spaces and trim
  description = description.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return description || 'Transação';
}

/**
 * Calculate confidence score based on parsed fields
 */
function calculateConfidence(
  amount: number | null,
  category: InferredCategory | null,
  description: string,
  hasExplicitType: boolean
): number {
  let score = 0;
  const maxScore = 100;

  // Amount detection (35% weight)
  if (amount !== null && amount > 0) {
    score += 35;
  }

  // Category detection (30% weight)
  if (category !== null) {
    if (category.name.startsWith('Other')) {
      score += 10; // Low score for fallback categories
    } else {
      score += 30;
    }
  }

  // Description quality (15% weight)
  if (description && description.length > 10 && description !== 'Transação') {
    score += 15;
  } else if (
    description &&
    description.length > 5 &&
    description !== 'Transação'
  ) {
    score += 10;
  } else if (
    description &&
    description.length > 0 &&
    description !== 'Transação'
  ) {
    score += 5;
  }

  // Explicit type detection (20% weight)
  if (hasExplicitType) {
    score += 20;
  }

  return Math.round((score / maxScore) * 100) / 100;
}

/**
 * Check if the text contains explicit type keywords
 */
function hasExplicitTypeKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  const allKeywords = [
    ...EXPENSE_KEYWORDS,
    ...INCOME_KEYWORDS,
    ...SAVING_KEYWORDS,
  ];
  return allKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Main inference function
 */
export async function inferTransaction(
  text: string
): Promise<InferTransactionResult> {
  const trimmedText = text.trim();

  // Handle empty input
  if (!trimmedText) {
    return {
      inferred: {
        amount: null,
        description: '',
        date: new Date(),
        type: TransactionType.EXPENSE,
        category: null,
        necessityLevel: null,
        valueAlignment: null,
      },
      confidence: 0,
      rawInput: text,
    };
  }

  // Parse all fields
  const amount = parseAmount(trimmedText);
  const type = detectTransactionType(trimmedText);
  const category = await matchCategory(trimmedText, type);
  const date = parseDate(trimmedText);
  const description = generateDescription(trimmedText);
  const necessityLevel = inferNecessityLevel(category?.name || null);
  const valueAlignment = inferValueAlignment(category?.name || null);
  const hasExplicitType = hasExplicitTypeKeyword(trimmedText);

  const confidence = calculateConfidence(
    amount,
    category,
    description,
    hasExplicitType
  );

  return {
    inferred: {
      amount,
      description,
      date,
      type,
      category,
      necessityLevel,
      valueAlignment,
    },
    confidence,
    rawInput: text,
  };
}
