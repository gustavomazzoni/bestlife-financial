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

async function submitNLTransaction(page: Page, text: string) {
  const textarea = page.locator(
    'textarea[aria-label="Descreva sua transação"]'
  );
  await textarea.fill(text);
  await page.click('button[aria-label="Enviar transação"]');
  await expect(page.locator('text=Transação Detectada')).toBeVisible({
    timeout: 10000,
  });
  await page.click('button:has-text("Confirmar")');
  await expect(page.locator('text=Transação salva com sucesso!')).toBeVisible({
    timeout: 10000,
  });
}

test.describe('Transactions Page', () => {
  test('unauthenticated user navigating to /transactions is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('Full Flow (requires auth)', () => {
    // Test 3: NL input on /transactions → inferred transaction shown for confirmation
    test('NL input on /transactions shows inferred transaction card', async ({
      page,
    }) => {
      const email = uniqueEmail('txn-infer');
      await loginUser(page, email);
      await page.goto('/transactions');

      const textarea = page.locator(
        'textarea[aria-label="Descreva sua transação"]'
      );
      await textarea.fill('Café no trabalho R$ 15');
      await page.click('button[aria-label="Enviar transação"]');

      await expect(page.locator('text=Transação Detectada')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('text=R$ 15,00')).toBeVisible();
    });

    // Test 4: Confirming inferred transaction saves it and appears in list
    test('confirming NL transaction saves it and appears in the list', async ({
      page,
    }) => {
      const email = uniqueEmail('txn-confirm');
      await loginUser(page, email);
      await page.goto('/transactions');

      await submitNLTransaction(page, 'Almoço no restaurante R$ 45');

      // After refreshTrigger increments, TransactionList remounts and re-fetches.
      // The saved transaction should appear in the list.
      await expect(page.locator('text=R$ 45,00')).toBeVisible({
        timeout: 10000,
      });
    });

    // Test 5: Transactions list appears with pagination/filters
    test('transactions list shows filter controls', async ({ page }) => {
      const email = uniqueEmail('txn-list');
      await loginUser(page, email);
      await page.goto('/transactions');

      await expect(page.locator('button:has-text("Todos")')).toBeVisible();
      await expect(page.locator('button:has-text("Receitas")')).toBeVisible();
      await expect(page.locator('button:has-text("Despesas")')).toBeVisible();
      await expect(page.locator('button:has-text("Poupança")')).toBeVisible();
    });

    // Test 6: User can edit an existing transaction → saved values reflect in list
    test('editing a transaction reflects saved values in the list', async ({
      page,
    }) => {
      test.slow(); // multi-step: create → edit → verify in list
      const email = uniqueEmail('txn-edit');
      await loginUser(page, email);
      await page.goto('/transactions');

      // Create a transaction to edit
      await submitNLTransaction(page, 'Mercado R$ 100');

      // Wait for it to appear in the list
      await expect(page.locator('text=R$ 100,00')).toBeVisible({
        timeout: 10000,
      });

      // Click the first transaction card body to open the edit page.
      // Card body buttons have aria-label="Editar <description>".
      await page.locator('button[aria-label^="Editar"]').first().click();
      await expect(page).toHaveURL(/\/transactions\/.+/, { timeout: 10000 });

      // Update the description
      await page.fill('#description', 'Supermercado atualizado');

      // Save
      await page.click('button:has-text("Salvar")');
      await expect(page).toHaveURL(/\/transactions$/, { timeout: 10000 });

      // The updated description should appear in the list
      await expect(page.locator('text=Supermercado atualizado')).toBeVisible({
        timeout: 10000,
      });
    });

    // Test 7: User can delete a transaction → removed from list without reload
    test('deleting a transaction removes it from the list without page reload', async ({
      page,
    }) => {
      test.slow(); // multi-step: create → open dialog → delete → verify gone
      const email = uniqueEmail('txn-delete');
      await loginUser(page, email);
      await page.goto('/transactions');

      // Create a transaction to delete
      await submitNLTransaction(page, 'Táxi para o aeroporto R$ 80');

      // Confirm it appears in the list
      await expect(page.locator('text=R$ 80,00')).toBeVisible({
        timeout: 10000,
      });

      // Click the delete icon on the first card
      await page
        .locator('button[aria-label="Excluir transação"]')
        .first()
        .click();

      // AlertDialog confirmation appears
      await expect(page.locator('text=Confirmar exclusão')).toBeVisible();

      // Confirm deletion via the dialog's destructive button
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Excluir' })
        .click();

      // Transaction disappears from the list — URL stays at /transactions (no reload)
      await expect(page).toHaveURL(/\/transactions/);
      await expect(page.locator('text=R$ 80,00')).not.toBeVisible({
        timeout: 10000,
      });
    });

    // Test 8: Filtering by INCOME shows only income transactions
    test('filtering by INCOME hides expense transactions', async ({ page }) => {
      test.slow(); // multi-step: create → filter → verify
      const email = uniqueEmail('txn-filter');
      await loginUser(page, email);
      await page.goto('/transactions');

      // Create a transaction that the NL service will typically infer as EXPENSE
      await submitNLTransaction(page, 'Café R$ 10');

      // Confirm the Despesa (expense) badge is visible in the list
      await expect(page.locator('text=R$ 10,00')).toBeVisible({
        timeout: 10000,
      });

      // Apply the INCOME (Receitas) filter
      await page.click('button:has-text("Receitas")');

      // After filtering, no EXPENSE badges should be visible
      // (either the expense is hidden or empty-state message is shown)
      await expect(page.locator('span:has-text("Despesa")')).not.toBeVisible({
        timeout: 5000,
      });
    });
  });
});
