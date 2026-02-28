# Technical Specification — BestLife Financial Freedom Module

**Purpose**: Help users discover their "Freedom Number" and make conscious financial choices aligned with their values.
**Development Approach**: Test-Driven Development (TDD)
**See also**: [PRODUCT.md](./.claude/PRODUCT.md) (product spec) | [ROADMAP.md](./.claude/ROADMAP.md) (post-MVP)

---

## Tech Stack

| Layer             | Technology                                  |
| ----------------- | ------------------------------------------- |
| Framework         | Next.js 16.1+ (App Router)                  |
| Language          | TypeScript 5.3+                             |
| Runtime           | Node.js 20+                                 |
| Package Manager   | pnpm                                        |
| Environment       | Docker                                      |
| Database          | PostgreSQL 15+ via Prisma 7.2+              |
| Auth              | NextAuth.js v5 (Auth.js) — email magic link |
| Validation        | Zod (shared frontend/backend)               |
| UI                | React 18+, Tailwind CSS 3.4+, shadcn/ui     |
| Forms             | React Hook Form + Zod                       |
| Charts            | Recharts                                    |
| Icons             | Lucide React                                |
| Dates             | date-fns                                    |
| Unit Tests        | Vitest                                      |
| Integration Tests | Vitest + Supertest                          |
| E2E Tests         | Playwright                                  |
| Hosting           | Vercel + Supabase                           |
| Currency          | BRL only (MVP)                              |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
├──────────────────────┬──────────────────────────────────────┤
│   Next.js Web App    │   React Native Mobile (Future)       │
│   - Server Components│   - Native Screens                   │
│   - Client Components│   - Navigation                       │
│   - Forms/UI         │   - API Client                       │
└──────────────────────┴──────────────────────────────────────┘
           │                           │
           └───────────┬───────────────┘
                       │ HTTP/JSON
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              REST API Layer (/api/v1/*)                     │
│  - Authentication & Authorization                           │
│  - Request Validation (Zod)                                 │
│  - Response Formatting                                      │
│  - Error Handling                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (Business Logic)             │
│  - Transaction Management                                   │
│  - Financial Calculations                                   │
│  - User Management                                          │
│  - Notifications                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                         │
│  - Prisma ORM                                               │
│  - Database Queries                                         │
│  - Transactions                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                          │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

- **Separation of Concerns** — Business logic independent of presentation
- **API-First** — All features exposed as REST APIs
- **Code Reuse** — 70–80% of backend shared between web and mobile
- **Type Safety** — End-to-end TypeScript with Zod validation
- **Test-Driven** — Write tests before implementation
- **Database-First** — Strong schema, enforce constraints at DB level

---

## Project Structure

```
src/
├── app/
│   ├── api/v1/
│   │   ├── transactions/        # route.ts, [id]/route.ts, import/, summary/
│   │   ├── recurring/           # route.ts, [id]/route.ts, [id]/execute/
│   │   ├── calculations/        # lifestyle-cost/, freedom-metrics/, fi-projection/, purchase-check/
│   │   ├── categories/          # route.ts, [id]/route.ts
│   │   ├── user/                # profile/, preferences/, stats/
│   │   └── reports/             # weekly/, monthly/
│   ├── (frontend)/              # Web routes (RSC)
│   └── (auth)/                  # login/, signup/
├── services/                    # Business Logic (SHARED)
│   ├── transactions/            # create, get, list, update, delete, import
│   ├── calculations/            # lifestyle-cost, freedom-metrics, purchase-analysis
│   ├── recurring/               # create, execute
│   ├── user/                    # profile, preferences
│   └── notifications/           # email, push
├── lib/
│   ├── db.ts                    # Prisma client singleton
│   ├── validations/             # Zod schemas (transaction, user, recurring)
│   ├── utils/                   # currency, date, calculations helpers
│   ├── auth/                    # config.ts, session.ts
│   └── api/                     # response.ts, error.ts
├── components/
│   ├── ui/                      # shadcn/ui base components
│   ├── features/                # transactions/, dashboard/, lifestyle/
│   └── shared/                  # header, nav, footer
├── types/                       # TypeScript types (SHARED)
│   ├── transaction.ts
│   ├── recurring.ts
│   ├── user.ts
│   ├── calculations.ts
│   └── index.ts
├── hooks/                       # React hooks (web-only)
└── prisma/
    ├── schema.prisma
    ├── seed.ts
    └── migrations/
```

---

## Database Schema

```prisma
enum TransactionType  { INCOME EXPENSE SAVING TRANSFER }
enum NecessityLevel   { IMPORTANT NEEDS WANTS }
enum ValueAlignment   { ALIGNED DEFAULT EXPERIENCE MATERIAL FREEDOM_ENABLING FREEDOM_LIMITING }
enum RecurringFrequency { WEEKLY MONTHLY YEARLY }

model Transaction {
  id             String          @id @default(cuid())
  userId         String
  date           DateTime
  amount         Decimal         @db.Decimal(12, 2)
  description    String
  type           TransactionType
  category       String
  necessityLevel NecessityLevel?
  valueAlignment ValueAlignment?
  isRecurring    Boolean         @default(false)
  recurringId    String?
  notes          String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurring      RecurringTransaction? @relation(fields: [recurringId], references: [id])
  @@index([userId, date])
  @@index([userId, type])
  @@index([userId, category])
}

model RecurringTransaction {
  id                     String             @id @default(cuid())
  userId                 String
  amount                 Decimal            @db.Decimal(12, 2)
  description            String
  type                   TransactionType
  category               String
  necessityLevel         NecessityLevel?
  valueAlignment         ValueAlignment?
  frequency              RecurringFrequency
  startDate              DateTime
  endDate                DateTime?
  nextDueDate            DateTime
  notificationDaysBefore Int                @default(3)
  isActive               Boolean            @default(true)
  lastCreatedDate        DateTime?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
  user                   User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions           Transaction[]
  @@index([userId, nextDueDate])
  @@index([userId, isActive])
}

model Category {
  id              String          @id @default(cuid())
  userId          String?
  name            String
  type            TransactionType
  isSystemDefault Boolean         @default(false)
  color           String          @default("#6B7280")
  icon            String          @default("📊")
  createdAt       DateTime        @default(now())
  user            User?           @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, name, type])
  @@index([userId, type])
}
```

---

## API Layer

### Conventions

- **Base URL**: `/api/v1`
- **Auth**: JWT via NextAuth.js
- **Success response**:
  ```json
  { "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 100 } }
  ```
- **Error response**:
  ```json
  { "error": { "message": "...", "code": "VALIDATION_ERROR", "details": [...] } }
  ```
- **Status codes**: `200` GET/PATCH/DELETE · `201` POST · `400` validation · `401` unauth · `403` forbidden · `404` not found · `409` conflict · `500` server error

### Endpoints

```
# Transactions
POST   /api/v1/transactions/infer        Rule-based NL parsing (LLM in future)
POST   /api/v1/transactions              Create
GET    /api/v1/transactions              List (with filters)
GET    /api/v1/transactions/:id          Get
PATCH  /api/v1/transactions/:id          Update
DELETE /api/v1/transactions/:id          Delete
POST   /api/v1/transactions/import       Bulk import (CSV)
GET    /api/v1/transactions/summary      Daily/weekly/monthly summary

# Recurring Transactions
POST   /api/v1/recurring                 Create
GET    /api/v1/recurring                 List
GET    /api/v1/recurring/:id             Get
PATCH  /api/v1/recurring/:id             Update
DELETE /api/v1/recurring/:id             Delete
POST   /api/v1/recurring/:id/execute     Manually execute

# Calculations
GET    /api/v1/calculations/lifestyle-cost
GET    /api/v1/calculations/freedom-metrics
GET    /api/v1/calculations/fi-projection
POST   /api/v1/calculations/purchase-check

# Categories
GET    /api/v1/categories
POST   /api/v1/categories
PATCH  /api/v1/categories/:id
DELETE /api/v1/categories/:id

# User
GET    /api/v1/user/profile
PATCH  /api/v1/user/profile
PATCH  /api/v1/user/preferences
GET    /api/v1/user/stats

# Reports
GET    /api/v1/reports/weekly
GET    /api/v1/reports/monthly
GET    /api/v1/reports/insights
```

### API Route Pattern

```typescript
// app/api/v1/transactions/route.ts
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(); // 1. Auth
    const body = await request.json();
    const validated = CreateTransactionSchema.parse(body); // 2. Validate
    const transaction = await createTransaction(userId, validated); // 3. Service
    return apiResponse(transaction, 201); // 4. Respond
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = ListTransactionsQuerySchema.parse(params);
    const { data, ...meta } = await listTransactions(userId, query);
    return apiResponse(data, 200, meta);
  } catch (error) {
    return apiError(error);
  }
}
```

---

## Business Logic (Key Interfaces)

```typescript
interface FreedomMetrics {
  fiNumber: number; // Dream cost × 12 × 25
  leanFiNumber: number; // 80% of dream
  fatFiNumber: number; // 150% of dream
  currentRunway: number; // Months of freedom
  fiProgress: number; // % to FI
  minimumWorkIncome: number; // Dream cost - passive income
  workOptionalProgress: number; // Passive income / dream cost
  emergencyFundTarget: number; // 6 months dream cost
  emergencyFundMonths: number; // Current coverage
  monthsToFI: number | null;
  fiDate: Date | null;
  savingsRate: number;
}

interface PurchaseAnalysis {
  freedomCost: { days: number; percentage: number };
  workCost: { hours: number } | null;
  fiImpact: { futureValue: number; daysSooner: number };
  alignmentScore: 'GREEN' | 'YELLOW' | 'RED';
}
```

---

## Authentication & Authorization

- All `/api/v1/*` routes require authentication (except auth routes)
- Users can only access their own data

```typescript
// lib/auth/session.ts
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session;
}

export async function getUserId() {
  const session = await requireAuth();
  return session.user.id;
}
```

```typescript
// lib/auth/config.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      },
      from: process.env.SMTP_FROM,
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
```

---

## Validation (Zod Schemas)

```typescript
// lib/validations/transaction.ts
const minimumDate = new Date('2023-01-01T00:00:00Z');

export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  description: z.string().min(3).max(500),
  date: z.coerce
    .date()
    .min(minimumDate, { message: 'Date must be on or after January 1, 2023' })
    .max(new Date(), { message: 'Date cannot be in the future' }),
  type: z.enum(Object.values(TransactionType)),
  categoryId: z.string().min(1, 'Category required'),
  necessityLevel: z.enum(Object.values(NecessityLevel)).optional(),
  valueAlignment: z.enum(Object.values(ValueAlignment)).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const ListTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(Object.values(TransactionType)).optional(),
  categoryId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

---

## Testing Strategy (TDD)

### TDD Workflow

1. Write test (red)
2. Write minimum code to pass (green)
3. Refactor (keep green)

### Coverage Targets

- Services: 90%+
- API Routes: 80%+
- Utilities: 90%+
- Components: 70%+

### Test Pyramid

- **60% Unit** — Services, utilities, calculations (co-located `*.test.ts`)
- **30% Integration** — API endpoints (Vitest + Supertest)
- **10% E2E** — Critical user flows (Playwright)

### Unit Test Pattern (Service Layer)

```typescript
// services/transactions/create.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createTransaction } from './create';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    transaction: { create: vi.fn() },
  },
}));

describe('createTransaction', () => {
  const userId = 'user_test_123';
  const validData = {
    date: new Date('2024-01-15'),
    amount: 100.5,
    description: 'Grocery shopping',
    type: 'EXPENSE' as const,
    categoryId: 'cat_food_123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create transaction with valid data', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: 'cat_food_123',
      name: 'Alimentação',
      type: 'EXPENSE',
      isSystemDefault: true,
      color: '#F97316',
      icon: '🍔',
      createdAt: new Date(),
    });
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: 'txn_1',
      userId,
      ...validData,
      amount: new Prisma.Decimal(validData.amount),
      necessityLevel: null,
      valueAlignment: null,
      isRecurring: false,
      recurringId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createTransaction(userId, validData);
    expect(result.userId).toBe(userId);
    expect(result.amount).toStrictEqual(new Prisma.Decimal(validData.amount));
  });

  it('should throw for invalid category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
    await expect(createTransaction(userId, validData)).rejects.toThrow(
      'Invalid category'
    );
  });
});
```

### Integration Test Pattern (API Routes)

```typescript
// tests/integration/transactions.test.ts
import { POST } from '@/app/api/v1/transactions/route';

describe('POST /api/v1/transactions', () => {
  it('should create transaction when authenticated', async () => {
    const request = new NextRequest('http://localhost/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        /* valid data */
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.data).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    // mock unauthenticated session, assert 401
  });
});
```

---

## Coding Guides & Lessons Learned

### TypeScript & Prisma Types

1. **Exporting Prisma model types** — wrap in `src/types/` to avoid spreading Prisma imports:

   ```typescript
   // src/types/recurring.ts
   import {
     RecurringTransaction,
     RecurringFrequency,
   } from '@/generated/prisma/client';
   export type { RecurringTransaction };
   export { RecurringFrequency };
   ```

   ```typescript
   // src/types/index.ts
   export * from './recurring';
   ```

2. **Importing Prisma types** — always from `@/types`, never from generated client:

   ```typescript
   // ✅ Correct
   import { RecurringTransaction } from '@/types';

   // ❌ Avoid — creates coupling to Prisma throughout codebase
   import { RecurringTransaction } from '@/generated/prisma/client';
   ```

3. **Vitest mock implementations** — use `mockResolvedValue`, not `mockImplementation`:

   ```typescript
   // ✅ No type errors
   vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({ id: 'rec_1', ... });

   // ❌ TypeScript errors (missing Prisma fluent API methods)
   vi.mocked(prisma.recurringTransaction.create).mockImplementation(async ({ data }) => ({ ... }));
   ```

4. **Vitest imports** — always import every utility used:
   ```typescript
   import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
   ```

### Testing Patterns

1. **Verifying function arguments** — use `expect.objectContaining`:

   ```typescript
   expect(prisma.recurringTransaction.create).toHaveBeenCalledWith(
     expect.objectContaining({
       data: expect.objectContaining({ nextDueDate: expectedNextDueDate }),
     })
   );
   ```

2. **Test data setup** — use fixed mock data with `mockResolvedValue`; verify behavior through assertions rather than dynamic implementations.

---

## Environment Variables

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
RESEND_API_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
ENABLE_GAMIFICATION="true"
ENABLE_EMAIL_NOTIFICATIONS="true"
```

