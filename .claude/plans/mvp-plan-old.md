# MVP Implementation Plan — BestLife Financial Module

## Context

Backend is ~55% complete: transactions, recurring transactions, auth, and database schema are all built and tested (21 test files). Auth route protection is also done (`src/proxy.ts`). The main gaps are frontend pages (~20% done), the calculations service (not started), and lightweight onboarding. The goal is to ship a working beta to 10–50 users in 2 weeks.

**User's core requirement**: Intentional money tracker — log transactions (via natural language), see where money is going, identify patterns, and make value-aligned financial choices toward freedom.

**Must-haves**: Dashboard, Recurring Transactions, Natural Language Entry, Auth (done).

---

## Version Overview

| Version | Week | Theme | Outcome |
|---|---|---|---|
| **v1** | Week 1 | Core Tracker | Onboard, log transactions via NL, basic dashboard |
| **v2** | Week 2 | Intentional Finance | Freedom metrics, recurring UI, spending patterns, deploy to beta |

---

## v1: Core Tracker (Week 1)

### Phase 1.1 — Lightweight Onboarding (Days 1–2, ~4h)

**Goal**: 3-step flow capturing the minimum for meaningful calculations. Triggered when `user.dreamLifestyleCost` is null.

**Schema change**: Add `activeIncomeMonthly Decimal @default(0) @db.Decimal(12, 2)` to User model → new Prisma migration.

**Onboarding steps**:
1. **Monthly Income** — total take-home income → saves `activeIncomeMonthly`
2. **Dream Lifestyle** — monthly cost of ideal life → saves `dreamLifestyleCost`
3. **Current Savings** — total investments/savings → saves `currentInvestments`

**Files**:
- `src/lib/validations/user.ts` *(new)* — `UserOnboardingSchema` (Zod)
- `src/app/api/v1/user/profile/route.ts` *(new)* — GET + PATCH user profile
- `src/app/(frontend)/onboarding/page.tsx` *(new)* — 3-step wizard UI

**Logic**: After auth, `src/proxy.ts` checks `dreamLifestyleCost`; if null → redirect to `/onboarding`.

**Reuse**: `src/lib/auth/session.ts` (getUserId), `src/lib/api/response.ts` (apiResponse, apiError)

**Acceptance Criteria**:
- [ ] **Unit tests** (`src/app/api/v1/user/profile/route.test.ts`):
  - `GET /api/v1/user/profile` returns user profile fields
  - `PATCH /api/v1/user/profile` updates `activeIncomeMonthly`, `dreamLifestyleCost`, `currentInvestments`
  - Returns `401` when unauthenticated
  - Returns `400` for invalid input (negative income, negative budget)
- [ ] **E2E test** (`tests/e2e/onboarding.spec.ts`):
  - New user after login lands on `/onboarding`
  - Completing all 3 steps redirects to `/dashboard`
  - Returning user skips onboarding and lands directly on `/dashboard`

---

### Phase 1.2 — Transaction Tracking UI (Days 2–3, ~6h)

**Goal**: Users can log, view, and manage transactions.

**Files**:
- `src/app/(frontend)/transactions/page.tsx` *(new)* — list + NL entry at top
- `src/app/(frontend)/transactions/[id]/page.tsx` *(new)* — edit transaction
- `src/components/features/transactions/transaction-list.tsx` *(new)*
- `src/components/features/transactions/transaction-card.tsx` *(new)*

**Already exists — reuse**:
- `src/components/features/transactions/transaction-infer-input.tsx` — NL input box
- `src/components/features/transactions/transaction-quick-entry.tsx` — confirmation/edit form
- All transaction API routes (`/api/v1/transactions`, `/api/v1/transactions/[id]`, `/api/v1/transactions/infer`)

**UI flow**:
- NL prompt at top ("What's your transaction?") → infer → confirm/edit → save
- Below: paginated list of transactions (amount, description, category, necessity level, date)
- Filter by type (INCOME/EXPENSE) and date range

**Acceptance Criteria**:
- [ ] **E2E tests** (`tests/e2e/transactions.spec.ts`):
  - User types NL input → inferred transaction shown for confirmation
  - Confirming inferred transaction saves it and appears at top of list
  - User can edit an existing transaction (amount, description, category)
  - User can delete a transaction → it disappears from list
  - Filtering by INCOME shows only income transactions

---

### Phase 1.3 — Calculations Service (Days 3–4, ~5h)

**Goal**: Core financial calculations powering the dashboard. Follow TDD — write tests first.

**Schema note**: Depends on `activeIncomeMonthly` added in Phase 1.1.

**Files**:
- `src/types/calculations.ts` *(new)* — `FreedomMetrics`, `SpendingBreakdown` interfaces; export from `src/types/index.ts`
- `src/services/calculations/freedom-metrics.ts` *(new)*
- `src/services/calculations/spending-analysis.ts` *(new)*
- `src/app/api/v1/calculations/freedom-metrics/route.ts` *(new)*
- `src/app/api/v1/calculations/lifestyle-cost/route.ts` *(new)*

