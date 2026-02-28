# MVP Implementation Plan — BestLife Financial Module

## Context

Backend is ~55% complete: transactions, recurring transactions, auth, and database schema are all built and tested (21 test files). Auth route protection is also done (`src/proxy.ts`). The main gaps are frontend pages (~20% done), the calculations service (not started), and lightweight onboarding. The goal is to ship a working beta to 10–50 users in 2 weeks.
Each phase in this plan has precise success criteria: goal alignment, happy path flows, error conditions, and edge cases.

**User's core requirement**: Intentional money tracker — log transactions (via natural language), see where money is going, identify patterns, and make value-aligned financial choices toward freedom.

**Must-haves**: Dashboard, Recurring Transactions, Natural Language Entry, Auth (done).

---

## Version Overview

| Version | Week | Theme | Outcome |
|---|---|---|---|
| **v1** | Week 1 | Core Tracker | Onboard, log transactions via NL, basic dashboard |
| **v2** | Week 2 | Intentional Finance | Freedom metrics, recurring UI, spending patterns, deploy to beta |

---

## Docker Environment

The application runs inside Docker. **All commands must be executed inside the correct container.**

| What | Command prefix | Container |
|---|---|---|
| Unit + integration tests | `docker compose exec app pnpm test` | `lifeos-app-dev` |
| Type check | `docker compose exec app pnpm type-check` | `lifeos-app-dev` |
| Lint | `docker compose exec app pnpm lint` | `lifeos-app-dev` |
| Build | `docker compose exec app pnpm build` | `lifeos-app-dev` |
| Prisma migrations | `docker compose exec app pnpm prisma migrate dev` | `lifeos-app-dev` |
| E2E tests | `docker compose --profile testing run playwright pnpm test:e2e` | `lifeos-playwright` |

**Mailpit** (email testing): All dev emails are captured at `http://localhost:8025`.
E2E auth tests can extract magic link URLs directly from Mailpit's HTTP API
(`GET http://localhost:8025/api/v1/messages`) — no test bypass endpoint needed.

---

## Phase 1.1 — Lightweight Onboarding

**Goal**: Gate the app so new users provide the minimum data needed for all calculations
(monthly income, dream cost, savings) before accessing any page. This data enables
every metric in Phase 1.3 and 1.4. Triggered when `user.dreamLifestyleCost` is null.

**Schema change**: Add `activeIncomeMonthly Decimal @default(0) @db.Decimal(12, 2)`
to User model → new Prisma migration required before any API in this phase works.

**Redirect mechanism**: JWT flag (`onboardingCompleted` boolean). Set on initial login
via `jwt()` callback querying DB (`!!user.dreamLifestyleCost`). After
`PATCH /api/v1/user/profile` succeeds, client calls `session.update({ onboardingCompleted: true })`
to refresh the JWT. `proxy.ts` reads the flag and redirects if false.

### Happy Path Flows

1. **First-time user — full onboarding**
   - Signs in via magic link → JWT `onboardingCompleted = false` → proxy redirects to `/onboarding`
   - Step 1: enters monthly take-home income → validated → advances to Step 2
   - Step 2: enters dream lifestyle monthly cost → validated → advances to Step 3
   - Step 3: enters current savings/investments → submits → `PATCH /api/v1/user/profile`
     saves all three fields atomically
   - Client calls `session.update({ onboardingCompleted: true })` → JWT flag flipped
   - Redirected to `/dashboard`

2. **Returning user — skips onboarding**
   - Signs in → JWT `onboardingCompleted = true` → lands directly on `/dashboard`

3. **Interrupted onboarding (browser closed mid-wizard)**
   - User returns after closing during Step 2 → `dreamLifestyleCost` still null →
     JWT flag still false → redirected to `/onboarding` (starts from Step 1)

### Error Conditions