---

## Development Workflow

- **Branch strategy**: `main` (production-ready) · feature branches (`features/...`) · PR required to merge
- **Commit convention**: Conventional Commits
- **Deployment**: Vercel auto-deploy on merge to main · preview on every PR

### Running Commands (Docker)

All commands must be executed **inside the Docker containers**, not on the host machine.

| Task                     | Command                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Start dev environment    | `docker compose up`                                                    |
| Unit + integration tests | `docker compose exec app pnpm test`                                    |
| Type check               | `docker compose exec app pnpm type-check`                              |
| Lint                     | `docker compose exec app pnpm lint`                                    |
| Build                    | `docker compose exec app pnpm build`                                   |
| Prisma migration         | `docker compose exec app pnpm prisma migrate dev`                      |
| E2E tests (local/host)   | `pnpm test:e2e`                                                        |
| E2E tests (Docker/CI)    | `docker compose --profile testing run playwright pnpm test:e2e:docker` |

**Email in dev**: All emails (e.g. magic links) are captured by Mailpit at `http://localhost:8025`. E2E tests can extract magic link URLs from the Mailpit HTTP API (`GET localhost:8025/api/v1/messages`) without needing real SMTP.

### Code Review Checklist

- [ ] Tests pass (unit + integration)
- [ ] Test coverage maintained/improved
- [ ] TypeScript errors: 0
- [ ] Linting errors: 0
- [ ] Mobile responsive

---

**Last Updated**: Feb 2026 | **Status**: In Development
