# Week 3: Recurring Transactions & CSV Import - Detailed Breakdown

## 📋 Overview

**Goal**: Enable users to manage recurring transactions and bulk import historical data from Brazilian banks.

**Timeline**: 5 days

**Dependencies**: Week 2 (Transaction CRUD) must be complete

---

## 🗂️ Task 3.1: Recurring Transaction Service Layer (Day 1)

### Phase 3.1.1: Write Tests for Recurring Transaction CRUD

**File**: `services/recurring/create.test.ts`

**Test Cases**:
```typescript
describe('createRecurringTransaction', () => {
  it('should create recurring transaction with valid data')
  it('should calculate initial nextDueDate correctly for WEEKLY')
  it('should calculate initial nextDueDate correctly for MONTHLY')
  it('should calculate initial nextDueDate correctly for YEARLY')
  it('should throw error for invalid categoryId')
  it('should throw error for negative amount')
  it('should throw error for endDate before startDate')
  it('should throw error for startDate in the past')
})
```

**Claude Code Prompt**:
```bash
claude-code "Write tests for createRecurringTransaction service.
File: services/recurring/create.test.ts
Test cases:
- Create with valid data (WEEKLY, MONTHLY, YEARLY frequencies)
- Calculate nextDueDate correctly for each frequency
- Validate categoryId exists
- Reject negative amounts
- Reject endDate before startDate
- Reject past startDate
Follow pattern in services/transactions/create.test.ts"
```

**Acceptance Criteria**:
- ✅ All 8 test cases written
- ✅ Tests fail (red phase)
- ✅ Mock setup for prisma.recurring and prisma.category

---

### Phase 3.1.2: Implement Recurring Transaction Service

**File**: `services/recurring/create.ts`

**Function Signature**:
```typescript
export async function createRecurringTransaction(
  userId: string,
  data: CreateRecurringInput
): Promise<RecurringTransaction>
```

**Business Rules**:
1. Validate category exists and matches transaction type
2. Calculate nextDueDate based on frequency:
   - WEEKLY: startDate + 7 days
   - MONTHLY: same day next month
   - YEARLY: same day next year
3. Ensure startDate is not in the past
4. Ensure endDate > startDate (if provided)
5. Set notificationDaysBefore default to 3

**Claude Code Prompt**:
```bash
claude-code "Implement createRecurringTransaction to pass tests.
File: services/recurring/create.ts
Business rules:
- Validate category exists and type matches
- Calculate nextDueDate: WEEKLY=+7d, MONTHLY=+1mo, YEARLY=+1yr
- Reject past startDate
- Ensure endDate > startDate
- Default notificationDaysBefore = 3
Use date-fns for date calculations"
```

**Acceptance Criteria**:
- ✅ All tests pass (green phase)
- ✅ Uses CreateRecurringSchema validation
- ✅ Returns RecurringTransaction with category included

---

### Phase 3.1.3: Implement List/Get/Update/Delete Services

**Files**: 
- `services/recurring/list.ts`
- `services/recurring/get.ts`
- `services/recurring/update.ts`
- `services/recurring/delete.ts`

**Claude Code Prompt**:
```bash
claude-code "Create recurring transaction CRUD services following transaction pattern:

1. list.ts - List user's recurring transactions
   - Filter by isActive (default true)
   - Sort by nextDueDate
   - Include category

2. get.ts - Get single recurring transaction
   - Verify userId ownership
   - Include category

3. update.ts - Update recurring transaction
   - Recalculate nextDueDate if frequency/startDate changed
   - Verify userId ownership

4. delete.ts - Soft delete (set isActive = false)
   - Don't delete created transaction instances

Reference: services/transactions/*.ts"
```

**Acceptance Criteria**:
- ✅ All 4 services implemented
- ✅ Each has corresponding test file
- ✅ All tests pass

---

## 🗂️ Task 3.2: Recurring Transaction Execution (Day 1-2)