| Scenario | Expected |
|---|---|
| `activeIncomeMonthly` is negative | `400` + Zod field error (must be `>= 0` — passive-income-only users may have 0) |
| `dreamLifestyleCost` is zero or negative | `400` + Zod field error (must be `> 0` — zero breaks FI calculations) |
| `currentInvestments` is negative | `400` + Zod field error |
| Non-numeric value in any field | `400` + Zod field error |
| Any profile endpoint — unauthenticated | `401 Unauthorized` |
| Step form submitted with empty required field | Client-side validation blocks submission before API call |

### Edge Cases

| Scenario | Expected |
|---|---|
| User manually navigates to `/dashboard` with JWT flag false | proxy.ts redirects to `/onboarding` |
| User manually navigates to `/onboarding` after completing it | Allowed — no forced redirect; Phase 2.3 settings page becomes canonical update path |
| Very large BRL values (e.g., R$ 10,000,000,000) | Validate max against `Decimal(12,2)` column limit (max 10 digits before decimal) |
| `PATCH /user/profile` saves only 1 of 3 fields (partial save) | Must be atomic — partial saves leave user half-onboarded and break Phase 1.3 calculations |
| JWT flag `onboardingCompleted = false` but `dreamLifestyleCost` is set in DB | Can happen if session wasn't updated after prior save; `jwt()` callback re-checks DB on token refresh |

### Tests Required

**Unit + Integration** (`src/app/api/v1/user/profile/route.test.ts`):
- `GET /api/v1/user/profile` returns `activeIncomeMonthly`, `dreamLifestyleCost`, `currentInvestments`
- `PATCH /api/v1/user/profile` saves all three fields and returns updated profile
- `PATCH` returns `401` when unauthenticated
- `PATCH` returns `400` for negative `activeIncomeMonthly`
- `PATCH` returns `400` for zero or negative `dreamLifestyleCost`
- `PATCH` returns `400` for negative `currentInvestments`

**E2E** (`tests/e2e/onboarding.spec.ts`):
- New user after login lands on `/onboarding`
- Completing all 3 steps redirects to `/dashboard`
- Returning user (dreamLifestyleCost set) skips onboarding and lands directly on `/dashboard`

### Files

| File | Status |
|---|---|
| `prisma/schema.prisma` | modify — add `activeIncomeMonthly` field |
| `prisma/migrations/` | new migration |
| `src/lib/auth/config.ts` | modify — add `onboardingCompleted` to jwt/session callbacks |
| `src/lib/validations/user.ts` | create — `UserOnboardingSchema` (Zod) |
| `src/app/api/v1/user/profile/route.ts` | create — GET + PATCH |
| `src/app/(frontend)/onboarding/page.tsx` | create — 3-step wizard |
| `src/proxy.ts` | modify — add onboarding redirect logic |
| `src/types/next-auth.d.ts` | modify — add `onboardingCompleted` to session/JWT types |

### Reuse

- `src/lib/auth/session.ts` → `getUserId()`
- `src/lib/api/response.ts` → `apiResponse()`, `apiError()`
- Zod pattern from `src/lib/validations/transaction.ts`

---

---

## Phase 1.2 — Transaction Tracking UI

**Goal**: Give users a place to see all their transactions and manage them. The NL entry
flow (infer → confirm → save) is already fully implemented — this phase wraps it in a
proper list/detail page structure. All API and service logic is complete; this phase is
pure UI work.

**Reuse**: `transaction-quick-entry.tsx`, `transaction-infer-input.tsx`,
`inferred-transaction-card.tsx`, all transaction API routes + services.

**Create**: `transactions/page.tsx`, `transactions/[id]/page.tsx`,
`transaction-list.tsx`, `transaction-card.tsx`.

### Happy Path Flows

1. **Log transaction via NL entry** (on `/transactions` page)
   - User types "Gastei R$50 no supermercado" → infer → inferred card shown (amount,
     category, type, date)
   - User confirms → `POST /api/v1/transactions` → saved transaction appears at top of list

2. **Browse transaction history**
   - `/transactions` shows paginated list — each row: amount, description, category,
     necessity level, date, type
   - Filter by INCOME or EXPENSE → list narrows
   - Filter by date range → list narrows
   - Pagination controls move through pages