**Key functions**:
```typescript
// freedom-metrics.ts
calculateFreedomMetrics(userId: string): Promise<FreedomMetrics>
// Inputs: user.dreamLifestyleCost, user.currentInvestments, user.activeIncomeMonthly
// Returns: fiNumber (dream × 12 × 25), fiProgress %, currentRunway (months),
//          savingsRate %, monthsToFI

// spending-analysis.ts
calculateSpendingBreakdown(userId, period: 'week'|'month'|'year'): Promise<SpendingBreakdown>
// Returns: total by category, breakdown by NecessityLevel, value-aligned %
```

**Reuse**:
- `src/services/transactions/list.ts` — query transactions by period
- `src/services/calculations/calculations.test.ts` — test file already exists, add tests here

**Acceptance Criteria**:
- [ ] **Unit tests** (`src/services/calculations/freedom-metrics.test.ts`):
  - FI number = `dreamLifestyleCost × 12 × 25`
  - Current runway = `currentInvestments / dreamLifestyleCost`
  - Savings rate = `(income - expenses) / income × 100`
  - Returns correct values when user has no transactions yet (zeroes, not errors)
- [ ] **Unit tests** (`src/services/calculations/spending-analysis.test.ts`):
  - Spending breakdown sums correctly by category
  - NecessityLevel breakdown sums to total expenses
  - Value-aligned % = (NEEDS + IMPORTANT) / total expenses
- [ ] **Integration tests** (`src/app/api/v1/calculations/freedom-metrics/route.test.ts`):
  - `GET /api/v1/calculations/freedom-metrics` returns all metric fields
  - Returns `401` when unauthenticated

---

### Phase 1.4 — Basic Dashboard (Day 5, ~4h)

**Goal**: Landing page after login shows key metrics and recent activity.

**Files**:
- `src/app/(frontend)/dashboard/page.tsx` *(modify — currently exists but empty)*
- `src/components/features/dashboard/metrics-overview.tsx` *(new)* — 4 metric cards
- `src/components/features/dashboard/spending-chart.tsx` *(new)* — spending by category (Recharts)
- `src/components/features/dashboard/recent-transactions.tsx` *(new)* — last 10 transactions

**Metrics (priority order from PRODUCT.md)**:
1. **Savings Rate %** this month
2. **FI Progress %** + current runway in months
3. **Spending this month** vs. dream lifestyle budget (progress bar)
4. **Value-Aligned Spending %** (NEEDS + IMPORTANT / total)

**Reuse**: Recharts (installed), `/api/v1/calculations/freedom-metrics`, `/api/v1/transactions` (limit=10)

**Acceptance Criteria**:
- [ ] **E2E tests** (`tests/e2e/dashboard.spec.ts`):
  - All 4 metric cards render with numeric values (not empty/zero after transactions logged)
  - Spending chart displays after at least one EXPENSE transaction exists
  - Recent transactions list shows the 10 most recent entries
  - Adding a new transaction via NL entry updates dashboard metrics on next load

---

## v2: Intentional Finance (Week 2)

### Phase 2.1 — Recurring Transactions UI (Days 6–7, ~5h)

**Goal**: Users can view, create, edit, and execute scheduled income/expenses.

**Files**:
- `src/app/(frontend)/recurring/page.tsx` *(new)* — list sorted by nextDueDate
- `src/app/(frontend)/recurring/new/page.tsx` *(new)*
- `src/app/(frontend)/recurring/[id]/page.tsx` *(new)*
- `src/components/features/recurring/recurring-list.tsx` *(new)*
- `src/components/features/recurring/recurring-card.tsx` *(new)* — shows days until due, "Execute now" button
- `src/components/features/recurring/recurring-form.tsx` *(new)*

**All recurring API routes already done** — reuse directly:
- `src/app/api/v1/recurring/route.ts` (GET, POST)
- `src/app/api/v1/recurring/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/v1/recurring/[id]/execute/route.ts` (POST)

**Acceptance Criteria**:
- [ ] **E2E tests** (`tests/e2e/recurring.spec.ts`):
  - User can create a monthly recurring expense → appears in list with correct next due date
  - "Execute now" creates a transaction and updates `lastCreatedDate`
  - User can edit frequency and amount → list reflects updated values
  - User can deactivate a recurring transaction → it no longer appears as active

---

### Phase 2.2 — Dashboard Enhancements & Spending Insights (Days 7–8, ~4h)

**Goal**: Deeper spending patterns and necessity-level breakdown visible on dashboard.