### Phase 3.2.1: Write Tests for Execute Service

**File**: `services/recurring/execute.test.ts`

**Test Cases**:
```typescript
describe('executeRecurringTransaction', () => {
  it('should create transaction from recurring')
  it('should update lastCreatedDate')
  it('should calculate next nextDueDate for WEEKLY')
  it('should calculate next nextDueDate for MONTHLY')
  it('should calculate next nextDueDate for YEARLY')
  it('should set isActive=false if reached endDate')
  it('should throw error if not due yet')
  it('should link created transaction to recurring (recurringId)')
})
```

**Claude Code Prompt**:
```bash
claude-code "Write tests for executeRecurringTransaction service.
File: services/recurring/execute.test.ts
Test cases:
- Create transaction from recurring template
- Update lastCreatedDate and nextDueDate
- Calculate next due date for each frequency
- Deactivate if reached endDate
- Reject if not due yet
- Set recurringId on created transaction"
```

---

### Phase 3.2.2: Implement Execute Service

**File**: `services/recurring/execute.ts`

**Function Signature**:
```typescript
export async function executeRecurringTransaction(
  userId: string,
  recurringId: string
): Promise<Transaction>
```

**Business Logic**:
1. Verify recurring belongs to user
2. Verify nextDueDate <= today
3. Create transaction with all recurring fields
4. Set transaction.recurringId = recurringId
5. Update recurring:
   - lastCreatedDate = today
   - nextDueDate = calculate next (based on frequency)
   - If nextDueDate > endDate: set isActive = false

**Claude Code Prompt**:
```bash
claude-code "Implement executeRecurringTransaction.
File: services/recurring/execute.ts
Logic:
- Verify ownership and due date
- Create transaction copying all fields from recurring
- Set transaction.recurringId
- Update recurring: lastCreatedDate, nextDueDate
- Deactivate if endDate reached
Use date-fns addDays/addMonths/addYears"
```

**Acceptance Criteria**:
- ✅ All tests pass
- ✅ Transaction created with recurringId link
- ✅ Recurring dates updated correctly
- ✅ Auto-deactivates when done

---

## 🗂️ Task 3.3: Recurring Transaction API Routes (Day 2)

### Phase 3.3.1: Create API Routes

**Files**:
- `app/api/v1/recurring/route.ts` (POST, GET)
- `app/api/v1/recurring/[id]/route.ts` (GET, PATCH, DELETE)
- `app/api/v1/recurring/[id]/execute/route.ts` (POST)

**Claude Code Prompt**:
```bash
claude-code "Create recurring transaction API routes.

Files:
1. app/api/v1/recurring/route.ts
   POST - createRecurringTransaction
   GET - listRecurringTransactions (filter: isActive)

2. app/api/v1/recurring/[id]/route.ts
   GET - getRecurringTransaction
   PATCH - updateRecurringTransaction
   DELETE - deleteRecurringTransaction (soft delete)

3. app/api/v1/recurring/[id]/execute/route.ts
   POST - executeRecurringTransaction

Follow pattern in app/api/v1/transactions/
Use getUserId() for auth
Use apiResponse/apiError helpers"
```

**Acceptance Criteria**:
- ✅ All 6 endpoints working
- ✅ Authentication required
- ✅ Proper error handling
- ✅ Include category in responses

---

### Phase 3.3.2: Write API Integration Tests

**File**: `tests/integration/recurring-api.test.ts`

**Claude Code Prompt**:
```bash
claude-code "Write API integration tests for recurring endpoints.
File: tests/integration/recurring-api.test.ts
Test all 6 endpoints:
- POST /recurring (create)
- GET /recurring (list with isActive filter)
- GET /recurring/:id
- PATCH /recurring/:id
- DELETE /recurring/:id (verify soft delete)
- POST /recurring/:id/execute (verify transaction created)
Follow pattern in tests/integration/transactions-api.test.ts"
```

