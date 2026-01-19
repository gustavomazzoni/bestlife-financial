# Development Backlog - LifeOS Financial Module

## Sprint Overview (6 Weeks to Beta)

**Start Date**: December 23, 2025 (Monday)
**Beta Release**: February 3, 2026
**Development Approach**: Test-Driven Development (TDD)

---

## WEEK 1: Foundation & Setup (Dec 23-29)

### 🎯 Goal: Project scaffolding, database setup, authentication working

### Tasks

#### 1.1 Project Initialization
- [x] **Create Next.js project** with TypeScript
  - Command: `pnpm create next-app@latest lifeos-financial --typescript --tailwind --app --use-pnpm`
  - Configure: App Router, TypeScript, Tailwind, ESLint
- [x] **Install core dependencies**
  - Prisma, NextAuth.js, Zod, date-fns, Recharts, shadcn/ui
- [x] **Set up testing framework**
  - Install Vitest, Playwright, testing-library
  - Configure vitest.config.ts
  - Create test utilities and fixtures
- [x] **Configure linting & formatting**
  - ESLint, Prettier, TypeScript strict mode
  - Pre-commit hooks (husky + lint-staged)
- [x] **Project structure setup**
  - Create folder structure (services, components, lib, etc.)
  - Set up path aliases in tsconfig

**Acceptance Criteria**:
- Project runs locally with `pnpm dev`
- Tests run with `pnpm test`
- Linting passes with `pnpm lint`

---

#### 1.2 Database Setup (TDD)
- [x] **Write Prisma schema**
  - Define User, Transaction, RecurringTransaction, Category, PurchaseConsideration, Badge models
  - Set up relations and indexes
- [x] **Write seed data**
  - System default categories
  - Test user data
- [ ] **Write database tests**
  - Test model creation
  - Test relations
  - Test constraints
- [ ] **Set up Supabase**
  - Create project
  - Get connection string
  - Configure environment variables
- [x] **Run migrations**
  - `prisma migrate dev`
  - Verify schema in Supabase
- [ ] **Test database connection**
  - Write integration test for database connectivity

**Acceptance Criteria**:
- Database schema matches specification
- Migrations run successfully
- Seed data loads correctly
- Database tests pass

---

#### 1.3 Authentication Setup (TDD)
- [ ] **Write authentication tests**
  - Test user registration flow
  - Test login flow
  - Test protected route access
  - Test session management
- [x] **Configure NextAuth.js**
  - Set up email provider (Resend)
  - Configure JWT strategy
  - Set up session handling
  - Create auth API routes
- [x] **Implement auth middleware**
  - Protect API routes
  - Protect dashboard pages
- [x] **Build auth UI components**
  - Login page
  - Signup page
  - Magic link email template
- [ ] **Test authentication end-to-end**

**Acceptance Criteria**:
- Users can sign up with email
- Users receive magic link
- Users can log in
- Protected routes redirect to login
- Session persists across refreshes
- All auth tests pass

---

#### 1.4 Basic Dashboard Setup
- [ ] **Create dashboard layout**
  - Responsive layout with sidebar (desktop) / bottom nav (mobile)
  - Header with user menu
  - Mobile-first design
- [ ] **Set up routing**
  - Dashboard home
  - Transactions page (skeleton)
  - Settings page (skeleton)
- [x] **Implement logout**
- [ ] **Add loading states**

**Acceptance Criteria**:
- User can access dashboard after login
- Navigation works on mobile and desktop
- User can log out
- Layout is responsive

---

## WEEK 2: Transaction Management (Dec 30 - Jan 5)

### 🎯 Goal: Full transaction CRUD working with tests

### Tasks

#### 2.1 Transaction Service (TDD)
- [x] **Write transaction service tests**
  - [ ] 2.1.1 Unit test infer transaction
    - User types natural language: "Comprei café e pão na padaria, 25 reais"
    - AI inference service (MVP: rule-based parsing, future: LLM integration)
    - Auto-detects from natural language:
      - Amount (currency parsing)
      - Category (keyword matching, context analysis)
      - Type (Income/Expense/Saving/Transfer)
      - Value alignment (Essential/Important/Want based on category and keywords)
      - Date (if mentioned, else default to today)
  - Test create transaction
  - Test get transaction by ID
  - Test list transactions with filters
  - Test update transaction
  - Test delete transaction
  - Test validation rules
  - Test category assignment
