# Technical Specification - LifeOS Financial Freedom Module

## Project Overview

**Name**: LifeOS - Financial Freedom Module (MVP)
**Purpose**: Help users achieve financial freedom by tracking money flows, optimizing lifestyle costs, and providing clear freedom metrics
**Philosophy**: Freedom > Money, Experiences > Possessions, Value-aligned spending over default consumption
**Timeline**: 6 weeks to Public Beta
**Development Approach**: Test-Driven Development (TDD)

---

## Architecture

### High-Level Architecture
```
┌─────────────────────────────────────┐
│   Web App (Mobile-First Responsive) │
│         Next.js 14 + React           │
└──────────────┬──────────────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────────────┐
│      Next.js API Routes              │
│   (Future: Separate for Mobile)      │
└──────────────┬───────────────────────┘
               │
               │ Prisma ORM
               ▼
┌──────────────────────────────────────┐
│      PostgreSQL Database             │
│         (Supabase)                   │
└──────────────────────────────────────┘
```

### Design Principles
1. **API-First**: All business logic via APIs (reusable for future mobile app)
2. **Mobile-First UI**: Responsive design, touch-optimized, PWA-ready
3. **Test-Driven**: Write tests before implementation
4. **Type-Safe**: TypeScript everywhere
5. **Database-First**: Strong schema, enforce constraints at DB level

---

## Tech Stack

### Core
- **Framework**: Next.js 14.2+ (App Router)
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm (faster, efficient)

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
- **ORM**: Prisma 5.8+
- **Validation**: Zod schemas (shared with frontend)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Email**: Resend
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

## Project Structure

```
lifeos-financial/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts            # Seed data for dev/testing
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth-related routes
│   │   ├── (dashboard)/   # Protected dashboard routes
│   │   ├── api/           # API routes
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── features/      # Feature-specific components
│   │   └── shared/        # Shared components
│   ├── lib/               # Utility functions
│   │   ├── db.ts          # Prisma client
│   │   ├── auth.ts        # Auth config
│   │   ├── utils.ts       # Helpers
│   │   └── validations/   # Zod schemas
│   ├── services/          # Business logic (testable)
│   │   ├── transactions.ts
│   │   ├── calculations.ts
│   │   ├── notifications.ts
│   │   └── *.test.ts      # Service tests
│   ├── types/             # TypeScript types
│   └── config/            # App configuration
├── tests/
│   ├── integration/       # API integration tests
│   ├── e2e/              # End-to-end tests
│   └── fixtures/         # Test data
├── public/               # Static assets
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── README.md
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

## API Design

### REST API Conventions
- **Base URL**: `/api/v1`
- **Authentication**: JWT via NextAuth.js
- **Response Format**: JSON
- **Error Format**: `{ error: string, details?: any }`
- **Success Format**: `{ data: any, meta?: any }`

### Core Endpoints

#### Transactions
```
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
- **Providers**: Email (magic link), Google, GitHub (future)
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

**Last Updated**: December 2025
**Status**: Ready for Development
**Next Review**: After Alpha Release