3. **Edit a transaction**
   - User clicks on a transaction card → navigates to `/transactions/[id]`
   - Form pre-filled with existing values
   - User changes amount → submits → `PATCH /api/v1/transactions/[id]` → redirected back to list

4. **Delete a transaction**
   - User clicks delete on a card → confirmation dialog → `DELETE /api/v1/transactions/[id]`
   - Item removed from list without page reload

### Error Conditions

| Scenario | Expected |
|---|---|
| Infer returns low confidence | Confidence badge shown (red/yellow/green) — user can still edit and confirm |
| Infer can't parse an amount | Inferred card shown with null amount — user must fill before confirming |
| `POST /transactions` with invalid `categoryId` | `400` shown as form error |
| `PATCH /transactions/[id]` on another user's transaction | `403 Forbidden` |
| `DELETE /transactions/[id]` on non-existent ID | `404 Not Found` |
| Date filter with `startDate > endDate` | `400` — shown as filter validation error |

### Edge Cases

| Scenario | Expected |
|---|---|
| 0 transactions in the list | Empty state shown with prompt to log the first one |
| Navigating past the last pagination page | Last page results or empty state |
| Direct URL to `/transactions/[nonexistent-id]` | Redirect to `/transactions` or 404 page |
| Infer finds no matching category | Category left null — user manually selects before confirming |
| Transaction linked to a recurring parent (`recurringId` set) | Still individually editable (independent from recurring) |
| Category selector in edit form when type changes (EXPENSE→INCOME) | Category list filters to match the new selected type |

### Tests Required

**E2E** (`tests/e2e/transactions.spec.ts`):
- User types NL input → inferred transaction shown for confirmation
- Confirming inferred transaction saves it and appears at top of list
- User can edit an existing transaction (amount, description, category)
- User can delete a transaction → it disappears from list
- Filtering by INCOME shows only income transactions

---

---

## Phase 1.3 — Calculations Service

**Goal**: Implement the financial calculation engine that powers the dashboard. TDD approach:
tests first. Depends on `activeIncomeMonthly` from Phase 1.1 migration.

**Reuse**: `calculateMonthlyExpenses()`, `calculateSavingsRate()`, `getCategoryBreakdown()`
from `src/services/calculations/index.ts`. Add new tests to
`src/services/calculations/calculations.test.ts`.

**Create**:
- `src/services/calculations/freedom-metrics.ts`
- `src/services/calculations/spending-analysis.ts`
- Extend `src/types/calculations.ts` — add `FreedomMetrics`, `SpendingBreakdown`
- `src/app/api/v1/calculations/freedom-metrics/route.ts`
- `src/app/api/v1/calculations/lifestyle-cost/route.ts`

**Key formulas**:
```
FI Number        = dreamLifestyleCost × 12 × 25
FI Progress %    = currentInvestments / fiNumber × 100
Current Runway   = currentInvestments / dreamLifestyleCost (months)
Savings Rate %   = (activeIncomeMonthly - avgMonthlyExpenses) / activeIncomeMonthly × 100
Value-Aligned %  = (NEEDS + IMPORTANT expenses) / total expenses × 100
```

Note: `activeIncomeMonthly` (declared at onboarding) is the savings rate baseline — not
recorded INCOME transactions. It's more reliable as a fixed reference.

### Happy Path Flows

1. **`GET /api/v1/calculations/freedom-metrics`**
   - Reads user: `dreamLifestyleCost`, `currentInvestments`, `activeIncomeMonthly`
   - Queries recent transactions for average monthly expenses
   - Returns: `fiNumber`, `fiProgress`, `currentRunway`, `savingsRate`, `monthsToFI`

2. **`GET /api/v1/calculations/lifestyle-cost`**
   - Returns user's `dreamLifestyleCost` (simple profile read)

3. **`calculateSpendingBreakdown(userId, 'month')`**
   - Queries transactions for the requested period
   - Returns: total by category, NecessityLevel breakdown (NEEDS / IMPORTANT / WANTS),
     value-aligned %

