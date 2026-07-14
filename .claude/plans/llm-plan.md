# Phase 2.8 — LLM-Powered Inference & Full Inline Edit Modal

## Context

The "Registrar Transação" modal has two critical problems:

1. **Bad inference**: The rule-based engine fails on slang, abbreviations, uncommon phrasing, and many real-world inputs. Keywords are too rigid — "almocei no bandejão" or "birosca ontem" won't match. Users end up with wrong categories, types, and amounts.

2. **Incomplete edit form**: After inference, only 3 fields are editable (amount, type, description). Category, date, necessity level, and value alignment are read-only. Users must save, then navigate to the edit page to fix anything — major UX friction.

**Outcome**: Replace the inference engine with GPT-4o Mini via an LLM abstraction layer (easy to swap providers), and convert `InferredTransactionCard` into a full pre-populated form with all fields editable inline.

---

## Part A — LLM Inference Abstraction Layer

### Design: Strategy Pattern with Factory

```
src/lib/llm/
  types.ts               → LLMInferenceProvider interface
  factory.ts             → createInferenceProvider() (env-driven)
  providers/
    openai.ts            → GPT-4o Mini implementation
    rule-based.ts        → existing logic (extracted from infer.ts)
```

Switching LLMs = add one file in `providers/`, add one `case` in `factory.ts`. The rest of the codebase is unchanged.

### Step 1 — Install `openai` package

```bash
docker compose exec app pnpm add openai
```

### Step 2 — Environment Variables

Add to `.env` and `.env.example`:
```
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai   # options: openai | rule-based
```

Add to `docker-compose.yml` under the `app` service environment:
```yaml
- OPENAI_API_KEY=${OPENAI_API_KEY}
- LLM_PROVIDER=${LLM_PROVIDER:-openai}
```

### Step 3 — Create `src/lib/llm/types.ts`

```typescript
import { InferTransactionResult } from '@/types/infer';

export interface DBCategory {
  id: string;
  name: string;
  type: string;
}

export interface LLMInferenceProvider {
  inferTransaction(text: string, categories: DBCategory[]): Promise<InferTransactionResult>;
}
```

### Step 4 — Create `src/lib/llm/providers/rule-based.ts`

Move all existing logic from `src/services/transactions/infer.ts` (all the keyword arrays, parse functions, `inferTransaction()` body) into this file as a class implementing `LLMInferenceProvider`. No logic changes — pure extraction.

### Step 5 — Create `src/lib/llm/providers/openai.ts`

Key implementation details:
- Model: `gpt-4o-mini`
- `response_format: { type: 'json_object' }` for reliable structured output
- Pass today's date and full category list (with IDs) in system prompt so the LLM picks the right `categoryId` directly
- Parse response → map to `InferTransactionResult`
- On API error → throw (let caller handle)

**System prompt structure**:
```
You are a financial transaction parser for a Brazilian personal finance app.
Parse the natural language input into a structured transaction.

Today's date: {YYYY-MM-DD}

Available categories:
{id}: "{name}" ({type})
...

Return ONLY a JSON object:
{
  "amount": number | null,
  "description": string,
  "date": "YYYY-MM-DD",
  "type": "EXPENSE" | "INCOME" | "SAVING" | "TRANSFER",
  "categoryId": string | null,
  "categoryName": string | null,
  "necessityLevel": "IMPORTANT" | "NEEDS" | "WANTS" | null,
  "valueAlignment": "ALIGNED" | "DEFAULT" | "EXPERIENCE" | "MATERIAL" | "FREEDOM_ENABLING" | "FREEDOM_LIMITING" | null,
  "confidence": number  // 0.0–1.0, estimate based on how clear the input is
}

Rules:
- amount: positive number, null if not found
- date: extract relative ("ontem"=yesterday, "anteontem"=day before), exact (DD/MM or DD/MM/YYYY), or default to today
- type: infer from context, default EXPENSE
- categoryId: must match exactly one of the provided IDs; null if none fits
- necessityLevel: IMPORTANT for essentials (rent, bills, health, income, savings); NEEDS for regular (food, transport, education); WANTS for discretionary
- valueAlignment: FREEDOM_ENABLING for income/savings; ALIGNED for bills/health/housing; DEFAULT for food/transport; EXPERIENCE for entertainment/travel; MATERIAL for shopping
- confidence: 0.9+ if all fields clear; 0.5–0.8 if amount or category uncertain; <0.5 if input is very ambiguous
```

