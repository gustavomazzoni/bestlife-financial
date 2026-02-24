# BestLifeOS API-First Architecture Documentation

## 🎯 Architecture Overview

BestLifeOS uses an **API-First architecture** built on Next.js 16, designed for seamless transition from web MVP to native mobile applications with maximum code reuse.

**Philosophy**: The architecture supports a user journey focused on freedom discovery - helping users define what truly matters, discover their Freedom Number, and make conscious financial choices aligned with their values.

### Core Principles

1. **Separation of Concerns**: Business logic is independent of presentation layer
2. **API-First**: All features exposed as REST APIs
3. **Code Reuse**: 70-80% of backend code shared between web and mobile
4. **Type Safety**: End-to-end TypeScript with Zod validation
5. **Testability**: Services isolated and easily testable (TDD approach)
6. **User-Centric**: Architecture supports natural language interaction, intelligent inference, and constant alignment monitoring

This is a Dockerized Application to make local development a breeze and also easy to replicate in other machines.
---

## 🏗️ Architecture Diagram

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

---

## 📁 Project Structure

```
bestlifeos-financial/
│
├── app/                                # Next.js App Router
│   │
│   ├── api/v1/                        # REST API (Mobile + Web)
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   │
│   │   ├── transactions/
│   │   │   ├── route.ts               # GET, POST /transactions
│   │   │   ├── [id]/route.ts          # GET, PATCH, DELETE /:id
│   │   │   ├── import/route.ts        # POST /import (CSV)
│   │   │   └── summary/route.ts       # GET /summary
│   │   │
│   │   ├── recurring/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── [id]/execute/route.ts
│   │   │
│   │   ├── calculations/
│   │   │   ├── lifestyle-cost/route.ts
│   │   │   ├── freedom-metrics/route.ts
│   │   │   ├── fi-projection/route.ts
│   │   │   └── purchase-check/route.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   │
│   │   ├── user/
│   │   │   ├── profile/route.ts
│   │   │   ├── preferences/route.ts
│   │   │   └── stats/route.ts
│   │   │
│   │   └── reports/
│   │       ├── weekly/route.ts
│   │       └── monthly/route.ts
│   │
│   ├── (frontend)/                         # Web-specific routes (RSC)
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Landing page
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Freedom metrics dashboard
│   │   │
│   │   ├── transactions/
│   │   │   ├── page.tsx               # List transactions
│   │   │   ├── new/page.tsx           # Create transaction
│   │   │   └── [id]/page.tsx          # Edit transaction
│   │   │
│   │   ├── lifestyle/
│   │   │   ├── current/page.tsx       # Current lifestyle cost
│   │   │   └── dream/page.tsx         # Dream lifestyle setup
│   │   │
│   │   ├── reports/
│   │   │   ├── weekly/page.tsx
│   │   │   └── monthly/page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── profile/page.tsx
│   │       └── preferences/page.tsx
│   │
│   ├── (auth)/                        # Auth-specific routes
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   └── layout.tsx                     # Root layout
│
├── services/                          # Business Logic Layer (SHARED)
│   │
│   ├── transactions/
│   │   ├── create.ts
│   │   ├── create.test.ts
│   │   ├── get.ts
│   │   ├── get.test.ts
│   │   ├── list.ts
│   │   ├── list.test.ts
│   │   ├── update.ts
│   │   ├── update.test.ts
│   │   ├── delete.ts
│   │   ├── delete.test.ts
│   │   ├── import.ts
│   │   ├── import.test.ts
│   │   └── index.ts
│   │
│   ├── calculations/
│   │   ├── lifestyle-cost.ts
│   │   ├── lifestyle-cost.test.ts
│   │   ├── freedom-metrics.ts
│   │   ├── freedom-metrics.test.ts
│   │   ├── purchase-analysis.ts
│   │   ├── purchase-analysis.test.ts
│   │   └── index.ts
│   │
│   ├── recurring/
│   │   ├── create.ts
│   │   ├── execute.ts
│   │   └── index.ts
│   │
│   ├── user/
│   │   ├── profile.ts
│   │   ├── preferences.ts
│   │   └── index.ts
│   │
│   └── notifications/
│       ├── email.ts
│       ├── push.ts
│       └── index.ts
│
├── lib/                               # Utilities & Config (SHARED)
│   │
│   ├── db.ts                          # Prisma client singleton
│   │
│   ├── validations/                   # Zod schemas (SHARED)
│   │   ├── transaction.ts
│   │   ├── user.ts
│   │   ├── recurring.ts
│   │   └── index.ts
│   │
│   ├── utils/                         # Helper functions (SHARED)
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── calculations.ts
│   │   └── index.ts
│   │
│   ├── auth/
│   │   ├── config.ts                  # NextAuth configuration
│   │   └── session.ts                 # Session helpers
│   │
│   └── api/
│       ├── response.ts                # API response helpers
│       └── error.ts                   # Error handling
│
├── components/                        # UI Components (Web-only)
│   │
│   ├── ui/                            # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── features/                      # Feature-specific components
│   │   ├── transactions/
│   │   │   ├── transaction-form.tsx
│   │   │   ├── transaction-list.tsx
│   │   │   └── transaction-card.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── freedom-metrics.tsx
│   │   │   ├── fi-progress-card.tsx
│   │   │   └── runway-card.tsx
│   │   │
│   │   └── lifestyle/
│   │       ├── cost-calculator.tsx
│   │       └── dream-questionnaire.tsx
│   │
│   └── shared/                        # Shared components
│       ├── header.tsx
│       ├── nav.tsx
│       └── footer.tsx
│
├── types/                             # TypeScript Types (SHARED)
│   ├── api.ts                         # API request/response types
│   ├── transaction.ts
│   ├── user.ts
│   ├── calculations.ts
│   └── index.ts
│
├── hooks/                             # React Hooks (Web-only)
│   ├── use-transactions.ts
│   ├── use-freedom-metrics.ts
│   └── use-auth.ts
│
├── prisma/                            # Database (SHARED)
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── tests/                             # Tests
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
└── config/                            # Configuration (SHARED)
    ├── constants.ts
    └── env.ts
```