### Error Conditions

| Scenario | Expected |
|---|---|
| User has no transactions yet | All metrics return valid 0/null values — no errors thrown |
| `activeIncomeMonthly = 0` | Savings rate = 0 (no division by zero) |
| `dreamLifestyleCost` is null or 0 | `fiProgress = 0`, `fiNumber = 0` (no division by zero) |
| `GET /api/v1/calculations/freedom-metrics` unauthenticated | `401 Unauthorized` |

### Edge Cases

| Scenario | Expected |
|---|---|
| Only INCOME transactions, no expenses | Spending breakdown returns zeros; value-aligned % = 100 |
| `currentInvestments ≥ fiNumber` | `fiProgress = 100` (capped — user is already FI) |
| Savings rate ≤ 0 (spending ≥ income) | `monthsToFI = null` (FI unreachable at current rate) |
| Transactions with no `necessityLevel` set | Excluded from value-aligned % numerator; counted in denominator |
| Large Decimal values (float precision risk) | Compute percentages last; cast via `Number()` only at final step |

### Tests Required

**Unit** (`src/services/calculations/freedom-metrics.test.ts`):
- FI number = `dreamLifestyleCost × 12 × 25`
- Current runway = `currentInvestments / dreamLifestyleCost`
- Savings rate = `(activeIncomeMonthly - avgExpenses) / activeIncomeMonthly × 100`
- Returns correct 0/null values when user has no transactions (no errors)

**Unit** (`src/services/calculations/spending-analysis.test.ts`):
- Spending breakdown sums correctly by category
- NecessityLevel breakdown (NEEDS/IMPORTANT/WANTS) sums to total expenses
- Value-aligned % = (NEEDS + IMPORTANT) / total expenses

**Integration** (`src/app/api/v1/calculations/freedom-metrics/route.test.ts`):
- `GET /api/v1/calculations/freedom-metrics` returns all metric fields
- Returns `401` when unauthenticated

---

---

## Phase 1.4 — Basic Dashboard

**Goal**: The daily landing page after login. Must be immediately useful after onboarding
and logging a few transactions — shows key financial health at a glance.

**Modify**: `src/app/(frontend)/dashboard/page.tsx` (replace placeholder "Em breve" cards)

**Create**:
- `src/components/features/dashboard/metrics-overview.tsx` — 4 metric cards
- `src/components/features/dashboard/spending-chart.tsx` — spending by category (Recharts)
- `src/components/features/dashboard/recent-transactions.tsx` — last 10 transactions

**Reuse**: `GET /api/v1/calculations/freedom-metrics` (Phase 1.3),
`GET /api/v1/transactions?limit=10`, Recharts (already installed).

**Metrics (priority order)**:
1. Savings Rate % — this month
2. FI Progress % + current runway in months
3. Spending this month vs. dream lifestyle budget (progress bar)
4. Value-Aligned Spending % — (NEEDS + IMPORTANT) / total expenses

### Happy Path Flows

1. **First load after onboarding (no transactions yet)**
   - 4 metric cards render with 0 values — no errors or crashes
   - Recent transactions: empty state ("Log your first transaction")
   - Spending chart: hidden or shows empty state (not rendered without data)

2. **After logging 3+ transactions**
   - Metrics show computed savings rate, FI progress, spending vs. budget
   - Spending chart renders category breakdown
   - Recent transactions shows up to 10 most recent entries

3. **New transaction logged → navigate back to dashboard**
   - Fresh page load reflects updated metrics (no stale data)

### Error Conditions

| Scenario | Expected |
|---|---|
| Freedom metrics API errors | Error state per metric card — not a page crash |
| Transactions API errors | Error state in recent list — not a page crash |
| Spending this month exceeds `dreamLifestyleCost` | Progress bar capped at 100%, "over budget" indicator shown |
| `activeIncomeMonthly = 0` | Savings rate = 0% — valid 0, not a crash |

