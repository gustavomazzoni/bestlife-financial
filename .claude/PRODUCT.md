# BestLife Financial Freedom Module — Product Specification

## Philosophy

**Freedom > Money.** The app helps users discover their "Freedom Number" — how much money is enough to cover their ideal lifestyle without having to work. By making smart, conscious, and aligned financial choices, users can create the freedom to live their Best Life.

### The Problem
Society teaches us to pursue success based on money, material possessions, and status. We sacrifice health, passions, and time with loved ones, ending up stuck in a life we don't want.

### Core Methodology
1. **Define what truly matters** — Core values and life goals
2. **Design ideal lifestyle** — Cost of living aligned with values
3. **Discover Freedom Number** — Calculate how much is enough
4. **Understand current reality** — Analyze actual spending vs. ideal
5. **Make conscious choices** — Eliminate non-essential spending
6. **Track progress** — Monitor runway gained, FI progress, value-aligned spending

---

## User Journey: Onboarding Flow

### Step 1: Defining What's Truly Important
- App presents a curated list of life goals/values (user selects up to 10)
- Examples: Family, Energy & vitality, Adventure, Freedom (mandatory, always selected)
- User can add custom values/goals
- Selections drive the rest of the journey

### Step 2: Defining the Ideal Life (Lifestyle Design)
- App suggests lifestyle categories aligned with selected values
- Auto-includes essential categories (housing, food) if not selected
- User arranges and customizes lifestyle buckets (categories + values)
- User sets monthly/annual budget per bucket
- **Total = Dream Lifestyle Cost**

### Step 3: Income & Investments Setup
- Active income (salary, business income)
- Passive income (rental, dividends)
- Total investments (current savings)
- Optional: expected return rate (default 7%)

### Step 4: Freedom Number Discovery
- **Freedom Number** = `Dream Lifestyle Cost × 12 × 25` (4% rule)
- Shows three scenarios:
  - Lean FI: 80% of dream
  - Standard FI: 100% of dream
  - Fat FI: 150% of dream
- First "aha moment": Seeing how much money is enough

### Step 5: Current Cost of Living Analysis
- User uploads past 12-month transaction statements (CSV)
- App calculates current annual cost of living
- App identifies outlier (one-time) vs. regular expenses
- **Aha moment**: Seeing current annual cost calculated automatically
- User can skip and upload later (calculations less accurate)

### Step 6: Alignment Analysis & Spending Insights
- Compares current spending vs. ideal lifestyle cost
- Highlights inconsistency between stated values and actual spending
- Identifies: non-essential habits, non-aligned spending, opportunities to cut
- **Aha moment**: Seeing how much spending is not value-aligned

---

## User Journey: Regular Flow

### 1. Transaction Entry (Natural Language Interface)
- **Primary interaction**: ChatGPT-like prompt — "What's your Transaction?"
- User types: `"Bought coffee and pastry for breakfast, R$ 25"`
- App infers: Amount, Category, Value alignment, Core value alignment
- User confirms/edits before saving

### 2. Daily Habit Building
- End-of-day reminder (configurable, default 9 PM)
- Prompts to log today's transactions
- Tracks daily logging streak
- Celebrates consistency with badges

### 3. Recurring Transaction Management
- User adds recurring income/expenses to calendar
- App suggests recurring patterns from transaction history
- User sets frequency (weekly/monthly/yearly) and notification preferences

### 4. Proactive Transaction Reminders
- Weekly preview (start of week)
- Day-before reminder (or 2 days before, configurable)
- User can mark as paid, skip, or execute early

### 5. Constant Alignment Monitoring
- Dashboard always highlights inconsistent expenses
- Prominently shows:
  - Monthly runway gained/lost
  - FI Progress %
  - Value-aligned spending %
  - Savings rate %

---

## Core User Outcomes

Users succeed when they:
1. **Reduce spending** by cutting non-important expenses
2. **Increase value-aligned spending** percentage
3. **Increase freedom bucket** (investments/savings toward FI)

## Primary Dashboard Metrics (Priority Order)

1. **Monthly Runway Gained/Lost** — Immediate impact of spending choices
2. **FI Progress %** — How close to Freedom Number
3. **Value-Aligned Spending %** — Percentage aligned with core values
4. **Savings Rate %** — Overall savings performance

## Key "Aha Moments" (Priority Order)

1. **Seeing how many years of freedom current savings buy** — Primary aha moment
2. **Seeing current annual cost of living calculated automatically** — Reality check
3. **Seeing how much spending is non-aligned** — Awareness of patterns
4. **Seeing Freedom Number for the first time** — The target to reach

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

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API Response Time: < 200ms (p95)
- Database Queries: < 50ms (p95)
- Lighthouse Score: 90+ (mobile)

---

## Accessibility Requirements

- WCAG 2.1 Level AA compliance
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

---

## Assumptions

1. Users primarily access via mobile browser (PWA)
2. Email notifications sufficient (no SMS)
3. Single user accounts (no family/shared accounts)
4. Brazilian market focus (BRL, Portuguese future)

## Open Questions

1. Should we support multiple bank accounts tracking?
2. What's the onboarding completion target (days)?
3. Premium features for monetization?
4. Data retention policy (how long keep old transactions)?
5. LGPD compliance requirements (Brazilian privacy law)?