---

## 🔌 API Layer Design

### REST API Conventions

**Base URL:** `/api/v1`

**Authentication:** JWT via NextAuth.js (session-based)

**Request Format:**
```json
{
  "data": { ... }
}
```

**Success Response Format:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response Format:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be positive"
      }
    ]
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PATCH, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Conflict (duplicate)
- `500 Internal Server Error` - Server error

---

## 📝 API Endpoint Structure

### Natural Language Transaction Entry

**Primary User Interface**: ChatGPT-like prompt box - "What's your Transaction?"

Users interact with the app through natural language entry, similar to ChatGPT. The app intelligently infers transaction details from natural language input.

**Example User Input:**
```
"Bought coffee and pastry for breakfast, R$ 25"
```

**Inferred Transaction:**
- Amount: R$ 25.00
- Category: Food
- Type: EXPENSE
- Description: "Coffee and pastry for breakfast"
- Value Alignment: WANTS (non-essential)
- Date: Today (if not specified)

**Implementation Notes:**
- **MVP**: Rule-based parsing using keyword matching, regex patterns, and context analysis
- **Future**: LLM integration (OpenAI API) for more accurate inference
- **Fallback**: If inference fails or is unclear, show structured form for manual entry
- **Service Layer**: `services/transactions/infer.ts` - Natural language inference logic
- **API Endpoint**: POST `/api/v1/transactions/infer` - Returns inferred transaction data before creation

**API Endpoint:**
```
POST /api/v1/transactions/infer
Body: { "text": "Bought coffee and pastry for breakfast, R$ 25" }
Response: { "data": { "inferred": {...}, "confidence": 0.95 } }
```

### Example: Transaction API Route

```typescript
// app/api/v1/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createTransaction, listTransactions } from '@/services/transactions'
import { CreateTransactionSchema } from '@/lib/validations/transaction'
import { apiResponse, apiError } from '@/lib/api/response'

// POST /api/v1/transactions - Create transaction
export async function POST(request: NextRequest) {
  try {
    // 1. Validate auth session and get user id
    const userId = await getUserId();

    // 2. Parse & Validate
    const body = await request.json();
    const validated = CreateTransactionSchema.parse(body);

    // 3. Call Service (Business Logic)
    const transaction = await createTransaction(userId, validated);

    // 4. Return Response
    return apiResponse(transaction, 201)
  } catch (error) {
    return apiError(error)
  }
}

// GET /api/v1/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    // 1. Validate auth session and get user id
    const userId = await getUserId();

    // 2. Parse & Validate Query Params
    const allPresentParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedQuery = ListTransactionsQuerySchema.parse(allPresentParams);

    // 3. Call Service
    const { data, ...meta } = await listTransactions(userId, validatedQuery);

    // 4. Return Response with Pagination
    return apiResponse(data, 200, meta);
  } catch (error) {
    return apiError(error)
  }
}
```