- [x] **Implement transaction service**
  - `createTransaction()`
  - `getTransaction()`
  - `listTransactions()`
  - `updateTransaction()`
  - `deleteTransaction()`
  - Input validation with Zod
- [ ] **Write calculation tests**
  - Test monthly expense calculation
  - Test savings rate calculation
  - Test category breakdown
- [ ] **Implement calculation functions**
  - `calculateMonthlyExpenses()`
  - `calculateSavingsRate()`
  - `getCategoryBreakdown()`

**Acceptance Criteria**:
- All service tests pass
- 90%+ test coverage
- TypeScript types are correct
- Validation works as expected

---

#### 2.2 Transaction API (TDD)
- [x] **Write API endpoint tests**
  - Test POST /api/v1/transactions
  - Test GET /api/v1/transactions (with pagination)
  - Test GET /api/v1/transactions/:id
  - Test PATCH /api/v1/transactions/:id
  - Test DELETE /api/v1/transactions/:id
  - Test error cases (unauthorized, not found, validation)
- [x] **Implement API routes**
  - POST /api/v1/transactions
  - GET /api/v1/transactions
  - GET /api/v1/transactions/:id
  - PATCH /api/v1/transactions/:id
  - DELETE /api/v1/transactions/:id
  - Error handling and responses
- [x] **Add request validation**
- [x] **Add response formatting**

**Acceptance Criteria**:
- All API tests pass
- APIs return correct status codes
- Validation errors are clear
- Authentication required
- User can only access their data

---

#### 2.3 Transaction UI Components (Component Testing)
- [ ] **Write component tests**
  - Test natural language transaction entry
  - Test AI inference accuracy
  - Test transaction form validation
  - Test transaction list display
  - Test filtering and sorting
  - Test mobile interactions
- [ ] **Build natural language transaction entry (Primary Interface)**
  - **ChatGPT-like prompt box**: "What's your Transaction?"
  - Large, prominent input field (full-width on mobile)
  - User types natural language: "Bought coffee and pastry for breakfast, R$ 25"
  - AI inference service (MVP: rule-based parsing, future: LLM integration)
  - Auto-detects from natural language:
    - Amount (currency parsing)
    - Category (keyword matching, context analysis)
    - Type (Income/Expense/Saving/Transfer)
    - Value alignment (Essential/Important/Want based on category and keywords)
    - Date (if mentioned, else default to today)
  - Show inferred details before confirmation
  - User can confirm or edit before saving
  - Transaction creation should feel conversational and effortless
- [ ] **Build transaction form (Secondary - Edit Mode)**
  - Date picker (mobile-friendly)
  - Amount input (BRL formatting)
  - Type selector (Income/Expense/Saving)
  - Category dropdown
  - Necessity level selector
  - Value alignment tags
  - Description field
  - Form validation feedback
  - Use when editing or when natural language fails
- [ ] **Build transaction list**
  - Transaction cards (mobile-optimized)
  - Filters (date range, type, category, alignment)
  - Sort options
  - Search
  - Infinite scroll / pagination
  - Highlight non-aligned transactions
- [ ] **Build transaction detail/edit**
  - View transaction details
  - Edit transaction (full form)
  - Delete confirmation
- [ ] **Add quick-add button**
  - Floating action button (mobile)
  - Opens natural language entry (primary interface)
  - Quick add templates for most common transactions (optional)

**Acceptance Criteria**:
- Natural language entry is fast and intuitive
- AI inference is accurate (80%+ correct on first try)
- User can easily edit inferred details
- Forms work on mobile and desktop
- Validation provides clear feedback
- Transactions display correctly
- Non-aligned transactions are highlighted
- Filters and search work
- Quick-add is accessible
- Component tests pass

---

#### 2.4 Categories Management
- [ ] **Create system default categories**
  - Income: Salary, Passive Income, Business, Investments, Other
  - Expenses: Housing, Food, Transport, Health, Entertainment, Education, Personal, Bills, Other
  - Savings: Emergency Fund, Investments, Retirement, Other
- [ ] **Implement category API**
  - GET /api/v1/categories
  - POST /api/v1/categories (custom)
  - PATCH /api/v1/categories/:id
  - DELETE /api/v1/categories/:id