**Acceptance Criteria**:
- ✅ All endpoints tested
- ✅ Auth tests (401)
- ✅ Validation tests (400)
- ✅ Not found tests (404)
- ✅ All tests pass

---

## 🗂️ Task 3.4: Recurring Transaction Notifications (Day 3)

### Phase 3.4.1: Create Notification Service

**File**: `services/notifications/recurring-reminders.ts`

**Function**:
```typescript
export async function sendRecurringReminders(): Promise<{
  sent: number
  failed: number
}>
```

**Logic**:
1. Query recurring transactions where:
   - isActive = true
   - nextDueDate is in 3 days
   - lastReminderSent != nextDueDate (avoid duplicate notifications)
2. Group by userId
3. For each user, send ONE email with:
   - Total amount due in 3 days
   - Count of recurring transactions
   - List of transactions (description, amount, date)
4. Update lastReminderSent

**Claude Code Prompt**:
```bash
claude-code "Create recurring reminder notification service.
File: services/notifications/recurring-reminders.ts

Function: sendRecurringReminders()
Logic:
- Find recurring transactions due in 3 days (isActive=true)
- Group by userId
- Send ONE email per user with:
  * Total amount: R$ X.XX
  * Count: Y transactions
  * List: description, amount, date
- Update lastReminderSent field
- Return { sent: N, failed: M }

Use Resend/SMTP for email
Template: simple HTML table"
```

**Database Change Needed**:
```prisma
model RecurringTransaction {
  // Add field:
  lastReminderSent  DateTime?
}
```

**Acceptance Criteria**:
- ✅ Groups by user correctly
- ✅ Sends one email per user
- ✅ Email includes total amount and count
- ✅ Doesn't send duplicates
- ✅ Returns statistics

---

### Phase 3.4.2: Create Cron Job API Route

**File**: `app/api/cron/recurring-reminders/route.ts`

**Claude Code Prompt**:
```bash
claude-code "Create cron job endpoint for recurring reminders.
File: app/api/cron/recurring-reminders/route.ts

GET /api/cron/recurring-reminders
- Verify cron secret (env: CRON_SECRET)
- Call sendRecurringReminders()
- Return statistics
- Log results

This will be called by Vercel Cron (or similar) daily"
```

**Acceptance Criteria**:
- ✅ Protected by secret token
- ✅ Calls notification service
- ✅ Returns JSON stats
- ✅ Logs for monitoring

---

### Phase 3.4.3: Setup Vercel Cron (Config Only)

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/recurring-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Environment Variable**:
```
CRON_SECRET=your-random-secret-here
```

**Acceptance Criteria**:
- ✅ Cron configured to run daily at 9 AM
- ✅ Secret configured in env

---

## 🗂️ Task 3.5: CSV Import - Backend (Day 3-4)

### Phase 3.5.1: Create Bank Parser Service

**File**: `services/import/parsers/index.ts`

**Supported Banks**:
- Nubank
- XP Investimentos
- Banco do Brasil
- Itaú
- Inter
- Bradesco

**Function Signature**:
```typescript
interface ParsedTransaction {
  date: Date
  amount: number
  description: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  category?: string
  rawData: Record<string, any>
}

export async function parseCSV(
  file: File,
  bankType?: string
): Promise<{
  transactions: ParsedTransaction[]
  unmappedColumns?: string[]
  errors: string[]
}>
```

**Claude Code Prompt**:
```bash
claude-code "Create CSV parser for Brazilian banks.
File: services/import/parsers/index.ts

Support banks:
1. Nubank - columns: date, category, title, amount
2. XP - columns: Data, Entrada/Saída, Produto, Descrição, Valor
3. Banco do Brasil - columns: Data, Histórico, Débito, Crédito
4. Itaú - columns: data, lançamento, valor, saldo
5. Inter - columns: Data, Descrição, Valor
6. Bradesco - columns: Data, Histórico, Valor

Use papaparse library for CSV parsing.
Auto-detect bank by column patterns.
Return parsed transactions + errors.
Don't save to DB yet - just parse."
```