---

## 🛠️ Service Layer Design

### Example: Transaction Service

```typescript
// services/transactions/create.ts
import { prisma } from '@/lib/db'
import { CreateTransactionInput } from '@/lib/validations/transaction'
import { Transaction } from '@/types/transaction'

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput // CreateTransactionInput ensures the data structure is valid
): Promise<Transaction> {
  // Verify category exists and matches type
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId, type: data.type },
  });

  if (!category) {
    throw new Error('Invalid category');
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      userId,
    },
  });

  return transaction;
}
```

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

  const decimalAmount = new Prisma.Decimal(validData.amount);

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

    expect(result).toBeDefined();
    expect(result.amount).toStrictEqual(decimalAmount);
    expect(result.userId).toBe(userId);
    expect(result.categoryId).toBe('cat_food_123');
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        ...validData,
        userId,
      },
    });
  });

  it('should throw error for mismatched category type', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(createTransaction(userId, validData)).rejects.toThrow(
      'Invalid category'
    );
  });
});
```

---

## ✅ Validation Layer

### Shared Zod Schemas

```typescript
// lib/validations/transaction.ts
import { z } from 'zod';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';

const minimumDate = new Date('2023-01-01T00:00:00Z');
export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição muito curta').max(500),
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

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;
```

**Usage in API:**
```typescript
// Validates and throws ZodError if invalid
const validated = CreateTransactionSchema.parse(body)
```

**Usage in Web Forms:**
```typescript
// React Hook Form integration
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const form = useForm({
  resolver: zodResolver(CreateTransactionSchema),
})
```

**Usage in Mobile:**
```typescript
// Same schema, same validation!
import { CreateTransactionSchema } from '@/lib/validations/transaction'

const validate = (data) => {
  try {
    CreateTransactionSchema.parse(data)
    return { valid: true }
  } catch (error) {
    return { valid: false, errors: error.errors }
  }
}
```

---

## 🔐 Authentication & Authorization

### Session-Based Auth with NextAuth.js

```typescript
// lib/auth/config.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
```

### Authorization Middleware

```typescript
// lib/auth/session.ts
import { getServerSession } from 'next-auth'
import { authOptions } from './config'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  
  return session
}

export async function getUserId() {
  const session = await requireAuth()
  return session.user.id
}
```

**Usage in API Routes:**
```typescript
import { requireAuth } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const session = await requireAuth() // Throws if not authenticated
  
  // Continue with authenticated user
  const data = await getDataForUser(session.user.id)
  return apiResponse(data)
}
```

---

## 📱 Mobile Integration (Future)

### React Native API Client

```typescript
// mobile/src/lib/api.ts
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'https://lifeos.app/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      navigation.navigate('Login')
    }
    return Promise.reject(error)
  }
)

export default api
```

### Shared Type Usage

```typescript
// mobile/src/services/transactions.ts
import api from '@/lib/api'
import { CreateTransactionInput, Transaction } from '@/types/transaction' // SAME TYPES!

export const createTransaction = async (
  data: CreateTransactionInput
): Promise<Transaction> => {
  const response = await api.post('/transactions', data)
  return response.data.data
}

export const listTransactions = async (
  params: ListTransactionsQuery
): Promise<Transaction[]> => {
  const response = await api.get('/transactions', { params })
  return response.data.data
}
```

### Shared Validation

```typescript
// mobile/src/components/TransactionForm.tsx
import { CreateTransactionSchema } from '@/lib/validations/transaction' // SAME SCHEMA!

