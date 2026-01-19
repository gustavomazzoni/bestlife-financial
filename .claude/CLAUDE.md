# Technical Specification - BestLife Financial Freedom Module

## Project Overview

**Name**: Best Life - Financial Module (MVP)
**Purpose**: Help people create freedom to live a life rich in what truly matters by making wise and conscious financial choices towards it with a minimalist approach to remove what's not essential or important, to then have more of what's truly important.
**Philosophy**: Freedom > Money. Instead of pursuing money and society's definition of success, we should pursue our own definition of success based on what truly matters to us, and create the freedom to do so.
**Timeline**: 6 weeks to Public Beta
**Development Approach**: Test-Driven Development (TDD)

---

## Philosophy & User Journey

### The Problem
Society teaches us to pursue a successful life based on money, material possessions, social status, comfort, security, and power. We sacrifice our health, passions, dreams, and time with loved ones. As a consequence, we end up stuck in a life we don't want. We might have money, but we don't have freedom to spend our time on what truly matters.

### The Solution
**Freedom > Money.** The app helps users discover their "Freedom Number" - how much money is enough to cover their ideal lifestyle without having to work. By making smart, conscious, and aligned financial choices, users can create the freedom to live their Best Life (rich in what truly matters).

### Core Methodology
1. **Define what truly matters** - Core values and life goals
2. **Design ideal lifestyle** - Cost of living aligned with values
3. **Discover Freedom Number** - Calculate how much is enough
4. **Understand current reality** - Analyze actual spending vs. ideal
5. **Make conscious choices** - Eliminate non-essential spending to create more freedom for what matters
6. **Track progress** - Monitor runway gained, FI progress, and value-aligned spending

### User Journey: Onboarding Flow

#### Step 1: Defining What's Truly Important (Core Values & Life Goals)
- App presents a curated list of life goals/values (user can select up to 10)
- Examples:
  - Family and meaningful relationships (time with kids, family, friends)
  - Energy and vitality (active lifestyle, low stress, healthy food, good sleep/rest)
  - New experiences and adventure (travel, exploration)
  - Freedom (autonomy, independence, control of time/life) - **Mandatory, always selected**
- User can add custom values/goals
- These selections drive the rest of the journey

#### Step 2: Defining the Ideal Life (Lifestyle Design)
- Based on selected values, app suggests lifestyle categories aligned with those values
- App automatically includes "essential" categories (housing, food) if not already selected
- User can arrange and customize lifestyle buckets (combination of categories and values)
- User sets monthly/annual budget for each lifestyle bucket
- **Total defines the cost of living for the ideal life** (Dream Lifestyle Cost)

#### Step 3: Income & Investments Setup
- User sets:
  - Active income (salary, business income)
  - Passive income (rental, dividends, etc.)
  - Total investments (current savings/investments)
- User can optionally set expected return rate (default: 7%)

#### Step 4: Freedom Number Discovery
- App calculates **Freedom Number** using 4% rule: `Dream Lifestyle Cost × 12 × 25`
- Shows three scenarios:
  - Lean FI (80% of dream)
  - Standard FI (100% of dream)
  - Fat FI (150% of dream)
- This is the user's first "aha moment": Seeing how much money is enough

#### Step 5: Current Cost of Living Analysis
- User uploads past 12-month transaction statements (CSV for MVP)
- App calculates current annual cost of living from actual spending data
- App identifies outlier expenses (one-time purchases) vs. regular expenses
- **Aha moment**: Seeing current annual cost calculated automatically
- User can skip this step and upload later, but calculations will be less accurate

#### Step 6: Alignment Analysis & Spending Insights
- App compares current spending vs. ideal lifestyle cost
- App highlights **inconsistency** between what's truly important (from Step 1) and actual spending
- App identifies:
  - Non-essential spending habits
  - Non-important spending (not aligned with core values)
  - Opportunities to cut spending to create more freedom for what matters
- **Aha moment**: Seeing how much spending is non-aligned with values

**Onboarding Complete** - User is ready to start their freedom journey!

### User Journey: Regular Flow

#### 1. Transaction Entry (Natural Language Interface)
- **Primary interaction**: ChatGPT-like prompt box - "What's your Transaction?"
- User types natural language: "Bought coffee and pastry for breakfast, R$ 25"
- App uses AI to infer:
  - Amount
  - Category
  - Value alignment (Essential, Important, Want)
  - Whether aligned with core values
- User can confirm/edit before saving
- Transaction creation should feel conversational and effortless