- [ ] **Build category UI**
  - Category list
  - Add custom category
  - Edit category (color, icon)
  - Delete category (with warning if used)

**Acceptance Criteria**:
- System categories available to all users
- Users can create custom categories
- Categories display with icons and colors
- Cannot delete categories in use

---

#### 2.5 Onboarding Flow - Core Setup

**Goal**: Guide new users through the freedom discovery journey

##### 2.5.1 Core Values & Life Goals Selection (TDD)
- [ ] **Write core values service tests**
  - Test value list retrieval
  - Test user value selection (up to 10)
  - Test "Freedom" mandatory enforcement
  - Test custom value creation
- [ ] **Define core values list**
  - Family and meaningful relationships
  - Energy and vitality
  - New experiences and adventure
  - Freedom (mandatory)
  - Add more curated options
- [ ] **Implement core values API**
  - GET /api/v1/onboarding/values (available values)
  - POST /api/v1/user/values (save user selections)
  - GET /api/v1/user/values (retrieve user selections)
- [ ] **Build core values selection UI**
  - Multi-select list of values/goals
  - Visual feedback for selections
  - Custom value input
  - Progress indicator
  - Mobile-optimized cards
  - "Freedom" pre-selected and locked

**Acceptance Criteria**:
- Users can select up to 10 values
- "Freedom" is always selected
- Custom values can be added
- Selections are saved to user profile
- Mobile-friendly interface

##### 2.5.2 Ideal Lifestyle Definition (TDD)
- [ ] **Write lifestyle bucket service tests**
  - Test bucket creation based on values
  - Test essential category inclusion (housing, food)
  - Test total cost calculation
  - Test bucket updates
- [ ] **Design lifestyle bucket structure**
  - Map values to suggested categories
  - Auto-include essentials (housing, food)
  - Allow custom buckets
- [ ] **Implement lifestyle bucket API**
  - GET /api/v1/onboarding/lifestyle-buckets (suggested based on values)
  - POST /api/v1/user/lifestyle-buckets (save user-defined buckets)
  - PATCH /api/v1/user/lifestyle-buckets/:id (update bucket amount)
  - GET /api/v1/user/lifestyle-buckets (get user buckets)
- [ ] **Build lifestyle bucket UI**
  - Show suggested buckets based on selected values
  - Budget input per bucket
  - Real-time total calculation
  - Visual breakdown
  - Can add/remove buckets
  - Progress indicator

**Acceptance Criteria**:
- Buckets suggested based on values
- Essentials automatically included
- User can set budget per bucket
- Total dream lifestyle cost calculated
- Saved to user profile (dreamLifestyleCost)

##### 2.5.3 Income & Investments Setup
- [ ] **Build income setup form**
  - Active income input
  - Passive income input
  - Total investments input
  - Expected return rate (default 7%, optional)
- [ ] **Implement income API**
  - PATCH /api/v1/user/profile (update income/investment fields)
  - Fields: currentInvestments, passiveIncomeMonthly, expectedReturnRate
- [ ] **Add validation**
  - All amounts must be >= 0
  - Return rate between 0-100%

**Acceptance Criteria**:
- Users can set all income/investment fields
- Values saved to user profile
- Validation prevents invalid inputs

##### 2.5.4 Freedom Number Calculation & Display
- [ ] **Implement Freedom Number calculation** (in freedom metrics service)
  - Calculate: Dream Lifestyle Cost × 12 × 25 (4% rule)
  - Calculate Lean FI (80%), Standard FI (100%), Fat FI (150%)
- [ ] **Build Freedom Number display UI**
  - Large, prominent display of Freedom Number
  - Show three scenarios (Lean/Standard/Fat)
  - Explanatory text about what it means
  - This is user's first "aha moment"
- [ ] **Save to user profile**
  - Calculated values can be stored/displayed (or calculated on demand)

**Acceptance Criteria**:
- Freedom Number calculated correctly
- User sees the number prominently
- Three scenarios displayed
- User understands what it means

##### 2.5.5 Current Cost of Living - CSV Upload
- [ ] **Build CSV upload UI for onboarding**
  - File upload interface
  - Instructions for preparing CSV
  - CSV template download
  - Upload progress indicator
  - "Skip for later" option