**Dependencies**:
```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

**Acceptance Criteria**:
- ✅ Parses all 6 bank formats
- ✅ Auto-detects bank type
- ✅ Validates required fields
- ✅ Returns errors for invalid rows
- ✅ Doesn't save to DB

---

### Phase 3.5.2: Create Duplicate Detection Service

**File**: `services/import/duplicate-detection.ts`

**Function**:
```typescript
export async function detectDuplicates(
  userId: string,
  transactions: ParsedTransaction[]
): Promise<{
  duplicates: ParsedTransaction[]
  unique: ParsedTransaction[]
}>
```

**Logic**: Match by date + amount + description (exact match)

**Claude Code Prompt**:
```bash
claude-code "Create duplicate detection for CSV import.
File: services/import/duplicate-detection.ts

Function: detectDuplicates(userId, transactions)
Logic:
- Query existing user transactions
- For each parsed transaction:
  * Check if exists: same date, amount, description
  * If exists: mark as duplicate
  * If not: mark as unique
- Return { duplicates: [], unique: [] }

Use efficient query (fetch all user transactions once, compare in memory)"
```

**Acceptance Criteria**:
- ✅ Detects exact duplicates
- ✅ Efficient (single DB query)
- ✅ Returns separated arrays

---

### Phase 3.5.3: Create Category Mapping Service

**File**: `services/import/category-mapping.ts`

**Function**:
```typescript
export async function mapCategories(
  transactions: ParsedTransaction[]
): Promise<{
  mapped: Array<ParsedTransaction & { categoryId: string }>
  unmapped: ParsedTransaction[]
  newCategories: string[]
}>
```

**Logic**:
1. For each transaction with category name:
   - Try to find existing category (fuzzy match)
   - If found: use existing categoryId
   - If not found: mark for new category creation
2. Group unmapped transactions

**Claude Code Prompt**:
```bash
claude-code "Create category mapping for CSV import.
File: services/import/category-mapping.ts

Function: mapCategories(transactions)
Logic:
- For each transaction.category (from CSV):
  * Fuzzy match to existing categories (normalize: lowercase, trim)
  * If match: set categoryId
  * If no match: add to newCategories list
- Return { mapped: [], unmapped: [], newCategories: [] }

Use string similarity for fuzzy matching (allow 80%+ match)"
```

**Acceptance Criteria**:
- ✅ Maps to existing categories
- ✅ Fuzzy matching works
- ✅ Identifies new categories needed
- ✅ Doesn't create duplicates

---

### Phase 3.5.4: Create Import Session Service

**File**: `services/import/create-session.ts`

**New Model** (add to Prisma schema):
```prisma
model ImportSession {
  id                String   @id @default(cuid())
  userId            String
  fileName          String
  bankType          String?
  totalTransactions Int
  duplicateCount    Int
  parsedData        Json
  status            String   @default("PENDING") // PENDING, CONFIRMED, CANCELLED
  createdAt         DateTime @default(now())
  confirmedAt       DateTime?
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, status])
}
```

**Function**:
```typescript
export async function createImportSession(
  userId: string,
  file: File
): Promise<{
  sessionId: string
  summary: {
    total: number
    duplicates: number
    unique: number
    newCategories: string[]
  }
  preview: ParsedTransaction[]
}>
```

**Claude Code Prompt**:
```bash
claude-code "Create CSV import session service.
File: services/import/create-session.ts

Steps:
1. Parse CSV (call parseCSV)
2. Detect duplicates (call detectDuplicates)
3. Map categories (call mapCategories)
4. Create ImportSession record (save parsed data)
5. Return session summary + preview (first 10 transactions)