#### 2. Daily Habit Building
- App sends reminder at end of day (user-configurable, default 9 PM)
- Prompts user to log today's transactions
- Tracks daily logging streak
- Celebrates consistency with badges

#### 3. Recurring Transaction Management
- User adds recurring income/expenses to calendar
- App automatically suggests recurring patterns from transaction history
- User can set frequency (weekly/monthly/yearly) and notification preferences

#### 4. Proactive Transaction Reminders
- App reminds user of scheduled transactions:
  - Weekly preview (start of week)
  - Day-before reminder (or 2 days before, user configurable)
- User can mark as paid, skip, or execute early

#### 5. Constant Alignment Monitoring
- App **always highlights** inconsistent expenses (not aligned with essentials or important)
- Dashboard prominently shows:
  - Monthly runway gained/lost (highlighted)
  - FI Progress %
  - Value-aligned spending %
  - Savings rate %
- Real-time feedback helps users make conscious choices

### Core User Outcomes (Success Metrics)

Users succeed when they:
1. **Reduce spending** by cutting non-important expenses
2. **Increase value-aligned spending** percentage
3. **Increase freedom bucket** (investments/savings toward FI)

### Primary Dashboard Metrics (Priority Order)

1. **Monthly Runway Gained/Lost** (Highlighted) - Shows immediate impact of spending choices
2. **FI Progress %** - How close to Freedom Number
3. **Value-Aligned Spending %** - Percentage aligned with core values
4. **Savings Rate %** - Overall savings performance

### Key "Aha Moments" (In Priority Order)

1. **Seeing how many years of freedom current savings buy** - Current runway calculation (primary aha moment)
2. **Seeing current annual cost of living calculated automatically** - Reality check
3. **Seeing how much spending is non-aligned** - Awareness of spending patterns
4. **Seeing Freedom Number for the first time** - The target to reach

---

## Architecture

**Philosophy**: The architecture supports a user journey focused on freedom discovery - helping users define what truly matters, discover their Freedom Number, and make conscious financial choices aligned with their values.

### Design Principles

1. **Separation of Concerns**: Business logic is independent of presentation layer
2. **API-First**: All features exposed as REST APIs
3. **Code Reuse**: 70-80% of backend code shared between web and mobile
4. **Mobile-First UI**: Responsive design, touch-optimized
5. **Type Safety**: End-to-end TypeScript with Zod validation
6. **Test-Driven**: Write tests before implementation
7. **Database-First**: Strong schema, enforce constraints at DB level
8. **User-Centric**: Architecture supports natural language interaction, intelligent inference, and constant alignment monitoring

---

## Tech Stack

### Core
- **Framework**: Next.js 16.1+ (App Router)
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm (faster, efficient)
- **Environment**: Docker

### Frontend
- **UI Library**: React 18+
- **Styling**: Tailwind CSS 3.4+
- **Components**: shadcn/ui (customizable, accessible)
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + hooks (simple for MVP)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast

### Backend
- **API**: Next.js API Routes (REST)
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 7.2+
- **Validation**: Zod schemas (shared with frontend)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Email**: Resend (Mailpit during development)
- **Cron Jobs**: Vercel Cron (for reminders, recurring transactions)

### Testing (TDD Approach)
- **Unit Tests**: Vitest (fast, Vite-based)
- **Integration Tests**: Vitest + Supertest (API testing)
- **E2E Tests**: Playwright (critical user flows)
- **Coverage Target**: 80%+ for business logic
- **Test Structure**: Co-located with code (`*.test.ts` files)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL + Auth)
- **Storage**: Vercel Blob (CSV imports)
- **Monitoring**: Vercel Analytics + Sentry (errors)
- **CI/CD**: GitHub Actions + Vercel auto-deploy

### Currency
- **MVP Currency**: BRL (Brazilian Reais) only
- **Future**: Multi-currency support

---

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

## Database Schema

### Core Tables

