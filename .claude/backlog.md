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
  - Test transaction form validation
  - Test transaction list display
  - Test filtering and sorting
  - Test mobile interactions
- [ ] **Build transaction form**
  - Date picker (mobile-friendly)
  - Amount input (BRL formatting)
  - Type selector (Income/Expense/Saving)
  - Category dropdown
  - Necessity level selector
  - Value alignment tags
  - Description field
  - Form validation feedback
- [ ] **Build transaction list**
  - Transaction cards (mobile-optimized)
  - Filters (date range, type, category)
  - Sort options
  - Search
  - Infinite scroll / pagination
- [ ] **Build transaction detail/edit**
  - View transaction details
  - Edit transaction
  - Delete confirmation
- [ ] **Add quick-add button**
  - Floating action button (mobile)
  - Quick add most common transaction types

**Acceptance Criteria**:
- Forms work on mobile and desktop
- Validation provides clear feedback
- Transactions display correctly
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
  - Most important metrics at top
  - Responsive grid
- [ ] **Build metric cards**
  - FI Progress (with progress bar)
  - FI Number (with 3 scenarios)
  - Current Runway (visual indicator)
  - Minimum Work Required
  - Emergency Fund Status
  - Savings Rate (with trend)
  - Time to FI (with projection chart)
  - Freedom Milestones (progress tracker)
- [ ] **Add interactivity**
  - Tooltips explaining each metric
  - "What if" calculator (adjust savings to see impact)
  - Expandable details
- [ ] **Optimize for mobile**
  - Swipeable cards
  - Collapsible sections
  - Touch-friendly

**Acceptance Criteria**:
- Dashboard shows all key metrics
- Visually appealing and motivating
- Loads fast (<2s)
- Mobile-optimized
- Tooltips are helpful
- Interactive elements work

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