- [ ] **Handle onboarding CSV import**
  - Parse 12 months of transactions
  - Calculate annual cost of living
  - Show summary after import
  - Save calculated cost to user profile (or calculate on demand)
- [ ] **Show current vs. ideal comparison**
  - Side-by-side comparison
  - Highlight difference
  - This is another "aha moment"

**Acceptance Criteria**:
- Users can upload 12-month CSV during onboarding
- Can skip if not ready
- Cost of living calculated accurately
- Comparison shown clearly
- Mobile-friendly upload

##### 2.5.6 Alignment Analysis & Spending Insights
- [ ] **Implement alignment analysis service**
  - Compare actual spending categories vs. ideal lifestyle buckets
  - Identify non-essential spending
  - Identify non-aligned spending (not matching core values)
  - Calculate value-aligned spending percentage
- [ ] **Build alignment insights UI**
  - Visual comparison: Ideal vs. Actual
  - Highlight inconsistent expenses
  - Show non-essential spending breakdown
  - Show non-aligned spending (not matching values)
  - Actionable suggestions: "You could save R$X by reducing Y"
- [ ] **Complete onboarding**
  - Mark onboarding as complete
  - Redirect to dashboard
  - Show welcome message with key insights

**Acceptance Criteria**:
- Alignment analysis is accurate
- Visualizations are clear and actionable
- User understands the insights
- Onboarding completion is tracked
- User is motivated to continue

**Overall Onboarding Acceptance Criteria**:
- Complete onboarding flow takes <15 minutes
- Users can skip CSV upload for later
- All "aha moments" are clear and impactful
- Mobile-optimized throughout
- Onboarding completion is saved (can be restarted from settings)

---

## WEEK 3: Lifestyle Cost & Freedom Metrics (Jan 6-12)

### 🎯 Goal: Core calculations working, freedom dashboard live

### Tasks

#### 3.1 Lifestyle Cost Calculator (TDD)
- [ ] **Write calculation tests**
  - Test current lifestyle cost calculation (12-month average)
  - Test outlier detection (one-time expenses)
  - Test annualized irregular expenses
  - Test category breakdown
  - Test trend analysis
- [ ] **Implement lifestyle cost service**
  - `calculateCurrentLifestyleCost()`
  - `analyzeSpendingTrends()`
  - `getCategoryBreakdown()`
  - `identifyOptimizationOpportunities()`
- [ ] **Write API tests**
  - Test GET /api/v1/calculations/lifestyle-cost
- [ ] **Implement API**
  - GET /api/v1/calculations/lifestyle-cost

**Acceptance Criteria**:
- Calculation logic correct and tested
- Handles edge cases (new users, sparse data)
- API returns accurate results
- All tests pass

---

#### 3.2 Dream Lifestyle Questionnaire (TDD)
- [ ] **Write questionnaire logic tests**
  - Test cost estimation per answer
  - Test total dream cost calculation
- [ ] **Design questionnaire flow**
  - Question structure and options
  - Cost estimates per answer
- [ ] **Implement questionnaire component**
  - Multi-step form
  - Progress indicator
  - Cost preview as user answers
  - Category-by-category review
  - Editable after completion
- [ ] **Save dream lifestyle cost**
  - Update user profile
  - Store questionnaire responses (for future reference)

**Acceptance Criteria**:
- Questionnaire is user-friendly
- Cost calculations are reasonable
- User can complete in <10 minutes
- Mobile-optimized
- Can update anytime

---

#### 3.3 Freedom Metrics Service (TDD)
- [ ] **Write freedom metrics tests**
  - Test FI number calculation (4% rule)
  - Test Lean/Standard/Fat FI scenarios
  - Test current runway calculation
  - Test FI progress percentage
  - Test minimum work income
  - Test work optional progress
  - Test emergency fund status
  - Test savings rate calculation
  - Test time to FI projection
- [ ] **Implement freedom metrics service**
  - `calculateFreedomMetrics()` (returns all metrics)
  - `calculateFiNumber()`
  - `calculateRunway()`
  - `calculateTimeToFi()`
  - `calculateSavingsRate()`
- [ ] **Write API tests**
  - Test GET /api/v1/calculations/freedom-metrics
  - Test different user scenarios
- [ ] **Implement API**
  - GET /api/v1/calculations/freedom-metrics