### Edge Cases

| Scenario | Expected |
|---|---|
| `fiProgress ≥ 100` | Show "Already FI!" state instead of >100% progress bar |
| Only INCOME transactions, no EXPENSE | Spending chart empty/hidden; savings rate shows high value |
| All transactions have no `necessityLevel` | Value-aligned % = 0, shown explicitly (not hidden) |
| Slow API responses | Loading skeleton per card while awaiting data |
| Recent transactions with `recurringId` set | Recurring indicator shown on the transaction card |

### Tests Required

**E2E** (`tests/e2e/dashboard.spec.ts`):
- All 4 metric cards render with numeric values (not empty/zero after transactions logged)
- Spending chart displays after at least one EXPENSE transaction exists
- Recent transactions list shows the 10 most recent entries
- Adding a new transaction via NL entry updates dashboard metrics on next load

---

---

## Phase 2.1 — Recurring Transactions UI

**Goal**: Users can view, create, edit, and manually execute scheduled income/expenses.
All API and service logic is complete — this phase is pure UI work.

**All recurring API routes already done** — reuse directly.

**Create**:
- `src/app/(frontend)/recurring/page.tsx` — list sorted by `nextDueDate`
- `src/app/(frontend)/recurring/new/page.tsx`
- `src/app/(frontend)/recurring/[id]/page.tsx` — edit form
- `src/components/features/recurring/recurring-list.tsx`
- `src/components/features/recurring/recurring-card.tsx` — days until due + "Execute now" button
- `src/components/features/recurring/recurring-form.tsx`

### Happy Path Flows

1. **Create a recurring transaction**
   - Navigate to `/recurring/new` → fill form (amount, description, type, category, frequency, startDate)
   - Submit → `POST /api/v1/recurring` → redirected to `/recurring` list

2. **View recurring list**
   - `/recurring` shows all active recurring sorted by `nextDueDate` (soonest first)
   - Each card: amount, description, frequency, days until due

3. **Execute a recurring transaction**
   - Click "Execute now" on a card → `POST /api/v1/recurring/[id]/execute`
   - Creates a transaction + updates `lastCreatedDate` and `nextDueDate` shown on the card

4. **Edit a recurring transaction**
   - Navigate to `/recurring/[id]` → form pre-filled
   - Submit → `PATCH /api/v1/recurring/[id]` → back to list with updated values

5. **Deactivate a recurring transaction**
   - Toggle `isActive = false` via PATCH → item disappears from the active list

### Error Conditions

| Scenario | Expected |
|---|---|
| Create with negative/zero amount | `400` shown as form error |
| Create with `endDate` before `startDate` | `400` validation error |
| Execute on an inactive recurring | API returns `404` or `400` — shown as error on the card |
| Execute on another user's recurring | `403 Forbidden` |
| List or any endpoint without auth | `401 Unauthorized` |

### Edge Cases

| Scenario | Expected |
|---|---|
| Recurring with `endDate` in the past | Visible in list but marked as expired |
| After executing, transaction appears in transaction list | Yes — execute creates a real transaction (Phase 1.2 list) |
| Multiple recurring with same `nextDueDate` | Stable sort by `createdAt` as tiebreaker |
| `frequency: YEARLY` — days until due crosses year boundary | Correctly computed via date-fns (already installed) |
| `notificationDaysBefore` in form | Include in form input — no notification UI built yet |
| Direct URL to `/recurring/[nonexistent-id]` | Redirect to `/recurring` or 404 page |

### Tests Required

**E2E** (`tests/e2e/recurring.spec.ts`):
- User can create a monthly recurring expense → appears in list with correct next due date
- "Execute now" creates a transaction and updates `lastCreatedDate` on the card
- User can edit frequency and amount → list reflects updated values
- User can deactivate a recurring transaction → no longer appears as active

---

---

## Phase 2.2 — Dashboard Enhancements & Spending Insights

