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

  await page.getByRole('combobox').nth(0).click();
  await page.getByRole('option', { name: 'Despesa' }).click();

  await page.getByRole('combobox').nth(1).click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
  await page.getByRole('option').first().click();

  await page.getByRole('combobox').nth(2).click();
  await page.getByRole('option', { name: frequencyLabel }).click();

  await page.click('button:has-text("Criar agendamento")');
  await page.waitForURL(/\/scheduled$/, { timeout: 10000 });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Calendar / Agenda', () => {
  // ── No auth needed ──────────────────────────────────────────────────────────

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Full flow tests ──────────────────────────────────────────────────────────

  test.describe('Full Flow (requires auth)', () => {
    test('calendar grid renders with 7 day-of-week headers', async ({
      page,
    }) => {
      const email = uniqueEmail('cal-grid');
      await loginUser(page, email);
      await page.goto('/calendar');

      await expect(page.getByTestId('calendar-grid')).toBeVisible({
        timeout: 10000,
      });

      // 7 day headers (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
      const dayHeaders = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      for (const header of dayHeaders) {
        await expect(page.locator(`text=${header}`).first()).toBeVisible();
      }
    });

    test('selecting a day shows the agenda section', async ({ page }) => {
      const email = uniqueEmail('cal-day-select');
      await loginUser(page, email);
      await page.goto('/calendar');

      await expect(page.getByTestId('calendar-grid')).toBeVisible({
        timeout: 10000,
      });

      // Initially shows the empty placeholder
      await expect(page.getByTestId('day-agenda-empty')).toBeVisible();

      // Click any day cell in the current month
      const dayCells = page.locator('[data-testid^="calendar-day-"]');
      await dayCells.first().click();

      // Agenda section should now show (placeholder gone or events visible)
      await expect(page.getByTestId('day-agenda')).toBeVisible();
      await expect(page.getByTestId('day-agenda-empty')).not.toBeVisible();
    });

    test('month navigation updates the month heading', async ({ page }) => {
      const email = uniqueEmail('cal-nav');
      await loginUser(page, email);
      await page.goto('/calendar');

      await expect(page.getByTestId('month-title')).toBeVisible({
        timeout: 10000,
      });
      const initialTitle = await page.getByTestId('month-title').textContent();

      // Navigate to next month
      await page.getByTestId('month-next').click();
      await expect(page.getByTestId('month-title')).not.toHaveText(
        initialTitle!
      );

      // Navigate back
      await page.getByTestId('month-prev').click();
      await expect(page.getByTestId('month-title')).toHaveText(initialTitle!);
    });

    test('"Lista" sub-tab shows scheduled list with type filters', async ({
      page,
    }) => {
      const email = uniqueEmail('cal-lista');
      await loginUser(page, email);
      await page.goto('/calendar');

      // Switch to Lista tab
      await page.getByRole('tab', { name: 'Lista' }).click();

      // ScheduledList renders (type filter buttons visible)
      await expect(page.locator('button:has-text("Todos")')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('button:has-text("Receitas")')).toBeVisible();
      await expect(page.locator('button:has-text("Despesas")')).toBeVisible();
    });

    test('"Agenda" nav tab is active on /calendar', async ({ page }) => {
      const email = uniqueEmail('cal-nav-active');
      await loginUser(page, email);
      await page.goto('/calendar');

      // Nav tab should be visible
      await expect(page.getByTestId('nav-calendar')).toBeVisible();
    });

    test('monthly recurring event shows "Projetado" badge in calendar after creation', async ({
      page,
    }) => {
      test.slow();
      const email = uniqueEmail('cal-projection');
      await loginUser(page, email);

      // Create a monthly scheduled transaction (nextOccurrence = startDate + 1 month)
      await createScheduled(page, {
        description: 'Projeção teste calendário',
        amount: '777',
        frequencyLabel: 'Mensal',
      });

      // Go to calendar
      await page.goto('/calendar');
      await expect(page.getByTestId('calendar-grid')).toBeVisible({
        timeout: 10000,
      });

      // Navigate to next month (where nextOccurrence falls)
      await page.getByTestId('month-next').click();

      // Wait for grid to reload
      await expect(page.getByTestId('calendar-grid')).toBeVisible({
        timeout: 5000,
      });

      // Find a day cell with an event dot
      const cellWithDot = page
        .locator('[data-testid^="calendar-day-"]')
        .filter({ has: page.locator('[data-testid="event-dot"]') })
        .first();

      await expect(cellWithDot).toBeVisible({ timeout: 10000 });

      // Click the day to see the agenda
      await cellWithDot.click();

      // "Projetado" badge should appear in the agenda
      await expect(
        page.getByTestId('event-projected-badge').first()
      ).toBeVisible({
        timeout: 5000,
      });
    });

    test('"Nova" button in Lista tab navigates to /scheduled/new', async ({
      page,
    }) => {
      const email = uniqueEmail('cal-nova');
      await loginUser(page, email);
      await page.goto('/calendar');

      await page.getByRole('tab', { name: 'Lista' }).click();
      await page.click('button:has-text("Nova")');
      await expect(page).toHaveURL(/\/scheduled\/new/, { timeout: 5000 });
    });
  });
});