### Step 6 — Create `src/lib/llm/factory.ts`

```typescript
export function createInferenceProvider(): LLMInferenceProvider {
  const provider = process.env.LLM_PROVIDER ?? 'openai';
  switch (provider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY not set');
      return new OpenAIProvider(key);
    }
    case 'rule-based':
      return new RuleBasedProvider();
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
  }
}
```

### Step 7 — Simplify `src/services/transactions/infer.ts`

Replace the entire body with a thin wrapper:

```typescript
export async function inferTransaction(text: string): Promise<InferTransactionResult> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, type: true },
  });
  const provider = createInferenceProvider();
  return provider.inferTransaction(text, categories);
}
```

The API route (`src/app/api/v1/transactions/infer/route.ts`) is **unchanged**.

---

## Part B — Full Inline Edit Form in Modal

### Step 8 — Update `src/types/infer.ts`

Add `notes?: string` to `InferredTransaction` (to support the notes field in modal):

```typescript
export interface InferredTransaction {
  amount: number | null;
  description: string;
  date: Date;
  type: TransactionType;
  category: InferredCategory | null;
  necessityLevel: NecessityLevel | null;
  valueAlignment: ValueAlignment | null;
  notes?: string;  // ← new
}
```

### Step 9 — Rewrite `src/components/features/transactions/inferred-transaction-card.tsx`

Replace the limited display-with-edit-mode pattern with a **full pre-populated form** (always in edit mode — no pencil toggle).

**Form fields** (all editable, matching the edit page pattern):
- Valor (amount) — `number` input, `step="0.01"`, `min="0"`, `valueAsNumber: true`
- Tipo (type) — `Select` with `Controller` (INCOME/EXPENSE/SAVING/TRANSFER); on change → reset categoryId, reload categories
- Descrição — `Input` text
- Data — `Input type="date"`, `register('date')`
- Categoria — `Select` with `Controller`; options loaded from `GET /api/v1/categories?type={type}` on mount + on type change; pre-selects inferred category
- Nível de necessidade — `Select` with `Controller` (optional)
- Alinhamento de valores — `Select` with `Controller` (optional)
- Notas — `Textarea` (optional)

**Reuse from** `src/app/(frontend)/transactions/[id]/page.tsx`:
- Same `transactionEditSchema` (Zod) and `FormValues` type (copy/adapt)
- Same `Field` + `Controller` + `Select` pattern for enum selects
- Same `typeOptions`, `necessityOptions`, `alignmentOptions` arrays

**Internal state**:
```typescript
const [categories, setCategories] = useState<Category[]>([]);
const currentType = watch('type');

// Fetch categories on mount and on type change
useEffect(() => {
  if (!currentType) return;
  fetch(`/api/v1/categories?type=${currentType}`)
    .then(r => r.json())
    .then(j => setCategories(j.data ?? []));
}, [currentType]);
```

**Default values** from inference result:
```typescript
defaultValues: {
  amount: result.inferred.amount ?? undefined,
  description: result.inferred.description,
  date: format(new Date(result.inferred.date), 'yyyy-MM-dd'),
  type: result.inferred.type,
  categoryId: result.inferred.category?.id ?? '',
  necessityLevel: result.inferred.necessityLevel ?? '',
  valueAlignment: result.inferred.valueAlignment ?? '',
  notes: '',
}
```

**On confirm** (RHF `handleSubmit`):
```typescript
const onSubmit = (data: FormValues) => {
  const category = categories.find(c => c.id === data.categoryId) ?? null;
  onConfirm({
    amount: data.amount,
    description: data.description,
    date: new Date(data.date),
    type: data.type as TransactionType,
    category: category ? { id: category.id, name: category.name } : null,
    necessityLevel: (data.necessityLevel as NecessityLevel) || null,
    valueAlignment: (data.valueAlignment as ValueAlignment) || null,
    notes: data.notes || undefined,
  });
};
```

