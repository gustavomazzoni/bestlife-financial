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

## Phase 2.4 — Missing shadcn/ui Components and Build forms using React Hook Form and Zod

**Status**: All required components are already installed. From git status and file inspection:
`badge`, `dialog`, `progress`, `select`, `separator`, `tabs`, `textarea` are all present
under `src/components/ui/`. The `form` component from shadcn/ui should no longer be used, but we should investigate whether to use the <Field /> component, adding schema validation using Zod, error handling, accessibility, and more (check https://ui.shadcn.com/docs/forms/react-hook-form). The goal is to create a coding standard on how to build better forms in React with Zod for schema validation.

**Action**: Run verification only — no install needed.

### Success Criteria

| Check | Expected |
|---|---|
| All `src/components/ui/*.tsx` files present | ✅ already done |
| `docker compose exec app pnpm build` | No errors |
| `docker compose exec app pnpm type-check` | 0 TypeScript errors |
| `docker compose exec app pnpm lint` | 0 linting errors |

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
---

---

## Phase 2.6 — Calendar / Agenda View

### Context

Phases 1.1–2.4 are complete. Users can log and manage transactions and recurring transactions, but have no way to see upcoming financial events in a time-based view. This phase adds a calendar page so users can visually see upcoming recurring transactions (projected by frequency) and logged transactions by day/month, enabling them to prepare for upcoming expenses, incomes, and investments.

---

### Navigation Change

Replace the "Recorrências" bottom nav tab with "Agenda" (calendar). The recurring list moves inside the new `/calendar` page as a sub-tab ("Lista"). The `/recurring`, `/recurring/new`, and `/recurring/[id]` routes remain unchanged.

**`src/components/shared/nav.tsx`** — change `RIGHT_NAV_ITEMS[0]`:
```diff
- { href: '/recurring', icon: RefreshCw, label: 'Recorrências', testId: 'nav-recurring' }
+ { href: '/calendar', icon: CalendarDays, label: 'Agenda', testId: 'nav-calendar' }
```
Add `CalendarDays` to the `lucide-react` import. Remove `RefreshCw`.

Note: The `isActive()` helper uses `pathname.startsWith(href)`. Sub-pages `/recurring/new` and `/recurring/[id]` will not highlight the Agenda tab (those are accessed from within the page), which is acceptable.

---

### New Type

**`src/types/calendar.ts`** — unified event type for projections + actuals:

```typescript
import { TransactionType } from '@/types';

export type CalendarEventKind = 'recurring_projection' | 'actual';

export interface CalendarEvent {
  date: string;              // 'YYYY-MM-DD' (no timezone shift)
  description: string;
  amount: string;            // decimal string, pass to formatCurrency()
  type: TransactionType;
  kind: CalendarEventKind;
  sourceId: string;          // recurringId for projections, transactionId for actuals
  categoryIcon?: string;
  categoryName?: string;
}
```

Update **`src/types/index.ts`** — add `export * from './calendar';`

---

### Utility Functions

**`src/lib/utils/calendar.ts`** — pure functions, no I/O:

```typescript
// Reuse same frequency logic as src/services/recurring/execute.ts
import { addDays, addMonths, addYears, startOfDay, format } from 'date-fns';

export function projectRecurringOccurrences(
  recurrings: RecurringWithCategory[],
  startDate: Date,
  endDate: Date
): CalendarEvent[]
// For each active recurring:
//   1. Skip if recurring.endDate < startDate
//   2. Start cursor at startOfDay(nextDueDate)
//   3. While cursor <= endDate:
//      - If cursor >= startDate: push CalendarEvent (kind: 'recurring_projection')
//      - Advance cursor: WEEKLY → addDays(7), MONTHLY → addMonths(1), YEARLY → addYears(1)
//      - Break if cursor > recurring.endDate

export function transactionsToCalendarEvents(
  transactions: TransactionRow[]
): CalendarEvent[]
// Maps each transaction to CalendarEvent (kind: 'actual')
// date: format(new Date(t.date), 'yyyy-MM-dd')

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]>
// Groups events by their date string key

export function getCalendarGridDates(year: number, month: number): Date[]
// Returns 42 dates (6 rows × 7 cols) for the month grid,
// padded with prev/next month days to fill the grid
// Week starts on Monday (Brazilian locale)
```

**`src/lib/utils/calendar.test.ts`** — pure unit tests, no mocks needed:
- `projectRecurringOccurrences`: empty input, MONTHLY in-window, WEEKLY multiple occurrences, YEARLY out-of-window, skip expired, stop at endDate, MONTHLY Feb edge case
- `transactionsToCalendarEvents`: correct field mapping, kind='actual', date format
- `getCalendarGridDates`: returns exactly 42 dates, first date is Monday
- `groupEventsByDate`: groups same-date events, handles empty array

---

### Page & Components

#### `src/app/(frontend)/calendar/page.tsx` — Client component

State:
- `selectedMonth: Date` — initialized to `startOfMonth(new Date())`
- `selectedDay: string | null` — null on load
- `events: CalendarEvent[]` — merged from both APIs
- `loading: boolean`, `error: string | null`

On `selectedMonth` change: parallel fetch of:
1. `GET /api/v1/recurring?isActive=true&limit=100`
2. `GET /api/v1/transactions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=100`

Merge using `projectRecurringOccurrences` + `transactionsToCalendarEvents` + `groupEventsByDate`.

Layout:
```
Header (existing, sticky)
  Tabs: [Calendário] [Lista]        ← shadcn Tabs
    [Calendário tab]:
      MonthNav: < Março 2026 >      ← ChevronLeft/Right + month title
      CalendarGrid                  ← 7×6 grid
      DayAgenda                     ← selected day event list
    [Lista tab]:
      <RecurringList />             ← imported unchanged from features/recurring
      <Link href="/recurring/new">Nova</Link>
BottomNav (existing, fixed)
```

#### `src/components/features/calendar/calendar-grid.tsx` — Client component
Props: `gridDates: Date[], currentMonth: Date, eventsByDate: Map<string, CalendarEvent[]>, selectedDay: string | null, onDaySelect: (d: string) => void`

CSS grid: `grid grid-cols-7`. Day headers (Seg–Dom) in first row. 42 cells below via `CalendarDayCell`.

data-testid: `calendar-grid`

#### `src/components/features/calendar/calendar-day-cell.tsx` — Pure render
Props: `date: Date, isCurrentMonth, isToday, isSelected, events: CalendarEvent[], onSelect`

- Day number with `bg-indigo-600 text-white` when selected, `ring-2 ring-indigo-200` when today
- Outside-current-month days: `opacity-40`
- Up to 2 colored dots: INCOME=green, EXPENSE=red, SAVING=blue, TRANSFER=gray
- Projection dots: `opacity-50`
- Overflow: "+N" label when > 2 events

data-testid: `calendar-day-{YYYY-MM-DD}`

#### `src/components/features/calendar/day-agenda.tsx` — Client component
Props: `date: string | null, events: CalendarEvent[]`

- null date: "Selecione um dia para ver os eventos"  (data-testid: `day-agenda-empty`)
- date with 0 events: "Nenhum evento neste dia"
- Events: list of `CalendarEventRow`

data-testid: `day-agenda`

#### `src/components/features/calendar/calendar-event-row.tsx` — Pure render
Props: `event: CalendarEvent`

- Category icon + description + category name + formatted amount
- `kind === 'recurring_projection'`: dashed border + "Projetado" badge (data-testid: `event-projected-badge`) + amount in muted color
- `kind === 'actual'`: solid border + amount in green (INCOME) or red (EXPENSE)

#### `src/components/features/calendar/index.ts` — barrel exports

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/shared/nav.tsx` | Replace Recurring tab with Calendar tab (href, icon, label, testId) |
| `src/components/shared/header.tsx` | Update backTo for `/recurring/new` and `/recurring/[id]` → `'/calendar'`; add `'/calendar'` as top-level page title "Agenda" |
| `src/types/index.ts` | Add `export * from './calendar'` |
| `tests/e2e/settings.spec.ts` | Change `nav-recurring` → `nav-calendar`, URL check `/recurring` → `/calendar` |

---

### Happy Path Flows

1. **First open**: Tap "Agenda" tab → `/calendar` loads current month → grid renders with dots on days that have recurring transactions projected → today highlighted → no day selected yet

2. **Select a day with events**: Tap a day cell with a dot → `selectedDay` updates → agenda section shows event rows with amounts and categories; projected events show "Projetado" badge; actual transactions show confirmed style

3. **Navigate to next month**: Tap `>` chevron → month advances → `selectedDay` resets → two new API fetches fire → grid re-renders with next month's projections (MONTHLY recurrings appear on their recurring day-of-month)

4. **Switch to Lista tab**: Tap "Lista" tab → existing `RecurringList` component renders unchanged → user can manage recurring transactions as before

---

### Edge Cases

| Scenario | Expected |
|---|---|
| Empty month (no events) | Grid renders normally; agenda shows "Nenhum evento" |
| YEARLY recurring outside current month | 0 projections (cursor starts at nextDueDate, advances 1yr past endDate immediately) |
| Recurring already executed this month | Only actual transaction appears (kind: actual) on execution date; nextDueDate moved to next month so no double dot |
| Past month navigation | 0 projections (all nextDueDates are future); actual transactions show as kind: actual |
| Network error | Error message + retry button; no crash |
| > 2 events on same day | Cell shows 2 dots + "+N"; agenda shows full list |
| MONTHLY recurring on day 31 in a 28-day month | `addMonths` from date-fns handles this correctly (moves to last day of month) |

---

### Tests

**Unit** (`src/lib/utils/calendar.test.ts`) — pure functions, no mocks:
- All projection scenarios listed above
- `getCalendarGridDates` returns 42 dates
- `groupEventsByDate` groups correctly

**E2E** (`tests/e2e/calendar.spec.ts`) — follow pattern from `tests/e2e/recurring.spec.ts`:
- Unauthenticated user is redirected to `/login`
- Calendar grid renders with 7 day-of-week headers
- Tapping a day shows agenda section
- Recurring event appears as projection dot after creating a monthly recurring
- "Projetado" badge visible on projected event
- Month navigation updates heading
- "Lista" sub-tab shows recurring list
- "Agenda" nav tab is active on `/calendar`

Update `tests/e2e/settings.spec.ts`: change `nav-recurring` testId and `/recurring` URL assertion.

---

### Reuse

- `src/services/recurring/execute.ts:8-22` — `calculateNextDueDate` logic to replicate in `projectRecurringOccurrences`
- `src/components/features/recurring/recurring-list.tsx` — import unchanged in "Lista" tab
- `src/components/features/recurring/recurring-card.tsx` — `typeConfig` colors/labels pattern to mirror in `CalendarEventRow`
- `src/lib/api/response.ts` — `apiError`/`apiResponse` (no new API routes, but pattern reference)
- shadcn `Tabs`, `Badge` components already installed

---

### Verification

```bash
docker compose exec app pnpm test           # unit tests for calendar utility
docker compose exec app pnpm type-check     # 0 errors
docker compose exec app pnpm lint           # 0 errors
docker compose exec app pnpm build          # succeeds
pnpm test:e2e                               # calendar.spec.ts passes
```

Manual smoke test:
1. Open app → tap Agenda tab → confirm calendar grid renders
2. Create a monthly recurring → navigate to calendar → confirm dot on nextDueDate day
3. Tap that day → confirm event shows "Projetado" badge
4. Navigate to next month → confirm recurring projects on same day of month
5. Switch to "Lista" tab → confirm recurring list is usable

---

---

## Phase 2.7 — Scheduled Transactions & Upcoming Dashboard Widget

### Context

The app currently only captures *executed* transactions (past or present). But financial life is about *commitments*: when you hire someone, you've committed to pay them before the money moves. When you know rent is due in 5 days, you need to see that. The app is missing the planning dimension — it's a ledger, not a financial co-pilot.

This phase makes the app forward-looking by:
1. Allowing transactions to be scheduled (one-time, future-dated, committed but not yet executed)
2. Adding a "This Week" dashboard widget combining both scheduled one-time and recurring upcoming items
3. Letting users quickly mark items as executed directly from the dashboard

---

### Key Design Decisions

#### Decision 1: Model for Scheduled One-Time Transactions

**Chosen: Add `TransactionStatus` enum + `status` field to the existing `Transaction` model**

Rationale:
- A scheduled payment IS a transaction — just not yet confirmed. Same amount, category, type.
- Unified model means a single query surface, reused components, no duplication.
- Fully backward-compatible: default `EXECUTED` means all existing transactions are unaffected.
- Avoids a `ScheduledTransaction` model that would duplicate fields and bifurcate the codebase.

```prisma
enum TransactionStatus {
  PENDING   // Committed but not yet executed (future-dated)
  EXECUTED  // Confirmed as happened (default — all existing transactions)
}

model Transaction {
  ...
  status TransactionStatus @default(EXECUTED)  // ← new field
}
```

#### Decision 2: Auto-status Derivation

When creating a transaction:
- `date` in the future → default `status = PENDING`
- `date` today or in the past → default `status = EXECUTED`

User can always override (e.g., log a past missed payment as PENDING to confirm later).

#### Decision 3: Dashboard Upcoming Widget Data Sources

Two unified sources for "This Week" (next 7 days):
1. `Transaction WHERE status = PENDING AND date BETWEEN today AND today+7`
2. `RecurringTransaction WHERE isActive = true AND nextDueDate BETWEEN today AND today+7`

Today's items (date = today or nextDueDate = today) are visually highlighted as urgent.

#### Decision 4: Early Execution Allowed

Both one-time PENDING transactions and recurring projections can be executed before their due date. Users pay things early — the app should support that. The existing `execute` service for recurring requires `nextDueDate <= today`; we'll relax that for dashboard-triggered execution.

---

### Implementation Plan

#### Step 1: Schema Migration
**File**: `prisma/schema.prisma`

- Add `TransactionStatus { PENDING EXECUTED }` enum
- Add `status TransactionStatus @default(EXECUTED)` to `Transaction`
- Add `@@index([userId, status, date])` for upcoming query performance
- Run: `docker compose exec app pnpm prisma migrate dev --name add-transaction-status`

#### Step 2: Type Exports
**File**: `src/types/transaction.ts`

- Export `TransactionStatus` from `@/types` (following existing re-export pattern)

#### Step 3: Validation Updates
**File**: `src/lib/validations/transaction.ts`

- Remove `max(new Date())` constraint from `date` (allow future dates)
- Add `status: z.enum(['PENDING', 'EXECUTED']).optional()` to `CreateTransactionSchema` and `UpdateTransactionSchema`
- Keep minimum date constraint (`2023-01-01`)

#### Step 4: Service Layer

##### 4a. Update `createTransaction`
**File**: `src/services/transactions/create.ts`

Auto-derive status if not provided:
```typescript
const status = data.status ?? (data.date > new Date() ? 'PENDING' : 'EXECUTED');
```

##### 4b. New `executeTransaction`
**File**: `src/services/transactions/execute.ts` (new)

```typescript
// PENDING → EXECUTED
// Updates status, optionally updates date to today
executeTransaction(userId, transactionId): Promise<Transaction>
```

##### 4c. New `getUpcomingItems`
**File**: `src/services/dashboard/upcoming.ts` (new)

```typescript
interface UpcomingItem {
  id: string;
  kind: 'scheduled' | 'recurring';  // 'scheduled' = PENDING Transaction, 'recurring' = RecurringTransaction projection
  date: string;           // YYYY-MM-DD — the due date
  isToday: boolean;       // date === today
  description: string;
  amount: Decimal;
  type: TransactionType;
  categoryIcon?: string;
  categoryName?: string;
  recurringId?: string;   // if kind='recurring', the RecurringTransaction id
  transactionId?: string; // if kind='scheduled', the Transaction id
}

getUpcomingItems(userId: string, days?: number): Promise<UpcomingItem[]>
```

Implementation:
- Query 1: `prisma.transaction.findMany` WHERE `status=PENDING AND date BETWEEN today AND today+N AND userId`
- Query 2: `prisma.recurringTransaction.findMany` WHERE `isActive=true AND nextDueDate BETWEEN today AND today+N AND userId`
- Merge and sort by date ASC
- Run both queries in parallel (Promise.all)

#### Step 5: API Endpoints

##### 5a. New execute endpoint
**File**: `src/app/api/v1/transactions/[id]/execute/route.ts` (new)

```
POST /api/v1/transactions/:id/execute
→ 200: { data: Transaction }
→ 404: transaction not found
→ 400: already executed
```

##### 5b. Update list endpoint
**File**: `src/app/api/v1/transactions/route.ts` (update GET handler)

- Add `status` query param to `ListTransactionsQuerySchema`

##### 5c. Upcoming items endpoint
**File**: `src/app/api/v1/dashboard/upcoming/route.ts` (new)

```
GET /api/v1/dashboard/upcoming?days=7
→ 200: { data: UpcomingItem[] }
```

(Primarily for future mobile client; dashboard RSC calls service directly)

#### Step 6: Dashboard RSC Update
**File**: `src/app/(frontend)/dashboard/page.tsx`

- Add `getUpcomingItems(userId, 7)` to the `Promise.all` data fetch block
- Pass `upcomingItems` to new `UpcomingTransactions` component
- Place widget **between Quick Entry and MetricsOverview** (urgent items deserve top placement)

#### Step 7: `UpcomingTransactions` Component
**File**: `src/components/features/dashboard/upcoming-transactions.tsx` (new, RSC)

Visual design:
- Section header: "Esta Semana" with a calendar icon + count badge
- Empty state: "Nenhum compromisso nos próximos 7 dias" with a checkmark icon
- Today's items: amber/orange left border + "HOJE" badge
- Future items: normal card
- Each row shows: category icon, description, due date (relative: "Hoje", "Amanhã", "Sex, 14/03"), amount (color-coded by type), kind badge ("Recorrente" or nothing for one-time)
- Execute button (chevron/check icon): calls execute API, refreshes via `router.refresh()`
- Max 5 items shown, "Ver todos no Calendário →" link

Since the dashboard is RSC but execute requires client interactivity, the execute button should be a small Client Component wrapper (`UpcomingExecuteButton`).

**data-testid attrs**: `upcoming-transactions`, `upcoming-transactions-empty`, `upcoming-item`, `upcoming-item-today`, `upcoming-execute-btn`

#### Step 8: Transaction List & Form Updates
**File**: `src/app/(frontend)/transactions/page.tsx` (update list)
**File**: `src/components/features/transactions/transaction-form.tsx` (update form)

- Transaction list: show "PENDENTE" badge on PENDING items
- Transaction list: add "Executar" action button for PENDING items
- Transaction form: remove max-date validation from date input
- Transaction form: add optional status selector (auto-derived, but user can override)

#### Step 9: Tests (TDD)

**Unit tests**:
- `src/services/transactions/execute.test.ts` — PENDING→EXECUTED, already executed error, not found error
- `src/services/dashboard/upcoming.test.ts` — combines both sources, sorts by date, today flag

**Integration tests**:
- `tests/integration/transactions-execute.test.ts` — POST /api/v1/transactions/:id/execute
- `tests/integration/dashboard-upcoming.test.ts` — GET /api/v1/dashboard/upcoming

**E2E tests**:
- `tests/e2e/upcoming.spec.ts` — create scheduled transaction → appears on dashboard → execute → disappears from upcoming, appears in recent

---

### Critical Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `TransactionStatus` enum + `status` field to Transaction |
| `src/types/transaction.ts` | Re-export `TransactionStatus` |
| `src/lib/validations/transaction.ts` | Remove max-date, add status field |
| `src/services/transactions/create.ts` | Auto-derive status |
| `src/services/transactions/execute.ts` | New — PENDING → EXECUTED |
| `src/services/dashboard/upcoming.ts` | New — unified upcoming items |
| `src/app/api/v1/transactions/[id]/execute/route.ts` | New endpoint |
| `src/app/api/v1/dashboard/upcoming/route.ts` | New endpoint |
| `src/app/(frontend)/dashboard/page.tsx` | Add getUpcomingItems to Promise.all |
| `src/components/features/dashboard/upcoming-transactions.tsx` | New component |

### Reusable Existing Code

- `src/lib/utils/calendar.ts` → `projectRecurringOccurrences()` concept (port logic to service layer)
- `src/services/recurring/execute.ts` → reference for how recurring execution advances `nextDueDate`
- `src/lib/api/response.ts` → `apiResponse()`, `apiError()` (follow existing pattern)
- `src/lib/auth/session.ts` → `getUserId()` (auth pattern)
- `src/app/api/v1/recurring/[id]/execute/route.ts` → model for the new execute endpoint

---

### Verification

1. **Schema**: `docker compose exec app pnpm prisma migrate dev` → migration applies cleanly
2. **Types**: `docker compose exec app pnpm type-check` → 0 errors
3. **Tests**: `docker compose exec app pnpm test` → all pass (including new test files)
4. **E2E**:
   - Create a transaction with tomorrow's date → appears in "Esta Semana" on dashboard with PENDENTE badge
   - Create a recurring transaction due today → appears in "Esta Semana" with "HOJE" highlight
   - Click Execute on a dashboard item → item disappears from upcoming, appears in recent transactions
   - Navigate to Calendar → scheduled item appears on correct date
5. **Backwards compatibility**: All existing transactions have `status = EXECUTED` via DB default — no data migration needed

---

---

## Phase 2.7.1 Revision — Unify Scheduled & Recurring into `ScheduledTransaction`

### Context

Phase 2.7 added `TransactionStatus { PENDING | EXECUTED }` to the `Transaction` model to represent one-time future commitments. This was pragmatic but created a semantic problem: **Transaction should mean "something that happened"** — it is the financial ledger, the source of truth for metrics. Mixing future commitments into that table forces every calculation to filter by `status`, and corrupts the historical record with entries that may never materialise.

The deeper insight: **a recurring transaction IS a scheduled transaction that repeats**. There should be one concept — `ScheduledTransaction` — covering both one-time future commitments and repeating ones. The current split between `RecurringTransaction` (separate model) and PENDING `Transaction` rows (inline) is an accidental inconsistency.

This revision:
1. Removes `TransactionStatus` / `status` from `Transaction` — ledger is pure again
2. Renames `RecurringTransaction` → `ScheduledTransaction` with a `frequency` field that includes `ONCE`
3. Migrates PENDING transactions → `ScheduledTransaction(ONCE)`
4. Renames the UI section "Recorrente" → "Agendadas" to reflect the unified concept

---

### New Unified Model

```
Transaction           ← historical ledger (only executed facts, no future items)
ScheduledTransaction  ← all future commitments, one-time or repeating
  frequency: ONCE | WEEKLY | MONTHLY | YEARLY
```

```prisma
enum ScheduleFrequency {
  ONCE       # replaces the PENDING Transaction concept
  WEEKLY
  MONTHLY
  YEARLY
}

model ScheduledTransaction {
  id                     String            @id @default(cuid())
  userId                 String
  amount                 Decimal           @db.Decimal(12, 2)
  description            String
  type                   TransactionType
  categoryId             String
  necessityLevel         NecessityLevel?
  valueAlignment         ValueAlignment?
  frequency              ScheduleFrequency
  startDate              DateTime          # ONCE: the scheduled date; RECURRING: start of recurrence
  endDate                DateTime?         # RECURRING only — null = indefinite
  nextOccurrence         DateTime          # ONCE: the date; RECURRING: next due date
  notificationDaysBefore Int               @default(3)
  isActive               Boolean           @default(true)
  lastExecutedDate       DateTime?
  notes                  String?
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt
  user                   User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  category               Category          @relation(fields: [categoryId], references: [id])
  transactions           Transaction[]
  @@index([userId, nextOccurrence])
  @@index([userId, frequency, isActive])
}

model Transaction {
  # Remove: status, isRecurring, recurringId
  # Add:    scheduledId String? (FK → ScheduledTransaction, replaces recurringId)
  ...
  scheduledId  String?
  scheduled    ScheduledTransaction? @relation(fields: [scheduledId], references: [id])
  @@index([userId, date])
  @@index([userId, type])
  @@index([userId, categoryId])
}

# Delete: TransactionStatus enum, RecurringTransaction model, RecurringFrequency enum (folded into ScheduleFrequency)
```

---

### Execution Logic

**ONCE on execute:**
- Create `Transaction` row (date = executionDate ?? today)
- Set `ScheduledTransaction.isActive = false`, `lastExecutedDate = executionDate`

**RECURRING on execute:**
- Create `Transaction` row (same as today)
- Advance `nextOccurrence` using current `calculateNextDueDate` logic
- If `nextOccurrence > endDate`: set `isActive = false`

**Upcoming dashboard widget** simplifies to a single query:
```typescript
prisma.scheduledTransaction.findMany({
  where: { userId, isActive: true, nextOccurrence: { gte: today, lt: cutoff } },
  include: { category: true }
})
```

---

### Migration Plan

#### Step 1 — Schema & Prisma migration
- Add `ScheduledTransaction` model with `ScheduleFrequency` enum
- Add `scheduledId` to `Transaction`; keep `isRecurring`+`recurringId`+`status` temporarily (for migration SQL)
- Write custom migration SQL:
  1. INSERT RecurringTransaction → ScheduledTransaction (map `nextDueDate` → `nextOccurrence`, `RecurringFrequency` values unchanged)
  2. INSERT PENDING Transactions → ScheduledTransaction (frequency=ONCE, date → startDate & nextOccurrence)
  3. UPDATE Transaction.scheduledId from recurringId (for executed recurring transactions)
  4. DELETE PENDING Transaction rows
  5. DROP RecurringTransaction, DROP Transaction.{status, isRecurring, recurringId}
- Run: `docker compose exec app pnpm prisma migrate dev --name unify-scheduled-transaction`

#### Step 2 — Types
- Add `src/types/scheduled.ts` — export `ScheduledTransaction`, `ScheduleFrequency`
- Update `src/types/transaction.ts` — remove `TransactionStatus`, update `TransactionRow` (remove isRecurring, add scheduledId)
- Update `src/types/index.ts` — export from scheduled.ts; deprecate recurring.ts exports

#### Step 3 — Service layer (`src/services/scheduled/`)
Create new directory, replacing `src/services/recurring/`:

| New file | Based on | Key changes |
|---|---|---|
| `create.ts` | recurring/create.ts | Add ONCE path (no frequency validation, startDate = nextOccurrence) |
| `execute.ts` | recurring/execute.ts + transactions/execute.ts | Branch on frequency: ONCE sets isActive=false, RECURRING advances nextOccurrence. Accept optional `executionDate`. Remove "not due yet" check for ONCE. |
| `list.ts` | recurring/list.ts | Add `frequency` filter; default shows all active |
| `get.ts` | recurring/get.ts | Field rename only |
| `update.ts` | recurring/update.ts | ONCE: only allow amount/description/date/category; RECURRING: existing logic |
| `delete.ts` | recurring/delete.ts | ONCE: hard delete (no history); RECURRING: soft delete (isActive=false) |
| `index.ts` | — | Re-export all |

Update `src/services/transactions/execute.ts` — remove (merged into scheduled/execute.ts).
Update `src/services/dashboard/upcoming.ts` — single query to ScheduledTransaction (remove two-query merge).
Update `src/services/transactions/list.ts` — remove `status` filter; `isRecurring` → `scheduledId != null`.

#### Step 4 — Validation (`src/lib/validations/scheduled.ts`)
```typescript
// Discriminated union
const CreateScheduledSchema = z.discriminatedUnion('frequency', [
  z.object({ frequency: z.literal('ONCE'), date: z.coerce.date().min(tomorrow), ... }),
  z.object({ frequency: z.enum(['WEEKLY','MONTHLY','YEARLY']), startDate: ..., endDate: optional, ... }),
])
```
Remove `status` from `CreateTransactionSchema` and `UpdateTransactionSchema`.
Remove `status` from `ListTransactionsQuerySchema`.

#### Step 5 — API routes
- `src/app/api/v1/scheduled/route.ts` (GET list, POST create) — replaces `/recurring/route.ts`
- `src/app/api/v1/scheduled/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/v1/scheduled/[id]/execute/route.ts` (POST) — handles both ONCE and RECURRING
- Delete `src/app/api/v1/recurring/` directory
- Delete `src/app/api/v1/transactions/[id]/execute/route.ts` (merged into scheduled execute)
- Delete `src/app/api/v1/dashboard/upcoming/route.ts` internal changes only (service updated)

#### Step 6 — UI (rename Recorrente → Agendadas)
**Pages:**
- `src/app/(frontend)/recurring/` → `src/app/(frontend)/scheduled/`
  - `page.tsx` — title "Agendadas", fetch `/api/v1/scheduled`, show both ONCE and RECURRING with frequency badge
  - `new/page.tsx` — form for creating any scheduled transaction
  - `[id]/page.tsx` — edit/view; "Desativar" only for RECURRING; "Excluir" for ONCE

**Components (`src/components/features/scheduled/`):**
- `scheduled-card.tsx` (replaces recurring-card.tsx) — conditional rendering by frequency
- `scheduled-list.tsx` (replaces recurring-list.tsx)
- `scheduled-form.tsx` (replaces recurring-form.tsx) — frequency selector drives conditional fields:
  - ONCE: date picker (future only)
  - RECURRING: startDate, endDate (optional), frequency dropdown

**Navigation (`src/components/shared/nav.tsx`):**
- Update route href `/recurring` → `/scheduled`
- Update label "Recorrente" → "Agendadas"
- Update icon (calendar-clock or similar fits better)

**Transaction card (`src/components/features/transactions/transaction-card.tsx`):**
- Remove PENDENTE badge and execute button (PENDING transactions no longer exist in Transaction table)
- `isRecurring` → `scheduledId != null` for recurring indicator icon

**Transaction list (`src/app/(frontend)/transactions/`):**
- Remove PENDING filter/handling entirely

**Dashboard (`src/components/features/dashboard/upcoming-transactions.tsx` + `upcoming-execute-button.tsx`):**
- Update `UpcomingItem.kind` from `'scheduled'|'recurring'` → `'ONCE'|recurring-frequency`
- Or simplify: `UpcomingItem.isRecurring: boolean` is sufficient for UI

#### Step 7 — Tests
- `src/services/scheduled/*.test.ts` — port from recurring tests, add ONCE-specific cases
- `src/app/api/v1/scheduled/*.test.ts` — port from recurring route tests
- Delete: `src/services/recurring/*.test.ts`, `src/app/api/v1/recurring/*.test.ts`
- Update: `src/services/dashboard/upcoming.test.ts` — single-query mock
- Update: `src/lib/validations/transaction.test.ts` — remove status/future-date tests
- `tests/e2e/upcoming.spec.ts` — update API calls from `/transactions` (PENDING creation) to `/scheduled` (ONCE creation)

---

### Critical Files

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add ScheduledTransaction, ScheduleFrequency; remove TransactionStatus, RecurringTransaction |
| `src/types/scheduled.ts` | New — ScheduledTransaction, ScheduleFrequency exports |
| `src/types/transaction.ts` | Remove TransactionStatus; update TransactionRow |
| `src/lib/validations/scheduled.ts` | New — discriminated union schema |
| `src/lib/validations/transaction.ts` | Remove status field |
| `src/services/scheduled/` | New directory (6 files), replaces recurring/ |
| `src/services/dashboard/upcoming.ts` | Single-query simplification |
| `src/services/transactions/list.ts` | Remove status filter |
| `src/app/api/v1/scheduled/` | New directory (3 route files) |
| `src/app/(frontend)/scheduled/` | Renamed from recurring/ (3 pages) |
| `src/components/features/scheduled/` | New directory (3 components) |
| `src/components/shared/nav.tsx` | Update label + route |
| `src/components/features/transactions/transaction-card.tsx` | Remove PENDING/execute UX |
| `tests/e2e/upcoming.spec.ts` | Update to use /scheduled for ONCE creation |

### Reusable Existing Code
- `src/services/recurring/execute.ts` → `calculateNextDueDate()` function — copy as-is
- `src/services/recurring/create.ts` → category validation + nextDueDate calc — reuse directly
- `src/components/features/recurring/recurring-card.tsx` → structure, execute dialog pattern
- `src/components/features/recurring/recurring-form.tsx` → field layout, RHF+Zod patterns
- `src/components/features/transactions/execute-transaction-dialog.tsx` — reuse unchanged for scheduled execute

---

### Verification
1. `docker compose exec app pnpm prisma migrate dev` → migration applies cleanly; no PENDING rows in Transaction, no RecurringTransaction table
2. `docker compose exec app pnpm type-check` → 0 errors
3. `docker compose exec app pnpm test` → all pass
4. Manual smoke test:
   - Create one-time scheduled transaction ("Pagamento consultor sexta R$500") → appears in /scheduled and upcoming widget
   - Create recurring transaction (monthly rent) → appears in /scheduled with MENSAL badge
   - Execute one-time → disappears from /scheduled, appears in /transactions history
   - Execute recurring → appears in /transactions history, nextOccurrence advances
   - Dashboard upcoming widget shows both kinds in "Esta Semana"
   - Financial calculations (freedom metrics, spending breakdown) unchanged — no PENDING pollution
5. `pnpm test:e2e` → E2E suite passes including upcoming.spec.ts

---

---