**Files**:
- `src/app/(frontend)/dashboard/page.tsx` *(modify)*
- `src/components/features/dashboard/spending-by-necessity.tsx` *(new)* — NEEDS / WANTS / IMPORTANT breakdown (bar chart)
- `src/components/features/dashboard/monthly-trend.tsx` *(new)* — last 3 months income vs. expenses
- `src/app/api/v1/transactions/summary/route.ts` *(new)* — implement existing summary endpoint

**Acceptance Criteria**:
- [ ] **Unit tests** (`src/app/api/v1/transactions/summary/route.test.ts`):
  - `GET /api/v1/transactions/summary` returns monthly totals for income and expenses
  - Returns last 3 months of data when queried with `period=month&months=3`
  - Returns `401` when unauthenticated
- [ ] **E2E tests** (extend `tests/e2e/dashboard.spec.ts`):
  - Necessity breakdown chart renders NEEDS / WANTS / IMPORTANT segments
  - Monthly trend chart shows at least current month bar

---

### Phase 2.3 — Navigation & Settings (Days 8–9, ~3h)

**Goal**: App is navigable and users can update their financial profile.

**Files**:
- `src/components/shared/nav.tsx` *(new)* — mobile-first bottom nav: Dashboard · Transactions · Recurring · Settings
- `src/components/shared/header.tsx` *(new)* — top header with page title + user avatar
- `src/app/(frontend)/settings/page.tsx` *(new)*
- `src/app/(frontend)/settings/profile/page.tsx` *(new)* — update income, dream budget, investments

**Reuse**: `/api/v1/user/profile` (built in Phase 1.1)

**Acceptance Criteria**:
- [ ] **E2E tests** (`tests/e2e/settings.spec.ts`):
  - Bottom nav links navigate to correct pages
  - User updates dream lifestyle budget → dashboard FI Progress % updates accordingly
  - User updates monthly income → savings rate on dashboard reflects new value

---

### Phase 2.4 — Missing shadcn/ui Components (Day 9, ~1h)

Install missing base components needed across all pages:
```bash
npx shadcn@latest add select dialog form tabs badge
```

Files created automatically under `src/components/ui/`.

**Acceptance Criteria**:
- [ ] `pnpm build` completes with no errors after install
- [ ] `pnpm type-check` returns 0 errors

---

### Phase 2.5 — E2E Tests + Deploy (Days 9–10, ~4h)

**E2E tests (Playwright)**:
- `tests/e2e/auth.spec.ts` — sign in via magic link
- `tests/e2e/onboarding.spec.ts` — complete 3-step onboarding
- `tests/e2e/transactions.spec.ts` — NL entry → transaction appears in list
- `tests/e2e/dashboard.spec.ts` — metrics load after transactions logged
- `tests/e2e/recurring.spec.ts` — create and execute recurring transaction
- `tests/e2e/settings.spec.ts` — update profile, dashboard reflects changes

**Deploy checklist**:
- Set Vercel env vars (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, RESEND_API_KEY)
- Run `prisma migrate deploy` on production DB
- `pnpm build` passes
- Invite beta users (email magic link — no password needed)

**Acceptance Criteria**:
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] `pnpm build` succeeds
- [ ] `pnpm type-check` returns 0 errors
- [ ] `pnpm lint` returns 0 errors
- [ ] Full user journey smoke test passes end-to-end on production URL

---

## Critical Files Reference

| What | Path | Status |
|---|---|---|
| Auth middleware | `src/proxy.ts` | ✅ done |
| Auth config | `src/lib/auth/config.ts` | ✅ done |
| Session helpers | `src/lib/auth/session.ts` | ✅ done |
| API response helpers | `src/lib/api/response.ts` | ✅ done |
| Transaction services | `src/services/transactions/` | ✅ all done |
| Recurring services | `src/services/recurring/` | ✅ all done |
| NL entry components | `src/components/features/transactions/transaction-infer-input.tsx` | ✅ done |
| Calculations test file | `src/services/calculations/calculations.test.ts` | ✅ exists |
| DB schema | `prisma/schema.prisma` | ✅ complete |
| User validations | `src/lib/validations/user.ts` | ❌ create |
| Calculations types | `src/types/calculations.ts` | ❌ create |
| User profile API | `src/app/api/v1/user/profile/route.ts` | ❌ create |

---

## Global Verification Rules

- **Backend phases** (service + API route): must have unit tests + integration tests before moving to next phase (`pnpm test && pnpm test:integration`)
- **Frontend phases** (pages + components): must have E2E tests covering the happy path before moving to next phase (`pnpm test:e2e`)
- **Before beta launch**: `pnpm type-check && pnpm lint && pnpm build && pnpm test:e2e` all pass clean

**Full user journey smoke test**:
1. Sign in via email magic link → redirected to onboarding
2. Complete 3-step onboarding → redirected to dashboard
3. Log 3 transactions via NL entry
4. Verify dashboard shows savings rate + FI progress
5. Create a recurring monthly expense
6. Verify recurring appears in list with correct next due date
7. Update profile (change dream budget) → verify dashboard metrics update