**Acceptance Criteria**:
- All calculations mathematically correct
- Edge cases handled (no passive income, no savings, etc.)
- API returns comprehensive metrics
- All tests pass with 90%+ coverage

---

#### 3.4 Freedom Dashboard UI
- [ ] **Design freedom dashboard layout**
  - Card-based layout
  - **Primary metrics prioritized at top** (in priority order)
  - Responsive grid
  - Highlight the most important metric visually
- [ ] **Build primary metric cards (Priority Order)**
  - **1. Monthly Runway Gained/Lost** (HIGHLIGHTED - Primary motivator)
    - Shows immediate impact of spending choices this month
    - Visual indicator: positive (gained) vs negative (lost)
    - Color-coded: green for gained, red for lost
    - This is the user's primary "aha moment" - seeing how many years of freedom current savings buy
  - **2. FI Progress %** (Secondary - How close to Freedom Number)
    - Progress bar showing % toward Freedom Number
    - Shows current investments vs FI Number
    - Visual milestone markers (25%, 50%, 75%, 100%)
  - **3. Value-Aligned Spending %** (Tertiary - Alignment with core values)
    - Percentage of spending aligned with core values (from onboarding)
    - Trend indicator (increasing/decreasing)
    - Breakdown: Essential, Important, Want
  - **4. Savings Rate %** (Supporting - Overall savings performance)
    - Current savings rate %
    - Trend over time
    - Comparison to target (if user sets one)
- [ ] **Build supporting metric cards**
  - FI Number (with 3 scenarios: Lean/Standard/Fat)
  - Current Runway (total months of freedom)
  - Minimum Work Required
  - Emergency Fund Status
  - Time to FI (with projection chart)
  - Freedom Milestones (progress tracker)
- [ ] **Add constant alignment monitoring**
  - **Always highlight inconsistent expenses** (not aligned with essentials or important)
  - Show non-aligned spending breakdown
  - Actionable insights: "You spent R$X on Y, which doesn't align with your values"
  - Suggestions for cutting non-essential spending
- [ ] **Add interactivity**
  - Tooltips explaining each metric
  - "What if" calculator (adjust savings to see impact on runway)
  - Expandable details for each metric
  - Drill-down into spending categories
- [ ] **Optimize for mobile**
  - Swipeable cards
  - Collapsible sections
  - Touch-friendly
  - Primary metrics always visible (sticky header)

**Acceptance Criteria**:
- **Monthly Runway Gained/Lost is prominently highlighted**
- Dashboard shows all key metrics in priority order
- Non-aligned expenses are always highlighted
- Visually appealing and motivating
- Loads fast (<2s)
- Mobile-optimized
- Tooltips are helpful
- Interactive elements work
- User understands their progress at a glance

---

## WEEK 4: CSV Import & Recurring Transactions (Jan 13-19)

### 🎯 Goal: Bulk import working, recurring transactions automated

### Tasks

#### 4.1 CSV Import (TDD)
- [ ] **Write CSV import tests**
  - Test CSV parsing
  - Test field mapping
  - Test validation
  - Test bulk insert
  - Test error handling (invalid data)
  - Test duplicate detection
- [ ] **Create CSV template**
  - Define required columns
  - Provide example file
- [ ] **Implement CSV parser**
  - Parse CSV with Papaparse
  - Map columns to transaction fields
  - Validate each row
  - Handle errors gracefully
- [ ] **Implement bulk import API**
  - POST /api/v1/transactions/import
  - Accept CSV file
  - Return success/error report
- [ ] **Build import UI**
  - File upload
  - Column mapping interface
  - Preview before import
  - Import progress indicator
  - Error report with line numbers
  - Success summary

**Acceptance Criteria**:
- Users can import 12 months of data quickly
- CSV template is clear and easy to use
- Validation catches common errors
- Error messages are helpful
- Import completes in <30 seconds for 500 rows
- All tests pass

---

#### 4.2 Recurring Transactions Service (TDD)
- [ ] **Write recurring transaction tests**
  - Test create recurring transaction
  - Test list recurring transactions
  - Test update recurring transaction
  - Test delete recurring transaction
  - Test execute recurring transaction (create actual transaction)
  - Test next due date calculation
  - Test notification scheduling