#### users
```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  name                  String?
  emailVerified         DateTime?
  image                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Financial data
  currentInvestments    Decimal   @default(0) @db.Decimal(12, 2)
  emergencyFund         Decimal   @default(0) @db.Decimal(12, 2)
  passiveIncomeMonthly  Decimal   @default(0) @db.Decimal(12, 2)
  expectedReturnRate    Decimal   @default(0.07) @db.Decimal(4, 4)
  dreamLifestyleCost    Decimal?  @db.Decimal(12, 2)
  hourlyRate            Decimal?  @db.Decimal(10, 2)
  
  // Preferences
  currency              String    @default("BRL")
  dailyReminderTime     String    @default("21:00")
  weeklyReviewDay       String    @default("SUNDAY")
  weeklyReviewTime      String    @default("18:00")
  purchaseCheckThreshold Decimal  @default(100) @db.Decimal(10, 2)
  notificationPush      Boolean   @default(true)
  notificationEmail     Boolean   @default(true)
  gamificationEnabled   Boolean   @default(true)
  
  // Gamification
  currentStreak         Int       @default(0)
  longestStreak         Int       @default(0)
  level                 String    @default("BEGINNER")
  
  // Relations
  transactions          Transaction[]
  recurringTransactions RecurringTransaction[]
  categories            Category[]
  purchaseConsiderations PurchaseConsideration[]
  badges                Badge[]
  accounts              Account[]
  sessions              Session[]
}
```

#### transactions
```prisma
enum TransactionType {
  INCOME
  EXPENSE
  SAVING
  TRANSFER
}

enum NecessityLevel {
  IMPORTANT
  NEEDS
  WANTS
}

enum ValueAlignment {
  ALIGNED
  DEFAULT
  EXPERIENCE
  MATERIAL
  FREEDOM_ENABLING
  FREEDOM_LIMITING
}

model Transaction {
  id              String           @id @default(cuid())
  userId          String
  date            DateTime
  amount          Decimal          @db.Decimal(12, 2)
  description     String
  type            TransactionType
  category        String
  necessityLevel  NecessityLevel?
  valueAlignment  ValueAlignment?
  isRecurring     Boolean          @default(false)
  recurringId     String?
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurring       RecurringTransaction? @relation(fields: [recurringId], references: [id])
  
  @@index([userId, date])
  @@index([userId, type])
  @@index([userId, category])
}
```

#### recurring_transactions
```prisma
enum RecurringFrequency {
  WEEKLY
  MONTHLY
  YEARLY
}

model RecurringTransaction {
  id                    String              @id @default(cuid())
  userId                String
  amount                Decimal             @db.Decimal(12, 2)
  description           String
  type                  TransactionType
  category              String
  necessityLevel        NecessityLevel?
  valueAlignment        ValueAlignment?
  frequency             RecurringFrequency
  startDate             DateTime
  endDate               DateTime?
  nextDueDate           DateTime
  notificationDaysBefore Int                @default(3)
  isActive              Boolean             @default(true)
  lastCreatedDate       DateTime?
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions          Transaction[]
  
  @@index([userId, nextDueDate])
  @@index([userId, isActive])
}
```

#### categories
```prisma
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

#### purchase_considerations
```prisma
enum ConsiderationDecision {
  PURCHASED
  SAVED_FOR_LATER
  PASSED
  PENDING
}

model PurchaseConsideration {
  id                  String                @id @default(cuid())
  userId              String
  date                DateTime              @default(now())
  amount              Decimal               @db.Decimal(12, 2)
  category            String
  reason              String
  alignmentResponses  Json
  decision            ConsiderationDecision @default(PENDING)
  transactionId       String?               @unique
  notes               String?
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  user                User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, date])
  @@index([userId, decision])
}
```

#### badges
```prisma
model Badge {
  id          String   @id @default(cuid())
  userId      String
  badgeType   String
  earnedAt    DateTime @default(now())
  metadata    Json?
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, badgeType])
  @@index([userId, earnedAt])
}
```

---

## 🔌 API Layer Design

### REST API Conventions
- **Base URL**: `/api/v1`
- **Authentication**: JWT via NextAuth.js
- **Response Format**: JSON
- **Success Response Format**:
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
- **Error Response Format**:
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

### Core Endpoints

#### Transactions
```
POST   /api/v1/transactions/infer        - Rule-based parsing using keyword matching, regex patterns, and context analysis (LLM integration in the future)
POST   /api/v1/transactions              - Create transaction
GET    /api/v1/transactions              - List transactions (with filters)
GET    /api/v1/transactions/:id          - Get transaction
PATCH  /api/v1/transactions/:id          - Update transaction
DELETE /api/v1/transactions/:id          - Delete transaction
POST   /api/v1/transactions/import       - Bulk import (CSV)
GET    /api/v1/transactions/summary      - Get summaries (daily/weekly/monthly)
```

#### Recurring Transactions
```
POST   /api/v1/recurring                 - Create recurring transaction
GET    /api/v1/recurring                 - List recurring transactions
GET    /api/v1/recurring/:id             - Get recurring transaction
PATCH  /api/v1/recurring/:id             - Update recurring transaction
DELETE /api/v1/recurring/:id             - Delete recurring transaction
POST   /api/v1/recurring/:id/execute     - Manually execute recurring transaction
```

#### Calculations
```
GET    /api/v1/calculations/lifestyle-cost       - Current vs dream lifestyle cost
GET    /api/v1/calculations/freedom-metrics      - All freedom metrics
GET    /api/v1/calculations/fi-projection        - Time to FI projection
POST   /api/v1/calculations/purchase-check       - Pre-purchase analysis
```

#### Categories
```
GET    /api/v1/categories                - List categories (system + user)
POST   /api/v1/categories                - Create custom category
PATCH  /api/v1/categories/:id            - Update category
DELETE /api/v1/categories/:id            - Delete category
```

#### User Profile
```
GET    /api/v1/user/profile              - Get user profile
PATCH  /api/v1/user/profile              - Update profile
PATCH  /api/v1/user/preferences          - Update preferences
GET    /api/v1/user/stats                - Gamification stats
```

#### Reports
```
GET    /api/v1/reports/weekly            - Weekly report
GET    /api/v1/reports/monthly           - Monthly report
GET    /api/v1/reports/insights          - AI-generated insights
```

---

## Business Logic (Service Layer)

### Key Calculations

#### 1. Current Lifestyle Cost
```typescript
// Calculate average monthly expenses from last 12 months
// Exclude: one-time large purchases, savings, transfers
// Include: annualized irregular expenses