Keep: `ConfidenceBadge` at the top, quoted raw input below it.
Remove: pencil icon toggle, `isEditing` state.

### Step 10 — Update `src/components/features/transactions/transaction-quick-entry.tsx`

Add `notes` to the POST body (line 44–57 area):
```typescript
body: JSON.stringify({
  amount: transaction.amount,
  description: transaction.description,
  date: transaction.date,
  type: transaction.type,
  categoryId: transaction.category?.id ?? '',
  necessityLevel: transaction.necessityLevel,
  valueAlignment: transaction.valueAlignment,
  notes: transaction.notes,  // ← new
}),
```

---

## Part C — Tests

### Update `src/services/transactions/infer.test.ts`

Replace direct keyword tests with a mocked provider test:
```typescript
vi.mock('@/lib/llm/factory', () => ({
  createInferenceProvider: () => ({
    inferTransaction: vi.fn().mockResolvedValue({ /* mock result */ }),
  }),
}));
```
Test: that `inferTransaction()` calls the provider and passes categories from DB.

### Create `src/lib/llm/providers/openai.test.ts`

Mock the `openai` SDK (`vi.mock('openai')`). Test:
- Well-formed input → correct `InferTransactionResult` mapping
- Missing amount in response → `amount: null`
- API error → throws
- Date parsing: "ontem" in response handled as yesterday

### Create `src/lib/llm/providers/rule-based.test.ts`

Port all existing tests from `infer.test.ts` (they still test the same logic, just now in the rule-based provider).

---

## Critical Files

| File | Action |
|---|---|
| `package.json` | Add `openai` dependency |
| `.env` / `.env.example` | Add `OPENAI_API_KEY`, `LLM_PROVIDER` |
| `docker-compose.yml` | Add env vars to `app` service |
| `src/lib/llm/types.ts` | New — `LLMInferenceProvider` interface |
| `src/lib/llm/factory.ts` | New — provider factory |
| `src/lib/llm/providers/openai.ts` | New — GPT-4o Mini implementation |
| `src/lib/llm/providers/rule-based.ts` | New — existing logic extracted here |
| `src/services/transactions/infer.ts` | Simplify to thin wrapper (~15 lines) |
| `src/types/infer.ts` | Add `notes?: string` to `InferredTransaction` |
| `src/components/features/transactions/inferred-transaction-card.tsx` | Full rewrite → all fields editable |
| `src/components/features/transactions/transaction-quick-entry.tsx` | Add `notes` to POST body |
| `src/services/transactions/infer.test.ts` | Update — mock provider factory |
| `src/lib/llm/providers/openai.test.ts` | New — unit tests with mocked SDK |
| `src/lib/llm/providers/rule-based.test.ts` | New — port existing infer tests |

---

## Verification

```bash
# 1. Install dependency
docker compose exec app pnpm add openai

# 2. Type check — 0 errors
docker compose exec app pnpm type-check

# 3. Unit tests — all pass
docker compose exec app pnpm test

# 4. Lint — 0 errors
docker compose exec app pnpm lint
```

**Manual smoke test**:
1. Open modal ("+" button) → type "almocei no bandejão R$35" → inference returns Alimentação, EXPENSE, R$35 with high confidence
2. Try "conta de luz chegou R$180" → Bills, EXPENSE, ALIGNED, IMPORTANT
3. Try "uber ontem 28 reais" → Transport, EXPENSE, yesterday's date
4. Try "salário do mês R$8000" → Salary, INCOME, FREEDOM_ENABLING
5. Check that all fields in the card are editable: change category → reloads correctly; change type → category resets and reloads; change date → shows in form; fill notes → saved
6. Confirm → transaction appears in list with correct values
7. Test switching to rule-based: set `LLM_PROVIDER=rule-based` in `.env` → inference still works (no API key needed)