- [ ] **Implement recurring service**
  - `createRecurring()`
  - `listRecurring()`
  - `updateRecurring()`
  - `deleteRecurring()`
  - `executeRecurring()`
  - `calculateNextDueDate()`
- [ ] **Implement API**
  - POST /api/v1/recurring
  - GET /api/v1/recurring
  - PATCH /api/v1/recurring/:id
  - DELETE /api/v1/recurring/:id
  - POST /api/v1/recurring/:id/execute

**Acceptance Criteria**:
- Recurring transactions can be created
- Next due date calculated correctly
- Can be executed manually
- All tests pass

---

#### 4.3 Recurring Transactions UI
- [ ] **Build recurring setup form**
  - All transaction fields
  - Frequency selector (weekly/monthly/yearly)
  - Start date
  - End date (optional)
  - Notification preference
- [ ] **Build recurring list**
  - List all recurring transactions
  - Show next due date
  - Active/inactive toggle
  - Edit/delete actions
  - Quick execute button
- [ ] **Build notification system**
  - Due date reminders (3 days before)
  - Mark as paid / skip / execute

**Acceptance Criteria**:
- Users can set up recurring income/expenses
- Reminders are timely
- Can manage recurring easily
- Mobile-optimized

---

#### 4.4 Cron Job Setup
- [ ] **Set up Vercel Cron**
  - Configure cron.json or vercel.json
- [ ] **Implement daily cron job**
  - Check due recurring transactions
  - Create transactions automatically
  - Send notifications
  - Update streaks
- [ ] **Test cron execution**
  - Manual trigger endpoint for testing
  - Verify transactions created correctly

**Acceptance Criteria**:
- Recurring transactions auto-create on due date
- Notifications sent correctly
- Can be tested locally
- Runs reliably in production

---

## WEEK 5: Pre-Purchase Check & Habits (Jan 20-26)

### 🎯 Goal: Pre-purchase tool working, habit system functional

### Tasks

#### 5.1 Pre-Purchase Check Service (TDD)
- [ ] **Write pre-purchase analysis tests**
  - Test freedom cost calculation
  - Test work cost calculation
  - Test FI impact calculation
  - Test alignment score algorithm
  - Test different scenarios
- [ ] **Implement purchase analysis service**
  - `analyzePurchase()`
  - `calculateFreedomCost()`
  - `calculateWorkCost()`
  - `calculateFiImpact()`
  - `calculateAlignmentScore()`
- [ ] **Implement API**
  - POST /api/v1/calculations/purchase-check
- [ ] **Implement purchase consideration storage**
  - Save all considerations (purchased or not)
  - Track decisions over time

**Acceptance Criteria**:
- All calculations accurate
- Alignment score is meaningful
- API responds quickly (<200ms)
- All tests pass

---

#### 5.2 Pre-Purchase Check UI
- [ ] **Design pre-purchase flow**
  - Quick access from dashboard
  - Mobile-optimized form
  - Clear visual feedback
- [ ] **Build input form**
  - Amount
  - Category
  - Reason (multiple choice)
- [ ] **Build analysis display**
  - Freedom cost (days visual)
  - Work cost (hours)
  - FI impact (future value)
  - Alignment questions
  - Decision score (color-coded)
- [ ] **Build decision actions**
  - "I'm buying it" (log transaction)
  - "Save for later"
  - "I'll pass" (celebrate avoided spending)
  - "Need more time" (close)
- [ ] **Add learning feature**
  - Track avoided spending
  - Monthly summary of money saved

**Acceptance Criteria**:
- Tool is fast to use (<1 minute)
- Calculations are clear
- Mobile-friendly
- Helps users pause and reflect
- Tracks learning over time

---

#### 5.3 Habit Builder - Daily Tracking
- [ ] **Implement notification system**
  - Daily reminder (9 PM default)
  - Push notifications (web push API)
  - Email notifications (Resend)
  - Customizable time
- [ ] **Build daily tracking UI**
  - "Log today's transactions" prompt
  - Quick-add most common transactions
  - Today's spending summary
  - Streak counter
- [ ] **Implement streak logic**
  - Track consecutive days of logging
  - Update streak on daily basis
  - Award badges for milestones

**Acceptance Criteria**:
- Notifications send reliably
- Users can customize timing
- Streak motivates daily use
- Quick-add is convenient

---