**Goal**: Add deeper spending patterns to the dashboard — necessity-level breakdown
and a monthly income vs. expenses trend. Requires implementing the `transactions/summary`
API endpoint.

**Modify**: `src/app/(frontend)/dashboard/page.tsx`

**Create**:
- `src/components/features/dashboard/spending-by-necessity.tsx` — NEEDS / WANTS / IMPORTANT bar chart
- `src/components/features/dashboard/monthly-trend.tsx` — last 3 months income vs. expenses (Recharts)
- `src/app/api/v1/transactions/summary/route.ts` — `GET` with `period=month&months=3`

**Reuse**: `getCategoryBreakdown()`, `calculateSavingsRate()` from
`src/services/calculations/index.ts`; `listTransactions()` from
`src/services/transactions/list.ts`.

### Happy Path Flows

1. **Summary API**
   - `GET /api/v1/transactions/summary?period=month&months=3`
   - Returns monthly totals for INCOME and EXPENSE for each of the last 3 months
   - Format: `[{ month: '2026-01', income: 5000, expenses: 3200 }, ...]`

2. **Necessity-level breakdown chart**
   - Dashboard shows bar chart: NEEDS / IMPORTANT / WANTS segments
   - Values from current month's expenses filtered by `necessityLevel`

3. **Monthly trend chart**
   - Dashboard shows current month + 2 prior months as grouped bars (income vs. expenses)
   - Data fetched from summary API

### Error Conditions

| Scenario | Expected |
|---|---|
| `GET /api/v1/transactions/summary` unauthenticated | `401 Unauthorized` |
| `months` param is not a positive integer | `400` validation error |
| No transactions in queried months | Returns valid 0s for those months — not an empty array |

### Edge Cases

| Scenario | Expected |
|---|---|
| All expenses have no `necessityLevel` | Necessity chart shows all-zero — not hidden |
| Only 1 month of data exists (new user) | Monthly trend shows 1 bar, others are zero |
| A month has only INCOME and no EXPENSE | Expense bar = 0 for that month — chart renders correctly |
| Dashboard data fetched in parallel (Phase 1.4 + Phase 2.2 calls) | No race conditions or double-loading |

### Tests Required

**Unit + Integration** (`src/app/api/v1/transactions/summary/route.test.ts`):
- `GET /api/v1/transactions/summary` returns monthly totals for income and expenses
- Returns last 3 months of data when queried with `period=month&months=3`
- Returns `401` when unauthenticated

**E2E** (extend `tests/e2e/dashboard.spec.ts`):
- Necessity breakdown chart renders NEEDS / WANTS / IMPORTANT segments
- Monthly trend chart shows at least the current month bar

---

---

## Phase 2.3 — Navigation & Settings

**Goal**: Make the app navigable between sections and allow users to update their
financial profile after onboarding.

**Modify**: `src/app/(frontend)/layout.tsx` — add nav + header wrapper.
Also remove duplicated inline nav from `dashboard/page.tsx` (layout provides it now).

**Create**:
- `src/components/shared/nav.tsx` — mobile-first bottom nav (Dashboard · Transactions · Recurring · Settings)
- `src/components/shared/header.tsx` — top header: page title + user avatar/logout
- `src/app/(frontend)/settings/page.tsx`
- `src/app/(frontend)/settings/profile/page.tsx` — update income, dream budget, investments

**Reuse**: `GET + PATCH /api/v1/user/profile` (Phase 1.1)

### Happy Path Flows

1. **Navigation between pages**
   - Every `(frontend)` page shows bottom nav with 4 links (Dashboard, Transactions, Recurring, Settings)
   - Active link highlighted based on current route

2. **Update dream lifestyle budget**
   - `/settings/profile` → form pre-filled → change `dreamLifestyleCost` → submit
   - `PATCH /api/v1/user/profile` → navigate to `/dashboard` → FI Progress % reflects new value

3. **Update monthly income**
   - Change `activeIncomeMonthly` → submit → savings rate updates on next dashboard load

4. **Update current investments**
   - Change `currentInvestments` → submit → FI progress % and runway update on next load