function calculateCurrentLifestyleCost(
  userId: string,
  months: number = 12
): Promise<LifestyleCostResult>
```

#### 2. Freedom Metrics
```typescript
interface FreedomMetrics {
  // Complete FI
  fiNumber: number;              // Dream cost × 12 × 25
  leanFiNumber: number;          // 80% of dream
  fatFiNumber: number;           // 150% of dream
  
  // Current status
  currentRunway: number;         // Months of freedom
  fiProgress: number;            // Percentage to FI
  
  // Work optional
  minimumWorkIncome: number;     // Dream cost - passive income
  workOptionalProgress: number;  // Passive income / dream cost
  
  // Emergency fund
  emergencyFundTarget: number;   // 6 months dream cost
  emergencyFundMonths: number;   // Current coverage
  
  // Projections
  monthsToFI: number | null;     // Based on savings rate
  fiDate: Date | null;           // Projected FI date
  savingsRate: number;           // Current savings rate %
}
```

#### 3. Pre-Purchase Analysis
```typescript
interface PurchaseAnalysis {
  freedomCost: {
    days: number;
    percentage: number;
  };
  workCost: {
    hours: number;
  } | null;
  fiImpact: {
    futureValue: number;      // If invested
    daysSooner: number;       // FI date impact
  };
  alignmentScore: 'GREEN' | 'YELLOW' | 'RED';
}
```

#### 4. Savings Rate Calculation
```typescript
// (Total Income - Total Expenses) / Total Income × 100%
// Monthly and 3-month average