#### 5.4 Habit Builder - Weekly Review
- [ ] **Implement weekly review generation**
  - Calculate weekly metrics
  - Generate insights
  - Identify patterns
- [ ] **Build weekly review UI**
  - Automated report display
  - Value-aligned spending %
  - Experience vs. Material ratio
  - Top categories
  - Celebration or encouragement message
  - Action items
- [ ] **Implement weekly notification**
  - Send on user's preferred day/time
  - Email + push
- [ ] **Track completion**
  - Mark review as completed
  - Streak for weekly reviews

**Acceptance Criteria**:
- Weekly review is insightful
- Takes <5 minutes to complete
- Motivational tone
- Actionable suggestions
- Notifications work

---

## WEEK 6: Polish, Gamification & Beta Launch (Jan 27 - Feb 2)

### 🎯 Goal: Full gamification, monthly reports, UI polish, ready for beta

### Tasks

#### 6.1 Monthly Reports & Insights
- [ ] **Implement monthly report generation**
  - Comprehensive month summary
  - Income vs. Expenses chart
  - Savings rate vs. target
  - Category breakdown with trends
  - Spending patterns analysis
  - Freedom metrics update
  - Optimization suggestions
  - Wins and achievements
- [ ] **Build monthly report UI**
  - Beautiful report layout
  - Shareable (optional)
  - Downloadable PDF (future)
- [ ] **Schedule monthly notification**
  - Send on 1st of month
  - Email summary

**Acceptance Criteria**:
- Monthly report is comprehensive
- Insights are valuable
- Takes <10 minutes to review
- Motivates continued use

---

#### 6.2 Gamification System
- [ ] **Define badge types**
  - First Month Tracked
  - 30-Day Streak
  - Savings Champion (50%+ rate)
  - Value Aligned (80%+ for a month)
  - Freedom Seeker (25% FI)
  - Halfway There (50% FI)
  - Coast FI (75% FI)
  - Financial Freedom (100% FI)
- [ ] **Implement badge awarding**
  - Check criteria on daily/weekly/monthly basis
  - Award badges automatically
  - Send celebration notification
- [ ] **Build badges UI**
  - Badge display in profile
  - Badge unlock animations
  - Badge sharing (optional)
- [ ] **Implement levels**
  - Beginner → Conscious Spender → Freedom Seeker → Financially Free
  - Level up based on milestones
- [ ] **Build achievements dashboard**
  - Current level
  - All badges earned
  - Next milestone preview
  - Shareable achievements

**Acceptance Criteria**:
- Badges motivate users
- Unlock animations feel rewarding
- Levels track meaningful progress
- Shareable (with privacy controls)

---

#### 6.3 User Profile & Settings
- [ ] **Build complete profile page**
  - Personal info
  - Financial data inputs
  - Preferences
  - Gamification stats
- [ ] **Build settings page**
  - Notification preferences
  - Reminder timings
  - Currency (locked to BRL for now)
  - Purchase check threshold
  - Enable/disable gamification
  - Account management (delete account)
- [ ] **Implement profile API**
  - GET /api/v1/user/profile
  - PATCH /api/v1/user/profile
  - PATCH /api/v1/user/preferences

**Acceptance Criteria**:
- Users can update all settings
- Changes take effect immediately
- Profile is complete
- Account deletion works (GDPR/LGPD)

---

#### 6.4 UI/UX Polish
- [ ] **Mobile optimization pass**
  - Test on multiple devices
  - Optimize touch targets
  - Improve swipe gestures
  - Speed up animations
- [ ] **Accessibility audit**
  - Keyboard navigation
  - Screen reader testing
  - Color contrast check
  - Focus indicators
  - ARIA labels
- [ ] **Performance optimization**
  - Lazy load components
  - Optimize images
  - Reduce bundle size
  - Database query optimization
  - Add loading skeletons
- [ ] **Error handling**
  - Graceful error messages
  - Retry mechanisms
  - Offline detection
  - Network error handling
- [ ] **Empty states**
  - Onboarding hints
  - Empty transaction list
  - No recurring transactions
  - First-time user guidance
- [ ] **Micro-interactions**
  - Button animations
  - Loading indicators
  - Success confirmations
  - Smooth transitions

**Acceptance Criteria**:
- Lighthouse score 90+ (mobile)
- Passes WCAG AA
- Feels fast and responsive
- No confusing states
- Delightful to use