### Error Conditions

| Scenario | Expected |
|---|---|
| `PATCH /user/profile` with invalid values | `400` shown as form error |
| Settings page accessed without auth | Layout redirects to `/login` (existing `getUserId()` guard) |

### Edge Cases

| Scenario | Expected |
|---|---|
| No profile image | Show initials (from name or email) in avatar |
| Header page title per route | "Dashboard" on `/dashboard`, "Transactions" on `/transactions`, etc. |
| Bottom nav on desktop | Functional — mobile-first, not broken on wider screens |
| `dreamLifestyleCost` updated in settings | `onboardingCompleted` JWT flag stays `true` — no re-onboarding triggered |
| Logout button | Moved from dashboard's inline nav to the header component |

### Tests Required

**E2E** (`tests/e2e/settings.spec.ts`):
- Bottom nav links navigate to the correct pages
- User updates dream lifestyle budget → FI Progress % on dashboard reflects new value
- User updates monthly income → savings rate on dashboard reflects new value

---

---

## Phase 2.4 — Missing shadcn/ui Components ✅ Effectively Complete

**Status**: All required components are already installed. From git status and file inspection:
`badge`, `dialog`, `progress`, `select`, `separator`, `tabs`, `textarea` are all present
under `src/components/ui/`. The `form` component was in the original install list but is not
needed — existing components use plain React state or react-hook-form directly, not the
shadcn `Form` wrapper.

**Action**: Run verification only — no install needed.

### Success Criteria

| Check | Expected |
|---|---|
| All `src/components/ui/*.tsx` files present | ✅ already done |
| `pnpm build` | No errors |
| `pnpm type-check` | 0 TypeScript errors |
| `pnpm lint` | 0 linting errors |

---

---

## Phase 2.5 — E2E Tests + Deploy

**Goal**: All E2E tests pass, the full user journey works end-to-end, and the app is
ready for beta deployment.

**E2E test files to create** (Playwright):
- `tests/e2e/auth.spec.ts` — sign in via magic link
- `tests/e2e/onboarding.spec.ts` — 3-step wizard
- `tests/e2e/transactions.spec.ts` — NL entry → appears in list
- `tests/e2e/dashboard.spec.ts` — metrics load after transactions logged
- `tests/e2e/recurring.spec.ts` — create and execute recurring
- `tests/e2e/settings.spec.ts` — update profile → dashboard metrics update

### Full User Journey (smoke test)

1. Sign in via email magic link → redirected to `/onboarding`
2. Complete 3-step onboarding → redirected to `/dashboard`
3. Log 3 transactions via NL entry
4. Verify dashboard shows savings rate + FI progress
5. Create a recurring monthly expense → appears in list with correct next due date
6. Update `dreamLifestyleCost` in settings → FI Progress % on dashboard updates

### Deploy Checklist

- Set Vercel env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`
- Run `prisma migrate deploy` on production DB
- `pnpm build` passes
- Invite beta users via email magic link

### Error Conditions

| Scenario | Expected |
|---|---|
| Magic link SMTP not configured | E2E auth tests fail with clear error — not a silent timeout |
| Test runs leave dirty DB state | Each E2E test cleans up created data (or uses isolated test users) |
| `pnpm build` fails before deploy | Block deployment — fix TypeScript/lint errors first |

### Edge Cases

| Scenario | Expected |
|---|---|
| Auth E2E magic link interception | Use Mailpit HTTP API (`GET localhost:8025/api/v1/messages`) to extract the link — no bypass needed |
| Vercel cold start + Prisma | Verify `DATABASE_URL` uses Supabase connection pooler |
| Beta user signs up with existing email | Existing account signs in normally (NextAuth handles this) |

### Pre-Launch Gate (all must pass, run inside Docker)

```bash
docker compose exec app pnpm type-check
docker compose exec app pnpm lint
docker compose exec app pnpm build
docker compose exec app pnpm test
docker compose --profile testing run playwright pnpm test:e2e
```