function calculateSavingsRate(
  userId: string,
  period: 'month' | 'quarter'
): Promise<number>
```

---

## Authentication & Authorization

### NextAuth.js Configuration
- **Providers**: Email (magic link), Google (future)
- **Session Strategy**: JWT
- **Session Duration**: 30 days
- **Email Provider**: Resend

### Authorization Rules
- All API routes require authentication (except auth routes)
- Users can only access their own data
- Middleware protects all `/api/v1/*` routes

---

## Testing Strategy (TDD)

### Test Pyramid
```
    /\      E2E Tests (10%)
   /  \     - Critical user flows
  /────\    Integration Tests (30%)
 /      \   - API endpoints
/────────\  Unit Tests (60%)
            - Services, utilities, calculations
```

### TDD Workflow
1. **Write test first** (describe expected behavior)
2. **Run test** (should fail - red)
3. **Write minimum code** to pass test
4. **Run test** (should pass - green)
5. **Refactor** code (keep tests passing)
6. **Repeat**

### Test Coverage Requirements
- **Services**: 90%+ (core business logic)
- **API Routes**: 80%+
- **Components**: 70%+ (critical UI)
- **Utilities**: 90%+

### Example Test Structure
```typescript
// src/services/calculations.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateFreedomMetrics } from './calculations';

describe('Freedom Metrics Calculation', () => {
  describe('FI Number', () => {
    it('should calculate FI number using 4% rule', () => {
      const dreamCost = 2000;
      const result = calculateFiNumber(dreamCost);
      expect(result).toBe(600000); // 2000 × 12 × 25
    });
  });

  describe('Current Runway', () => {
    it('should calculate months of freedom', () => {
      const investments = 100000;
      const dreamCost = 2000;
      const result = calculateRunway(investments, dreamCost);
      expect(result).toBe(50); // 100000 / 2000
    });
  });
});
```

---

## Scheduled Jobs (Cron)

### Daily Jobs
```typescript
// Run at 9 PM (user's local time - handled by timezone)
- Check daily reminder notifications
- Create due recurring transactions
- Update streaks
```

### Weekly Jobs
```typescript
// Run on user's preferred day/time
- Send weekly review notifications
- Generate weekly reports
- Award weekly badges
```

### Monthly Jobs
```typescript
// Run on 1st of month
- Generate monthly reports
- Send monthly insights
- Recalculate lifestyle costs
- Update FI projections
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Email
RESEND_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Feature Flags
ENABLE_GAMIFICATION="true"
ENABLE_EMAIL_NOTIFICATIONS="true"
```

---

## Development Workflow

### Git Strategy
- **Main branch**: Production-ready code
- **Feature branches**: `feature/transaction-tracking`
- **PR required**: Before merging to main
- **Commit convention**: Conventional Commits

### Code Review Checklist
- [ ] Tests pass (unit + integration)
- [ ] Test coverage maintained/improved
- [ ] TypeScript errors: 0
- [ ] Linting errors: 0
- [ ] Accessible (keyboard nav, ARIA)
- [ ] Mobile responsive
- [ ] Performance considered

### Deployment
- **Preview**: Every PR (Vercel preview)
- **Production**: Merge to main (auto-deploy)
- **Rollback**: Instant via Vercel

---

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **API Response Time**: < 200ms (p95)
- **Database Queries**: < 50ms (p95)
- **Lighthouse Score**: 90+ (mobile)

---

## Security Considerations

- SQL injection: Protected by Prisma (parameterized queries)
- XSS: React escapes by default
- CSRF: NextAuth.js handles
- Rate limiting: Vercel rate limits + API throttling
- Input validation: Zod schemas on all inputs
- Sensitive data: Encrypted at rest (Supabase)

---

## Accessibility Requirements

- **WCAG 2.1 Level AA** compliance
- Keyboard navigation throughout
- Screen reader support
- Focus indicators visible
- Color contrast ratio: 4.5:1 minimum
- Form labels and errors
- Skip navigation links

---

## Mobile Optimization

- Touch targets: 44×44px minimum
- Responsive typography (rem units)
- Swipe gestures for common actions
- Bottom navigation for critical actions
- Optimized images (WebP, lazy loading)
- PWA manifest (installable)
- Offline support (future)

---

## Future Considerations (Post-MVP)

- Native mobile app (React Native + shared API)
- Real-time sync (WebSockets)
- Bank integration (Plaid equivalent for Brazil)
- AI-powered insights (OpenAI API)
- Multi-currency support
- Collaborative features (shared goals)
- Export/backup data
- Dark mode

---

## Success Metrics (Beta)

### Technical
- Uptime: 99.9%
- Zero critical bugs
- Test coverage: >80%
- Page load: <2s

### Product
- 100 beta users
- 70% weekly active users
- 50% complete onboarding
- Average 5+ transactions logged per week
- 60% use pre-purchase check
- Average session: 3+ minutes

---

## Questions & Assumptions

### Assumptions Made
1. Users primarily access via mobile browser (PWA)
2. Manual transaction entry is acceptable for MVP
3. Email notifications sufficient (no SMS)
4. Single user accounts (no family/shared accounts)
5. Brazilian market focus (BRL, Portuguese future)

### Open Questions
1. Should we support multiple bank accounts tracking?
2. What's the onboarding completion target (days)?
3. Premium features for monetization?
4. Data retention policy (how long keep old transactions)?
5. LGPD compliance requirements (Brazilian privacy law)?

---

## Getting Started (Next Steps)

1. Initialize project with create-next-app
2. Set up Prisma + PostgreSQL
3. Configure authentication
4. Write first test (transaction creation)
5. Implement transaction API (TDD)
6. Build basic dashboard
7. Iterate!

---

**Last Updated**: Jan 2026
**Status**: Ready for Development
**Next Review**: After Alpha Release
