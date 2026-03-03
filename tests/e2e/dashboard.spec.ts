import { test, expect, Page } from '@playwright/test';

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function getMagicLink(page: Page, email: string): Promise<string> {
  const endTime = Date.now() + 15000;
  while (Date.now() < endTime) {
    const res = await page.request.get(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`
    );
    const data = await res.json();
    if (data.messages?.length > 0) {
      const msg = await page.request.get(
        `${MAILPIT_URL}/api/v1/message/${data.messages[0].ID}`
      );
      const msgData = await msg.json();
      const match = msgData.HTML?.match(/href="([^"]*callback[^"]*)"/i);
      if (match) return match[1];
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`No magic link email found for ${email}`);
}

/** Login and complete onboarding if needed. Always lands on /dashboard. */
async function loginUser(
  page: Page,
  email: string,
  opts: { income?: string; dreamCost?: string; investments?: string } = {}
) {
  const { income = '8000', dreamCost = '15000', investments = '50000' } = opts;

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
    await page.fill('#step-input', income);
    await page.click('button:has-text("Próximo")');
    await page.fill('#step-input', dreamCost);
    await page.click('button:has-text("Próximo")');
    await page.fill('#step-input', investments);
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

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  // ── Auth guard ───────────────────────────────────────────────────────────────

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Fresh user (no transactions yet) ─────────────────────────────────────────

  test.describe('Fresh user (no transactions)', () => {
    test('all 4 metric cards render without crashing', async ({ page }) => {
      const email = uniqueEmail('dash-fresh');
      await loginUser(page, email);

      // All 4 cards must be visible — zero values are acceptable, crashes are not
      await expect(
        page.locator('[data-testid="metric-savings-rate"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="metric-fi-progress"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="metric-monthly-spending"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="metric-value-aligned"]')
      ).toBeVisible();
    });

    test('FI progress card shows runway derived from onboarding data', async ({
      page,
    }) => {
      // investments=50000, dreamCost=15000 → runway = 50000/15000 ≈ 3.33 months
      const email = uniqueEmail('dash-runway');
      await loginUser(page, email, {
        investments: '50000',
        dreamCost: '15000',
      });

      await expect(
        page.locator('[data-testid="metric-fi-progress"]')
      ).toContainText('meses');
    });

    test('recent transactions shows empty state', async ({ page }) => {
      const email = uniqueEmail('dash-empty-recent');
      await loginUser(page, email);

      await expect(
        page.locator('[data-testid="recent-transactions-empty"]')
      ).toBeVisible();
    });

    test('spending chart shows empty state when no EXPENSE transactions exist', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-empty-chart');
      await loginUser(page, email);

      await expect(
        page.locator('[data-testid="spending-chart-empty"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="spending-chart"]')
      ).not.toBeVisible();
    });
  });

  // ── After logging transactions ────────────────────────────────────────────────

  test.describe('After logging transactions', () => {
    test('spending chart renders after logging an EXPENSE transaction', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-chart-after');
      await loginUser(page, email);

      await submitNLTransaction(page, 'Almoço no restaurante R$ 45');

      // Reload to get a fresh server render with updated data
      await page.reload();

      await expect(page.locator('[data-testid="spending-chart"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator('[data-testid="spending-chart-empty"]')
      ).not.toBeVisible();
    });

    test('recent transactions shows the newly logged transaction', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-recent-after');
      await loginUser(page, email);

      await submitNLTransaction(page, 'Mercado R$ 120');
      await page.reload();

      await expect(
        page.locator('[data-testid="recent-transactions"]')
      ).toContainText('R$ 120,00', { timeout: 10000 });
    });

    test('recent transactions list shows at most 10 entries', async ({
      page,
    }) => {
      test.slow(); // logs 11 transactions via NL

      const email = uniqueEmail('dash-max-10');
      await loginUser(page, email);

      for (let i = 1; i <= 11; i++) {
        await submitNLTransaction(page, `Café ${i} R$ ${i * 10}`);
      }
      await page.reload();

      const items = page.locator('[data-testid="recent-transaction-item"]');
      await expect(items).toHaveCount(10, { timeout: 10000 });
    });

    test('savings rate card shows a percentage value', async ({ page }) => {
      const email = uniqueEmail('dash-savings-pct');
      // income=8000, expense≈R$500 → savingsRate ≈ 93.75%
      await loginUser(page, email, { income: '8000' });

      await submitNLTransaction(page, 'Supermercado R$ 500');
      await page.reload();

      await expect(
        page.locator('[data-testid="metric-savings-rate"]')
      ).toContainText('%', { timeout: 10000 });
    });

    test('spending this month card reflects logged expenses', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-spending-card');
      await loginUser(page, email, { dreamCost: '5000' });

      await submitNLTransaction(page, 'Academia R$ 300');
      await page.reload();

      await expect(
        page.locator('[data-testid="metric-monthly-spending"]')
      ).toContainText('R$ 300,00', { timeout: 10000 });
    });

    test('value-aligned spending card shows a percentage', async ({ page }) => {
      const email = uniqueEmail('dash-aligned-pct');
      await loginUser(page, email);

      // NL infer will likely tag this with a necessityLevel (NEEDS)
      await submitNLTransaction(page, 'Supermercado R$ 200');
      await page.reload();

      await expect(
        page.locator('[data-testid="metric-value-aligned"]')
      ).toContainText('%', { timeout: 10000 });
    });

    test('FI progress shows "Já FI!" when investments cover the FI number', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-already-fi');
      // dreamCost=1000 → fiNumber=1000×12×25=300000; investments=999999999 > fiNumber
      await loginUser(page, email, {
        dreamCost: '1000',
        investments: '999999999',
      });

      await expect(
        page.locator('[data-testid="metric-fi-progress"]')
      ).toContainText('Já FI!');
    });

    // ── Phase 2.2: Necessity breakdown ───────────────────────────────────────────

    test('necessity breakdown shows empty state when no expenses exist', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-necessity-empty');
      await loginUser(page, email);

      await expect(
        page.locator('[data-testid="necessity-empty"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="necessity-chart"]')
      ).not.toBeVisible();
    });

    test('necessity breakdown chart renders after logging an expense', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-necessity-chart');
      await loginUser(page, email);

      await submitNLTransaction(page, 'Mercado R$ 200');
      await page.reload();

      await expect(page.locator('[data-testid="necessity-chart"]')).toBeVisible(
        { timeout: 10000 }
      );
      await expect(
        page.locator('[data-testid="necessity-empty"]')
      ).not.toBeVisible();
    });

    // ── Phase 2.2: Monthly trend ──────────────────────────────────────────────────

    test('monthly trend shows empty state when no transactions exist', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-trend-empty');
      await loginUser(page, email);

      await expect(
        page.locator('[data-testid="monthly-trend-empty"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="monthly-trend"]')
      ).not.toBeVisible();
    });

    test('monthly trend chart renders after logging a transaction', async ({
      page,
    }) => {
      const email = uniqueEmail('dash-trend-chart');
      await loginUser(page, email);

      await submitNLTransaction(page, 'Aluguel R$ 1500');
      await page.reload();

      await expect(page.locator('[data-testid="monthly-trend"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator('[data-testid="monthly-trend-empty"]')
      ).not.toBeVisible();
    });
  });
});
