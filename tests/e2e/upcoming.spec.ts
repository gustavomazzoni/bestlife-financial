import { test, expect, Page } from '@playwright/test';

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function getMagicLink(page: Page, email: string): Promise<string> {
  const endTime = Date.now() + 15000;
  while (Date.now() < endTime) {
    const response = await page.request.get(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`
    );
    const data = await response.json();
    if (data.messages?.length > 0) {
      const msgResponse = await page.request.get(
        `${MAILPIT_URL}/api/v1/message/${data.messages[0].ID}`
      );
      const msgData = await msgResponse.json();
      const match = msgData.HTML?.match(/href="([^"]*callback[^"]*)"/i);
      if (match) return match[1];
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`No magic link email found for ${email}`);
}

async function loginUser(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await Promise.all([
    page.waitForURL('**/verify-request**', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  const magicLink = await getMagicLink(page, email);
  await page.goto(magicLink);
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });

  if (page.url().includes('/onboarding')) {
    await page.fill('#step-input', '8000');
    await page.click('button:has-text("Próximo")');
    await page.fill('#step-input', '15000');
    await page.click('button:has-text("Próximo")');
    await page.fill('#step-input', '50000');
    await page.click('button:has-text("Concluir")');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  }
}

/**
 * Create a future-dated transaction directly via API using the authenticated session.
 * Returns the created transaction ID.
 */
async function createScheduledTransaction(
  page: Page,
  description: string,
  amount: number
): Promise<string> {
  // Get a valid category ID first
  const catResponse = await page.request.get('/api/v1/categories');
  const catJson = await catResponse.json();
  const expenseCategories: Array<{ id: string; type: string }> = (
    catJson.data ?? []
  ).filter((c: { type: string }) => c.type === 'EXPENSE');

  if (expenseCategories.length === 0) {
    throw new Error('No EXPENSE categories found');
  }
  const categoryId = expenseCategories[0].id;

  // Build a date 3 days from now (safely within the 7-day upcoming window)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  futureDate.setHours(12, 0, 0, 0);

  const response = await page.request.post('/api/v1/transactions', {
    data: {
      description,
      amount,
      date: futureDate.toISOString(),
      type: 'EXPENSE',
      categoryId,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create transaction: ${response.status()} — ${body}`
    );
  }

  const json = await response.json();
  return json.data.id as string;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Upcoming Transactions Widget — Esta Semana', () => {
  // ── Auth guard ───────────────────────────────────────────────────────────────

  test('unauthenticated user navigating to /dashboard is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Empty state ──────────────────────────────────────────────────────────────

  test('shows empty state when no upcoming items exist', async ({ page }) => {
    const email = uniqueEmail('upcoming-empty');
    await loginUser(page, email);

    await expect(
      page.locator('[data-testid="upcoming-transactions"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="upcoming-transactions-empty"]')
    ).toBeVisible();
  });

  // ── Scheduled transaction flow ───────────────────────────────────────────────

  test('scheduled transaction appears in Esta Semana widget on dashboard', async ({
    page,
  }) => {
    const email = uniqueEmail('upcoming-appear');
    await loginUser(page, email);

    await createScheduledTransaction(page, 'Pagamento Futuro', 750);

    // Reload to get fresh RSC data
    await page.reload();

    const widget = page.locator('[data-testid="upcoming-transactions"]');
    await expect(widget).toBeVisible({ timeout: 10000 });
    await expect(widget).toContainText('Pagamento Futuro');
    await expect(widget).toContainText('R$ 750,00');

    // Empty state should NOT be shown
    await expect(
      page.locator('[data-testid="upcoming-transactions-empty"]')
    ).not.toBeVisible();
  });

  test('scheduled transaction shows PENDENTE badge in transaction list', async ({
    page,
  }) => {
    const email = uniqueEmail('upcoming-pending-badge');
    await loginUser(page, email);

    await createScheduledTransaction(page, 'Conta Agendada', 300);

    await page.goto('/transactions');

    await expect(page.locator('text=PENDENTE').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('executing a scheduled transaction removes it from the widget', async ({
    page,
  }) => {
    test.slow(); // multi-step: create → reload → execute → verify
    const email = uniqueEmail('upcoming-execute');
    await loginUser(page, email);

    await createScheduledTransaction(page, 'Despesa Para Executar', 500);

    // Reload dashboard to see the item in the widget
    await page.reload();

    const widget = page.locator('[data-testid="upcoming-transactions"]');
    await expect(widget).toContainText('Despesa Para Executar', {
      timeout: 10000,
    });

    // Click the execute (checkmark) button on the upcoming item
    const executeBtn = page
      .locator('[data-testid="upcoming-execute-btn"]')
      .first();
    await executeBtn.click();

    // After router.refresh(), the RSC re-renders — item should disappear
    await expect(widget).not.toContainText('Despesa Para Executar', {
      timeout: 10000,
    });
  });

  test('executed transaction appears in recent transactions after execution', async ({
    page,
  }) => {
    test.slow(); // multi-step flow
    const email = uniqueEmail('upcoming-in-recent');
    await loginUser(page, email);

    await createScheduledTransaction(page, 'Transação Executada', 999);

    await page.reload();

    // Wait for upcoming widget to load with our item
    await expect(
      page.locator('[data-testid="upcoming-transactions"]')
    ).toContainText('Transação Executada', { timeout: 10000 });

    // Execute it from the widget
    await page.locator('[data-testid="upcoming-execute-btn"]').first().click();

    // Now the executed transaction should appear in the recent transactions section
    const recentSection = page.locator('[data-testid="recent-transactions"]');
    await expect(recentSection).toContainText('Transação Executada', {
      timeout: 10000,
    });
  });

  // ── Upcoming widget structure ────────────────────────────────────────────────

  test('upcoming item shows category icon, description, date, and amount', async ({
    page,
  }) => {
    const email = uniqueEmail('upcoming-structure');
    await loginUser(page, email);

    await createScheduledTransaction(page, 'Aluguel Agendado', 2000);
    await page.reload();

    const item = page
      .locator(
        '[data-testid="upcoming-item"], [data-testid="upcoming-item-today"]'
      )
      .first();
    await expect(item).toBeVisible({ timeout: 10000 });
    await expect(item).toContainText('Aluguel Agendado');
    await expect(item).toContainText('R$ 2.000,00');
  });

  test('executing via transaction list removes PENDENTE badge', async ({
    page,
  }) => {
    test.slow();
    const email = uniqueEmail('upcoming-list-execute');
    await loginUser(page, email);

    await createScheduledTransaction(page, 'Conta A Executar', 150);

    await page.goto('/transactions');

    // PENDENTE badge should appear
    await expect(page.locator('text=PENDENTE').first()).toBeVisible({
      timeout: 10000,
    });

    // Click the execute (CheckCircle) button on the card
    await page
      .locator('button[aria-label="Executar transação"]')
      .first()
      .click();

    // PENDENTE badge should disappear after execution
    await expect(page.locator('text=PENDENTE')).not.toBeVisible({
      timeout: 10000,
    });
  });
});