Don't create actual transactions yet - just prepare for review.
Add ImportSession model to Prisma schema first."
```

**Acceptance Criteria**:
- ✅ Parses and validates CSV
- ✅ Detects duplicates
- ✅ Maps categories
- ✅ Saves session to DB
- ✅ Returns preview

---

### Phase 3.5.5: Create Import Confirmation Service

**File**: `services/import/confirm-session.ts`

**Function**:
```typescript
export async function confirmImportSession(
  userId: string,
  sessionId: string,
  oneTimePurchaseIds: string[] // Transaction IDs user marked
): Promise<{
  created: number
  skipped: number
}>
```

**Logic**:
1. Verify session belongs to user
2. Load parsedData from session
3. Create new categories if needed
4. Bulk create transactions (skip duplicates)
5. Mark one-time purchases with tag/flag
6. Update session status to CONFIRMED
7. Return statistics

**Claude Code Prompt**:
```bash
claude-code "Create import confirmation service.
File: services/import/confirm-session.ts

Function: confirmImportSession(userId, sessionId, oneTimePurchaseIds)
Steps:
1. Verify session ownership and status=PENDING
2. Load parsedData from session
3. Create new categories from newCategories list
4. Bulk create transactions (use prisma.transaction.createMany)
5. Mark one-time purchases (add flag or tag)
6. Update session: status=CONFIRMED, confirmedAt=now
7. Return { created: N, skipped: M }

Use transaction (Prisma.$transaction) for atomicity"
```

**Acceptance Criteria**:
- ✅ Verifies session
- ✅ Creates categories
- ✅ Bulk creates transactions
- ✅ Marks one-time purchases
- ✅ Atomic operation
- ✅ Updates session status

---

## 🗂️ Task 3.6: CSV Import - API Routes (Day 4)

### Phase 3.6.1: Create Import API Routes

**Files**:
- `app/api/v1/import/upload/route.ts` (POST)
- `app/api/v1/import/sessions/[id]/route.ts` (GET)
- `app/api/v1/import/sessions/[id]/confirm/route.ts` (POST)
- `app/api/v1/import/sessions/[id]/cancel/route.ts` (POST)

**Claude Code Prompt**:
```bash
claude-code "Create CSV import API routes.

1. POST /api/v1/import/upload
   - Accept multipart/form-data file
   - Optional: bankType query param
   - Call createImportSession
   - Return session summary

2. GET /api/v1/import/sessions/:id
   - Return session details + full preview

3. POST /api/v1/import/sessions/:id/confirm
   - Body: { oneTimePurchaseIds: string[] }
   - Call confirmImportSession
   - Return statistics

4. POST /api/v1/import/sessions/:id/cancel
   - Set status=CANCELLED
   - Return success

Use next-connect or similar for file upload handling"
```

**Dependencies**:
```bash
pnpm add formidable
pnpm add -D @types/formidable
```

**Acceptance Criteria**:
- ✅ File upload works
- ✅ Session creation returns summary
- ✅ Preview accessible
- ✅ Confirmation creates transactions
- ✅ Cancel works

---

## 🗂️ Task 3.7: CSV Import - UI Components (Day 5)

### Phase 3.7.1: Create Import Upload Component

**File**: `components/features/import/import-upload.tsx`

**Features**:
- Drag & drop file upload
- Bank selection (optional)
- File validation
- Upload progress

**Claude Code Prompt**:
```bash
claude-code "Create CSV import upload component.
File: components/features/import/import-upload.tsx

Features:
- Drag & drop zone (use react-dropzone)
- Bank selector dropdown (optional)
- File validation (.csv only, max 10MB)
- Upload progress indicator
- Call POST /api/v1/import/upload
- On success: navigate to review page with sessionId

Use shadcn/ui components"
```

---

### Phase 3.7.2: Create Import Review Component

**File**: `components/features/import/import-review.tsx`

**Features**:
- Show session summary (total, duplicates, unique)
- List new categories to be created
- Transaction preview table (first 50)
- Checkbox column: "One-Time Purchase?"
- Confirm/Cancel buttons

**Claude Code Prompt**:
```bash
claude-code "Create CSV import review component.
File: components/features/import/import-review.tsx

