import { test, expect, Page } from '@playwright/test';

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

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

/**
 * Log in a brand-new user via magic link.
 * After login, new users (no dreamLifestyleCost) land on /onboarding.
 */
async function loginNewUser(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await Promise.all([
    page.waitForURL('**/verify-request**', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  const magicLink = await getMagicLink(page, email);
  await page.goto(magicLink);
  await page.waitForURL('**/onboarding**', { timeout: 30000 });
}

/**
 * Fill and submit the onboarding wizard (all 3 steps).
 */
async function completeOnboarding(
  page: Page,
  {
    income = '8000',
    dreamCost = '15000',
    investments = '50000',
  }: { income?: string; dreamCost?: string; investments?: string } = {}
) {
  // Step 1 – monthly income
  await expect(
    page.locator('text=Qual é sua renda mensal líquida?')
  ).toBeVisible();
  await page.fill('#step-input', income);
  await page.click('button:has-text("Próximo")');

  // Step 2 – dream lifestyle cost
  await expect(
    page.locator('text=Qual é o custo do seu estilo de vida dos sonhos?')
  ).toBeVisible();
  await page.fill('#step-input', dreamCost);
  await page.click('button:has-text("Próximo")');

  // Step 3 – current investments
  await expect(
    page.locator('text=Quanto você já tem investido?')
  ).toBeVisible();
  await page.fill('#step-input', investments);
  await page.click('button:has-text("Concluir")');

  await page.waitForURL('**/dashboard**', { timeout: 30000 });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Onboarding Flow', () => {
  // ── No auth needed ──────────────────────────────────────────────────────────

  test('unauthenticated user navigating to /dashboard redirects to /login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user navigating to /onboarding redirects to /login', async ({
    page,
  }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Full auth tests ─────────────────────────────────────────────────────────

  test.describe('Full Flow', () => {
    test('new user after login lands on /onboarding', async ({ page }) => {
      const email = `onboarding-new-${Date.now()}@example.com`;
      await loginNewUser(page, email);

      await expect(page).toHaveURL(/\/onboarding/);
      await expect(
        page.locator('text=Configure seu perfil financeiro')
      ).toBeVisible();
      await expect(page.locator('text=Etapa 1 de 3')).toBeVisible();
    });

    test('completing all 3 steps redirects to /dashboard', async ({ page }) => {
      const email = `onboarding-complete-${Date.now()}@example.com`;
      await loginNewUser(page, email);
      await completeOnboarding(page);

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('step validation blocks negative income', async ({ page }) => {
      const email = `onboarding-validate-${Date.now()}@example.com`;
      await loginNewUser(page, email);

      // Try to advance with a negative value (bypasses HTML min="0" attr)
      await page.fill('#step-input', '-100');
      await page.click('button:has-text("Próximo")');

      // Should still be on step 1 with an error shown
      await expect(page.locator('text=Etapa 1 de 3')).toBeVisible();
      await expect(
        page.locator('text=A renda mensal deve ser maior ou igual a 0')
      ).toBeVisible();
    });

    test('step validation blocks zero dreamLifestyleCost', async ({ page }) => {
      const email = `onboarding-zero-dream-${Date.now()}@example.com`;
      await loginNewUser(page, email);

      // Step 1 – valid income
      await page.fill('#step-input', '8000');
      await page.click('button:has-text("Próximo")');

      // Step 2 – try zero (invalid)
      await page.fill('#step-input', '0');
      await page.click('button:has-text("Próximo")');

      await expect(
        page.locator('text=O custo de vida dos sonhos deve ser maior que 0')
      ).toBeVisible();
    });

    test('back button navigates to previous step', async ({ page }) => {
      const email = `onboarding-back-${Date.now()}@example.com`;
      await loginNewUser(page, email);

      await page.fill('#step-input', '8000');
      await page.click('button:has-text("Próximo")');

      await expect(page.locator('text=Etapa 2 de 3')).toBeVisible();

      await page.click('button:has-text("Voltar")');

      await expect(page.locator('text=Etapa 1 de 3')).toBeVisible();
    });

    test('returning user (dreamLifestyleCost set) skips onboarding and lands on /dashboard', async ({
      page,
    }) => {
      const email = `onboarding-returning-${Date.now()}@example.com`;

      // First session – complete onboarding
      await loginNewUser(page, email);
      await completeOnboarding(page);

      // Sign out
      await page.click('button:has-text("Sair")');
      await expect(page).toHaveURL(/\/login/);

      // Second login with the same email (dreamLifestyleCost now set in DB)
      await page.fill('input[type="email"]', email);
      await Promise.all([
        page.waitForURL('**/verify-request**', { timeout: 30000 }),
        page.click('button[type="submit"]'),
      ]);

      const magicLink = await getMagicLink(page, email);
      await page.goto(magicLink);

      // Should land directly on /dashboard — not /onboarding
      await page.waitForURL('**/dashboard**', { timeout: 30000 });
      await expect(page).not.toHaveURL(/\/onboarding/);
    });

    test('completed user navigating to /onboarding is redirected to /dashboard', async ({
      page,
    }) => {
      const email = `onboarding-manual-${Date.now()}@example.com`;

      await loginNewUser(page, email);
      await completeOnboarding(page);

      // Manually navigate back to /onboarding — proxy should redirect to /dashboard
      await page.goto('/onboarding');
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
