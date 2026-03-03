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
 * Fill and submit the /recurring/new form.
 * startDate defaults to today; nextDueDate will be set to today + frequency
 * (e.g. today + 1 month for MONTHLY) — the card will NOT show "Executar".
 * Use the test seed endpoint instead when you need an overdue recurring.
 */
async function createRecurring(
  page: Page,
  {
    description = 'Aluguel mensal',
    amount = '1500',
    frequencyLabel = 'Mensal',
  }: {
    description?: string;
    amount?: string;
    frequencyLabel?: string;
  } = {}
) {
  await page.goto('/recurring/new');

  await page.fill('#description', description);
  await page.fill('#amount', amount);

  // Type → Despesa
  await page.getByRole('combobox').nth(0).click();
  await page.getByRole('option', { name: 'Despesa' }).click();

  // Category → first available expense category (loaded async after type selection)
  await page.getByRole('combobox').nth(1).click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
  await page.getByRole('option').first().click();

  // Frequency
  await page.getByRole('combobox').nth(2).click();
  await page.getByRole('option', { name: frequencyLabel }).click();

  await page.click('button:has-text("Criar recorrência")');
  await page.waitForURL(/\/recurring$/, { timeout: 10000 });

  // Wait for the card to appear in the refreshed list
  await expect(page.locator(`text=${description}`)).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Create an overdue recurring via the test-only seed endpoint.
 * The endpoint sets nextDueDate = yesterday, making "Executar" visible.
 * Only works in non-production environments.
 */
async function seedOverdueRecurring(page: Page, description = 'Conta de água') {
  await page.goto('/recurring'); // establish session before making API calls
  const response = await page.request.post('/api/v1/test-seed/recurring', {
    data: { description, amount: 85 },
  });
  expect(response.ok()).toBeTruthy();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Recurring Transactions', () => {
  // ── No auth needed ──────────────────────────────────────────────────────────

  test('unauthenticated user navigating to /recurring is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/recurring');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user navigating to /recurring/new is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/recurring/new');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Full flow tests ──────────────────────────────────────────────────────────

  test.describe('Full Flow (requires auth)', () => {
    // Test: Create a monthly recurring expense → appears in list with correct info
    test('user can create a monthly recurring expense → appears in list', async ({
      page,
    }) => {
      const email = uniqueEmail('rec-create');
      await loginUser(page, email);

      await createRecurring(page, {
        description: 'Internet mensal',
        amount: '120',
        frequencyLabel: 'Mensal',
      });

      // Card shows description, formatted amount, and frequency badge
      await expect(page.locator('text=Internet mensal')).toBeVisible();
      await expect(page.locator('text=R$ 120,00')).toBeVisible();
      // Use exact match to avoid substring matching the description itself
      await expect(page.getByText('Mensal', { exact: true })).toBeVisible();
    });

    // Test: List shows type filter controls
    test('recurring list shows type filter controls', async ({ page }) => {
      const email = uniqueEmail('rec-filters');
      await loginUser(page, email);
      await page.goto('/recurring');

      await expect(page.locator('button:has-text("Todos")')).toBeVisible();
      await expect(page.locator('button:has-text("Receitas")')).toBeVisible();
      await expect(page.locator('button:has-text("Despesas")')).toBeVisible();
    });

    // Test: Filtering by Receitas hides expense recurring transactions
    test('filtering by Receitas hides expense recurring transactions', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('rec-type-filter');
      await loginUser(page, email);

      await createRecurring(page, {
        description: 'Conta de luz',
        amount: '200',
        frequencyLabel: 'Mensal',
      });

      // Card is visible in "Todos" (default)
      await expect(page.locator('text=Conta de luz')).toBeVisible();

      // Switch to Receitas filter — the EXPENSE card should disappear
      await page.click('button:has-text("Receitas")');
      await expect(page.locator('text=Conta de luz')).not.toBeVisible({
        timeout: 5000,
      });
    });

    // Test: "Execute now" creates a transaction and updates the card's next due date.
    // Uses a test-only seed endpoint (POST /api/v1/_test/recurring) to create a
    // recurring with nextDueDate = yesterday — the only way to make "Executar"
    // appear, since the normal create flow always sets nextDueDate = startDate + frequency.
    test('"Execute now" executes the recurring and refreshes the card', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('rec-execute');
      await loginUser(page, email);

      // Seed an overdue recurring (nextDueDate = yesterday)
      await seedOverdueRecurring(page, 'Conta de água');

      // Reload the list to show the new item
      await page.reload();
      await expect(page.locator('text=Conta de água')).toBeVisible({
        timeout: 10000,
      });

      // "Executar" button is visible because nextDueDate < today
      const executeBtn = page.locator('button:has-text("Executar")').first();
      await expect(executeBtn).toBeVisible({ timeout: 10000 });

      // Click — inline confirm appears
      await executeBtn.click();
      const confirmBtn = page
        .locator('button[aria-label="Confirmar execução"]')
        .first();
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });

      // Confirm — triggers POST /api/v1/recurring/[id]/execute
      await confirmBtn.click();

      // nextDueDate advances to next month → execute button disappears
      await expect(page.locator('button:has-text("Executar")')).not.toBeVisible(
        { timeout: 10000 }
      );
    });

    // Test: User can edit frequency and amount → list reflects updated values
    test('user can edit frequency and amount → list reflects updated values', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('rec-edit');
      await loginUser(page, email);

      await createRecurring(page, {
        description: 'Plano academia',
        amount: '100',
        frequencyLabel: 'Mensal',
      });

      // Navigate to edit page via the edit icon on the card
      await page
        .locator('button[aria-label="Editar recorrência"]')
        .first()
        .click();
      await expect(page).toHaveURL(/\/recurring\/.+/, { timeout: 10000 });

      // Update amount
      await page.fill('#amount', '200');

      // Update frequency from Mensal to Anual (nth(2) = Frequency combobox)
      await page.getByRole('combobox').nth(2).click();
      await page.getByRole('option', { name: 'Anual' }).click();

      // Save
      await page.click('button:has-text("Salvar")');
      await expect(page).toHaveURL(/\/recurring$/, { timeout: 10000 });

      // List reflects updated values
      await expect(page.locator('text=R$ 200,00')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText('Anual', { exact: true })).toBeVisible({
        timeout: 10000,
      });
    });

    // Test: User can deactivate a recurring transaction → no longer appears as active
    test('user can deactivate a recurring transaction → no longer in active list', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('rec-deactivate');
      await loginUser(page, email);

      await createRecurring(page, {
        description: 'Streaming para desativar',
        amount: '50',
        frequencyLabel: 'Mensal',
      });

      await expect(page.locator('text=Streaming para desativar')).toBeVisible();

      // Click deactivate (trash icon) on the card
      await page
        .locator('button[aria-label="Desativar recorrência"]')
        .first()
        .click();

      // Dialog appears — confirm
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Desativar' })
        .click();

      // Wait for dialog to close before checking list (avoids strict-mode
      // violation while the dialog description still contains the name)
      await expect(page.getByRole('dialog')).not.toBeVisible({
        timeout: 5000,
      });

      // Card disappears from the active list
      await expect(
        page.locator('text=Streaming para desativar')
      ).not.toBeVisible({ timeout: 10000 });
    });

    // Test: Deactivating from the edit page also works
    test('deactivating from the edit page redirects to list without the card', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('rec-edit-deactivate');
      await loginUser(page, email);

      await createRecurring(page, {
        description: 'Assinatura para remover',
        amount: '30',
        frequencyLabel: 'Mensal',
      });

      // Open edit page
      await page
        .locator('button[aria-label="Editar recorrência"]')
        .first()
        .click();
      await expect(page).toHaveURL(/\/recurring\/.+/, { timeout: 10000 });

      // Click the "Desativar recorrência" button at the bottom of the form
      await page.click('button:has-text("Desativar recorrência")');

      // Dialog opens — verify via the dialog role, not the title text
      // (the title text matches both the trigger button and the dialog heading)
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Desativar' })
        .click();

      // Redirected to /recurring — card is gone from active list
      await expect(page).toHaveURL(/\/recurring$/, { timeout: 10000 });
      await expect(
        page.locator('text=Assinatura para remover')
      ).not.toBeVisible({ timeout: 10000 });
    });
  });
});