Features:
- Fetch session: GET /api/v1/import/sessions/:id
- Display summary card:
  * Total: X transactions
  * Duplicates: Y (skipped)
  * Unique: Z (to be imported)
  * New categories: list
- Transaction table:
  * Columns: Date, Description, Amount, Category, One-Time?
  * Checkbox for one-time purchase
  * Show first 50, pagination if more
- Actions:
  * Confirm (POST /confirm with oneTimePurchaseIds)
  * Cancel (POST /cancel)

Use shadcn/ui Table, Checkbox, Button"
```

---

### Phase 3.7.3: Create Import Page

**File**: `app/(web)/import/page.tsx`

**Flow**:
1. Show upload component
2. On upload success → show review component
3. On confirm → redirect to transactions with success message

**Claude Code Prompt**:
```bash
claude-code "Create CSV import page.
File: app/(web)/import/page.tsx

Flow:
1. Initial state: show ImportUpload
2. After upload: show ImportReview with sessionId
3. After confirm: redirect to /transactions with toast

Use useState for flow control
Show loading states"
```

---

### Phase 3.7.4: Add Import Link to Dashboard

**Update**: `app/(web)/dashboard/page.tsx`

Add card linking to `/import` page.

---

## ✅ Week 3 Acceptance Criteria

### Recurring Transactions
- ✅ Can create/edit/delete recurring transactions
- ✅ Can execute recurring transaction (manual confirmation)
- ✅ Execution creates transaction with recurringId link
- ✅ Recurring auto-deactivates when endDate reached
- ✅ Email notifications sent 3 days before due date
- ✅ Notification groups by user (one email per user)
- ✅ Notification includes total amount and count

### CSV Import
- ✅ Can upload CSV from 6+ Brazilian banks
- ✅ Auto-detects bank format OR allows manual column mapping
- ✅ Detects duplicates (date + amount + description)
- ✅ Maps categories to existing OR creates new
- ✅ Shows preview before importing
- ✅ Can mark one-time purchases during review
- ✅ Can confirm or cancel import
- ✅ Bulk creates transactions atomically

### Testing
- ✅ All services have unit tests (>80% coverage)
- ✅ All API routes have integration tests
- ✅ CSV parsing tested for all bank formats
- ✅ Duplicate detection tested
- ✅ Category mapping tested

### Database
- ✅ Migration for lastReminderSent field
- ✅ Migration for ImportSession model
- ✅ Migration for one-time purchase flag (add to Transaction model)

---

## 🚀 Development Order

**Day 1**: Tasks 3.1 + 3.2 (Recurring CRUD + Execute)
**Day 2**: Tasks 3.3 (API Routes) + 3.4 (Notifications)
**Day 3**: Tasks 3.5.1-3.5.3 (CSV Parsing + Detection)
**Day 4**: Tasks 3.5.4-3.5.5 (Import Sessions) + 3.6 (API)
**Day 5**: Task 3.7 (UI) + Testing + Bug Fixes

---

## 📦 Dependencies to Install

```bash
pnpm add papaparse date-fns formidable react-dropzone
pnpm add -D @types/papaparse @types/formidable
```

---

## 🗄️ Database Changes

### Add to Transaction model:
```prisma
model Transaction {
  // Add:
  isOneTimePurchase Boolean @default(false)
}
```

### Add to RecurringTransaction model:
```prisma
model RecurringTransaction {
  // Add:
  lastReminderSent DateTime?
}
```

### Add new model:
```prisma
model ImportSession {
  id                String   @id @default(cuid())
  userId            String
  fileName          String
  bankType          String?
  totalTransactions Int
  duplicateCount    Int
  parsedData        Json
  status            String   @default("PENDING")
  createdAt         DateTime @default(now())
  confirmedAt       DateTime?
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, status])
}
```

### Migration command:
```bash
pnpm prisma migrate dev --name week3_recurring_and_import
```