---

#### 6.5 Testing & Bug Fixes
- [ ] **Run full test suite**
  - All unit tests pass
  - All integration tests pass
  - All E2E tests pass
  - Coverage >80%
- [ ] **Manual testing**
  - Complete user flows
  - Edge cases
  - Error scenarios
  - Mobile devices
  - Different browsers
- [ ] **Bug triage and fixes**
  - Critical bugs (blocking)
  - High priority (UX issues)
  - Medium priority (nice to have)
  - Low priority (defer to v2)
- [ ] **Security audit**
  - Authentication flows
  - Authorization checks
  - Input validation
  - SQL injection prevention
  - XSS prevention

**Acceptance Criteria**:
- Zero critical bugs
- All high priority bugs fixed
- Test coverage >80%
- Security vulnerabilities addressed

---

#### 6.6 Resend Setup Checklist (Before Beta Launch)

- [ ] Sign up for Resend account
- [ ] Add and verify domain (lifeos.app)
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Get API key
- [ ] Update production environment variables
- [ ] Test magic link email in production
- [ ] Configure custom email templates (optional)
- [ ] Set up webhook for bounce handling (optional)
- [ ] Monitor first 100 emails for deliverability
- [ ] Enable alerts for bounce rate > 5%

---

#### 6.7 Documentation & Beta Launch
- [ ] **Write user documentation**
  - Getting started guide
  - Feature tutorials
  - FAQ
  - Troubleshooting
- [ ] **Prepare beta launch**
  - Beta signup page
  - Welcome email flow
  - Feedback collection mechanism
- [ ] **Set up analytics**
  - Vercel Analytics
  - Custom event tracking
  - Error monitoring (Sentry)
- [ ] **Deploy to production**
  - Final production deploy
  - Test in production
  - Monitor for issues
- [ ] **Launch to beta users**
  - Send invites
  - Collect feedback
  - Monitor usage
  - Quick iteration on feedback

**Acceptance Criteria**:
- Documentation is clear
- Beta users can onboard easily
- Analytics tracking key events
- No production issues
- Feedback mechanism works

---

## Post-Beta: Iteration & V1 Planning

### Week 7-8: Beta Feedback & Improvements
- [ ] Analyze user feedback
- [ ] Fix critical issues
- [ ] Iterate on UX pain points
- [ ] Optimize based on analytics
- [ ] Plan V1 features

### Future Features (V1+)
- Native mobile app (React Native)
- Bank integration (Brazilian banks)
- AI-powered insights (OpenAI)
- Goal setting and tracking
- Multi-currency support
- Collaborative features
- Data export/backup
- Dark mode
- Advanced charts and analytics

---

## Risk Management

### High Risk Items
1. **CSV Import Complexity** - Mitigation: Start early, extensive testing
2. **Cron Job Reliability** - Mitigation: Manual trigger fallback, monitoring
3. **Performance with Large Data** - Mitigation: Database indexing, pagination
4. **Mobile Browser Compatibility** - Mitigation: Test early and often

### Dependencies
- Supabase availability
- Vercel deployment limits
- Email provider (Resend) reliability
- Third-party library updates

### Contingency Plans
- If behind schedule: Cut gamification to Week 7
- If Supabase issues: Have backup PostgreSQL option
- If notification issues: Start with email only, add push later

---

## Definition of Done (Per Task)

- [ ] Tests written and passing (TDD)
- [ ] Code reviewed (self-review minimum)
- [ ] TypeScript errors: 0
- [ ] Linting errors: 0
- [ ] Responsive (mobile + desktop)
- [ ] Accessible (keyboard nav, ARIA)
- [ ] Documented (if complex)
- [ ] Deployed to preview
- [ ] Manually tested

---

## Daily Workflow with Claude Code

1. **Morning**: Review today's tasks from backlog
2. **TDD Cycle**: 
   - Write test first (describe expected behavior)
   - Run test (red)
   - Implement feature
   - Run test (green)
   - Refactor
3. **Afternoon**: Continue with next task
4. **End of Day**: 
   - Update backlog (mark completed)
   - Deploy to preview
   - Review progress
   - Plan tomorrow

---

**Last Updated**: Jan 2026
**Status**: In Progress
**Next Update**: Weekly progress reviews