const TransactionForm = () => {
  const [errors, setErrors] = useState({})
  
  const handleSubmit = () => {
    try {
      // Client-side validation
      const validated = CreateTransactionSchema.parse(formData)
      
      // Submit to API
      await createTransaction(validated)
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors(error.flatten().fieldErrors)
      }
    }
  }
  
  return (/* form UI */)
}
```

---

## 🎨 Web Client Integration

### API Client Hook (React Query)

```typescript
// hooks/use-transactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateTransactionInput, Transaction } from '@/types/transaction'

export function useTransactions(params?: ListTransactionsQuery) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const response = await fetch('/api/v1/transactions?' + new URLSearchParams(params))
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const json = await response.json()
      return json.data
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create transaction')
      const json = await response.json()
      return json.data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
```

### Usage in Components

```typescript
// components/features/transactions/transaction-list.tsx
'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { TransactionCard } from './transaction-card'

export function TransactionList() {
  const { data: transactions, isLoading, error } = useTransactions({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading transactions</div>
  
  return (
    <div className="space-y-4">
      {transactions?.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  )
}
```

---

## 🧪 Testing Strategy

### 1. Service Layer Tests (Unit Tests)

```typescript
// services/transactions/create.test.ts
describe('createTransaction', () => {
  it('should create transaction with valid data', async () => {
    const data = { /* valid data */ }
    const result = await createTransaction(userId, data)
    expect(result).toBeDefined()
  })
  
  it('should throw error for invalid amount', async () => {
    const data = { amount: -100, /* ... */ }
    await expect(createTransaction(userId, data)).rejects.toThrow()
  })
})
```

### 2. API Route Tests (Integration Tests)

```typescript
// tests/integration/transactions.test.ts
import { POST } from '@/app/api/v1/transactions/route'

describe('POST /api/v1/transactions', () => {
  it('should create transaction when authenticated', async () => {
    const request = new NextRequest('http://localhost/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({ /* data */ }),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(201)
    
    const json = await response.json()
    expect(json.data).toBeDefined()
  })
  
  it('should return 401 when not authenticated', async () => {
    // Test unauthorized access
  })
})
```

### 3. E2E Tests (Playwright)

```typescript
// tests/e2e/transactions.spec.ts
test('should create transaction', async ({ page }) => {
  await page.goto('/transactions/new')
  await page.fill('[name="amount"]', '100')
  await page.fill('[name="description"]', 'Test transaction')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('.success-message')).toBeVisible()
})
```

---

## 📦 Code Sharing Strategy

### Shared Code (Web + Mobile)

These can be extracted into a shared package or copied:

```
shared/
├── types/              # TypeScript types
├── validations/        # Zod schemas
├── utils/              # Pure functions
└── constants/          # Constants
```

### Monorepo

```
lifeos/
├── apps/
│   ├── web/           # Next.js web app
│   └── mobile/        # React Native app
│
└── packages/
    ├── shared/        # Shared code
    ├── api-client/    # API client library
    └── ui/            # Shared UI components (future)
```

---

## 🚀 Deployment Strategy

### MVP (Next.js Only)

```
Vercel
├── Next.js App (SSR + API Routes)
└── Connected to PostgreSQL (Supabase)
```

### Future (Web + Mobile)

```
Vercel
├── Next.js App (SSR)
└── API Routes (consumed by both)
    ↓
    Consumed by:
    - Web (same app)
    - iOS App (App Store)
    - Android App (Play Store)
```

**No changes to backend needed!** Just deploy mobile apps that consume existing APIs.

---

## 📊 API Documentation

### Swagger/OpenAPI (Recommended)

Use `next-swagger-doc` to auto-generate API documentation:

```typescript
// lib/swagger.ts
import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api/v1',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LifeOS API',
        version: '1.0.0',
        description: 'Financial Freedom API',
      },
      servers: [
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development',
        },
        {
          url: 'https://lifeos.app/api/v1',
          description: 'Production',
        },
      ],
    },
  })
  return spec
}
```

**Accessible at:** `http://localhost:3000/api-docs`

---

## ✅ Benefits of This Architecture

### For MVP (Week 1-6)
- ✅ Fast development (Next.js features)
- ✅ Type-safe end-to-end
- ✅ Easy testing (TDD approach)
- ✅ Single deployment

### For Mobile (Future)
- ✅ API already exists and tested
- ✅ Reuse types, validations, utilities
- ✅ No backend changes needed
- ✅ Faster mobile development

### For Scale (Long-term)
- ✅ Can extract API to separate service later