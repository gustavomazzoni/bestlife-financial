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
 * Fill and submit the /scheduled/new form with a recurring frequency.
 * nextOccurrence will be startDate + 1 period — card will NOT show "Executar".
 * Use seedOverdueScheduled() when you need an overdue item with the execute button.
 */
async function createScheduled(
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
  await page.goto('/scheduled/new');

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

  await page.click('button:has-text("Criar agendamento")');
  await page.waitForURL(/\/scheduled$/, { timeout: 10000 });

  // Wait for the card to appear in the refreshed list
  await expect(page.locator(`text=${description}`)).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Fill and submit /scheduled/new with ONCE frequency.
 */
async function createScheduledOnce(
  page: Page,
  {
    description = 'Pagamento único',
    amount = '500',
  }: { description?: string; amount?: string } = {}
) {
  await page.goto('/scheduled/new');

  await page.fill('#description', description);
  await page.fill('#amount', amount);

  // Type → Despesa
  await page.getByRole('combobox').nth(0).click();
  await page.getByRole('option', { name: 'Despesa' }).click();

  // Category
  await page.getByRole('combobox').nth(1).click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
  await page.getByRole('option').first().click();

  // Frequency → Uma vez
  await page.getByRole('combobox').nth(2).click();
  await page
    .getByRole('option', { name: 'Uma vez (agendamento único)' })
    .click();

  // startDate defaults to today — leave it
  await page.click('button:has-text("Criar agendamento")');
  await page.waitForURL(/\/scheduled$/, { timeout: 10000 });

  await expect(page.locator(`text=${description}`)).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Seed an overdue MONTHLY scheduled transaction via the test-only seed endpoint.
 * Sets nextOccurrence = yesterday → "Executar" button is visible.
 */
async function seedOverdueScheduled(page: Page, description = 'Conta de água') {
  await page.goto('/scheduled'); // establish session before making API calls
  const response = await page.request.post('/api/v1/test-seed/recurring', {
    data: { description, amount: 85 },
  });
  expect(response.ok()).toBeTruthy();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Scheduled Transactions', () => {
  // ── Auth guards ──────────────────────────────────────────────────────────────

  test('unauthenticated user navigating to /scheduled is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/scheduled');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user navigating to /scheduled/new is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/scheduled/new');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Full flow tests ──────────────────────────────────────────────────────────

  test.describe('Full Flow (requires auth)', () => {
    test('user can create a monthly recurring scheduled transaction → appears in list', async ({
      page,
    }) => {
      const email = uniqueEmail('sched-create-monthly');
      await loginUser(page, email);

      await createScheduled(page, {
        description: 'Internet mensal',
        amount: '120',
        frequencyLabel: 'Mensal',
      });

      // Card shows description, formatted amount, and frequency badge
      await expect(page.locator('text=Internet mensal')).toBeVisible();
      await expect(page.locator('text=R$ 120,00')).toBeVisible();
      await expect(page.getByText('Mensal', { exact: true })).toBeVisible();
    });

    test('user can create a ONCE scheduled transaction → appears with "Uma vez" badge', async ({
      page,
    }) => {
      const email = uniqueEmail('sched-create-once');
      await loginUser(page, email);

      await createScheduledOnce(page, {
        description: 'Consulta médica',
        amount: '350',
      });

      await expect(page.locator('text=Consulta médica')).toBeVisible();
      await expect(page.locator('text=R$ 350,00')).toBeVisible();
      await expect(page.getByText('Uma vez', { exact: true })).toBeVisible();
    });

    test('scheduled list shows type filter controls', async ({ page }) => {
      const email = uniqueEmail('sched-filters');
      await loginUser(page, email);
      await page.goto('/scheduled');

      await expect(page.locator('button:has-text("Todos")')).toBeVisible();
      await expect(page.locator('button:has-text("Receitas")')).toBeVisible();
      await expect(page.locator('button:has-text("Despesas")')).toBeVisible();
    });

    test('filtering by Receitas hides expense scheduled transactions', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('sched-type-filter');
      await loginUser(page, email);

      await createScheduled(page, {
        description: 'Conta de luz',
        amount: '200',
        frequencyLabel: 'Mensal',
      });

      await expect(page.locator('text=Conta de luz')).toBeVisible();

      await page.click('button:has-text("Receitas")');
      await expect(page.locator('text=Conta de luz')).not.toBeVisible({
        timeout: 5000,
      });
    });

    test('"Execute now" executes the overdue recurring and refreshes the card', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('sched-execute');
      await loginUser(page, email);

      // Seed an overdue recurring (nextOccurrence = yesterday)
      await seedOverdueScheduled(page, 'Conta de água');

      // Reload the list to show the new item
      await page.reload();
      await expect(page.locator('text=Conta de água')).toBeVisible({
        timeout: 10000,
      });

      // "Executar" button is visible because nextOccurrence < today
      const executeBtn = page.locator('button:has-text("Executar")').first();
      await expect(executeBtn).toBeVisible({ timeout: 10000 });

      // Click — date picker dialog opens
      await executeBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // Date defaults to today — confirm without changing it
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Confirmar' })
        .click();

      // nextOccurrence advances to next month → execute button disappears
      await expect(page.locator('button:has-text("Executar")')).not.toBeVisible(
        { timeout: 10000 }
      );
    });

    test('user can edit frequency and amount → list reflects updated values', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('sched-edit');
      await loginUser(page, email);

      await createScheduled(page, {
        description: 'Plano academia',
        amount: '100',
        frequencyLabel: 'Mensal',
      });

      // Navigate to edit page via the edit icon on the card
      await page
        .locator('button[aria-label="Editar agendamento"]')
        .first()
        .click();
      await expect(page).toHaveURL(/\/scheduled\/.+/, { timeout: 10000 });

      // Update amount
      await page.fill('#amount', '200');

      // Update frequency to Anual
      await page.getByRole('combobox').nth(2).click();
      await page.getByRole('option', { name: 'Anual' }).click();

      // Save
      await page.click('button:has-text("Salvar")');
      await expect(page).toHaveURL(/\/scheduled$/, { timeout: 10000 });

      await expect(page.locator('text=R$ 200,00')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText('Anual', { exact: true })).toBeVisible({
        timeout: 10000,
      });
    });

    test('user can deactivate a MONTHLY recurring → no longer in active list', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('sched-deactivate');
      await loginUser(page, email);

      await createScheduled(page, {
        description: 'Streaming para desativar',
        amount: '50',
        frequencyLabel: 'Mensal',
      });

      await expect(page.locator('text=Streaming para desativar')).toBeVisible();

      // Click the deactivate button on the card (MONTHLY → aria-label "Desativar recorrência")
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

      await expect(page.getByRole('dialog')).not.toBeVisible({
        timeout: 5000,
      });

      // Card disappears from the active list (soft deleted)
      await expect(
        page.locator('text=Streaming para desativar')
      ).not.toBeVisible({ timeout: 10000 });
    });

    test('user can delete a ONCE scheduled transaction → completely removed', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('sched-delete-once');
      await loginUser(page, email);

      await createScheduledOnce(page, {
        description: 'Pagamento para excluir',
        amount: '300',
      });

      await expect(page.locator('text=Pagamento para excluir')).toBeVisible();

      // ONCE card has "Excluir agendamento" aria-label
      await page
        .locator('button[aria-label="Excluir agendamento"]')
        .first()
        .click();

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Excluir' })
        .click();

      await expect(page.getByRole('dialog')).not.toBeVisible({
        timeout: 5000,
      });

      // Hard deleted — completely gone
      await expect(page.locator('text=Pagamento para excluir')).not.toBeVisible(
        { timeout: 10000 }
      );
    });

    test('deactivating from the edit page redirects to list without the card', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('sched-edit-deactivate');
      await loginUser(page, email);

      await createScheduled(page, {
        description: 'Assinatura para remover',
        amount: '30',
        frequencyLabel: 'Mensal',
      });

      // Open edit page
      await page
        .locator('button[aria-label="Editar agendamento"]')
        .first()
        .click();
      await expect(page).toHaveURL(/\/scheduled\/.+/, { timeout: 10000 });

      // Click the "Desativar recorrência" button at the bottom of the form
      await page.click('button:has-text("Desativar recorrência")');

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Desativar' })
        .click();

      // Redirected to /scheduled — card is gone from active list
      await expect(page).toHaveURL(/\/scheduled$/, { timeout: 10000 });
      await expect(
        page.locator('text=Assinatura para remover')
      ).not.toBeVisible({ timeout: 10000 });
    });
  });
});
